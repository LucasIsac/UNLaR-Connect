"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import { DbPost, DbPostReply } from "@/types/database";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";
import { awardPoints } from "@/actions/reputation";
import { POINT_VALUES } from "@/lib/reputation-constants";

// ==========================================
// TYPES
// ==========================================

export interface ForumPostExtended extends DbPost {
  subjectName?: string;
  authorName: string;
  authorId: string;
  authorKarma: number;
  repliesCount: number;
  userVote?: "up" | "down" | null;
  category: string;
  categoryColor: string;
  dotColor: string;
  bestAnswer: {
    author: string;
    content: string;
  } | null;
}

export interface TopContributor {
  id: string;
  name: string;
  points: number;
  avatar_url?: string;
}

export interface PopularTag {
  tag: string;
  count: number;
}

// ==========================================
// READ: Forum Posts (with best answer)
// ==========================================

/**
 * UNCACHED: Fetch all forum posts (threads list)
 */
async function fetchForumPostsUncached(): Promise<ForumPostExtended[]> {
  const supabase = createServerClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (authError || !authUser) {
    console.error("Error fetching forum posts: authenticated session not found.");
    return [];
  }
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      subject:subjects(name),
      post_type:post_types(name),
      author:users!user_id(id, name, last_name, points, deleted_at),
      post_replies(id, is_accepted, content, author:users!user_id(name, last_name)),
      post_votes(user_id, direction)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching forum posts:", error);
    return [];
  }

  return (data || [])
    .filter((post: any) => post.author && !post.author.deleted_at)
    .map((post: any) => {
      const type = post.type || 'question';
      let category = "Pregunta";
      let catColor = "text-red-400 bg-red-400/10 border-red-400/20";
      let dotColor = "bg-red-400";

      if (type === 'resource') {
        category = "Recurso";
        catColor = "text-accent bg-accent/10 border-accent/20";
        dotColor = "bg-secondary";
      } else if (type === 'tutoring') {
        category = "Tutoría";
        catColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
        dotColor = "bg-blue-400";
      } else if (type === 'borrow') {
        category = "Préstamo";
        catColor = "text-teal-400 bg-teal-400/10 border-teal-400/20";
        dotColor = "bg-teal-400";
      } else if (type === 'sell_rent') {
        category = "Compra / Alquiler";
        catColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
        dotColor = "bg-purple-400";
      }

      const voteRows = post.post_votes || [];
      const votesScore = voteRows.reduce((sum: number, vote: { direction: number }) => sum + vote.direction, 0);
      const currentUserVote = voteRows.find((vote: { user_id: string }) => vote.user_id === authUser.id);

      // Find the accepted answer
      const acceptedReply = post.post_replies?.find((r: any) => r.is_accepted);
      const bestAnswer = acceptedReply
        ? {
            author: `${acceptedReply.author?.name || ""} ${acceptedReply.author?.last_name || ""}`.trim(),
            content: acceptedReply.content,
          }
        : null;

      return {
        id: post.id,
        user_id: post.user_id,
        subject_id: post.subject_id,
        post_type_id: post.post_type_id,
        title: post.title,
        content: post.content,
        upvotes: (post.upvotes || 0) + votesScore,
        is_resolved: post.is_resolved || false,
        created_at: post.created_at,
        subjectName: post.subject?.name || "General",
        authorName: `${post.author.name} ${post.author.last_name || ""}`.trim(),
        authorId: post.author.id,
        authorKarma: post.author.points || 0,
        repliesCount: post.post_replies ? post.post_replies.length : 0,
        userVote: currentUserVote ? (currentUserVote.direction === 1 ? "up" : "down") : null,
        category,
        categoryColor: catColor,
        dotColor,
        bestAnswer,
        type,
        metadata: post.metadata || {}
      };
    });
}

/**
 * Fetch all forum posts (threads list)
 */
export async function fetchForumPosts(): Promise<ForumPostExtended[]> {
  return fetchForumPostsUncached();
}

