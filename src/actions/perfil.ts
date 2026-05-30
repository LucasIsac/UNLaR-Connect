"use server";

import { createServerClient, createStaticClient, getVerifiedSession } from "@/lib/supabase";
import { 
  DbUser, 
  DbTutorAvailability, 
  DbSubject, 
  DbCareer,
  DbNotification
} from "@/types/database";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";

export interface UserProfileExtended extends DbUser {
  careerName?: string;
  isTutorActive: boolean;
}

/**
 * UNCACHED: Fetch complete profile detail for the current student
 */
async function fetchUserProfileUncached(userId: string, accessToken: string): Promise<UserProfileExtended> {
  const db = createStaticClient(accessToken);

  const { data: dbUserData, error: userError } = await db
    .from("users")
    .select("*, careers(name)")
    .eq("id", userId)
    .single();

  if (userError || !dbUserData) {
    console.log(`[Cache Self-Heal] User ${userId} not found in public.users. Attempting to restore...`);
    const { data: authData } = await db.auth.getUser();
    const authUser = authData?.user;
    
    if (authUser) {
      const name = authUser.user_metadata?.first_name || authUser.user_metadata?.name || "Estudiante";
      const lastName = authUser.user_metadata?.last_name || "";
      const email = authUser.email || "";
      const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

      const { data: insertedUser, error: insertError } = await db
        .from("users")
        .insert({
          id: userId,
          email: email,
          name: name,
          last_name: lastName,
          avatar_url: avatarUrl,
          role_id: 2
        })
        .select("*, careers(name)")
        .single();

      if (!insertError && insertedUser) {
        console.log(`[Cache Self-Heal] User ${userId} successfully created in public.users.`);
        return {
          ...insertedUser,
          careerName: insertedUser.careers?.name,
          isTutorActive: false
        };
      } else {
        console.error(`[Cache Self-Heal] Failed to auto-create user in public.users:`, insertError);
      }
    }
    throw new Error("Usuario no encontrado en la base de datos.");
  }

  if (!dbUserData.avatar_url) {
    const { data: authData } = await db.auth.getUser();
    const authUser = authData?.user;
    const avatarUrl = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null;

    if (avatarUrl) {
      const { error: avatarError } = await db
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (!avatarError) {
        dbUserData.avatar_url = avatarUrl;
      }
    }
  }

  const { count: hasSubjects } = await db
    .from("tutor_subjects")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", userId);

  return {
    ...dbUserData,
    careerName: dbUserData.careers?.name,
    isTutorActive: (hasSubjects || 0) > 0 || dbUserData.role_id === 3
  };
}

/**
 * Fetch complete profile detail for the current student (CACHED)
 */
export async function fetchUserProfile(): Promise<UserProfileExtended> {
  const session = await getVerifiedSession();
  if (!session) throw new Error("No estás autenticado/a.");

  const { userId, accessToken } = session;
  console.log(`[Cache Access] fetchUserProfile for user: ${userId}`);

  return unstable_cache(
    async () => fetchUserProfileUncached(userId, accessToken),
    ["user-profile", userId],
    {
      tags: [CACHE_TAGS.userProfile(userId)],
      revalidate: 86400
    }
  )();
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

    invalidateCache(CACHE_TAGS.userProfile(authUser.id));
    invalidateCache(CACHE_TAGS.dashboardStats(authUser.id));

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

    invalidateCache(CACHE_TAGS.userProfile(authUser.id));
    invalidateCache(CACHE_TAGS.dashboardStats(authUser.id));
    
    return { success: true, isTutorActive: active };
  } catch (err: any) {
    console.error("Error toggling tutor status in Supabase:", err);
    return { success: false, isTutorActive: !active, error: err.message || "No se pudo cambiar el estado de tutor." };
  }
}

/**
 * UNCACHED: Fetch subjects student is registered to teach
 */
async function fetchTutorSubjectsUncached(userId: string, accessToken: string): Promise<DbSubject[]> {
  const db = createStaticClient(accessToken);
  const { data, error } = await db
    .from("tutor_subjects")
    .select("subjects(*)")
    .eq("tutor_id", userId);
  
  if (error) {
    console.error("Error fetching tutor subjects from Supabase:", error);
    return [];
  }

  return (data || []).map((item: any) => item.subjects).filter(Boolean);
}

/**
 * Fetch subjects student is registered to teach (CACHED)
 */
export async function fetchTutorSubjects(): Promise<DbSubject[]> {
  const session = await getVerifiedSession();
  if (!session) return [];

  const { userId, accessToken } = session;
  console.log(`[Cache Access] fetchTutorSubjects for user: ${userId}`);

  return unstable_cache(
    async () => fetchTutorSubjectsUncached(userId, accessToken),
    ["tutor-subjects", userId],
    {
      tags: [CACHE_TAGS.tutorSubjects(userId)],
      revalidate: 86400
    }
  )();
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

    invalidateCache(CACHE_TAGS.tutorSubjects(authUser.id));
    invalidateCache(CACHE_TAGS.userProfile(authUser.id));

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

    invalidateCache(CACHE_TAGS.tutorSubjects(authUser.id));
    invalidateCache(CACHE_TAGS.userProfile(authUser.id));

    const freshSubjects = await fetchTutorSubjects();
    return { success: true, data: freshSubjects };
  } catch (err: any) {
    console.error("Error removing tutor subject in Supabase:", err);
    return { success: false, error: err.message || "No se pudo desvincular la materia de base de datos." };
  }
}

/**
 * UNCACHED: Fetch tutor schedule availability
 */
