"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import { ActionResponse } from "./consultas";
import { DbTutoringSession } from "@/types/database";

export interface StudentSearchResult {
  id: string;
  name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

export async function searchStudents(query: string): Promise<ActionResponse<StudentSearchResult[]>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    if (!query || query.trim().length < 3) {
      return { success: true, data: [] };
    }

    const supabase = createServerClient();
    const cleanQuery = query.trim();
    const parts = cleanQuery.split(/\s+/);
    
    // Always check if the full query is in name, last_name, or email
    let orQuery = `name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`;
    
    if (parts.length > 1) {
      // If there's a space, ALSO try to match first name with the first part and last name with the rest
      // This handles users who have their name split across both columns
      const first = parts[0];
      const rest = parts.slice(1).join(" ");
      orQuery += `,and(name.ilike.%${first}%,last_name.ilike.%${rest}%)`;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, name, last_name, email, avatar_url")
      .or(orQuery)
      .neq("id", session.userId) // Don't return the tutor themselves
      .limit(10);

    if (error) throw error;

    return { success: true, data: data as StudentSearchResult[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[searchStudents]", msg);
    return { success: false, error: "No pudimos buscar a los alumnos." };
  }
}

export async function createCustomTutoring(params: {
  studentId: string | null;
  title: string;
  subjectId: number;
  scheduledStart: string;
  scheduledEnd: string;
}): Promise<ActionResponse<DbTutoringSession>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado/a." };

    const supabase = createServerClient();

    // Insert directly as confirmed
    const { data, error } = await supabase
      .from("tutoring_sessions")
      .insert({
        tutor_id: session.userId,
        student_id: params.studentId || null,
        subject_id: params.subjectId,
        scheduled_start: params.scheduledStart,
        scheduled_end: params.scheduledEnd,
        status: "confirmed",
        meeting_link: params.title // Storing the custom title here
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to the student ONLY if there is a studentId
    if (params.studentId) {
      const { data: tutorProfile } = await supabase
        .from("users")
        .select("name, last_name")
        .eq("id", session.userId)
        .single();

      if (tutorProfile) {
        await supabase.from("notifications").insert({
          user_id: params.studentId,
          type: "session_request",
          title: "Tutoría Programada",
          content: `El tutor ${tutorProfile.name} ${tutorProfile.last_name} ha agendado una tutoría confirmada con vos.`,
          is_read: false,
          link: "/tutorias"
        });
      }
    }

    return { success: true, data: data as DbTutoringSession };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[createCustomTutoring]", msg);
    return { success: false, error: "No pudimos crear la tutoría." };
  }
}
