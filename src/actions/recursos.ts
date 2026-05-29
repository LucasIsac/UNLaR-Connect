"use server";

import { createServerClient } from "@/lib/supabase";
import { DbDocument } from "@/types/database";
import { revalidatePath } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";

export interface ResourceExtended extends DbDocument {
  category: string; // Map from topic/subject
  categoryColor: string;
  thematicAxis: string;
  authorName: string;
  uploadedDate: string;
  saved: boolean;
  hasVoted?: boolean;
  likes: number;
  description: string;
  careers: string[];
  isOwner: boolean;
}

// Note: auth is now retrieved server-side.

/**
 * Fetch all resources/documents from Supabase
 */
export async function fetchResources(): Promise<ResourceExtended[]> {
  const supabase = createServerClient();
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*, subjects(name, career_subjects(careers(name))), users!documents_user_id_fkey(name, last_name), topics(name), saved_documents(user_id), document_votes(user_id)")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase Error fetching documents:", error);
      return [];
    }

    if (!documents || documents.length === 0) {
      return [];
    }

    // Map DbDocument to ResourceExtended format
    return documents.map((doc: any) => {
      const cat = doc.subjects?.name || "Otra";
      let catColor = "text-primary bg-primary/10 border-primary/20";
      const relatedCareers = doc.subjects?.career_subjects?.map((cs: any) => cs.careers?.name).filter(Boolean) || [];
      
      if (cat === "Sistemas Operativos") catColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
      else if (cat.includes("Análisis")) catColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
      else if (cat.includes("Álgebra")) catColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
      
      return {
        ...doc,
        category: cat,
        categoryColor: catColor,
        thematicAxis: doc.topics?.name || "General",
        authorName: doc.users ? `${doc.users.name} ${doc.users.last_name || ""}`.trim() : "Estudiante UNLaR",
        uploadedDate: new Date(doc.uploaded_at).toLocaleDateString("es-AR"),
        saved: userId ? doc.saved_documents?.some((s: any) => s.user_id === userId) : false,
        hasVoted: userId ? doc.document_votes?.some((v: any) => v.user_id === userId) : false,
        likes: doc.upvotes || 0,
        description: "Apunte subido a la plataforma.",
        careers: relatedCareers,
        isOwner: userId ? userId === doc.user_id : false,
      };
    });
  } catch (error) {
    console.error("Unexpected error fetching documents:", error);
    return [];
  }
}

/**
 * REAL SUPABASE UPLOAD: Used by /dashboard/recursos page
 */
export async function uploadResource(formData: FormData): Promise<{ success: boolean; data?: ResourceExtended; error?: string }> {
  const supabase = createServerClient();
  try {
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const thematicAxis = formData.get("thematicAxis") as string;
    const description = formData.get("description") as string;
    const filePath = formData.get("filePath") as string;

    if (!title) {
      return { success: false, error: "El título es obligatorio." };
    }

    if (!filePath) {
      return { success: false, error: "El archivo no se subió correctamente o no se recibió la ruta." };
    }

    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    const { data: publicUrlData } = supabase.storage
      .from('apuntes')
      .getPublicUrl(filePath);

    // Look up the subject ID to save it to the DB so it persists
    let subjectId = null;
    if (category) {
      const { data: subj } = await supabase.from('subjects').select('id').ilike('name', category).maybeSingle();
      if (subj) {
        subjectId = subj.id;
      } else {
        // Create new subject automatically
        const { data: newSubj, error: newSubjErr } = await supabase
          .from('subjects')
          .insert({ name: category, year: 1 })
          .select('id')
          .single();
          
        if (newSubj) {
          subjectId = newSubj.id;
          invalidateCache(CACHE_TAGS.subjectsList);
        } else {
          console.error("Error al crear materia nueva:", newSubjErr);
        }
      }
    }

    let topicId = null;
    if (thematicAxis && thematicAxis !== "General" && subjectId) {
      const { data: topic } = await supabase.from('topics').select('id').eq('subject_id', subjectId).ilike('name', thematicAxis).maybeSingle();
      if (topic) {
        topicId = topic.id;
      } else {
        const { data: newTopic } = await supabase
          .from('topics')
          .insert({ name: thematicAxis, subject_id: subjectId })
          .select('id')
          .single();
        if (newTopic) topicId = newTopic.id;
      }
    }

    const fileExt = filePath.split('.').pop();
    const newDoc = {
      user_id: authUser.id,
      subject_id: subjectId,
      topic_id: topicId,
      title: title.trim(),
      document_type: fileExt || "unknown",
      storage_url: publicUrlData.publicUrl,
    };

    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert(newDoc)
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      await supabase.storage.from('apuntes').remove([filePath]);
      return { success: false, error: "Error al guardar los datos del apunte." };
    }

    revalidatePath("/recursos");

    // We must return the mapped 'data' so the dashboard optimistic UI works
    let catColor = "text-accent bg-accent/10 border-accent/20";
    if (category === "Sistemas Operativos") catColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
    else if (category === "Bases de Datos") catColor = "text-secondary bg-secondary/10 border-secondary/20";

    const mappedDoc: ResourceExtended = {
      ...dbData,
      category,
      categoryColor: catColor,
      thematicAxis,
      authorName: authUser.user_metadata?.name || "Tu Perfil",
      uploadedDate: "Hoy",
      likes: dbData.upvotes || 0,
      saved: false,
      description: description || `Material aportado voluntariamente.`,
      careers: []
    };

    // Revalidate everything so the top header points update
    revalidatePath('/', 'layout');

    return { success: true, data: mappedDoc };
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return { success: false, error: "Hubo un problema inesperado al registrar tu apunte." };
  }
}

