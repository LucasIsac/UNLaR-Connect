"use server";

import { createServerClient } from "@/lib/supabase";
import { DbPost, DbPostReply, DbSubject } from "@/types/database";

export interface ForumPostExtended extends DbPost {
  subjectName?: string;
  authorName: string;
  authorKarma: number;
  githubUsername?: string;
  repliesCount: number;
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
 * Fetch all forum posts (threads list)
 */
export async function fetchForumPosts(): Promise<ForumPostExtended[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      subject:subjects(name),
      post_type:post_types(name),
      author:users!user_id(name, last_name, points, deleted_at),
      post_replies(id)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching forum posts from Supabase:", error);
    return [];
  }

  // Filter out posts from soft-deleted users
  return (data || [])
    .filter((post: any) => post.author && !post.author.deleted_at)
    .map((post: any) => {
      const catColor = post.post_type?.id === 1 
        ? "text-red-400 bg-red-400/10 border-red-400/20" 
        : post.post_type?.id === 2 
          ? "text-accent bg-accent/10 border-accent/20" 
          : "text-teal-400 bg-teal-400/10 border-teal-400/20";
      
      const dotColor = post.post_type?.id === 1 
        ? "bg-red-400" 
        : post.post_type?.id === 2 
          ? "bg-secondary" 
          : "bg-accent";

      return {
        id: post.id,
        user_id: post.user_id,
        subject_id: post.subject_id,
        post_type_id: post.post_type_id,
        title: post.title,
        content: post.content,
        upvotes: post.upvotes || 0,
        is_resolved: post.is_resolved || false,
        created_at: post.created_at,
        subjectName: post.subject?.name || "General",
        authorName: `${post.author.name} ${post.author.last_name || ""}`.trim(),
        authorKarma: post.author.points || 0,
        repliesCount: post.post_replies ? post.post_replies.length : 0,
        category: post.post_type?.name || "Duda Académica",
        categoryColor: catColor,
        dotColor,
        bestAnswer: null
      };
    });
}

/**
 * Create a new forum post
 */
export async function createForumPost(
  title: string,
  content: string,
  subject: string,
  category: string
): Promise<{ success: boolean; data?: ForumPostExtended; error?: string }> {
  try {
    const supabase = createServerClient();
    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "Che, no estás autenticado/a." };
    }

    if (!title.trim() || !content.trim()) {
      return { success: false, error: "El título y cuerpo del hilo son obligatorios." };
    }

    // 1. Look up subject ID matching name
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", subject)
      .limit(1);

    const subjectId = subjectData && subjectData.length > 0 ? subjectData[0].id : 1;

    // 2. Map category to post_type_id
    let post_type_id = 1;
    if (category === "Consejo de Cursada") {
      post_type_id = 2;
    } else if (category === "Ayuda con TP" || category === "Compraventa") {
      post_type_id = 3;
    }

    // 3. Insert post
    const { data: newPostData, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: authUser.id,
        subject_id: subjectId,
        post_type_id,
        title: title.trim(),
        content: content.trim(),
        upvotes: 1,
        is_resolved: false
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Fetch author user details to build extended response
    const { data: authorData } = await supabase
      .from("users")
      .select("name, last_name, points")
      .eq("id", authUser.id)
      .single();

    // 5. Award 15 Karma points to the user for posting
    const currentPoints = authorData?.points || 0;
    await supabase
      .from("users")
      .update({ points: currentPoints + 15 })
      .eq("id", authUser.id);

    const catColor = post_type_id === 1 
      ? "text-red-400 bg-red-400/10 border-red-400/20" 
      : post_type_id === 2 
        ? "text-accent bg-accent/10 border-accent/20" 
        : "text-teal-400 bg-teal-400/10 border-teal-400/20";
    
    const dotColor = post_type_id === 1 
      ? "bg-red-400" 
      : post_type_id === 2 
        ? "bg-secondary" 
        : "bg-accent";

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
      category,
      categoryColor: catColor,
      dotColor,
      bestAnswer: null
    };

    return { success: true, data: responseData };
  } catch (error: any) {
    console.error("Error creating forum post:", error);
    return { success: false, error: error.message || "Hubo un problema al crear tu hilo." };
  }
}

/**
 * Upvote or downvote a forum post
 */
export async function castPostVote(
  postId: string,
  direction: "up" | "down",
  currentVote: "up" | "down" | null
): Promise<{ success: boolean; likes?: number; error?: string }> {
  try {
    const supabase = createServerClient();
    
    let diff = 0;
    if (currentVote === direction) {
      diff = direction === "up" ? -1 : 1;
    } else if (currentVote) {
      diff = direction === "up" ? 2 : -2;
    } else {
      diff = direction === "up" ? 1 : -1;
    }

    const { data: postData } = await supabase
      .from("posts")
      .select("upvotes")
      .eq("id", postId)
      .single();

    const currentUpvotes = postData?.upvotes || 0;
    const newUpvotes = currentUpvotes + diff;

    const { error } = await supabase
      .from("posts")
      .update({ upvotes: newUpvotes })
      .eq("id", postId);

    if (error) throw error;

    return { success: true, likes: newUpvotes };
  } catch (error: any) {
    console.error("Error casting post vote:", error);
    return { success: false, error: error.message || "No se pudo registrar tu voto." };
  }
}

/**
 * Fetch replies for a specific thread
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

  // Filter out replies from soft-deleted authors
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
    
    // Set is_resolved on post
    const { error: postError } = await supabase
      .from("posts")
      .update({ is_resolved: true })
      .eq("id", postId);

    if (postError) throw postError;

    // If replyId is specified, mark it as is_accepted = true
    if (replyId) {
      const { error: replyError } = await supabase
        .from("post_replies")
        .update({ is_accepted: true })
        .eq("id", replyId);

      if (replyError) throw replyError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error resolving post:", error);
    return { success: false, error: error.message || "No se pudo actualizar la resolución del hilo." };
  }
}
