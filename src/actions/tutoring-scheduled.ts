"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import { 
  DbTutoringSession, 
  DbTutorAvailability, 
  DbSubject, 
  DbUser
} from "@/types/database";
import { ActionResponse } from "./consultas";

// ============================================================
// Domain-level types for Scheduled Tutoring
// ============================================================

export interface TutorProfileForMatching {
  id: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  tutor_rating: number;
  total_reviews: number;
  subjects: DbSubject[];
  availability: DbTutorAvailability[];
  is_online: boolean;
  match_score: number;
  email: string | null;
  phone_number: string | null;
  contact_visibility: boolean;
  tutor_price: number;
}

export interface ScheduledSessionExtended extends DbTutoringSession {
  subject: DbSubject | null;
  tutor: Pick<DbUser, "id" | "name" | "last_name" | "avatar_url" | "tutor_rating"> | null;
  student: Pick<DbUser, "id" | "name" | "last_name" | "avatar_url"> | null;
}

export interface TutoringCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  subject_name: string;
  peer_name: string;
  is_tutor: boolean;
}

type SupabaseRelation<T> = T | T[] | null;

interface TutoringCalendarRow extends DbTutoringSession {
  subject: SupabaseRelation<Pick<DbSubject, "name">>;
  tutor: SupabaseRelation<Pick<DbUser, "id" | "name" | "last_name">>;
  student: SupabaseRelation<Pick<DbUser, "id" | "name" | "last_name">>;
}

function unwrapRelation<T>(value: SupabaseRelation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

// ============================================================
// fetchTutorProfilesForMatching
// Returns tutors with their subjects, availability, and a match score.
// ============================================================
export async function fetchTutorProfilesForMatching(
  subjectId?: number,
  searchQuery?: string
): Promise<ActionResponse<TutorProfileForMatching[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Fetch tutors with their subjects and availability
    let query = supabase
      .from("tutor_subjects")
      .select(`
        tutor:users!tutor_id(
          id, name, last_name, avatar_url, tutor_rating, total_reviews, role_id, email, phone_number, contact_visibility, tutor_price
        ),
        subject:subjects(id, name, year)
      `);

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data: tutorSubjects, error: tsError } = await query;
    if (tsError) throw tsError;

    // Group by tutor and collect subjects
    const tutorMap = new Map<string, {
      user: DbUser & { role_id: number };
      subjects: DbSubject[];
    }>();

    for (const row of tutorSubjects ?? []) {
      const tutor = (Array.isArray(row.tutor) ? row.tutor[0] : row.tutor) as unknown as (DbUser & { role_id: number; email: string | null; phone_number: string | null; contact_visibility: boolean; tutor_price: number });
      const subject = (Array.isArray(row.subject) ? row.subject[0] : row.subject) as unknown as DbSubject;

      if (!tutor || !tutor.id) continue;
      // Only active tutors (role_id === 3) or Admins (role_id === 1) can appear in scheduled tutoring
      if (tutor.role_id !== 3 && tutor.role_id !== 1) continue;

      if (!tutorMap.has(tutor.id)) {
        tutorMap.set(tutor.id, { user: tutor, subjects: [] });
      }
      if (subject) {
        tutorMap.get(tutor.id)!.subjects.push(subject);
      }
    }

    // Fetch availability for all tutors
    const tutorIds = Array.from(tutorMap.keys());
    if (tutorIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: availabilityData } = await supabase
      .from("tutor_availability")
      .select("*")
      .in("tutor_id", tutorIds);

    // Group availability by tutor
    const availabilityMap = new Map<string, DbTutorAvailability[]>();
    for (const avail of availabilityData ?? []) {
      if (!availabilityMap.has(avail.tutor_id)) {
        availabilityMap.set(avail.tutor_id, []);
      }
      availabilityMap.get(avail.tutor_id)!.push(avail);
    }

    // Build tutor profiles with match scores
    const profiles: TutorProfileForMatching[] = [];
    for (const [tutorId, { user, subjects }] of Array.from(tutorMap.entries())) {
      const availability = availabilityMap.get(tutorId) || [];
      
      // Calculate match score based on:
      // - Subject match (if specific subject requested)
      // - Rating
      // - Number of reviews
      // - Availability slots count
      let matchScore = 0;
      
      if (subjectId) {
        const hasSubject = subjects.some(s => s.id === subjectId);
        if (hasSubject) matchScore += 50;
      } else {
        matchScore += 25; // Base score for no subject filter
      }
      
      matchScore += (user.tutor_rating || 0) * 10;
      matchScore += Math.min((user.total_reviews || 0), 20) * 2;
      matchScore += availability.length * 5;

      profiles.push({
        id: tutorId,
        name: user.name,
        last_name: user.last_name,
        avatar_url: user.avatar_url ?? null,
        tutor_rating: user.tutor_rating || 0,
        total_reviews: user.total_reviews || 0,
        subjects,
        availability,
        is_online: false, // Will be updated client-side via presence
        match_score: matchScore,
        email: user.email || null,
        phone_number: user.phone_number || null,
        contact_visibility: user.contact_visibility ?? true,
        tutor_price: user.tutor_price || 0,
      });
    }

    // Sort by match score descending
    profiles.sort((a, b) => b.match_score - a.match_score);

    // Apply text search filter if provided
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      return {
        success: true,
        data: profiles.filter(p => {
          const fullName = `${p.name} ${p.last_name}`.toLowerCase();
          const matchesName = fullName.includes(query);
          const matchesSubject = p.subjects.some(s => s.name.toLowerCase().includes(query));
          return matchesName || matchesSubject;
        }),
      };
    }

    return { success: true, data: profiles };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchTutorProfilesForMatching]", msg);
    return { success: false, error: "No pudimos cargar los perfiles de tutores." };
  }
}

