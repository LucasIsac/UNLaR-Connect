"use server";

import { createServerClient } from "@/lib/supabase";
import { 
  DbUser, 
  DbTutorAvailability, 
  DbSubject, 
  DbCareer 
} from "@/types/database";

export interface UserProfileExtended extends DbUser {
  careerName?: string;
  isTutorActive: boolean; // Virtual field determining if tutor status is enabled
}

/**
 * Fetch complete profile detail for the current student
 */
export async function fetchUserProfile(): Promise<UserProfileExtended> {
  const db = createServerClient();
  const authUserResponse = await db.auth.getUser();
  const authUser = authUserResponse?.data?.user;

  if (!authUser) {
    throw new Error("No estás autenticado/a.");
  }

  // Fetch user matching architecture users schema
  const { data: dbUserData, error: userError } = await db
    .from("users")
    .select("*, careers(name)")
    .eq("id", authUser.id)
    .single();

  if (userError || !dbUserData) {
    throw new Error("Usuario no encontrado en la base de datos.");
  }

  // Check if user has tutor subjects or availability
  const { count: hasSubjects } = await db
    .from("tutor_subjects")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", authUser.id);

  return {
    ...dbUserData,
    careerName: dbUserData.careers?.name,
    isTutorActive: (hasSubjects || 0) > 0 || dbUserData.role_id === 3
  };
}

/**
 * Update general student info
 */
export async function updateUserProfile(
  name: string,
  lastName: string,
  careerId: number,
  avatarUrl?: string
): Promise<{ success: boolean; data?: UserProfileExtended; error?: string }> {
  try {
    if (!name.trim()) {
      return { success: false, error: "El nombre no puede quedar vacío." };
    }

    const db = createServerClient();
    const authUserResponse = await db.auth.getUser();
    const authUser = authUserResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    const updatePayload: any = {
      name: name.trim(),
      last_name: lastName.trim(),
      career_id: careerId
    };

    if (avatarUrl !== undefined) {
      updatePayload.avatar_url = avatarUrl;
    }

    const { error } = await db
      .from("users")
      .update(updatePayload)
      .eq("id", authUser.id);

    if (error) throw error;

    // Fetch updated user details
    const updated = await fetchUserProfile();
    return { success: true, data: updated };
  } catch (err: any) {
    console.error("Error updating user profile in Supabase:", err);
    return { success: false, error: err.message || "Hubo un error al actualizar los datos en Supabase." };
  }
}

/**
 * Toggle tutor profile condition
 */
export async function toggleTutorStatus(
  active: boolean
): Promise<{ success: boolean; isTutorActive: boolean; error?: string }> {
  try {
    const db = createServerClient();
    const authUserResponse = await db.auth.getUser();
    const authUser = authUserResponse?.data?.user;

    if (!authUser) {
      return { success: false, isTutorActive: !active, error: "No estás autenticado/a." };
    }

    const { error } = await db
      .from("users")
      .update({ role_id: active ? 3 : 2 }) // 3 = Tutor, 2 = Estudiante
      .eq("id", authUser.id);

    if (error) throw error;
    
    return { success: true, isTutorActive: active };
  } catch (err: any) {
    console.error("Error toggling tutor status in Supabase:", err);
    return { success: false, isTutorActive: !active, error: err.message || "No se pudo cambiar el estado de tutor." };
  }
}

/**
 * Fetch subjects student is registered to teach
 */
export async function fetchTutorSubjects(): Promise<DbSubject[]> {
  const db = createServerClient();
  const authUserResponse = await db.auth.getUser();
  const authUser = authUserResponse?.data?.user;

  if (!authUser) {
    return [];
  }

  const { data, error } = await db
    .from("tutor_subjects")
    .select("subjects(*)")
    .eq("tutor_id", authUser.id);
  
  if (error) {
    console.error("Error fetching tutor subjects from Supabase:", error);
    return [];
  }

  if (data) {
    return data.map((item: any) => item.subjects).filter(Boolean);
  }

  return [];
}

