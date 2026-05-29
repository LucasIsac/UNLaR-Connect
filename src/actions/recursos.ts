"use server";

import { createServerClient } from "@/lib/supabase";
import { DbDocument } from "@/types/database";
import { revalidatePath } from "next/cache";

export interface ResourceExtended extends DbDocument {
  category: string; // Map from topic/subject
  categoryColor: string;
  thematicAxis: string;
  authorName: string;
  uploadedDate: string;
  saved: boolean;
  likes: number;
  description: string;
}

// Note: auth is now retrieved server-side.

/**
 * Fetch all resources/documents from Supabase
 */
export async function fetchResources(): Promise<ResourceExtended[]> {
  const supabase = createServerClient();
  try {
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*, subjects(name)")
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
      
      if (cat === "Sistemas Operativos") catColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
      else if (cat.includes("Análisis")) catColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
      else if (cat.includes("Álgebra")) catColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
      
      return {
        ...doc,
        category: cat,
        categoryColor: catColor,
        thematicAxis: "General",
        authorName: "Estudiante UNLaR",
        uploadedDate: new Date(doc.uploaded_at).toLocaleDateString("es-AR"),
        saved: false,
        likes: doc.upvotes || 0,
        description: "Apunte subido a la plataforma.",
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
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const thematicAxis = formData.get("thematicAxis") as string;
    const description = formData.get("description") as string;

    if (!file || !title) {
      return { success: false, error: "El archivo y el título son obligatorios." };
    }

    if (file.size === 0) {
      return { success: false, error: "El archivo está vacío (0 bytes)." };
    }

    if (file.size > 50 * 1024 * 1024) {
      return { success: false, error: "El archivo es demasiado grande (máximo 50MB)." };
    }

    const authResponse = await supabase.auth.getUser();
    const authUser = authResponse?.data?.user;

    if (!authUser) {
      return { success: false, error: "No estás autenticado/a." };
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${authUser.id}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await supabase.storage
      .from('apuntes')
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return { success: false, error: "Error al subir el archivo físico." };
    }

    const { data: publicUrlData } = supabase.storage
      .from('apuntes')
      .getPublicUrl(filePath);

    // Look up the subject ID to save it to the DB so it persists
    let subjectId = null;
    if (category) {
      const { data: subj } = await supabase.from('subjects').select('id').ilike('name', category).single();
      if (subj) subjectId = subj.id;
    }

    const newDoc = {
      user_id: authUser.id,
      subject_id: subjectId,
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

    revalidatePath("/dashboard/recursos");

    // We must return the mapped 'data' so the dashboard optimistic UI works
    let catColor = "text-accent bg-accent/10 border-accent/20";
    if (category === "Sistemas Operativos") catColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
    else if (category === "Bases de Datos") catColor = "text-secondary bg-secondary/10 border-secondary/20";

    const mappedDoc: ResourceExtended = {
      ...dbData,
      category,
      categoryColor: catColor,
      thematicAxis,
      authorName: "Tu Perfil",
      uploadedDate: "Hoy",
      likes: dbData.upvotes || 0,
      saved: false,
      description: description || `Material aportado voluntariamente.`
    };

    return { success: true, data: mappedDoc };
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return { success: false, error: "Hubo un problema inesperado al registrar tu apunte." };
  }
}

/**
 * Favorite or save a resource (Placeholder for now)
 */
export async function toggleSaveResource(): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, saved: true };
  } catch {
    return { success: false, error: "Error al guardar el apunte." };
  }
}

/**
 * Cast a vote on a resource (Placeholder for now)
 */
export async function castResourceVote(): Promise<{ success: boolean; newScore?: number; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, newScore: 2 };
  } catch {
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

    revalidatePath("/dashboard/recursos");
    return { success: true };
  } catch (error) {
    console.error("Unexpected delete error:", error);
    return { success: false, error: "Hubo un problema inesperado al eliminar el apunte." };
  }
}