// ============================================================
// requestScheduledTutoring
// Student requests a scheduled tutoring session with a tutor.
// ============================================================
export async function requestScheduledTutoring(params: {
  tutorId: string;
  subjectId: number;
  scheduledStart: string;
  scheduledEnd: string;
  initialMessage?: string;
}): Promise<ActionResponse<DbTutoringSession>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Prevent self-booking
    if (session.userId === params.tutorId) {
      return { success: false, error: "No podés agendar una tutoría con vos mismo/a." };
    }

    // Check for double-booking: verify tutor is not already booked at that time
    const { data: existingSessions, error: conflictError } = await supabase
      .from("tutoring_sessions")
      .select("id")
      .eq("tutor_id", params.tutorId)
      .in("status", ["pending", "confirmed"])
      .lt("scheduled_start", params.scheduledEnd)
      .gt("scheduled_end", params.scheduledStart);

    if (conflictError) throw conflictError;

    if (existingSessions && existingSessions.length > 0) {
      return { success: false, error: "El tutor ya tiene una tutoría agendada en ese horario." };
    }

    // Check for student double-booking as well
    const { data: studentSessions, error: studentConflictError } = await supabase
      .from("tutoring_sessions")
      .select("id")
      .eq("student_id", session.userId)
      .in("status", ["pending", "confirmed"])
      .lt("scheduled_start", params.scheduledEnd)
      .gt("scheduled_end", params.scheduledStart);

    if (studentConflictError) throw studentConflictError;

    if (studentSessions && studentSessions.length > 0) {
      return { success: false, error: "Ya tenés una tutoría agendada en ese horario." };
    }

    // Create the tutoring session
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .insert({
        tutor_id: params.tutorId,
        student_id: session.userId,
        subject_id: params.subjectId,
        scheduled_start: params.scheduledStart,
        scheduled_end: params.scheduledEnd,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    if (params.initialMessage && params.initialMessage.trim().length > 0) {
      await supabase.from("tutoring_session_messages").insert({
        session_id: data.id,
        sender_id: session.userId,
        content: params.initialMessage.trim(),
      });
    }

    // Create notification for the tutor
    const { data: studentProfile } = await supabase
      .from("users")
      .select("name, last_name")
      .eq("id", session.userId)
      .single();

    const { data: subject } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", params.subjectId)
      .single();

    await supabase.from("notifications").insert({
      user_id: params.tutorId,
      title: "Nueva solicitud de tutoría",
      content: `${studentProfile?.name} ${studentProfile?.last_name} quiere agendar una tutoría de ${subject?.name || "una materia"}.`,
      type: "tutorias",
      is_read: false,
    });

    return { success: true, data: data as DbTutoringSession };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[requestScheduledTutoring]", msg);
    return { success: false, error: "No pudimos crear la solicitud de tutoría." };
  }
}