// ==========================================
// READ: User votes for a set of posts
// ==========================================

export async function fetchUserVotes(
  postIds: string[]
): Promise<Record<string, "up" | "down" | null>> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user || postIds.length === 0) return {};

    const { data } = await supabase
      .from("post_votes")
      .select("post_id, direction")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const map: Record<string, "up" | "down" | null> = {};
    postIds.forEach((id) => (map[id] = null));
    (data || []).forEach((v: any) => {
      map[v.post_id] = v.direction === 1 ? "up" : "down";
    });
    return map;
  } catch {
    return {};
  }
}

// ==========================================
// READ: User votes for replies
// ==========================================

export async function fetchReplyVotes(
  replyIds: string[]
): Promise<Record<string, "up" | "down" | null>> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user || replyIds.length === 0) return {};

    const { data } = await supabase
      .from("post_votes")
      .select("post_id, direction")
      .eq("user_id", user.id)
      .in("post_id", replyIds);

    const map: Record<string, "up" | "down" | null> = {};
    replyIds.forEach((id) => (map[id] = null));
    (data || []).forEach((v: any) => {
      map[v.post_id] = v.direction === 1 ? "up" : "down";
    });
    return map;
  } catch {
    return {};
  }
}

// ==========================================
// READ: Current user ID (via getVerifiedSession)
// ==========================================

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await getVerifiedSession();
    console.log("[getCurrentUserId] session:", session?.userId ?? "null");
    return session?.userId ?? null;
  } catch (err) {
    console.error("[getCurrentUserId] error:", err);
    return null;
  }
}

// ==========================================
// CREATE: Forum post
// ==========================================

export async function createForumPost(
  title: string,
  content: string,
  subject: string,
  type: 'question' | 'resource' | 'tutoring' | 'borrow' | 'sell_rent',
  metadata?: Record<string, unknown>,
  imageUrl?: string
): Promise<{ success: boolean; data?: ForumPostExtended; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const authUser = authRes?.user;
    if (!authUser) return { success: false, error: "No estás autenticado/a." };

    if (!title.trim() || !content.trim()) {
      return { success: false, error: "El título y cuerpo de la publicación son obligatorios." };
    }

    const { data: subjectData } = await supabase
      .from("subjects").select("id").eq("name", subject).limit(1);
    const subjectId = subjectData && subjectData.length > 0 ? subjectData[0].id : 1;

    let post_type_id = 1;
    if (type === "resource" || type === "tutoring") {
      post_type_id = 2;
    } else if (type === "borrow" || type === "sell_rent") {
      post_type_id = 3;
    }

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: authUser.id,
        subject_id: subjectId,
        post_type_id,
        title: title.trim(),
        content: content.trim(),
        upvotes: 1,
        is_resolved: false,
        type,
        metadata: metadata || {},
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Award +15 points for creating a post
    await awardPoints(authUser.id, POINT_VALUES.FORO_POST, "foro_post", "Publicó un hilo en el foro", newPost.id);

    // Auto-upvote own post
    await supabase.from("post_votes").insert({
      user_id: authUser.id,
      post_id: newPost.id,
      direction: 1,
    });

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);
    invalidateCache(CACHE_TAGS.dashboardStats(authUser.id));

    let category = "Pregunta";
    let catColor = "text-red-400 bg-red-400/10 border-red-400/20";
    let dotColor = "bg-red-400";

    if (type === 'resource') {
      category = "Recurso";
      catColor = "text-accent bg-accent/10 border-accent/20";
      dotColor = "bg-secondary";
    } else if (type === 'tutoring') {
      category = "Tutoría";
      catColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
      dotColor = "bg-blue-400";
    } else if (type === 'borrow') {
      category = "Préstamo";
      catColor = "text-teal-400 bg-teal-400/10 border-teal-400/20";
      dotColor = "bg-teal-400";
    } else if (type === 'sell_rent') {
      category = "Compra / Alquiler";
      catColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
      dotColor = "bg-purple-400";
    }

    return {
      success: true,
      data: {
        ...newPost,
        subjectName: subject,
        authorName: "Tu Perfil",
        authorId: authUser.id,
        authorKarma: 0, // Will be refreshed on next page load
        repliesCount: 0,
        userVote: null,
        category,
        categoryColor: catColor,
        dotColor,
        bestAnswer: null,
        type,
        metadata: newPost.metadata || {}
      },
    };
  } catch (error: any) {
    console.error("Error creating forum post:", error);
    return { success: false, error: error.message || "Hubo un problema al crear tu publicación." };
  }
}

