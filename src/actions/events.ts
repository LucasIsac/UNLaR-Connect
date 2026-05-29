"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import { DbEvent, DbEventRegistration } from "@/types/database";
import { awardPoints } from "@/actions/reputation";
import { POINT_VALUES } from "@/lib/reputation-constants";

// ==========================================
// TYPES
// ==========================================

export interface EventExtended extends DbEvent {
  authorName: string;
  registrationCount: number;
  isRegistered: boolean;
  isFull: boolean;
  timeLabel: string;
  typeLabel: string;
  typeColor: string;
}

// ==========================================
// HELPERS
// ==========================================

function getTimeLabel(startDate: string, endDate: string, status: string): string {
  if (status === "completed") return "Finalizado";
  if (status === "cancelled") return "Cancelado";
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now >= start && now <= end) return "En curso";
  
  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays <= 7) return `En ${diffDays} días`;
  if (diffDays <= 30) return `En ${Math.ceil(diffDays / 7)} semanas`;
  return start.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    seminario: "Seminario",
    capacitacion: "Capacitación",
    diplomatura: "Diplomatura",
    taller: "Taller",
    conferencia: "Conferencia",
    otro: "Otro",
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    seminario: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    capacitacion: "bg-green-500/15 text-green-400 border-green-500/25",
    diplomatura: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    taller: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    conferencia: "bg-teal-500/15 text-teal-400 border-teal-500/25",
    otro: "bg-muted text-muted-foreground border-border",
  };
  return colors[type] || colors.otro;
}

// ==========================================
// READ: Fetch active events (for dashboard)
// ==========================================

