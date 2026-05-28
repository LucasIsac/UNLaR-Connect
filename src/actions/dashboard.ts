"use server";

import { createServerClient } from "@/lib/supabase";
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
 * Fetch core statistics, level, XP, and badges earned by the user.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerClient();
  const authResponse = await supabase.auth.getUser();
  const authUser = authResponse?.data?.user;

  if (!authUser) {
    throw new Error("No estás autenticado/a.");
  }

  // 1. Fetch user metrics
  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (userError || !dbUser) {
    throw new Error("Usuario no encontrado en la base de datos.");
  }

  // 2. Fetch badges
  const { data: allBadges } = await supabase
    .from("badges")
    .select("*")
    .order("required_points", { ascending: true });

  const recentBadges = allBadges || [];

  // Calculating level: let's do Level = Math.floor(points / 250) + 1, and level threshold:
  const points = dbUser.points || 0;
  const karmaLevel = Math.floor(points / 250) + 1;
  const nextLevelXP = karmaLevel * 250;
  const xpPercentage = Math.min(((points % 250) / 250) * 100, 100);

  // Return standard notifications
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
 * Fetch all upcoming tutoring sessions for the student (either as tutor or learner)
 */
export async function fetchUpcomingSessions(): Promise<UpcomingSessionExtended[]> {
  const supabase = createServerClient();
  const authResponse = await supabase.auth.getUser();
  const authUser = authResponse?.data?.user;

  if (!authUser) {
    return [];
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select(`
      *,
      subject:subjects(*),
      tutor:users!tutor_id(name, last_name, deleted_at),
      student:users!student_id(name, last_name, deleted_at)
    `)
    .or(`student_id.eq.${authUser.id},tutor_id.eq.${authUser.id}`)
    .order("scheduled_start", { ascending: true });

  if (error) {
    console.error("Error fetching tutoring sessions from Supabase:", error);
    return [];
  }

  const extendedSessions: UpcomingSessionExtended[] = (data || [])
    .filter((session: any) => {
      // Exclude sessions where the other participant is soft-deleted
      const isTutorRole = session.tutor_id === authUser.id;
      const peer = isTutorRole ? session.student : session.tutor;
      if (peer && peer.deleted_at) {
        return false;
      }
      return true;
    })
    .map((session: any) => {
      const isTutorRole = session.tutor_id === authUser.id;
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
 * Fetch recent forum activities or academic questions
 */
export async function fetchRecentForumPosts(): Promise<ForumPostExtended[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      subject:subjects(name),
      post_type:post_types(name),
      author:users!user_id(name, last_name, deleted_at),
      replies:post_replies(count)
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
      return {
        id: post.id,
        user_id: post.user_id,
        subject_id: post.subject_id,
        post_type_id: post.post_type_id,
        title: post.title,
        content: post.content,
        upvotes: post.upvotes || 0,
        is_resolved: post.is_resolved,
        created_at: post.created_at,
        subjectName: post.subject?.name,
        postTypeName: post.post_type?.name || "Duda Académica",
        repliesCount: post.replies ? post.replies[0]?.count || 0 : 0
      };
    });

  return extendedPosts;
}

/**
 * Update the status of a tutoring session (Accept class or Reject/Cancel class)
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

    const updateData: any = { status: newStatus };
    if (newStatus === "confirmed") {
      updateData.meeting_link = "https://meet.google.com/xyz-pdqk-wlm";
    }

    const { error } = await supabase
      .from("tutoring_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) throw error;

    const freshSessions = await fetchUpcomingSessions();
    return { success: true, data: freshSessions };
  } catch (error: any) {
    console.error("Error updating session status:", error);
    return { success: false, error: error.message || "Hubo un problema al procesar tu solicitud." };
  }
}

/**
 * Fetch active tutor availability schedule slots
 */
export async function fetchTutorAvailability(): Promise<DbTutorAvailability[]> {
  const supabase = createServerClient();
  const authResponse = await supabase.auth.getUser();
  const authUser = authResponse?.data?.user;

  if (!authUser) {
    return [];
  }

  const { data, error } = await supabase
    .from("tutor_availability")
    .select("*")
    .eq("tutor_id", authUser.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching tutor availability from Supabase:", error);
    return [];
  }

  return data || [];
}

/**
 * Save active tutor availability calendar slots
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

    // Delete existing availability slots
    const { error: deleteError } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("tutor_id", authUser.id);

    if (deleteError) throw deleteError;

    // Insert new availability slots
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

    const fresh = await fetchTutorAvailability();
    return { success: true, data: fresh };
  } catch (error: any) {
    console.error("Error saving tutor availability:", error);
    return { success: false, error: error.message || "Hubo un problema al actualizar tu agenda." };
  }
}

/**
 * Fetch all replies/comments associated with a forum post
 */
export async function fetchPostReplies(postId: string): Promise<DbPostReply[]> {
  const supabase = createServerClient();
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

  // Filter out replies from soft-deleted users
  return (data || []).filter((r: any) => r.author && !r.author.deleted_at);
}

/**
 * Submit a new reply comment to a forum post
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

    const newReply = {
      post_id: postId,
      user_id: authUser.id,
      content: content.trim(),
      upvotes: 0,
      is_accepted: false
    };

    const { error } = await supabase
      .from("post_replies")
      .insert(newReply);

    if (error) throw error;

    const replies = await fetchPostReplies(postId);
    return { success: true, data: replies };
  } catch (error: any) {
    console.error("Error adding post reply:", error);
    return { success: false, error: error.message || "Hubo un problema al enviar tu comentario." };
  }
}

/**
 * Upload a document metadata entry
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

    // Increment points for user by 50 points (Karma points)
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

    return { success: true, data: data as DbDocument };
  } catch (error: any) {
    console.error("Error uploading apunte:", error);
    return { success: false, error: error.message || "Hubo un problema al registrar tu apunte." };
  }
}
