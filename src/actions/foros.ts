"use server";

import { createServerClient } from "@/lib/supabase";
import { DbPost, DbPostReply } from "@/types/database";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";

export interface ForumPostExtended extends DbPost {
  subjectName?: string;
  authorName: string;
  authorKarma: number;
  githubUsername?: string;
  repliesCount: number;
  userVote?: "up" | "down" | null;
  category: string;
  categoryColor: string;
  dotColor: string;
  bestAnswer: {
    author: string;
    role: string;
    content: string;
    badge: string;
  } | null;
}

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
      author:users!user_id(name, last_name, points, deleted_at),
      post_replies(id),
      post_votes(user_id, direction)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching forum posts from Supabase:", error);
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
        authorKarma: post.author.points || 0,
        repliesCount: post.post_replies ? post.post_replies.length : 0,
        userVote: currentUserVote ? (currentUserVote.direction === 1 ? "up" : "down") : null,
        category,
        categoryColor: catColor,
        dotColor,
        bestAnswer: null,
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

/**
 * Create a new forum post
 */
export async function createForumPost(
  title: string,
  content: string,
  subject: string,
  type: 'question' | 'resource' | 'tutoring' | 'borrow' | 'sell_rent',
  metadata?: any
): Promise<{ success: boolean; data?: ForumPostExtended; error?: string }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "Che, no estás autenticado/a." };
    }

    if (!title.trim() || !content.trim()) {
      return { success: false, error: "El título y cuerpo de la publicación son obligatorios." };
    }

    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", subject)
      .limit(1);

    const subjectId = subjectData && subjectData.length > 0 ? subjectData[0].id : 1;

    let post_type_id = 1;
    if (type === "resource" || type === "tutoring") {
      post_type_id = 2;
    } else if (type === "borrow" || type === "sell_rent") {
      post_type_id = 3;
    }

    const { data: newPostData, error: insertError } = await supabase
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
        metadata: metadata || {}
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const { data: authorData } = await supabase
      .from("users")
      .select("name, last_name, points")
      .eq("id", authUser.id)
      .single();

    const currentPoints = authorData?.points || 0;
    await supabase
      .from("users")
      .update({ points: currentPoints + 15 })
      .eq("id", authUser.id);

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);
    invalidateCache(CACHE_TAGS.dashboardStats(authUser.id));
    invalidateCache(CACHE_TAGS.userProfile(authUser.id));

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

    const responseData: ForumPostExtended = {
      id: newPostData.id,
      user_id: newPostData.user_id,
      subject_id: newPostData.subject_id,
      post_type_id: newPostData.post_type_id,
      title: newPostData.title,
      content: newPostData.content,
      upvotes: newPostData.upvotes,
      is_resolved: newPostData.is_resolved,
      created_at: newPostData.created_at,
      subjectName: subject,
      authorName: authorData ? `${authorData.name} ${authorData.last_name || ""}`.trim() : "Tu Perfil",
      authorKarma: currentPoints + 15,
      repliesCount: 0,
      userVote: null,
      category,
      categoryColor: catColor,
      dotColor,
      bestAnswer: null,
      type,
      metadata: newPostData.metadata || {}
    };

    return { success: true, data: responseData };
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

/**
 * Upvote or downvote a forum post
 */
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

    const nextDirection = direction === "up" ? 1 : -1;

    const { data: existingVote, error: voteFetchError } = await supabase
      .from("post_votes")
      .select("direction")
      .eq("post_id", postId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (voteFetchError) throw voteFetchError;

    let userVote: "up" | "down" | null = direction;

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
    console.error("Error casting post vote:", error);
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

  return (data || [])
    .filter((r: any) => r.author && !r.author.deleted_at)
    .map((r: any) => ({
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      content: r.content,
      upvotes: r.upvotes || 0,
      is_accepted: r.is_accepted || false,
      created_at: r.created_at
    }));
}

/**
 * Fetch replies for a specific thread
 */
export async function fetchPostReplies(postId: string): Promise<DbPostReply[]> {
  return fetchPostRepliesUncached(postId);
}

/**
 * Add a new response/reply to a thread
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
      return { success: false, error: "La respuesta no puede estar vacía." };
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

    const freshReplies = await fetchPostReplies(postId);
    return { success: true, data: freshReplies };
  } catch (error: any) {
    console.error("Error adding post reply:", error);
    return { success: false, error: error.message || "No se pudo publicar la respuesta." };
  }
}

/**
 * Mark a post as solved
 */
export async function resolvePost(
  postId: string,
  replyId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    
    const { error: postError } = await supabase
      .from("posts")
      .update({ is_resolved: true })
      .eq("id", postId);

    if (postError) throw postError;

    if (replyId) {
      const { error: replyError } = await supabase
        .from("post_replies")
        .update({ is_accepted: true })
        .eq("id", replyId);

      if (replyError) throw replyError;
    }

    invalidateCache(CACHE_TAGS.forumPosts);
    invalidateCache(CACHE_TAGS.recentForumPosts);
    invalidateCache(CACHE_TAGS.postReplies(postId));

    return { success: true };
  } catch (error: any) {
    console.error("Error resolving post:", error);
    return { success: false, error: error.message || "No se pudo actualizar la resolución del hilo." };
  }
}