/**
 * Interact with a post (Interest, Reserve, Deliver, Return)
 */
export async function interactWithPost(
  postId: string,
  actionType: "interest" | "reserve" | "deliver" | "return"
): Promise<{ success: boolean; error?: string; updatedPost?: ForumPostExtended }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "Che, no estás autenticado/a." };
    }

    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select(`
        *,
        subject:subjects(name),
        post_type:post_types(name),
        author:users!user_id(id, name, last_name, points, email)
      `)
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return { success: false, error: "No se encontró la publicación." };
    }

    const currentMetadata = post.metadata || {};
    let updatedMetadata = { ...currentMetadata };
    let notificationTitle = "";
    let notificationContent = "";
    let targetUserId = post.user_id;

    const currentUserFullName = `${authUser.user_metadata?.name || "Un estudiante"} ${authUser.user_metadata?.last_name || ""}`.trim();

    if (actionType === "interest") {
      notificationTitle = "¡Alguien se interesó en tu publicación!";
      notificationContent = `${currentUserFullName} está interesado/a en tu publicación '${post.title}'. ¡Ponete en contacto!`;
    } else if (actionType === "reserve") {
      updatedMetadata.status = "reserved";
      notificationTitle = "¡Artículo Reservado!";
      notificationContent = `${currentUserFullName} reservó tu artículo '${currentMetadata.item_name || post.title}'.`;
    } else if (actionType === "deliver") {
      updatedMetadata.status = "delivered";
      notificationTitle = "Artículo Entregado";
      notificationContent = `Marcaste el artículo '${currentMetadata.item_name || post.title}' como entregado.`;
    } else if (actionType === "return") {
      updatedMetadata.status = "available";
      notificationTitle = "Artículo Devuelto";
      notificationContent = `El artículo '${currentMetadata.item_name || post.title}' fue marcado como devuelto y vuelve a estar disponible.`;
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({ metadata: updatedMetadata })
      .eq("id", postId);

    if (updateError) throw updateError;

    if (targetUserId !== authUser.id) {
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: notificationTitle,
        content: notificationContent,
        type: "foros",
        is_read: false
      });
    } else {
      await supabase.from("notifications").insert({
        user_id: authUser.id,
        title: notificationTitle,
        content: notificationContent,
        type: "foros",
        is_read: false
      });
    }

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);

    // Fetch refreshed posts
    const allPosts = await fetchForumPosts();
    const updatedPost = allPosts.find((p) => p.id === postId);

    return { success: true, updatedPost };
  } catch (error: any) {
    console.error("Error interacting with post:", error);
    return { success: false, error: error.message || "Hubo un error al procesar tu acción." };
  }
}

// ==========================================
// VOTE: Upvote / downvote (with persistence)
// ==========================================

