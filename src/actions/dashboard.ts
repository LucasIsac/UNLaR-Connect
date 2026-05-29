"use server";

import { createServerClient, createStaticClient, getVerifiedSession } from "@/lib/supabase";
import { 
  DbUser, 
  DbTutoringSession, 
  DbPost, 
  DbBadge, 
  DbSubject,
  DbTutorAvailability,
  DbPostReply,
  DbDocument
} from "@/types/database";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";

// Custom return types for Server Actions
export interface DashboardStats {
  user: DbUser;
  karmaLevel: number;
  currentXP: number;
  nextLevelXP: number;
  xpPercentage: number;
  recentBadges: DbBadge[];
  notificationsCount: number;
}

export interface UpcomingSessionExtended extends Omit<DbTutoringSession, 'subject_id'> {
  subject: DbSubject;
  peerName: string;
  isTutorRole: boolean;
}

export interface ForumPostExtended extends DbPost {
  subjectName?: string;
  postTypeName: string;
  repliesCount: number;
}

/**
 * UNCACHED: Fetch core statistics, level, XP, and badges earned by the user.
 * Uses an explicit accessToken so this function is safe inside unstable_cache.
 */
async function fetchDashboardStatsUncached(userId: string, accessToken: string): Promise<DashboardStats> {
  const supabase = createStaticClient(accessToken);

  // 1. Fetch user metrics
  let { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !dbUser) {
    console.log(`[Cache Self-Heal/Dashboard] User ${userId} not found in public.users. Attempting to restore...`);
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    
    if (authUser) {
      const name = authUser.user_metadata?.first_name || authUser.user_metadata?.name || "Estudiante";
      const lastName = authUser.user_metadata?.last_name || "";
      const email = authUser.email || "";
      const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: email,
          name: name,
          last_name: lastName,
          avatar_url: avatarUrl,
          role_id: 2
        })
        .select("*")
        .single();

      if (!insertError && insertedUser) {
        console.log(`[Cache Self-Heal/Dashboard] User ${userId} successfully created in public.users.`);
        dbUser = insertedUser;
      } else {
        console.error(`[Cache Self-Heal/Dashboard] Failed to auto-create user:`, insertError);
        throw new Error("Usuario no encontrado en la base de datos.");
      }
    } else {
      throw new Error("Usuario no encontrado en la base de datos.");
    }
  }

  // 2. Fetch badges
  const { data: allBadges } = await supabase
    .from("badges")
    .select("*")
    .order("required_points", { ascending: true });

  const recentBadges = allBadges || [];

  const points = dbUser.points || 0;
  const karmaLevel = Math.floor(points / 250) + 1;
  const nextLevelXP = karmaLevel * 250;
  const xpPercentage = Math.min(((points % 250) / 250) * 100, 100);
  const notificationsCount = 3;

  return {
    user: dbUser as DbUser,
    karmaLevel,
    currentXP: points,
    nextLevelXP,
    xpPercentage,
    recentBadges,
    notificationsCount
  };
}

/**
 * Fetch core statistics, level, XP, and badges earned by the user (CACHED).
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const session = await getVerifiedSession();
  if (!session) throw new Error("No estás autenticado/a.");

  const { userId, accessToken } = session;
  console.log(`[Cache Access] fetchDashboardStats for user: ${userId}`);

  return unstable_cache(
    async () => fetchDashboardStatsUncached(userId, accessToken),
    ["dashboard-stats", userId],
    {
      tags: [CACHE_TAGS.dashboardStats(userId)],
      revalidate: 86400
    }
  )();
}

/**
 * UNCACHED: Fetch all upcoming tutoring sessions for the student.
 */
