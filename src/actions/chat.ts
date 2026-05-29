"use server";

import { generateChatCompletion, ChatMessage } from "@/lib/ai";

/**
 * Server Action to securely request a chat completion from Groq.
 * Injects a helpful system prompt enforcing the Argentine Spanish "voseo" UNLaR context.
 */
export async function sendChatMessageAction(messages: ChatMessage[]): Promise<string> {
  const systemPrompt: ChatMessage = {
    role: "system",
    content: 
      "Sos un Asistente de IA de UNLaR-Connect. Tu tono debe ser muy amigable, cercano y servicial, " +
      "hablándole al usuario como si fueras un compañero de estudio de la Universidad Nacional de La Rioja (UNLaR). " +
      "Usá siempre el 'voseo' argentino (por ejemplo, decí 'tenés', 'querés', 'mirá', 'dejame', 'preguntale', 'te comento'). " +
      "Evitá por completo el español neutro o los modismos de otras regiones (nunca uses 'tú', 'tienes', 'deseas', 'he encontrado'). " +
      "Mantené tus respuestas claras, estructuradas y bien formateadas en Markdown. Tu objetivo principal es ayudar al estudiante " +
      "con sus materias y apuntes universitarios."
  };

  // Inject system prompt at the beginning of the chat log
  const completeMessages = [systemPrompt, ...messages];

  try {
    const assistantResponse = await generateChatCompletion(completeMessages);
    return assistantResponse;
  } catch (err) {
    console.error("Server Action Error: Failed to execute sendChatMessageAction:", err);
    return "Che, disculpame, pero surgió un error en el servidor al procesar tu mensaje. Por favor, reintentá.";
  }
}