export async function castPostVote(
  postId: string,
  direction: "up" | "down"
): Promise<{ success: boolean; likes?: number; userVote?: "up" | "down" | null; error?: string }> {
  try {
    const supabase = createServerClient();

    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "Che, no estás autenticado/a." };
    }

    // Get the post author to award them points
    const { data: postAuthor } = await supabase
      .from("posts").select("user_id").eq("id", postId).single();

    const nextDirection = direction === "up" ? 1 : -1;

    const { data: existingVote, error: voteFetchError } = await supabase
      .from("post_votes")
      .select("direction")
      .eq("post_id", postId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (voteFetchError) throw voteFetchError;

    let userVote: "up" | "down" | null = direction;
    let pointsAwarded = 0;

    if (existingVote?.direction === nextDirection) {
      const { error: deleteError } = await supabase
        .from("post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", authUser.id);

      if (deleteError) throw deleteError;
      userVote = null;
    } else {
      const { error: upsertError } = await supabase
        .from("post_votes")
        .upsert(
          {
            post_id: postId,
            user_id: authUser.id,
            direction: nextDirection
          },
          { onConflict: "user_id,post_id" }
        );

      if (upsertError) throw upsertError;

      // Award +5 points to post author for receiving an upvote (not self-upvote)
      if (direction === "up" && postAuthor && postAuthor.user_id !== authUser.id) {
        await awardPoints(postAuthor.user_id, POINT_VALUES.RESOURCE_UPVOTE, "resource_upvote", "Recibió un like en su publicación", postId);
        pointsAwarded = POINT_VALUES.RESOURCE_UPVOTE;
      }
    }

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("upvotes")
      .eq("id", postId)
      .single();

    if (postError) throw postError;

    const { data: votesData, error: votesError } = await supabase
      .from("post_votes")
      .select("direction")
      .eq("post_id", postId);

    if (votesError) throw votesError;

    const votesScore = (votesData || []).reduce((sum, vote) => sum + vote.direction, 0);
    const likes = (postData?.upvotes || 0) + votesScore;

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);

    return { success: true, likes, userVote };
  } catch (error: any) {
    console.error("Error casting vote:", error);
    return { success: false, error: error.message || "No se pudo registrar tu voto." };
  }
}

/**
 * UNCACHED: Fetch replies for a specific thread
 */
async function fetchPostRepliesUncached(postId: string): Promise<DbPostReply[]> {
  const supabase = createServerClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    console.error("Error fetching post replies: authenticated session not found.");
    return [];
  }
  const { data, error } = await supabase
    .from("post_replies")
    .select(`*, author:users!user_id(id, name, last_name, deleted_at)`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data || [])
    .filter((r: any) => r.author && !r.author.deleted_at)
    .map((r: any) => ({
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      content: r.content,
      upvotes: r.upvotes || 0,
      is_accepted: r.is_accepted || false,
      created_at: r.created_at,
    }));
}

/**
 * Fetch replies for a specific thread
 */
export async function fetchPostReplies(postId: string): Promise<DbPostReply[]> {
  return fetchPostRepliesUncached(postId);
}

// ==========================================
// CREATE: Reply
// ==========================================

export async function addPostReply(
  postId: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; data?: DbPostReply[]; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user) return { success: false, error: "No estás autenticado/a." };
    if (!content.trim() && !imageUrl) return { success: false, error: "La respuesta no puede estar vacía." };

    const { error } = await supabase.from("post_replies").insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      upvotes: 0,
      is_accepted: false,
      image_url: imageUrl || null,
    });
    if (error) throw error;

    // Award +10 points for replying
    await awardPoints(user.id, POINT_VALUES.FORO_REPLY, "foro_reply", "Respondió una pregunta en el foro", postId);

    invalidateCache(CACHE_TAGS.postReplies(postId));
    invalidateCache(CACHE_TAGS.forumPosts);
    const freshReplies = await fetchPostReplies(postId);
    return { success: true, data: freshReplies };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo publicar la respuesta." };
  }
}

// ==========================================
// UPDATE: Resolve post
// ==========================================

