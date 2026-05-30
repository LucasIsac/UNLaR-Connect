"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import {
  DbCallMessage,
  DbCallRoom,
  DbCallRoomParticipant,
  DbSubject,
  DbUser,
  CallParticipantRole,
  CallRoomStatus,
} from "@/types/database";

// ============================================================
// Domain-level types for Consultas Express
// ============================================================

export interface CallUserPreview {
  id: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  tutor_rating: number;
}

export interface CallRoomParticipantExtended extends DbCallRoomParticipant {
  user: CallUserPreview | null;
}

export interface CallMessageExtended extends DbCallMessage {
  sender: {
    id: string;
    name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

export interface CallRoomExtended extends DbCallRoom {
  subject: DbSubject | null;
  student: CallUserPreview | null;
  tutor: CallUserPreview;
  participants: CallRoomParticipantExtended[];
  participant_count: number;
}

export interface AvailableTutor {
  id: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  tutor_rating: number;
  total_reviews: number;
  subjects: DbSubject[];
  live_room_id?: string;
  participant_count?: number;
  max_participants?: number;
}

export interface OpenLiveTutoringRoom {
  id: string;
  subject_id: number | null;
  status: CallRoomStatus;
  max_participants: number;
  participant_count: number;
  subject: DbSubject | null;
  tutor: CallUserPreview;
  participants: CallRoomParticipantExtended[];
}

export interface ActionResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

type SubjectRelation = DbSubject | DbSubject[] | null;
type UserRelation = CallUserPreview | CallUserPreview[] | null;

interface TutorSubjectRow {
  subject: SubjectRelation;
}

interface AvailableTutorRow {
  id: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  tutor_rating: number | string | null;
  total_reviews: number | null;
  role_id: number;
  tutor_subjects?: TutorSubjectRow[] | null;
}

interface ParticipantRow extends DbCallRoomParticipant {
  user?: UserRelation;
}

interface CallRoomQueryRow extends DbCallRoom {
  subject?: SubjectRelation;
  student?: UserRelation;
  tutor?: UserRelation;
  participants?: ParticipantRow[] | null;
}

interface CallMessageQueryRow extends DbCallMessage {
  sender?: UserRelation;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeUser(value: UserRelation | undefined): CallUserPreview | null {
  const user = firstRelation(value);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    last_name: user.last_name,
    avatar_url: user.avatar_url ?? null,
    tutor_rating: Number(user.tutor_rating) || 0,
  };
}

function normalizeSubject(value: SubjectRelation | undefined): DbSubject | null {
  return firstRelation(value);
}

function normalizeParticipant(row: ParticipantRow): CallRoomParticipantExtended {
  return {
    id: row.id,
    room_id: row.room_id,
    user_id: row.user_id,
    role: row.role,
    is_host: row.is_host,
    joined_at: row.joined_at,
    left_at: row.left_at,
    created_at: row.created_at,
    user: normalizeUser(row.user),
  };
}

function normalizeRoom(row: CallRoomQueryRow): CallRoomExtended {
  const participants = (row.participants ?? [])
    .map(normalizeParticipant)
    .sort((a, b) => Number(b.is_host) - Number(a.is_host) || a.joined_at.localeCompare(b.joined_at));

  const tutor = normalizeUser(row.tutor) ?? {
    id: row.tutor_id,
    name: "Tutor",
    last_name: "",
    avatar_url: null,
    tutor_rating: 0,
  };

  return {
    id: row.id,
    subject_id: row.subject_id,
    student_id: row.student_id,
    tutor_id: row.tutor_id,
    status: row.status,
    room_kind: row.room_kind,
    max_participants: row.max_participants,
    created_at: row.created_at,
    started_at: row.started_at,
    ended_at: row.ended_at,
    subject: normalizeSubject(row.subject),
    student: normalizeUser(row.student),
    tutor,
    participants,
    participant_count: participants.filter((participant) => !participant.left_at).length,
  };
}

function normalizeMessage(row: CallMessageQueryRow): CallMessageExtended {
  const sender = normalizeUser(row.sender);
  return {
    id: row.id,
    room_id: row.room_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    sender: sender
      ? {
          id: sender.id,
          name: sender.name,
          last_name: sender.last_name,
          avatar_url: sender.avatar_url,
        }
      : null,
  };
}

function mapRoomError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("room_full")) return "La sala ya está completa.";
  if (message.includes("room_closed")) return "Esta tutoría ya no está abierta.";
  if (message.includes("room_not_found")) return "No encontramos esa tutoría en vivo.";
  if (message.includes("not_tutor")) return "Solo los tutores pueden crear una tutoría en vivo.";
  if (message.includes("not_authenticated")) return "No estás autenticado/a.";