// ============================================================
// respondToScheduledTutoring
// Tutor accepts or rejects a scheduled tutoring request.
// ============================================================
export async function respondToScheduledTutoring(
  sessionId: string,
  accept: boolean
): Promise<ActionResponse<ScheduledSessionExtended>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Verify the current user is the tutor of this session
    const { data: sessionData } = await supabase
      .from("tutoring_sessions")
      .select("tutor_id, student_id")
      .eq("id", sessionId)
      .single();

    if (!sessionData || sessionData.tutor_id !== session.userId) {
      return { success: false, error: "No tenés permiso para responder esta tutoría." };
    }

    const newStatus = accept ? "confirmed" : "canceled";
    const updatePayload: Partial<DbTutoringSession> = { status: newStatus as DbTutoringSession['status'] };
    
    if (accept) {
      // Generate a placeholder meeting link
      updatePayload.meeting_link = `https://meet.unlar-connect.com/${sessionId.substring(0, 8)}`;
    }

    const { data, error } = await supabase
      .from("tutoring_sessions")
      .update(updatePayload)
      .eq("id", sessionId)
      .select(`
        *,
        subject:subjects(*),
        tutor:users!tutor_id(id, name, last_name, avatar_url, tutor_rating),
        student:users!student_id(id, name, last_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Create notification for the student
    const { data: tutorProfile } = await supabase
      .from("users")
      .select("name, last_name")
      .eq("id", session.userId)
      .single();

    const notificationContent = accept
      ? `${tutorProfile?.name} ${tutorProfile?.last_name} aceptó tu tutoría. ¡Genial!`
      : `${tutorProfile?.name} ${tutorProfile?.last_name} no pudo aceptar tu tutoría en este momento.`;

    await supabase.from("notifications").insert({
      user_id: sessionData.student_id,
      title: accept ? "Tutoría confirmada" : "Tutoría rechazada",
      content: notificationContent,
      type: "tutorias",
      is_read: false,
    });

    return { success: true, data: data as ScheduledSessionExtended };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[respondToScheduledTutoring]", msg);
    return { success: false, error: "No pudimos procesar tu respuesta." };
  }
}

// ============================================================
// fetchTutoringCalendar
// Returns all scheduled sessions for the current user.
// ============================================================
export async function fetchTutoringCalendar(): Promise<ActionResponse<TutoringCalendarEvent[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("tutoring_sessions")
      .select(`
        *,
        subject:subjects(name),
        tutor:users!tutor_id(id, name, last_name),
        student:users!student_id(id, name, last_name)
      `)
      .or(`tutor_id.eq.${session.userId},student_id.eq.${session.userId}`)
      .in("status", ["pending", "confirmed", "canceled"])
      .order("scheduled_start", { ascending: true });

    if (error) throw error;

    const events: TutoringCalendarEvent[] = ((data ?? []) as TutoringCalendarRow[]).map((s) => {
      const tutor = unwrapRelation(s.tutor);
      const student = unwrapRelation(s.student);
      const subject = unwrapRelation(s.subject);
      const isTutor = s.tutor_id === session.userId;
      const peer = isTutor ? student : tutor;

      const peerNameFallback = peer ? `${peer.name || ""} ${peer.last_name || ""}`.trim() : (s.meeting_link || "Acuerdo Privado");

      return {
        id: s.id,
        title: `${subject?.name || "Tutoría"} con ${peerNameFallback}`,
        start: s.scheduled_start,
        end: s.scheduled_end,
        status: s.status,
        subject_name: subject?.name || "Sin materia",
        peer_name: peerNameFallback,
        is_tutor: isTutor,
      };
    });

    return { success: true, data: events };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchTutoringCalendar]", msg);
    return { success: false, error: "No pudimos cargar el calendario de tutorías." };
  }
}

// ============================================================
// fetchScheduledSessions
// Returns detailed scheduled sessions for the current user (for the list view).
// ============================================================
export async function fetchScheduledSessions(): Promise<ActionResponse<ScheduledSessionExtended[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("tutoring_sessions")
      .select(`
        *,
        subject:subjects(*),
        tutor:users!tutor_id(id, name, last_name, avatar_url, tutor_rating),
        student:users!student_id(id, name, last_name, avatar_url)
      `)
      .or(`tutor_id.eq.${session.userId},student_id.eq.${session.userId}`)
      .order("scheduled_start", { ascending: true });

    if (error) throw error;

    return { success: true, data: (data ?? []) as ScheduledSessionExtended[] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchScheduledSessions]", msg);
    return { success: false, error: "No pudimos cargar las tutorías programadas." };
  }
}

// ============================================================
// cancelScheduledSession
// Cancel a scheduled tutoring session (either student or tutor can cancel).
// ============================================================
export async function cancelScheduledSession(
  sessionId: string
): Promise<ActionResponse<ScheduledSessionExtended>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Verify the current user is a participant of this session
    const { data: sessionData } = await supabase
      .from("tutoring_sessions")
      .select("tutor_id, student_id")
      .eq("id", sessionId)
      .single();

    if (!sessionData || (sessionData.tutor_id !== session.userId && sessionData.student_id !== session.userId)) {
      return { success: false, error: "No tenés permiso para cancelar esta tutoría." };
    }

    const { data, error } = await supabase
      .from("tutoring_sessions")
      .update({ status: "canceled" })
      .eq("id", sessionId)
      .select(`
        *,
        subject:subjects(*),
        tutor:users!tutor_id(id, name, last_name, avatar_url, tutor_rating),
        student:users!student_id(id, name, last_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Notify the other party
    const notifyUserId = session.userId === sessionData.tutor_id 
      ? sessionData.student_id 
      : sessionData.tutor_id;

    const { data: cancelerProfile } = await supabase
      .from("users")
      .select("name, last_name")
      .eq("id", session.userId)
      .single();

    await supabase.from("notifications").insert({
      user_id: notifyUserId,
      title: "Tutoría cancelada",
      content: `${cancelerProfile?.name} ${cancelerProfile?.last_name} canceló la tutoría programada.`,
      type: "tutorias",
      is_read: false,
    });

    return { success: true, data: data as ScheduledSessionExtended };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[cancelScheduledSession]", msg);
    return { success: false, error: "No pudimos cancelar la tutoría." };
  }
}

