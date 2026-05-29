"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import { DbCallRoom, DbCallMessage, DbUser, DbSubject, CallRoomStatus } from "@/types/database";

// ============================================================
// Domain-level types for Consultas Express
// ============================================================

export interface CallRoomExtended extends DbCallRoom {
  subject: DbSubject | null;
  student: Pick<DbUser, "id" | "name" | "last_name" | "avatar_url" | "tutor_rating">;
  tutor: Pick<DbUser, "id" | "name" | "last_name" | "avatar_url" | "tutor_rating">;
}

export interface AvailableTutor {
  id: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  tutor_rating: number;
  total_reviews: number;
  subjects: DbSubject[];
}

export interface ActionResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// fetchAvailableTutors
// Returns tutors who teach a given subject (presence is handled
// client-side via Supabase Realtime Presence).
// ============================================================
export async function fetchAvailableTutors(
  subjectId?: number
): Promise<ActionResponse<AvailableTutor[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Query all users who are tutors (role_id = 3)
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

    for (const row of data ?? []) {
      // Extract the subjects list from the nested relation
      const rawSubjects = (row.tutor_subjects || []) as any[];
      const subjects: DbSubject[] = rawSubjects
        .map((item: any) => {
          const s = Array.isArray(item.subject) ? item.subject[0] : item.subject;
          return s as DbSubject;
        })
        .filter(Boolean);

      // If a specific subject filter is requested, filter it here
      if (subjectId && !subjects.some((s) => s.id === subjectId)) {
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
// requestCall
// Student creates a call room with status = 'requested'.
// ============================================================
export async function requestCall(
  tutorId: string,
  subjectId: number | null
): Promise<ActionResponse<DbCallRoom>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_rooms")
      .insert({
        student_id: session.userId,
        tutor_id: tutorId,
        subject_id: subjectId,
        status: "requested" as CallRoomStatus,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as DbCallRoom };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[requestCall]", msg);
    return { success: false, error: "No pudimos crear la consulta. Intentá de nuevo." };
  }
}

// ============================================================
// respondToCall
// Tutor accepts or rejects an incoming call request.
// ============================================================
export async function respondToCall(
  roomId: string,
  accept: boolean
): Promise<ActionResponse<DbCallRoom>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Verify the current user is the tutor of this room
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

    return { success: true, data: data as DbCallRoom };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[respondToCall]", msg);
    return { success: false, error: "No pudimos procesar tu respuesta." };
  }
}

// ============================================================
// startCall
// Marks the room as 'active' once WebRTC connection is established.
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
// Marks the room as 'ended' and records the end timestamp.
// ============================================================
export async function endCall(roomId: string): Promise<ActionResponse> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { error } = await supabase
      .from("call_rooms")
      .update({
        status: "ended" as CallRoomStatus,
        ended_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[endCall]", msg);
    return { success: false, error: "No pudimos cerrar la sala correctamente." };
  }
}

// ============================================================
// fetchCallRoom
// Fetch a single call room with participant and subject details.
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
      .select(`
        *,
        subject:subjects(*),
        student:users!student_id(id, name, last_name, avatar_url, tutor_rating),
        tutor:users!tutor_id(id, name, last_name, avatar_url, tutor_rating)
      `)
      .eq("id", roomId)
      .single();

    if (error) throw error;

    const room = data as CallRoomExtended;

    // Security: only participants can view room details
    if (room.student_id !== session.userId && room.tutor_id !== session.userId) {
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
// Returns the last 20 call rooms for the current user.
// ============================================================
export async function fetchCallHistory(): Promise<ActionResponse<CallRoomExtended[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_rooms")
      .select(`
        *,
        subject:subjects(*),
        student:users!student_id(id, name, last_name, avatar_url, tutor_rating),
        tutor:users!tutor_id(id, name, last_name, avatar_url, tutor_rating)
      `)
      .or(`student_id.eq.${session.userId},tutor_id.eq.${session.userId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return { success: true, data: (data ?? []) as CallRoomExtended[] };
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
): Promise<ActionResponse<DbCallMessage>> {
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
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as DbCallMessage };
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
): Promise<ActionResponse<DbCallMessage[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("call_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: (data ?? []) as DbCallMessage[] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchCallMessages]", msg);
    return { success: false, error: "No pudimos cargar los mensajes." };
  }
}