  return fallback;
}

function logSupabaseActionError(scope: string, error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    console.error(scope, {
      message: candidate.message,
      code: candidate.code,
      details: candidate.details,
      hint: candidate.hint,
    });
    return;
  }

  console.error(scope, error);
}

const ROOM_SELECT = `
  *,
  subject:subjects(*),
  student:users!student_id(id, name, last_name, avatar_url, tutor_rating),
  tutor:users!tutor_id(id, name, last_name, avatar_url, tutor_rating),
  participants:call_room_participants(
    *,
    user:users!user_id(id, name, last_name, avatar_url, tutor_rating)
  )
`;

// ============================================================
// fetchAvailableTutors
// Returns tutors who teach a given subject.
// ============================================================
export async function fetchAvailableTutors(
  subjectId?: number
): Promise<ActionResponse<AvailableTutor[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("users")
      .select(`
        id, name, last_name, avatar_url, tutor_rating, total_reviews, role_id,
        tutor_subjects(
          subject:subjects(id, name, year)
        )
      `)
      .eq("role_id", 3);

    if (error) throw error;

    const tutors: AvailableTutor[] = [];

    for (const row of (data ?? []) as AvailableTutorRow[]) {
      const subjects: DbSubject[] = (row.tutor_subjects ?? [])
        .map((item) => normalizeSubject(item.subject))
        .filter((subject): subject is DbSubject => Boolean(subject));

      if (subjectId && !subjects.some((subject) => subject.id === subjectId)) {
        continue;
      }

      tutors.push({
        id: row.id,
        name: row.name,
        last_name: row.last_name,
        avatar_url: row.avatar_url ?? null,
        tutor_rating: Number(row.tutor_rating) || 0,
        total_reviews: row.total_reviews ?? 0,
        subjects,
      });
    }

    return { success: true, data: tutors };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchAvailableTutors]", msg);
    return { success: false, error: "No pudimos cargar los tutores disponibles." };
  }
}

// ============================================================
// fetchOpenLiveTutoringRooms
// Returns currently open/active tutor-hosted rooms.
// ============================================================
export async function fetchOpenLiveTutoringRooms(
  subjectId?: number
): Promise<ActionResponse<OpenLiveTutoringRoom[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();
    let query = supabase
      .from("call_rooms")
      .select(ROOM_SELECT)
      .eq("room_kind", "open")
      .in("status", ["open", "active"])
      .order("created_at", { ascending: false });

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rooms = ((data ?? []) as CallRoomQueryRow[]).map(normalizeRoom);
    return {
      success: true,
      data: rooms.map((room) => ({
        id: room.id,
        subject_id: room.subject_id,
        status: room.status,
        max_participants: room.max_participants,
        participant_count: room.participant_count,
        subject: room.subject,
        tutor: room.tutor,
        participants: room.participants.filter((participant) => !participant.left_at),
      })),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchOpenLiveTutoringRooms]", msg);
    return { success: false, error: "No pudimos cargar las tutorías en vivo." };
  }
}

// ============================================================
// openLiveTutoringRoom
// Tutor opens/reuses an open room and becomes host.
// ============================================================
export async function openLiveTutoringRoom(
  subjectId: number | null = null
): Promise<ActionResponse<CallRoomExtended>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();
    const { data: roomId, error } = await supabase.rpc("open_live_call_room", {
      p_subject_id: subjectId,
    });

    if (error) throw error;
    if (!roomId || typeof roomId !== "string") {
      return { success: false, error: "No pudimos crear la tutoría en vivo." };
    }

    return fetchCallRoom(roomId);
  } catch (error: unknown) {
    logSupabaseActionError("[openLiveTutoringRoom]", error);
    return {
      success: false,
      error: mapRoomError(error, "No pudimos crear la tutoría en vivo."),
    };
  }
}