export async function resolvePost(
  postId: string,
  replyId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;

    const { error: postError } = await supabase
      .from("posts").update({ is_resolved: true }).eq("id", postId);
    if (postError) throw postError;

    if (replyId) {
      const { error: replyError } = await supabase
        .from("post_replies").update({ is_accepted: true }).eq("id", replyId);
      if (replyError) throw replyError;

      // Get the reply author to award them points
      const { data: reply } = await supabase
        .from("post_replies").select("user_id").eq("id", replyId).single();

      if (reply && reply.user_id !== user?.id) {
        // Award +50 to the winner
        await awardPoints(reply.user_id, POINT_VALUES.BEST_ANSWER_WINNER, "best_answer_winner", "Su respuesta fue seleccionada como mejor", postId);
        // Award +25 to the selector
        if (user) {
          await awardPoints(user.id, POINT_VALUES.BEST_ANSWER_SELECTOR, "best_answer_selector", "Seleccionó la mejor respuesta", postId);
        }
      }
    }

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);
    invalidateCache(CACHE_TAGS.postReplies(postId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo actualizar." };
  }
}

// ==========================================
// UPDATE: Edit post
// ==========================================

export async function editPost(
  postId: string,
  title: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user) return { success: false, error: "No estás autenticado." };

    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (!post || post.user_id !== user.id) {
      return { success: false, error: "No tenés permiso para editar este hilo." };
    }

    const { error } = await supabase
      .from("posts")
      .update({ title: title.trim(), content: content.trim() })
      .eq("id", postId);
    if (error) throw error;

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo editar el hilo." };
  }
}

// ==========================================
// UPDATE: Edit reply
// ==========================================

export async function editReply(
  replyId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user) return { success: false, error: "No estás autenticado." };

    const { data: reply } = await supabase.from("post_replies").select("user_id, post_id").eq("id", replyId).single();
    if (!reply || reply.user_id !== user.id) {
      return { success: false, error: "No tenés permiso para editar esta respuesta." };
    }

    const { error } = await supabase
      .from("post_replies")
      .update({ content: content.trim() })
      .eq("id", replyId);
    if (error) throw error;

    invalidateCache(CACHE_TAGS.postReplies(reply.post_id));
    invalidateCache(CACHE_TAGS.forumPosts);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo editar la respuesta." };
  }
}

// ==========================================
// DELETE: Delete post
// ==========================================

export async function deletePost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user) return { success: false, error: "No estás autenticado." };

    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (!post || post.user_id !== user.id) {
      return { success: false, error: "No tenés permiso para borrar este hilo." };
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);
    invalidateCache(CACHE_TAGS.postReplies(postId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo borrar el hilo." };
  }
}

// ==========================================
// DELETE: Delete reply
// ==========================================

export async function deleteReply(
  replyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    const user = authRes?.user;
    if (!user) return { success: false, error: "No estás autenticado." };

    const { data: reply } = await supabase.from("post_replies").select("user_id, post_id").eq("id", replyId).single();
    if (!reply || reply.user_id !== user.id) {
      return { success: false, error: "No tenés permiso para borrar esta respuesta." };
    }

    const { error } = await supabase.from("post_replies").delete().eq("id", replyId);
    if (error) throw error;

    invalidateCache(CACHE_TAGS.postReplies(reply.post_id));
    invalidateCache(CACHE_TAGS.forumPosts);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo borrar la respuesta." };
  }
}

// ==========================================
// READ: Top contributors (dynamic)
// ==========================================

export async function fetchTopContributors(): Promise<TopContributor[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("users")
      .select("id, name, last_name, points, avatar_url, deleted_at")
      .is("deleted_at", null)
      .order("points", { ascending: false })
      .limit(5);

    return (data || []).map((u: any) => ({
      id: u.id,
      name: `${u.name} ${u.last_name || ""}`.trim(),
      points: u.points || 0,
      avatar_url: u.avatar_url,
    }));
  } catch {
    return [];
  }
}

// ==========================================
// READ: Popular tags (dynamic)
// ==========================================

export async function fetchPopularTags(): Promise<PopularTag[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("post_tags")
      .select("tag:tags(name)")
      .limit(200);

    if (!data) return [];

    const counts: Record<string, number> = {};
    (data || []).forEach((pt: any) => {
      const name = pt.tag?.name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch {
    return [];
  }
}
