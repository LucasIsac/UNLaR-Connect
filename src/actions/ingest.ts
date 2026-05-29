"use server";

import { createServerClient } from "@/lib/supabase";
import { extractTextFromBuffer, chunkText } from "@/lib/parser";
import { generateEmbedding } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export interface IngestResult {
  success: boolean;
  message: string;
  chunksIngested?: number;
  error?: string;
}

/**
 * Server Action: Ingests an uploaded academic document into the vector database.
 * Self-healing: If embeddings already exist, skips parsing to prevent duplicate entries.
 */
export async function ingestDocumentAction(documentId: string): Promise<IngestResult> {
  const supabase = createServerClient();

  try {
    const authData = await supabase.auth.getUser();
    if (!authData.data?.user) {
      return { success: false, message: "No estás autorizado/a. Iniciá sesión de nuevo.", error: "UNAUTHORIZED" };
    }

    // 1. Check if embeddings already exist for this document
    const { count, error: countErr } = await supabase
      .from("document_embeddings")
      .select("*", { count: "exact", head: true })
      .eq("document_id", documentId);

    if (countErr) {
      console.error(`Ingest Error: Failed to check existing embeddings for document ${documentId}:`, countErr);
    } else if (count && count > 0) {
      // Self-healing check: Already ingested!
      return {
        success: true,
        message: "El apunte ya estaba analizado e indexado correctamente.",
        chunksIngested: count
      };
    }

    // 2. Fetch document metadata
    const { data: document, error: fetchErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchErr || !document) {
      console.error(`Ingest Error: Failed to fetch document metadata for ID ${documentId}:`, fetchErr);
      return { success: false, message: "No se encontró el documento en la base de datos.", error: "NOT_FOUND" };
    }

    const { title, storage_url, document_type } = document;
    if (!storage_url) {
      return { success: false, message: "El documento no tiene una URL de almacenamiento válida.", error: "INVALID_URL" };
    }

    // 3. Download the file from Supabase storage
    console.log(`Ingest Status: Downloading file from storage URL: ${storage_url}`);
    const downloadResponse = await fetch(storage_url);
    if (!downloadResponse.ok) {
      console.error(`Ingest Error: Failed to download file from storage. Status: ${downloadResponse.status}`);
      return { success: false, message: "No se pudo descargar el archivo desde el servidor de almacenamiento.", error: "DOWNLOAD_FAILED" };
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 4. Parse text from buffer
    console.log(`Ingest Status: Extracting text from ${document_type} file: ${title}`);
    let fullText = "";
    try {
      fullText = await extractTextFromBuffer(fileBuffer, document_type);
    } catch (parseErr: any) {
      console.error("Ingest Error during text extraction:", parseErr);
      return { success: false, message: parseErr.message || "Error al extraer texto del documento.", error: "PARSING_FAILED" };
    }

    if (!fullText || fullText.trim().length < 10) {
      return { success: false, message: "El documento parece estar vacío o no contiene texto legible (ej. es una imagen escaneada).", error: "EMPTY_DOCUMENT" };
    }

    // 5. Create sliding-window semantic text chunks
    console.log(`Ingest Status: Chunking document text...`);
    const textChunks = chunkText(fullText, 700, 150);
    if (textChunks.length === 0) {
      return { success: false, message: "No se pudieron generar fragmentos de texto válidos a partir del contenido.", error: "NO_CHUNKS_GENERATED" };
    }

    console.log(`Ingest Status: Generated ${textChunks.length} chunks. Generating vector embeddings...`);

    // 6. Generate embeddings and insert chunks sequentially to maintain API stability
    const rowsToInsert = [];
    let processedCount = 0;

    for (const chunk of textChunks) {
      try {
        const embedding = await generateEmbedding(chunk);
        
        // Safety check to ensure we got a valid 768-dimension vector
        if (embedding && embedding.length === 768) {
          rowsToInsert.push({
            document_id: documentId,
            content: chunk,
            embedding: embedding
          });
          processedCount++;
        } else {
          console.warn(`Ingest Warning: Embedding generation returned an invalid vector dimension: ${embedding?.length}. Skipping chunk.`);
        }
      } catch (embErr) {
        console.error(`Ingest Error: Failed to generate embedding for chunk: ${chunk.slice(0, 30)}...`, embErr);
      }
    }

    if (rowsToInsert.length === 0) {
      return { success: false, message: "No se pudieron generar embeddings vectoriales para ningún fragmento del texto.", error: "EMBEDDING_FAILED" };
    }

    // 7. Bulk insert into document_embeddings table
    console.log(`Ingest Status: Inserting ${rowsToInsert.length} embeddings into document_embeddings...`);
    const { error: insertErr } = await supabase
      .from("document_embeddings")
      .insert(rowsToInsert);

    if (insertErr) {
      console.error("Ingest Error: Failed to bulk insert document embeddings:", insertErr);
      return { success: false, message: "Error al registrar los fragmentos vectoriales en la base de datos.", error: "DATABASE_INSERT_FAILED" };
    }

    console.log(`Ingest Success: Successfully ingested ${rowsToInsert.length} chunks for document: ${title}`);
    revalidatePath("/chat");

    return {
      success: true,
      message: `¡Buenísimo! Se procesaron ${rowsToInsert.length} fragmentos de tu apunte de manera correcta.`,
      chunksIngested: rowsToInsert.length
    };

  } catch (error: any) {
    console.error("Ingest Error: Unexpected exception:", error);
    return { success: false, message: "Ocurrió un error inesperado al procesar el apunte.", error: error.message || "UNKNOWN_ERROR" };
  }
}