// ============================================================================
// CHAT MESSAGING FOR SCHEDULED SESSIONS
// ============================================================================

export interface SessionMessage {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export async function fetchSessionMessages(sessionId: string): Promise<{ success: boolean; data?: SessionMessage[]; error?: string }> {
  try {
    const supabase = createServerClient();
    const session = await getVerifiedSession();

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch messages with sender info
    const { data, error } = await supabase
      .from("tutoring_session_messages")
      .select(`
        id, session_id, sender_id, content, created_at,
        sender:users!sender_id(name, last_name, avatar_url)
      `)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return { success: false, error: "Failed to load messages" };
    }

    const messages = (data ?? []).map((msg: any) => ({
      id: msg.id,
      session_id: msg.session_id,
      sender_id: msg.sender_id,
      content: msg.content,
      created_at: msg.created_at,
      sender: msg.sender ? (Array.isArray(msg.sender) ? msg.sender[0] : msg.sender) : undefined,
    })) as SessionMessage[];

    return { success: true, data: messages };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Internal server error" };
  }
}

export async function sendSessionMessage(sessionId: string, content: string): Promise<{ success: boolean; data?: SessionMessage; error?: string }> {
  try {
    const supabase = createServerClient();
    const session = await getVerifiedSession();

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("tutoring_session_messages")
      .insert({
        session_id: sessionId,
        sender_id: session.userId,
        content: content.trim(),
      })
      .select(`
        id, session_id, sender_id, content, created_at,
        sender:users!sender_id(name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return { success: false, error: "Failed to send message" };
    }

    const newMessage: SessionMessage = {
      id: data.id,
      session_id: data.session_id,
      sender_id: data.sender_id,
      content: data.content,
      created_at: data.created_at,
      sender: data.sender ? (Array.isArray(data.sender) ? data.sender[0] : data.sender) : undefined,
    };

    return { success: true, data: newMessage };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Internal server error" };
  }
}

// ============================================================
// fetchTutorAvailabilityForDate
// Returns available time slots for a specific tutor on a specific date.
// ============================================================
export async function fetchTutorAvailabilityForDate(
  tutorId: string,
  date: string
): Promise<ActionResponse<{ start_time: string; end_time: string }[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Fetch tutor availability for this day
    const { data: availability, error: availError } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", tutorId)
      .eq("day_of_week", dayOfWeek);

    if (availError) throw availError;

    if (!availability || availability.length === 0) {
      return { success: true, data: [] };
    }

    // For each availability slot, check for existing bookings
    const availableSlots: { start_time: string; end_time: string }[] = [];

    for (const slot of availability) {
      const slotStart = `${date}T${slot.start_time}`;
      const slotEnd = `${date}T${slot.end_time}`;

      // Check for conflicting sessions
      const { data: conflicts } = await supabase
        .from("tutoring_sessions")
        .select("id")
        .eq("tutor_id", tutorId)
        .in("status", ["pending", "confirmed"])
        .lt("scheduled_start", slotEnd)
        .gt("scheduled_end", slotStart);

      if (!conflicts || conflicts.length === 0) {
        availableSlots.push({
          start_time: slot.start_time,
          end_time: slot.end_time,
        });
      }
    }

    return { success: true, data: availableSlots };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[fetchTutorAvailabilityForDate]", msg);
    return { success: false, error: "No pudimos cargar la disponibilidad del tutor." };
  }
}