// ============================================================
// joinLiveTutoringRoom
// Student joins an open room atomically if capacity allows it.
// ============================================================
export async function joinLiveTutoringRoom(
  roomId: string
): Promise<ActionResponse<CallRoomExtended>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();
    const { data: joinedRoomId, error } = await supabase.rpc("join_live_call_room", {
      p_room_id: roomId,
    });

    if (error) throw error;
    if (!joinedRoomId || typeof joinedRoomId !== "string") {
      return { success: false, error: "No pudimos sumarte a la tutoría." };
    }

    return fetchCallRoom(joinedRoomId);
  } catch (error: unknown) {
    logSupabaseActionError("[joinLiveTutoringRoom]", error);
    return {
      success: false,
      error: mapRoomError(error, "No pudimos sumarte a la tutoría."),
    };
  }
}

// ============================================================
// requestCall
// Legacy direct-call flow retained for compatibility.
// ============================================================
export async function requestCall(
  tutorId: string,
  subjectId: number | null
): Promise<ActionResponse<DbCallRoom>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    if (tutorId === session.userId) {
      return { success: false, error: "No podés solicitar acceso a tu propia tutoría." };
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_rooms")
      .insert({
        student_id: session.userId,
        tutor_id: tutorId,
        subject_id: subjectId,
        status: "requested" as CallRoomStatus,
        room_kind: "direct",
        max_participants: 2,
      })
      .select()
      .single();

    if (error) throw error;

    const room = data as DbCallRoom;
    await supabase.from("call_room_participants").upsert({
      room_id: room.id,
      user_id: session.userId,
      role: "student" as CallParticipantRole,
      is_host: false,
      left_at: null,
    });

    return { success: true, data: room };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[requestCall]", msg);
    return { success: false, error: "No pudimos crear la consulta. Intentá de nuevo." };
  }
}

// ============================================================
// respondToCall
// Legacy tutor response flow retained for compatibility.
// ============================================================
export async function respondToCall(
  roomId: string,
  accept: boolean
): Promise<ActionResponse<DbCallRoom>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data: room } = await supabase
      .from("call_rooms")
      .select("tutor_id")
      .eq("id", roomId)
      .single();

    if (!room || room.tutor_id !== session.userId) {
      return { success: false, error: "No tenés permiso para responder esta consulta." };
    }

    const newStatus: CallRoomStatus = accept ? "accepted" : "rejected";
    const updatePayload: Partial<DbCallRoom> = { status: newStatus };
    if (accept) {
      updatePayload.started_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("call_rooms")
      .update(updatePayload)
      .eq("id", roomId)
      .select()
      .single();

    if (error) throw error;

    if (accept) {
      await supabase.from("call_room_participants").upsert({
        room_id: roomId,
        user_id: session.userId,
        role: "tutor" as CallParticipantRole,
        is_host: true,
        left_at: null,
      });
    }

    return { success: true, data: data as DbCallRoom };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[respondToCall]", msg);
    return { success: false, error: "No pudimos procesar tu respuesta." };
  }
}

// ============================================================
// startCall
// Marks the room as active once media connection begins.
// ============================================================
export async function startCall(roomId: string): Promise<ActionResponse<DbCallRoom>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_rooms")
      .update({ status: "active" as CallRoomStatus, started_at: new Date().toISOString() })
      .eq("id", roomId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as DbCallRoom };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[startCall]", msg);
    return { success: false, error: "No pudimos activar la sala." };
  }
}

