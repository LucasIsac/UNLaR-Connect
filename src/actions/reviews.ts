"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { getVerifiedSession } from "@/lib/supabase";

export type ActionResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Submit a review for a tutor.
 * Fails if the user tries to rate themselves or if they've already rated this tutor.
 */
export async function submitTutorReview(
  tutorId: string,
  rating: number,
  comment: string = ""
): Promise<ActionResponse<void>> {
  try {
    const session = await getVerifiedSession();
    if (!session) return { success: false, error: "No estás autenticado." };

    const studentId = session.userId;

    if (studentId === tutorId) {
      return { success: false, error: "No puedes calificarte a ti mismo." };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: "La calificación debe estar entre 1 y 5 estrellas." };
    }

    const supabase = createServerClient();

    // Insert the review. Due to RLS and UNIQUE constraints, this will fail if it's a duplicate.
    const { error } = await supabase
      .from("tutor_reviews")
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        rating,
        comment: comment.trim() || null,
      });

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return { success: false, error: "Ya has dejado una valoración para este tutor." };
      }
      throw error;
    }

    return { success: true, data: undefined };
  } catch (error: any) {
    console.error("Error submitting tutor review:", error);
    return { success: false, error: "Ocurrió un error al procesar tu valoración. Intenta de nuevo más tarde." };
  }
}
