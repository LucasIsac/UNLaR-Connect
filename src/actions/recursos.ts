"use server";

import { supabase } from "@/lib/supabase";
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

// Temporary hardcoded UUID for demo if auth is not fully hooked up
const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

/**
 * Fetch all resources/documents from Supabase
 */
export async function fetchResources(): Promise<ResourceExtended[]> {
  try {
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase Error fetching documents:", error);
      return [];
    }

    if (!documents || documents.length === 0) {
      return [];
    }

    // Map DbDocument to ResourceExtended format
    return documents.map((doc: DbDocument) => {
      // Simulate category and styling based on DB data for now
      // In a real app, we'd join with `subjects` and `topics` tables
      let cat = "Otra";
      let catColor = "text-primary bg-primary/10 border-primary/20";
      
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
  try {
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const thematicAxis = formData.get("thematicAxis") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;

    if (!file || !title) {
      return { success: false, error: "El archivo y el título son obligatorios." };
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${MOCK_USER_ID}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // TypeScript will complain here until @supabase/supabase-js is installed
    const { data: storageData, error: storageError } = await (supabase as any).storage
      .from('apuntes')
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return { success: false, error: "Error al subir el archivo físico." };
    }

    const { data: publicUrlData } = (supabase as any).storage
      .from('apuntes')
      .getPublicUrl(filePath);

    const newDoc = {
      user_id: MOCK_USER_ID,
      title: title.trim(),
      document_type: fileExt || "unknown",
      storage_url: publicUrlData.publicUrl,
    };

    const { data: dbData, error: dbError } = await (supabase as any)
      .from('documents')
      .insert(newDoc)
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      await (supabase as any).storage.from('apuntes').remove([filePath]);
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
export async function toggleSaveResource(resourceId: string): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  // TODO: Implement actual user save table interaction
  return { success: true, saved: true };
}

/**
 * Cast vote/like on resource card
 */
export async function castResourceVote(resourceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // We would use an RPC call or increment logic in Supabase to avoid race conditions
    // For now, doing a simple fetch and update:
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('upvotes')
      .eq('id', resourceId)
      .single();

    if (fetchError || !doc) return { success: false, error: "Apunte no encontrado." };

    const { error: updateError } = await supabase
      .from('documents')
      .update({ upvotes: doc.upvotes + 1 })
      .eq('id', resourceId);

    if (updateError) return { success: false, error: "No se pudo actualizar." };

    revalidatePath("/apuntes");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo registrar tu me gusta." };
  }
}