export async function fetchActiveEvents(): Promise<EventExtended[]> {
  try {
    const session = await getVerifiedSession();
    const userId = session?.userId;

    const supabase = createServerClient();
    
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        *,
        author:users!created_by(name, last_name)
      `)
      .neq("status", "cancelled")
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }

    // Get registration counts and user's registrations
    const eventIds = (events || []).map((e: any) => e.id);
    
    let registrationCounts: Record<string, number> = {};
    let userRegistrations: string[] = [];

    if (eventIds.length > 0) {
      // Get registration counts
      const { data: regCounts } = await supabase
        .from("event_registrations")
        .select("event_id")
        .in("event_id", eventIds);

      if (regCounts) {
        regCounts.forEach((r: any) => {
          registrationCounts[r.event_id] = (registrationCounts[r.event_id] || 0) + 1;
        });
      }

      // Get user's registrations
      if (userId) {
        const { data: userRegs } = await supabase
          .from("event_registrations")
          .select("event_id")
          .eq("user_id", userId)
          .in("event_id", eventIds);

        if (userRegs) {
          userRegistrations = userRegs.map((r: any) => r.event_id);
        }
      }
    }

    const now = new Date();

    return (events || [])
      .filter((event: any) => {
        const endDate = new Date(event.end_date);
        const regDeadline = new Date(event.registration_deadline);
        // Show if: registration still open OR event hasn't ended yet
        return regDeadline > now || endDate > now;
      })
      .map((event: any) => {
        const regCount = registrationCounts[event.id] || 0;
        const isFull = event.max_participants ? regCount >= event.max_participants : false;

        return {
          ...event,
          authorName: event.author
            ? `${event.author.name} ${event.author.last_name || ""}`.trim()
            : "UNLaR",
          registrationCount: regCount,
          isRegistered: userRegistrations.includes(event.id),
          isFull,
          timeLabel: getTimeLabel(event.start_date, event.end_date, event.status),
          typeLabel: getTypeLabel(event.event_type),
          typeColor: getTypeColor(event.event_type),
        };
      });
  } catch (error) {
    console.error("Error fetching active events:", error);
    return [];
  }
}

// ==========================================
// READ: Check if current user can create events
// ==========================================

export async function canCreateEvents(): Promise<boolean> {
  try {
    const session = await getVerifiedSession();
    if (!session) return false;

    const supabase = createServerClient();
    const { data } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", session.userId)
      .single();

    return data?.role_id === 1 || data?.role_id === 4;
  } catch {
    return false;
  }
}

// ==========================================
// CREATE: Create a new event
// ==========================================

export async function createEvent(data: {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string;
  meeting_link?: string;
  image_url?: string;
  max_participants?: number;
}): Promise<{ success: boolean; event?: EventExtended; error?: string }> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado." };

    const supabase = createServerClient();

    // Check permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", session.userId)
      .single();

    if (!userData || ![1, 4].includes(userData.role_id)) {
      return { success: false, error: "No tenés permiso para crear eventos." };
    }

    // Validate dates
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const deadline = new Date(data.registration_deadline);

    if (end <= start) {
      return { success: false, error: "La fecha de fin debe ser posterior al inicio." };
    }
    if (deadline > start) {
      return { success: false, error: "La fecha de inscripción debe ser anterior al inicio." };
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title: data.title.trim(),
        description: data.description.trim(),
        event_type: data.event_type,
        start_date: data.start_date,
        end_date: data.end_date,
        registration_deadline: data.registration_deadline,
        location: data.location.trim(),
        meeting_link: data.meeting_link || null,
        image_url: data.image_url || null,
        created_by: session.userId,
        max_participants: data.max_participants || null,
        status: "upcoming",
      })
      .select()
      .single();

    if (error) throw error;

    const extendedEvent: EventExtended = {
      ...event,
      authorName: "Tu Perfil",
      registrationCount: 0,
      isRegistered: false,
      isFull: false,
      timeLabel: getTimeLabel(event.start_date, event.end_date, event.status),
      typeLabel: getTypeLabel(event.event_type),
      typeColor: getTypeColor(event.event_type),
    };

    return { success: true, event: extendedEvent };
  } catch (error: any) {
    console.error("Error creating event:", error);
    return { success: false, error: error.message || "No se pudo crear el evento." };
  }
}

// ==========================================
// UPDATE: Edit an event
// ==========================================

export async function editEvent(
  eventId: string,
  data: {
    title: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    location: string;
    meeting_link?: string;
    image_url?: string;
    max_participants?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado." };

    const supabase = createServerClient();

    const { data: userData } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", session.userId)
      .single();

    if (!userData || ![1, 4].includes(userData.role_id)) {
      return { success: false, error: "No tenés permiso para editar eventos." };
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: data.title.trim(),
        description: data.description.trim(),
        event_type: data.event_type,
        start_date: data.start_date,
        end_date: data.end_date,
        registration_deadline: data.registration_deadline,
        location: data.location.trim(),
        meeting_link: data.meeting_link || null,
        image_url: data.image_url || null,
        max_participants: data.max_participants || null,
      })
      .eq("id", eventId);

    if (error) throw error;
    console.log("[editEvent] Success for eventId:", eventId);
    return { success: true };
  } catch (error: any) {
    console.error("[editEvent] Error:", error);
    return { success: false, error: error.message || "No se pudo editar el evento." };
  }
}

// ==========================================
// CREATE: Register for an event
// ==========================================

export async function registerForEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado." };

    const supabase = createServerClient();

    // Check if event exists and registration is open
    const { data: event } = await supabase
      .from("events")
      .select("registration_deadline, max_participants, status")
      .eq("id", eventId)
      .single();

    if (!event) return { success: false, error: "Evento no encontrado." };
    if (event.status === "cancelled") return { success: false, error: "Evento cancelado." };
    
    const now = new Date();
    if (new Date(event.registration_deadline) < now) {
      return { success: false, error: "Las inscripciones ya cerraron." };
    }

    // Check capacity
    if (event.max_participants) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (count && count >= event.max_participants) {
        return { success: false, error: "El evento está completo." };
      }
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", session.userId)
      .single();

    if (existing) {
      return { success: false, error: "Ya estás inscripto/a en este evento." };
    }

    const { error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: session.userId,
      });

    if (error) throw error;

    // Award +5 points for registering
    await awardPoints(session.userId, POINT_VALUES.EVENT_REGISTRATION, "event_registration", "Se inscribió en un evento", eventId);

    return { success: true };
  } catch (error: any) {
    console.error("Error registering for event:", error);
    return { success: false, error: error.message || "No se pudo completar la inscripción." };
  }
}

// ==========================================
// DELETE: Cancel registration
// ==========================================

export async function cancelRegistration(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado." };

    const supabase = createServerClient();

    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", session.userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling registration:", error);
    return { success: false, error: error.message || "No se pudo cancelar la inscripción." };
  }
}

// ==========================================
// DELETE: Cancel event (admin only)
// ==========================================

export async function cancelEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado." };

    const supabase = createServerClient();

    const { data: userData } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", session.userId)
      .single();

    if (!userData || ![1, 4].includes(userData.role_id)) {
      return { success: false, error: "No tenés permiso." };
    }

    const { error } = await supabase
      .from("events")
      .update({ status: "cancelled" })
      .eq("id", eventId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling event:", error);
    return { success: false, error: error.message || "No se pudo cancelar el evento." };
  }
}