// ============================================================
// endCall
// Host ends the room for everyone; non-host participants leave.
// ============================================================
export async function endCall(roomId: string): Promise<ActionResponse> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();
    const roomRes = await fetchCallRoom(roomId);
    if (!roomRes.success || !roomRes.data) {
      return { success: false, error: roomRes.error || "No pudimos cargar la sala." };
    }

    const room = roomRes.data;
    const activeParticipant = room.participants.find(
      (participant) => participant.user_id === session.userId && !participant.left_at
    );

    if (!activeParticipant && room.student_id !== session.userId && room.tutor_id !== session.userId) {
      return { success: false, error: "No tenés permiso para cerrar esta sala." };
    }

    const isHost = activeParticipant?.is_host || room.tutor_id === session.userId;
    const now = new Date().toISOString();

    if (isHost) {
      const { error: roomError } = await supabase
        .from("call_rooms")
        .update({
          status: "ended" as CallRoomStatus,
          ended_at: now,
        })
        .eq("id", roomId);

      if (roomError) throw roomError;

      const { error: participantError } = await supabase
        .from("call_room_participants")
        .update({ left_at: now })
        .eq("room_id", roomId)
        .is("left_at", null);

      if (participantError) throw participantError;
    } else {
      const { error } = await supabase
        .from("call_room_participants")
        .update({ left_at: now })
        .eq("room_id", roomId)
        .eq("user_id", session.userId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[endCall]", msg);
    return { success: false, error: "No pudimos cerrar la sala correctamente." };
  }
}

// ============================================================
// fetchCallRoom
// Fetch a single call room with participants and subject details.
// ============================================================
export async function fetchCallRoom(
  roomId: string
): Promise<ActionResponse<CallRoomExtended>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_rooms")
      .select(ROOM_SELECT)
      .eq("id", roomId)
      .single();

    if (error) throw error;

    const room = normalizeRoom(data as CallRoomQueryRow);
    const isActiveParticipant = room.participants.some(
      (participant) => participant.user_id === session.userId && !participant.left_at
    );

    if (!isActiveParticipant && room.student_id !== session.userId && room.tutor_id !== session.userId) {
      return { success: false, error: "No tenés permiso para acceder a esta sala." };
    }

    return { success: true, data: room };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchCallRoom]", msg);
    return { success: false, error: "No pudimos cargar la sala." };
  }
}

// ============================================================
// fetchCallHistory
// Returns the last 20 rooms where the current user participated.
// ============================================================
export async function fetchCallHistory(): Promise<ActionResponse<CallRoomExtended[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data: participantRooms, error: participantError } = await supabase
      .from("call_room_participants")
      .select("room_id")
      .eq("user_id", session.userId)
      .order("joined_at", { ascending: false })
      .limit(20);

    if (participantError) throw participantError;

    const roomIds = Array.from(new Set((participantRooms ?? []).map((row) => row.room_id)));
    if (roomIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from("call_rooms")
      .select(ROOM_SELECT)
      .in("id", roomIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return { success: true, data: ((data ?? []) as CallRoomQueryRow[]).map(normalizeRoom) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchCallHistory]", msg);
    return { success: false, error: "No pudimos cargar el historial de consultas." };
  }
}

// ============================================================
// sendCallMessage
// Insert a text message into call_messages.
// ============================================================
export async function sendCallMessage(
  roomId: string,
  content: string
): Promise<ActionResponse<CallMessageExtended>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    if (!content.trim()) {
      return { success: false, error: "El mensaje no puede estar vacío." };
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_messages")
      .insert({
        room_id: roomId,
        sender_id: session.userId,
        content: content.trim(),
      })
      .select(`
        *,
        sender:users!sender_id(id, name, last_name, avatar_url, tutor_rating)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: normalizeMessage(data as CallMessageQueryRow) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[sendCallMessage]", msg);
    return { success: false, error: "No pudimos enviar el mensaje." };
  }
}

// ============================================================
// fetchCallMessages
// Load chat history for a room.
// ============================================================
export async function fetchCallMessages(
  roomId: string
): Promise<ActionResponse<CallMessageExtended[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_messages")
      .select(`
        *,
        sender:users!sender_id(id, name, last_name, avatar_url, tutor_rating)
      `)
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: ((data ?? []) as CallMessageQueryRow[]).map(normalizeMessage) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchCallMessages]", msg);
    return { success: false, error: "No pudimos cargar los mensajes." };
  }
}
