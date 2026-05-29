"use server";

import { generateChatCompletion, generateEmbedding, ChatMessage } from "@/lib/ai";
import { createServerClient } from "@/lib/supabase";

/**
 * Server Action to securely request a chat completion from Groq, optionally powered by RAG context.
 * Injects a helpful system prompt enforcing the Argentine Spanish "voseo" UNLaR context and chunk similarity data.
 */
export async function sendChatMessageAction(
  messages: ChatMessage[],
  documentId?: string,
  filters?: { subject?: string; topic?: string; type?: string }
): Promise<string> {
  const latestMessage = messages[messages.length - 1]?.content || "";
  let contextText = "";
  let hasChunks = false;

  const hasActiveFilters = documentId || (filters && (
    (filters.subject && filters.subject !== "all") ||
    (filters.topic && filters.topic !== "all") ||
    (filters.type && filters.type !== "all")
  ));

  // 1. Retrieve matching text chunks via vector search if filters/document are set
  if (hasActiveFilters && latestMessage.trim() !== "") {
    try {
      const supabase = createServerClient();
      
      // Generate 768-dimension embedding for the user's query
      const queryEmbedding = await generateEmbedding(latestMessage);

      // Query the database using our custom vector similarity RPC function
      const { data: chunks, error: rpcError } = await supabase.rpc("buscar_apuntes", {
        query_embedding: queryEmbedding,
        match_threshold: 0.35,
        match_count: 5,
        filter_document_id: documentId || null,
        filter_subject: (filters?.subject && filters.subject !== "all") ? filters.subject : null,
        filter_topic: (filters?.topic && filters.topic !== "all") ? filters.topic : null,
        filter_type: (filters?.type && filters.type !== "all") ? filters.type : null,
      });

      if (rpcError) {
        console.error("RAG Error: Failed to fetch vector embeddings from RPC:", rpcError);
      } else if (chunks && chunks.length > 0) {
        contextText = chunks.map((c: any) => c.content).join("\n---\n");
        hasChunks = true;
        console.log(`RAG Status: Successfully retrieved ${chunks.length} context chunks for query.`);
      } else {
        console.log("RAG Status: No semantic matches found above the 0.35 similarity threshold.");
      }
    } catch (err) {
      console.error("RAG Error: Unexpected exception during semantic document search:", err);
    }
  }

  // 2. Fetch the actual list of documents matching active filters to inject in system prompt
  let realDocsText = "";
  try {
    const supabase = createServerClient();
    let docsQuery = supabase
      .from("documents")
      .select("title, subjects(name), topics(name), document_type");

    if (documentId) {
      docsQuery = docsQuery.eq("id", documentId);
    } else {
      if (filters?.subject && filters.subject !== "all") {
        const { data: subData } = await supabase
          .from("subjects")
          .select("id")
          .eq("name", filters.subject);
        const subIds = subData?.map(s => s.id) || [];
        docsQuery = docsQuery.in("subject_id", subIds);
      }
      if (filters?.topic && filters.topic !== "all") {
        const { data: topData } = await supabase
          .from("topics")
          .select("id")
          .eq("name", filters.topic);
        const topIds = topData?.map(t => t.id) || [];
        docsQuery = docsQuery.in("topic_id", topIds);
      }
      if (filters?.type && filters.type !== "all") {
        if (filters.type === "pdf") {
          docsQuery = docsQuery.eq("document_type", "pdf");
        } else if (filters.type === "text") {
          docsQuery = docsQuery.in("document_type", ["txt", "md"]);
        }
      }
    }

    const { data: matchedDocs } = await docsQuery;
    if (matchedDocs && matchedDocs.length > 0) {
      realDocsText = matchedDocs.map((d: any) => {
        const subName = d.subjects?.name || "Sin Materia";
        const topName = d.topics?.name || "General";
        return `- **${d.title}** (Materia: ${subName}, Eje: ${topName}, Formato: ${d.document_type.toUpperCase()})`;
      }).join("\n");
    } else {
      realDocsText = "Ningún apunte disponible para los filtros seleccionados.";
    }
  } catch (docsErr) {
    console.error("RAG Error: Failed to fetch active document names list:", docsErr);
  }

  // 3. Build the system prompt, appending context guidelines and available documents
  let systemContent = 
    "Sos un Asistente de IA de UNLaR-Connect. Tu tono debe ser muy amigable, cercano y servicial, " +
    "hablándole al usuario como si fueras un compañero de estudio de la Universidad Nacional de La Rioja (UNLaR). " +
    "Usá siempre el 'voseo' argentino (por ejemplo, decí 'tenés', 'querés', 'mirá', 'dejame', 'preguntale', 'te comento'). " +
    "Evitá por completo el español neutro o los modismos de otras regiones (nunca uses 'tú', 'tienes', 'deseas', 'he encontrado'). " +
    "Mantené tus respuestas claras, estructuradas y bien formateadas en Markdown. Tu objetivo principal es ayudar al estudiante " +
    "con sus materias y apuntes universitarios.\n\n" +
    "--------------------------------------------------\n" +
    "INFORMACIÓN DE CONTEXTO ACTUAL:\n";

  if (documentId) {
    systemContent += `El usuario está chateando con un apunte específico seleccionado.\n`;
  } else if (filters && ((filters.subject && filters.subject !== "all") || (filters.topic && filters.topic !== "all") || (filters.type && filters.type !== "all"))) {
    const activeFilters = [];
    if (filters.subject && filters.subject !== "all") activeFilters.push(`Materia: ${filters.subject}`);
    if (filters.topic && filters.topic !== "all") activeFilters.push(`Eje Temático: ${filters.topic}`);
    if (filters.type && filters.type !== "all") activeFilters.push(`Formato: ${filters.type.toUpperCase()}`);
    systemContent += `El usuario está en modo general pero aplicando los siguientes filtros de contexto: ${activeFilters.join(", ")}.\n`;
  } else {
    systemContent += `El usuario está chateando en modo general (sin filtros).\n`;
  }

  if (realDocsText) {
    systemContent += 
      "\nAPUNTES REALES Y ÚNICOS DISPONIBLES EN LA BASE DE DATOS QUE COINCIDEN CON LA SELECCIÓN:\n" +
      realDocsText + "\n" +
      "(IMPORTANTE: Si el usuario te pregunta qué apuntes, archivos o documentos tenés disponibles para consultar, basate ÚNICAMENTE en esta lista anterior. NO inventes materias ni uses listas genéricas. Si te pregunta por apuntes y la lista anterior indica que no hay ninguno disponible, decile con voseo argentino que no hay apuntes cargados con esos filtros y que puede subir uno).\n";
  }
  
  systemContent += "--------------------------------------------------\n\n";

  if (hasChunks) {
    systemContent += 
      "--------------------------------------------------\n" +
      "CONTEXTO RELEVANTE EXTRAÍDO DE LOS APUNTES SELECCIONADOS:\n" +
      contextText + "\n" +
      "--------------------------------------------------\n\n" +
      "INSTRUCCIONES ADICIONALES PARA RAG:\n" +
      "1. Respondé a la pregunta del usuario basándote únicamente en el contexto provisto arriba.\n" +
      "2. Si la respuesta no figura en el contexto anterior o la información no es suficiente, respondé estrictamente de forma honesta indicando que no encontrás ese tema en el apunte, y sugerile textualmente lo siguiente: 'Che, no encontré nada específico sobre eso en este apunte. ¿Querés que busquemos en internet o en otro documento?'.\n" +
      "3. Si el usuario te saluda, te agradece o te hace comentarios generales de conversación ('hola', 'gracias', 'cómo estás'), respondé con amabilidad y educación sin exigir el uso de contexto.";
  } else if (hasActiveFilters) {
    systemContent += 
      "\n\nINSTRUCCIÓN DE FALLBACK RAG:\n" +
      "El usuario seleccionó un contexto de apuntes para chatear, pero su pregunta no arrojó coincidencias semánticas relevantes con el contenido de los documentos. " +
      "Si el usuario está haciendo una pregunta sobre el contenido de los apuntes, debés informarle amablemente en español argentino que no encontraste información sobre eso y sugerirle textualmente lo siguiente: " +
      "'Che, no encontré nada específico sobre eso en este apunte. ¿Querés que busquemos en internet o en otro documento?'. " +
      "Si es un saludo, despedida o pregunta general de conversación, respondé amigablemente de forma normal.";
  }

  const systemPrompt: ChatMessage = {
    role: "system",
    content: systemContent
  };

  const completeMessages = [systemPrompt, ...messages];

  try {
    const assistantResponse = await generateChatCompletion(completeMessages);
    return assistantResponse;
  } catch (err) {
    console.error("Server Action Error: Failed to execute sendChatMessageAction:", err);
    return "Che, disculpame, pero surgió un error en el servidor al procesar tu mensaje. Por favor, reintentá.";
  }
}