async function fetchTutorAvailabilityUncached(userId: string, accessToken: string): Promise<DbTutorAvailability[]> {
  const db = createStaticClient(accessToken);
  const { data, error } = await db
    .from("tutor_availability")
    .select("*")
    .eq("tutor_id", userId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching availability from Supabase:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch tutor schedule availability (CACHED)
 */
export async function fetchTutorAvailability(): Promise<DbTutorAvailability[]> {
  const session = await getVerifiedSession();
  if (!session) return [];

  const { userId, accessToken } = session;
  console.log(`[Cache Access] fetchTutorAvailability for user: ${userId}`);

  return unstable_cache(
    async () => fetchTutorAvailabilityUncached(userId, accessToken),
    ["tutor-availability", userId],
    {
      tags: [CACHE_TAGS.tutorAvailability(userId)],
      revalidate: 86400
    }
  )();
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

    const { error: deleteError } = await db
      .from("tutor_availability")
      .delete()
      .eq("tutor_id", authUser.id);
    
    if (deleteError) throw deleteError;

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

    invalidateCache(CACHE_TAGS.tutorAvailability(authUser.id));

    const fresh = await fetchTutorAvailability();
    return { success: true, data: fresh };
  } catch (err: any) {
    console.error("Error saving availability in Supabase:", err);
    return { success: false, error: err.message || "No se pudo guardar la agenda de disponibilidad." };
  }
}

/**
 * UNCACHED: Fetch official list of careers for dropdown selection
 */
async function fetchCareersUncached(accessToken: string): Promise<DbCareer[]> {
  const db = createStaticClient(accessToken);
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
 * Fetch official list of careers for dropdown selection (CACHED)
 */
export async function fetchCareers(): Promise<DbCareer[]> {
  const session = await getVerifiedSession();
  const accessToken = session?.accessToken ?? "";

  console.log("[Cache Access] fetchCareers");

  return unstable_cache(
    async () => fetchCareersUncached(accessToken),
    ["careers-list"],
    {
      tags: [CACHE_TAGS.careersList],
      revalidate: 86400
    }
  )();
}

/**
 * UNCACHED: Fetch all official college subjects
 */
async function fetchSubjectsUncached(accessToken: string): Promise<DbSubject[]> {
  const db = createStaticClient(accessToken);
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

/**
 * Fetch all official college subjects (CACHED)
 */
export async function fetchSubjects(): Promise<DbSubject[]> {
  const session = await getVerifiedSession();
  const accessToken = session?.accessToken ?? "";

  console.log("[Cache Access] fetchSubjects");

  return unstable_cache(
    async () => fetchSubjectsUncached(accessToken),
    ["subjects-list"],
    {
      tags: [CACHE_TAGS.subjectsList],
      revalidate: 300
    }
  )();
}

export interface CombinedHeaderData {
  profile: UserProfileExtended;
  notifications: DbNotification[];
}

/**
 * Fetch both user profile and notifications in a single optimized Server Action call.
 */
export async function fetchCombinedHeaderData(): Promise<CombinedHeaderData> {
  const session = await getVerifiedSession();
  if (!session) throw new Error("No estás autenticado/a.");

  const { userId, accessToken } = session;
  console.log(`[Combined Cache Access] fetchCombinedHeaderData for user: ${userId}`);

  const [profile, notifications] = await Promise.all([
    unstable_cache(
      async () => fetchUserProfileUncached(userId, accessToken),
      ["user-profile", userId],
      {
        tags: [CACHE_TAGS.userProfile(userId)],
        revalidate: 86400
      }
    )(),
    (async () => {
      const db = createStaticClient(accessToken);
      const { data, error } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching header notifications:", error);
        return [];
      }
      return data || [];
    })()
  ]);

  return { profile, notifications };
}

// ==========================================
// READ: Public profile for other users
// ==========================================

export interface PublicProfile {
  id: string;
  name: string;
  last_name: string;
  avatar_url?: string;
  career_name?: string;
  points: number;
  karmaLevel: number;
  badgesCount: number;
  postsCount: number;
  repliesCount: number;
  resourcesCount: number;
  isTutor: boolean;
  tutor_rating?: number;
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  try {
    const supabase = createServerClient();

    // Simple query first - just get user data
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, last_name, avatar_url, points, career_id")
      .eq("id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("[fetchPublicProfile] Error fetching user:", error.message, error.code);
      return null;
    }
    if (!user) {
      console.error("[fetchPublicProfile] User not found for id:", userId);
      return null;
    }

    console.log("[fetchPublicProfile] Found user:", user.name, user.id);

    // Get career name separately
    let careerName = "General";
    if (user.career_id) {
      const { data: career } = await supabase
        .from("careers")
        .select("name")
        .eq("id", user.career_id)
        .single();
      if (career) careerName = career.name;
    }

    // Count posts
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Count replies
    const { count: repliesCount } = await supabase
      .from("post_replies")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Count resources
    const { count: resourcesCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Count badges
    const { count: badgesCount } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      id: user.id,
      name: user.name,
      last_name: user.last_name || "",
      avatar_url: user.avatar_url,
      career_name: careerName,
      points: user.points || 0,
      karmaLevel: Math.floor((user.points || 0) / 250) + 1,
      badgesCount: badgesCount || 0,
      postsCount: postsCount || 0,
      repliesCount: repliesCount || 0,
      resourcesCount: resourcesCount || 0,
      isTutor: false,
    };
  } catch (error) {
    console.error("[fetchPublicProfile] Error:", error);
    return null;
  }
}
