"use server";

import { createServerClient, createStaticClient, getVerifiedSession } from "@/lib/supabase";
import { DbDocument } from "@/types/database";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";

export interface ResourceExtended extends DbDocument {
  category: string;
  categoryColor: string;
  thematicAxis: string;
  authorName: string;
  uploadedDate: string;
  saved: boolean;
  likes: number;
  description: string;
}

/**
 * UNCACHED: Fetch all resources/documents
 */
async function fetchResourcesUncached(accessToken: string): Promise<ResourceExtended[]> {
  const supabase = createStaticClient(accessToken);
  const { data, error } = await supabase
    .from("documents")
    .select(`
      *,
      subject:subjects(*),
      author:users!user_id(name, last_name, deleted_at)
    `)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching resources from Supabase:", error);
    return [];
  }

  return (data || [])
    .filter((doc: any) => doc.author && !doc.author.deleted_at)
    .map((doc: any) => {
      const categoryName = doc.subject?.name || "General";
      const catColor = categoryName === "Sistemas Operativos" 
        ? "text-orange-400 bg-orange-400/10 border-orange-400/20" 
        : categoryName === "Bases de Datos" 
          ? "text-secondary bg-secondary/10 border-secondary/20" 
          : "text-accent bg-accent/10 border-accent/20";

      return {
        id: doc.id,
        user_id: doc.user_id,
        subject_id: doc.subject_id,
        topic_id: doc.topic_id,
        title: doc.title,
        document_type: doc.document_type || "pdf",
        storage_url: doc.storage_url,
        uploaded_at: doc.uploaded_at,
        upvotes: doc.upvotes || 0,
        category: categoryName,
        categoryColor: catColor,
        thematicAxis: "Material de Cursada",
        authorName: `${doc.author.name} ${doc.author.last_name || ""}`.trim(),
        uploadedDate: new Date(doc.uploaded_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
        likes: doc.upvotes || 0,
        saved: false,
        description: `Apunte oficial cargado por ${doc.author.name} para la materia ${categoryName}.`
      };
    });
}

/**
 * Fetch all resources/documents (CACHED)
 */
export async function fetchResources(): Promise<ResourceExtended[]> {
  const session = await getVerifiedSession();
  const accessToken = session?.accessToken ?? "";

  console.log("[Cache Access] fetchResources");

  return unstable_cache(
    async () => fetchResourcesUncached(accessToken),
    ["resources"],
    {
      tags: [CACHE_TAGS.resources],
      revalidate: 86400
    }
  )();
}

/**
 * Upload resource document metadata entry
 */
export async function uploadResource(
  title: string,
  category: string,
  thematicAxis: string,
  type: string
): Promise<{ success: boolean; data?: ResourceExtended; error?: string }> {
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

    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", category)
      .limit(1);

    const subjectId = subjectData && subjectData.length > 0 ? subjectData[0].id : 1;

    const { data: newDocData, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: authUser.id,
        subject_id: subjectId,
        title: title.trim(),
        document_type: "pdf",
        storage_url: `https://accwhmxpbfdvecwaxdho.supabase.co/storage/v1/object/public/apuntes/${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        upvotes: 1
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
      .update({ points: currentPoints + 50 })
      .eq("id", authUser.id);

    invalidateCache(CACHE_TAGS.resources);
    invalidateCache(CACHE_TAGS.dashboardStats(authUser.id));
    invalidateCache(CACHE_TAGS.userProfile(authUser.id));

    const catColor = category === "Sistemas Operativos" 
      ? "text-orange-400 bg-orange-400/10 border-orange-400/20" 
      : category === "Bases de Datos" 
        ? "text-secondary bg-secondary/10 border-secondary/20" 
        : "text-accent bg-accent/10 border-accent/20";

    const responseData: ResourceExtended = {
      id: newDocData.id,
      user_id: newDocData.user_id,
      subject_id: newDocData.subject_id,
      topic_id: newDocData.topic_id,
      title: newDocData.title,
      document_type: newDocData.document_type,
      storage_url: newDocData.storage_url,
      uploaded_at: newDocData.uploaded_at,
      upvotes: newDocData.upvotes,
      category,
      categoryColor: catColor,
      thematicAxis,
      authorName: authorData ? `${authorData.name} ${authorData.last_name || ""}`.trim() : "Tu Perfil",
      uploadedDate: "Hoy",
      likes: 1,
      saved: false,
      description: `Material sobre ${thematicAxis} (${type}). Aportado voluntariamente por la comunidad de la carrera.`
    };

    return { success: true, data: responseData };
  } catch (error: any) {
    console.error("Error uploading resource in Supabase:", error);
    return { success: false, error: error.message || "Hubo un problema al registrar tu apunte." };
  }
}

/**
 * Favorite or save a resource
 */
export async function toggleSaveResource(
  resourceId: string
): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  return { success: true, saved: true };
}

/**
 * Cast vote/like on resource card
 */
export async function castResourceVote(
  resourceId: string
): Promise<{ success: boolean; likes?: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: docData } = await supabase
      .from("documents")
      .select("upvotes")
      .eq("id", resourceId)
      .single();

    const currentUpvotes = docData?.upvotes || 0;
    const newUpvotes = currentUpvotes + 1;

    const { error } = await supabase
      .from("documents")
      .update({ upvotes: newUpvotes })
      .eq("id", resourceId);

    if (error) throw error;

    invalidateCache(CACHE_TAGS.resources);

    return { success: true, likes: newUpvotes };
  } catch (error: any) {
    console.error("Error casting resource vote:", error);
    return { success: false, error: error.message || "No se pudo registrar tu me gusta." };
  }
}
