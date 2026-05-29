// Server-side AI Provider Abstraction
// This file coordinates chat completions via Groq and embeddings via Google Gemini REST APIs.

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqChatChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GeminiEmbeddingResponse {
  embedding: {
    values: number[];
  };
}

/**
 * Request a chat completion directly from Groq using standard server-side HTTP fetch.
 * Decouples the frontend components from Groq-specific packages.
 */
export async function generateChatCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey) {
    console.error("AI Error: GROQ_API_KEY environment variable is not configured.");
    return "Disculpame, pero el administrador no configuró la clave de API de Groq en el servidor. Avisale para que la cargue en el archivo .env.local.";
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Error: Groq request failed with status ${response.status}:`, errorText);
      return "Che, disculpame, pero ocurrió un problema al comunicarme con el servidor de IA de Groq. Intentá de nuevo en un ratito.";
    }

    const data = (await response.json()) as GroqChatResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("AI Error: Groq response returned an empty completion content.", data);
      return "Che, no logré obtener una respuesta válida del asistente. Por favor, probá escribir otra cosa.";
    }

    return content;
  } catch (err) {
    console.error("AI Error: Unexpected exception during Groq chat completion request:", err);
    return "Disculpame, pero ocurrió un error inesperado de red en el servidor. Revisá tu conexión o reintentá más tarde.";
  }
}

/**
 * Generate 768-dimension vector embeddings using Google Gemini's REST API.
 * Gracefully falls back to a dummy vector if the API key is not configured.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("AI Warning: GEMINI_API_KEY not configured. Falling back to a dummy embedding vector.");
    // Return a dummy 768-dimension vector (standard for text-embedding-004)
    return new Array(768).fill(0);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Error: Gemini embedding request failed with status ${response.status}:`, errorText);
      return new Array(768).fill(0);
    }

    const data = (await response.json()) as GeminiEmbeddingResponse;
    const values = data.embedding?.values;

    if (!values || !Array.isArray(values)) {
      console.error("AI Error: Gemini embedding response has invalid layout:", data);
      return new Array(768).fill(0);
    }

    return values;
  } catch (err) {
    console.error("AI Error: Unexpected exception during Gemini embedding request:", err);
    return new Array(768).fill(0);
  }
}