async function fetchUpcomingSessionsUncached(userId: string, accessToken: string): Promise<UpcomingSessionExtended[]> {
  const supabase = createStaticClient(accessToken);

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select(`
      *,
      subject:subjects(*),
      tutor:users!tutor_id(name, last_name, deleted_at),
      student:users!student_id(name, last_name, deleted_at)
    `)
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`)
    .order("scheduled_start", { ascending: true });

  if (error) {
    console.error("Error fetching tutoring sessions from Supabase:", error);
    return [];
  }

  const extendedSessions: UpcomingSessionExtended[] = (data || [])
    .filter((session: any) => {
      const isTutorRole = session.tutor_id === userId;
      const peer = isTutorRole ? session.student : session.tutor;
      return !(peer && peer.deleted_at);
    })
    .map((session: any) => {
      const isTutorRole = session.tutor_id === userId;
      const peer = isTutorRole ? session.student : session.tutor;
      const peerName = peer ? `${peer.name} ${peer.last_name || ""}`.trim() : "Compañero/a";

      return {
        id: session.id,
        tutor_id: session.tutor_id,
        student_id: session.student_id,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        status: session.status,
        meeting_link: session.meeting_link || "",
        created_at: session.created_at,
        subject: session.subject || { id: 0, name: "Materia Desconocida", year: 1 },
        peerName,
        isTutorRole
      };
    });

  return extendedSessions;
}

/**
 * Fetch all upcoming tutoring sessions for the student (CACHED).
 */
export async function fetchUpcomingSessions(): Promise<UpcomingSessionExtended[]> {
  const session = await getVerifiedSession();
  if (!session) return [];

  const { userId, accessToken } = session;
  console.log(`[Cache Access] fetchUpcomingSessions for user: ${userId}`);

  return unstable_cache(
    async () => fetchUpcomingSessionsUncached(userId, accessToken),
    ["upcoming-sessions", userId],
    {
      tags: [CACHE_TAGS.upcomingSessions(userId)],
      revalidate: 86400
    }
  )();
}

/**
 * UNCACHED: Fetch recent forum activities or academic questions.
 */
async function fetchRecentForumPostsUncached(accessToken?: string): Promise<ForumPostExtended[]> {
  const supabase = accessToken ? createStaticClient(accessToken) : createServerClient();

  if (!accessToken) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error("Error fetching recent forum posts: authenticated session not found.");
      return [];
    }
  }
  
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      subject:subjects(name),
      post_type:post_types(name),
      author:users!user_id(name, last_name, deleted_at),
      replies:post_replies(count),
      post_votes(direction)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent forum posts from Supabase:", error);
    return [];
  }

  const extendedPosts: ForumPostExtended[] = (data || [])
    .filter((post: any) => post.author && !post.author.deleted_at)
    .map((post: any) => {
      const votesScore = (post.post_votes || []).reduce(
        (sum: number, vote: { direction: number }) => sum + vote.direction,
        0
      );

      return {
        id: post.id,
        user_id: post.user_id,
        subject_id: post.subject_id,
        post_type_id: post.post_type_id,
        title: post.title,
        content: post.content,
        upvotes: (post.upvotes || 0) + votesScore,
        is_resolved: post.is_resolved,
        created_at: post.created_at,
        subjectName: post.subject?.name,
        postTypeName: post.post_type?.name || "Duda Académica",
        repliesCount: post.replies ? post.replies[0]?.count || 0 : 0,
        type: post.type || 'question',
        metadata: post.metadata || {}
      };
    });

  return extendedPosts;
}

/**
 * Fetch recent forum activities or academic questions.
 */
export async function fetchRecentForumPosts(): Promise<ForumPostExtended[]> {
  const session = await getVerifiedSession();
  if (!session) return [];

  return fetchRecentForumPostsUncached(session.accessToken);
}

/**
 * Update the status of a tutoring session (Accept class or Reject/Cancel class).
 */
export async function updateSessionStatus(
  sessionId: string, 
  newStatus: 'confirmed' | 'canceled'
): Promise<{ success: boolean; data?: UpcomingSessionExtended[]; error?: string }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "Che, no estás autenticado/a." };
    }

    const { data: sessionData } = await supabase
      .from("tutoring_sessions")
      .select("tutor_id, student_id")
      .eq("id", sessionId)
      .single();

    const updateData: any = { status: newStatus };
    if (newStatus === "confirmed") {
      updateData.meeting_link = "https://meet.google.com/xyz-pdqk-wlm";
    }

    const { error } = await supabase
      .from("tutoring_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) throw error;

    invalidateCache(CACHE_TAGS.upcomingSessions(authUser.id));
    if (sessionData) {
      const peerId = sessionData.tutor_id === authUser.id ? sessionData.student_id : sessionData.tutor_id;
      if (peerId) {
        invalidateCache(CACHE_TAGS.upcomingSessions(peerId));
      }
    }

    const freshSessions = await fetchUpcomingSessions();
    return { success: true, data: freshSessions };
  } catch (error: any) {
    console.error("Error updating session status:", error);
    return { success: false, error: error.message || "Hubo un problema al procesar tu solicitud." };
  }
}

/**
 * UNCACHED: Fetch active tutor availability schedule slots.
 */
async function fetchTutorAvailabilityUncached(userId: string, accessToken: string): Promise<DbTutorAvailability[]> {
  const supabase = createStaticClient(accessToken);

  const { data, error } = await supabase
    .from("tutor_availability")
    .select("*")
    .eq("tutor_id", userId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching tutor availability from Supabase:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch active tutor availability schedule slots (CACHED).
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
 * Save active tutor availability calendar slots.
 */
export async function saveTutorAvailability(
  availabilityList: DbTutorAvailability[]
): Promise<{ success: boolean; data?: DbTutorAvailability[]; error?: string }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No autenticado." };
    }

    const { error: deleteError } = await supabase
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

      const { error: insertError } = await supabase
        .from("tutor_availability")
        .insert(insertData);

      if (insertError) throw insertError;
    }

    invalidateCache(CACHE_TAGS.tutorAvailability(authUser.id));

    const fresh = await fetchTutorAvailability();
    return { success: true, data: fresh };
  } catch (error: any) {
    console.error("Error saving tutor availability:", error);
    return { success: false, error: error.message || "Hubo un problema al actualizar tu agenda." };
  }
}

/**
 * UNCACHED: Fetch all replies/comments associated with a forum post.
 */
async function fetchPostRepliesUncached(postId: string, accessToken: string): Promise<DbPostReply[]> {
  const supabase = createStaticClient(accessToken);
  const { data, error } = await supabase
    .from("post_replies")
    .select(`
      *,
      author:users!user_id(name, last_name, deleted_at)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching post replies from Supabase:", error);
    return [];
  }

  return (data || []).filter((r: any) => r.author && !r.author.deleted_at);
}