/**
 * Link a new subject for teaching
 */
export async function addTutorSubject(
  subjectId: number
): Promise<{ success: boolean; data?: DbSubject[]; error?: string }> {
  try {
    const db = createServerClient();
    const authUserResponse = await db.auth.getUser();
    const authUser = authUserResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    // Check if already registered
    const { count, error: countError } = await db
      .from("tutor_subjects")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", authUser.id)
      .eq("subject_id", subjectId);

    if (countError) throw countError;

    if ((count || 0) > 0) {
      return { success: false, error: "Ya estás dictando esta materia." };
    }

    const { error: insertError } = await db
      .from("tutor_subjects")
      .insert({ tutor_id: authUser.id, subject_id: subjectId });
    
    if (insertError) throw insertError;

    const freshSubjects = await fetchTutorSubjects();
    return { success: true, data: freshSubjects };
  } catch (err: any) {
    console.error("Error adding tutor subject in Supabase:", err);
    return { success: false, error: err.message || "Tuvimos un error al vincular la materia." };
  }
}

/**
 * Remove a subject from tutor subjects
 */
export async function removeTutorSubject(
  subjectId: number
): Promise<{ success: boolean; data?: DbSubject[]; error?: string }> {
  try {
    const db = createServerClient();
    const authUserResponse = await db.auth.getUser();
    const authUser = authUserResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    const { error: deleteError } = await db
      .from("tutor_subjects")
      .delete()
      .eq("tutor_id", authUser.id)
      .eq("subject_id", subjectId);
    
    if (deleteError) throw deleteError;

    const freshSubjects = await fetchTutorSubjects();
    return { success: true, data: freshSubjects };
  } catch (err: any) {
    console.error("Error removing tutor subject in Supabase:", err);
    return { success: false, error: err.message || "No se pudo desvincular la materia de base de datos." };
  }
}

/**
 * Fetch tutor schedule availability
 */
export async function fetchTutorAvailability(): Promise<DbTutorAvailability[]> {
  const db = createServerClient();
  const authUserResponse = await db.auth.getUser();
  const authUser = authUserResponse?.data?.user;

  if (!authUser) {
    return [];
  }

  const { data, error } = await db
    .from("tutor_availability")
    .select("*")
    .eq("tutor_id", authUser.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching availability from Supabase:", error);
    return [];
  }

  return data || [];
}

/**
 * Register availability schedule slots
 */
export async function saveTutorAvailability(
  availabilityList: DbTutorAvailability[]
): Promise<{ success: boolean; data?: DbTutorAvailability[]; error?: string }> {
  try {
    const db = createServerClient();
    const authUserResponse = await db.auth.getUser();
    const authUser = authUserResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    // Clear previous slots
    const { error: deleteError } = await db
      .from("tutor_availability")
      .delete()
      .eq("tutor_id", authUser.id);
    
    if (deleteError) throw deleteError;

    // Insert new slots
    if (availabilityList.length > 0) {
      const insertData = availabilityList.map(slot => ({
        tutor_id: authUser.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time
      }));

      const { error: insertError } = await db
        .from("tutor_availability")
        .insert(insertData);

      if (insertError) throw insertError;
    }

    const fresh = await fetchTutorAvailability();
    return { success: true, data: fresh };
  } catch (err: any) {
    console.error("Error saving availability in Supabase:", err);
    return { success: false, error: err.message || "No se pudo guardar la agenda de disponibilidad." };
  }
}

/**
 * Fetch official list of careers for dropdown selection
 */
export async function fetchCareers(): Promise<DbCareer[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from("careers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching careers from Supabase:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all official college subjects
 */
export async function fetchSubjects(): Promise<DbSubject[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from("subjects")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching subjects from Supabase:", error);
    return [];
  }

  return data || [];
}