/**
 * Favorite or save a resource (Placeholder for now)
 */
export async function toggleSaveResource(id: string): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  if (!id) return { success: false, error: "ID inválido." };
  const supabase = createServerClient();
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "No autorizado." };

    const { data: existing } = await supabase
      .from('saved_documents')
      .select('user_id')
      .eq('user_id', authData.user.id)
      .eq('document_id', id)
      .maybeSingle();

    if (existing) {
      await supabase.from('saved_documents').delete().eq('user_id', authData.user.id).eq('document_id', id);
      revalidatePath('/', 'layout');
      return { success: true, saved: false };
    } else {
      await supabase.from('saved_documents').insert({ user_id: authData.user.id, document_id: id });
      revalidatePath('/', 'layout');
      return { success: true, saved: true };
    }
  } catch (error) {
    console.error("Error al guardar el apunte:", error);
    return { success: false, error: "Error al guardar el apunte." };
  }
}

/**
 * Cast a vote on a resource (Placeholder for now)
 */
export async function castResourceVote(id: string): Promise<{ success: boolean; newScore?: number; error?: string }> {
  if (!id) return { success: false, error: "ID inválido." };
  const supabase = createServerClient();
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { success: false, error: "No autorizado." };

    const { data: existingVote } = await supabase
      .from('document_votes')
      .select('direction')
      .eq('user_id', authData.user.id)
      .eq('document_id', id)
      .maybeSingle();

    if (existingVote) {
      await supabase.from('document_votes').delete().eq('user_id', authData.user.id).eq('document_id', id);
    } else {
      await supabase.from('document_votes').insert({ user_id: authData.user.id, document_id: id, direction: 1 });
    }

    // Wait a bit for the trigger to update the documents upvotes, then fetch the new score
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: doc } = await supabase.from('documents').select('upvotes').eq('id', id).single();
    
    // Refresh layout for global points
    revalidatePath('/', 'layout');

    return { success: true, newScore: doc?.upvotes || 0 };
  } catch (error) {
    console.error("Error al registrar voto:", error);
    return { success: false, error: "Error al registrar voto." };
  }
}

/**
 * Delete a resource
 */
export async function deleteResource(id: string, storageUrl: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();
  try {

    // Extract path from storage_url
    // Url format: https://[project].supabase.co/storage/v1/object/public/apuntes/[user_id]/[file.pdf]
    const urlParts = storageUrl.split('/apuntes/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error: deleteStorageError } = await supabase.storage
        .from('apuntes')
        .remove([filePath]);
        
      if (deleteStorageError) console.error("Error deleting from storage:", deleteStorageError);
    }

    const { data: deletedRows, error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .select();

    if (dbError) {
      console.error("Database delete error:", dbError);
      return { success: false, error: "Error al eliminar de la base de datos." };
    }

    if (!deletedRows || deletedRows.length === 0) {
      console.error("No rows deleted (possible RLS issue). ID:", id);
      return { success: false, error: "Permisos insuficientes o apunte no encontrado (Falla de RLS)." };
    }

    revalidatePath("/recursos");
    return { success: true };
  } catch (error) {
    console.error("Unexpected delete error:", error);
    return { success: false, error: "Hubo un problema inesperado al eliminar el apunte." };
  }
}