/**
 * Fetch all replies/comments associated with a forum post (CACHED).
 */
export async function fetchPostReplies(postId: string): Promise<DbPostReply[]> {
  const session = await getVerifiedSession();
  const accessToken = session?.accessToken ?? "";

  console.log(`[Cache Access] fetchPostReplies for post: ${postId}`);

  return unstable_cache(
    async () => fetchPostRepliesUncached(postId, accessToken),
    ["post-replies", postId],
    {
      tags: [CACHE_TAGS.postReplies(postId)],
      revalidate: 86400
    }
  )();
}

/**
 * Submit a new reply comment to a forum post.
 */
export async function addPostReply(
  postId: string,
  content: string
): Promise<{ success: boolean; data?: DbPostReply[]; error?: string }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    if (!content.trim()) {
      return { success: false, error: "El comentario no puede estar vacío." };
    }

    const { error } = await supabase
      .from("post_replies")
      .insert({
        post_id: postId,
        user_id: authUser.id,
        content: content.trim(),
        upvotes: 0,
        is_accepted: false
      });

    if (error) throw error;

    invalidateCache(CACHE_TAGS.postReplies(postId));
    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);

    const replies = await fetchPostReplies(postId);
    return { success: true, data: replies };
  } catch (error: any) {
    console.error("Error adding post reply:", error);
    return { success: false, error: error.message || "Hubo un problema al enviar tu comentario." };
  }
}

/**
 * Upload a document metadata entry.
 */
export async function uploadApunte(
  title: string,
  subjectId: number,
  fileType: string
): Promise<{ success: boolean; data?: DbDocument; error?: string }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    if (!title.trim()) {
      return { success: false, error: "El título del apunte es obligatorio." };
    }

    const newDoc = {
      user_id: authUser.id,
      subject_id: subjectId,
      title: title.trim(),
      document_type: fileType,
      storage_url: `https://accwhmxpbfdvecwaxdho.supabase.co/storage/v1/object/public/apuntes/${title.toLowerCase().replace(/\s+/g, '-')}.${fileType}`,
      upvotes: 0
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(newDoc)
      .select()
      .single();

    if (error) throw error;

    const { data: dbUser } = await supabase
      .from("users")
      .select("points")
      .eq("id", authUser.id)
      .single();

    const currentPoints = dbUser?.points || 0;
    await supabase
      .from("users")
      .update({ points: currentPoints + 50 })
      .eq("id", authUser.id);

    invalidateCache(CACHE_TAGS.resources);
    invalidateCache(CACHE_TAGS.dashboardStats(authUser.id));
    invalidateCache(CACHE_TAGS.userProfile(authUser.id));

    return { success: true, data: data as DbDocument };
  } catch (error: any) {
    console.error("Error uploading apunte:", error);
    return { success: false, error: error.message || "Hubo un problema al registrar tu apunte." };
  }
}

export interface CombinedDashboardData {
  stats: DashboardStats;
  sessions: UpcomingSessionExtended[];
  posts: ForumPostExtended[];
}

/**
 * Fetch stats, sessions, and posts in a single optimized Server Action call.
 */
export async function fetchCombinedDashboardData(): Promise<CombinedDashboardData> {
  const session = await getVerifiedSession();
  if (!session) throw new Error("No estás autenticado/a.");

  const { userId, accessToken } = session;
  console.log(`[Combined Cache Access] fetchCombinedDashboardData for user: ${userId}`);

  const [stats, sessions, posts] = await Promise.all([
    unstable_cache(
      async () => fetchDashboardStatsUncached(userId, accessToken),
      ["dashboard-stats", userId],
      {
        tags: [CACHE_TAGS.dashboardStats(userId)],
        revalidate: 86400
      }
    )(),
    unstable_cache(
      async () => fetchUpcomingSessionsUncached(userId, accessToken),
      ["upcoming-sessions", userId],
      {
        tags: [CACHE_TAGS.upcomingSessions(userId)],
        revalidate: 86400
      }
    )(),
    fetchRecentForumPostsUncached(accessToken)
  ]);

  return { stats, sessions, posts };
}
