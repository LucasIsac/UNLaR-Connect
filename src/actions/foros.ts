"use server";

import { supabase } from "@/lib/supabase";
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

const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

let mockPosts: ForumPostExtended[] = [
  {
    id: "post-1",
    user_id: "user-martin",
    subject_id: 1,
    post_type_id: 1, // Duda Técnica
    title: "¿Cómo plantear integrales dobles en coordenadas polares?",
    content: "Estoy trabado con el TP3, ejercicio 4. Entiendo la teoría básica pero al momento de definir los límites de integración para regiones circulares desplazadas me confundo con el r y el ángulo theta. ¿Alguien tiene un tip visual o un apunte que lo explique más claro?",
    upvotes: 15,
    is_resolved: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    subjectName: "Análisis Matemático II",
    authorName: "Martín S.",
    githubUsername: "martinprlt",
    authorKarma: 1200,
    repliesCount: 3,
    category: "Duda Técnica",
    categoryColor: "text-red-400 bg-red-400/10 border-red-400/20",
    dotColor: "bg-accent",
    bestAnswer: {
      author: "Prof. García",
      role: "Profesor",
      content:
        "La clave está en graficar la región primero. Si tu circunferencia está desplazada del origen (ej: (x-1)² + y² = 1), tenés que reemplazar x=r·cos(θ), y=r·sin(θ) en esa ecuación para encontrar el límite de 'r' en función de 'θ'. Te dejo un enlace a un GeoGebra interactivo en la sección de recursos.",
      badge: "Mejor Respuesta",
    }
  },
  {
    id: "post-2",
    user_id: "user-luciana",
    subject_id: 2,
    post_type_id: 2, // Consejo
    title: "¿Conviene rendir final libre o esperar a recursar?",
    content: "Me quedé regular pero siento que la cursada la hice muy a las apuradas y los conceptos de grafos no me quedaron del todo claros. ¿Alguien rindió el final de Algoritmos libre? ¿Es muy exigente o me recomiendan recursarla el cuatrimestre que viene para afianzar?",
    upvotes: 8,
    is_resolved: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    subjectName: "Algoritmos y Estructuras de Datos",
    authorName: "Luciana V.",
    authorKarma: 850,
    repliesCount: 1,
    category: "Consejo de Cursada",
    categoryColor: "text-accent bg-accent/10 border-accent/20",
    dotColor: "bg-secondary",
    bestAnswer: null
  },
  {
    id: "post-3",
    user_id: "user-camila",
    subject_id: 3,
    post_type_id: 3, // Ayuda TP
    title: "Error de segmentación en lista enlazada (C)",
    content: "Estoy implementando una lista enlazada simple para el TP de Programación II y me tira segmentation fault al intentar eliminar un nodo del medio. Ya revisé los punteros mil veces pero no encuentro el bug. ¿Alguien me da una mano?",
    upvotes: 6,
    is_resolved: false,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    subjectName: "Programación II",
    authorName: "Camila R.",
    authorKarma: 2100,
    repliesCount: 0,
    category: "Ayuda con TP",
    categoryColor: "text-teal-400 bg-teal-400/10 border-teal-400/20",
    dotColor: "bg-accent",
    bestAnswer: null
  }
];

let mockReplies: Record<string, DbPostReply[]> = {
  "post-1": [
    {
      id: "reply-10",
      post_id: "post-1",
      user_id: "user-prof-garcia",
      content: "La clave está en graficar la región primero. Si tu circunferencia está desplazada del origen (ej: (x-1)² + y² = 1), tenés que reemplazar x=r·cos(θ), y=r·sin(θ) en esa ecuación para encontrar el límite de 'r' en función de 'θ'. Te dejo un enlace a un GeoGebra interactivo en la sección de recursos.",
      upvotes: 8,
      is_accepted: true,
      created_at: new Date(Date.now() - 1.8 * 3600000).toISOString()
    },
    {
      id: "reply-11",
      post_id: "post-1",
      user_id: "user-lucas",
      content: "Ufff me re sirvió a mí también ese GeoGebra, ¡muchas gracias Profesor!",
      upvotes: 2,
      is_accepted: false,
      created_at: new Date(Date.now() - 1 * 3600000).toISOString()
    }
  ],
  "post-2": [
    {
      id: "reply-20",
      post_id: "post-2",
      user_id: "user-tomi",
      content: "Che, yo rendí Algoritmos libre el año pasado y no es imposible, pero te sacan el cuero con la parte práctica de árboles balanceados (AVL). Si no te sentís 100% segura, recursarla te da otra base para lo que viene después en Programación II.",
      upvotes: 4,
      is_accepted: false,
      created_at: new Date(Date.now() - 8 * 3600000).toISOString()
    }
  ],
  "post-3": []
};

/**
 * Fetch all forum posts (threads list)
 */
export async function fetchForumPosts(): Promise<ForumPostExtended[]> {
  // Artificial delay to show off the beautiful skeleton loader
  await new Promise(resolve => setTimeout(resolve, 800));

  const USE_REAL_DATABASE = false; // Toggle to connect to Supabase
  if (USE_REAL_DATABASE) {
    try {
      // Real database fetch would go here
      // const { data } = await supabase.from('posts').select('*, users(name, last_name, points)').order('created_at', { ascending: false });
    } catch (error) {
      console.error(error);
    }
  }

  return mockPosts;
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
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!title.trim() || !content.trim()) {
      return { success: false, error: "El título y cuerpo del hilo son obligatorios." };
    }

    let catColor = "text-teal-400 bg-teal-400/10 border-teal-400/20";
    let dotColor = "bg-accent";
    if (category === "Duda Técnica") {
      catColor = "text-red-400 bg-red-400/10 border-red-400/20";
      dotColor = "bg-red-400";
    } else if (category === "Consejo de Cursada") {
      catColor = "text-accent bg-accent/10 border-accent/20";
      dotColor = "bg-secondary";
    }

    const newPost: ForumPostExtended = {
      id: `post-${Date.now()}`,
      user_id: MOCK_USER_ID,
      post_type_id: category === "Duda Técnica" ? 1 : category === "Consejo de Cursada" ? 2 : 3,
      title: title.trim(),
      content: content.trim(),
      upvotes: 1,
      is_resolved: false,
      created_at: new Date().toISOString(),
      subjectName: subject,
      authorName: "Tu Perfil",
      authorKarma: 2450,
      repliesCount: 0,
      category,
      categoryColor: catColor,
      dotColor,
      bestAnswer: null
    };

    // Prepend to local mock database
    mockPosts = [newPost, ...mockPosts];
    mockReplies[newPost.id] = [];

    // Supabase equivalent insert query:
    // await supabase.from('posts').insert(newPost);

    return { success: true, data: newPost };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Hubo un problema al crear tu hilo." };
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
    await new Promise(resolve => setTimeout(resolve, 200));

    const postIndex = mockPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return { success: false, error: "Hilo no encontrado." };
    }

    let diff = 0;
    if (currentVote === direction) {
      diff = direction === "up" ? -1 : 1;
    } else if (currentVote) {
      diff = direction === "up" ? 2 : -2;
    } else {
      diff = direction === "up" ? 1 : -1;
    }

    mockPosts[postIndex].upvotes += diff;

    // Supabase update:
    // await supabase.from('posts').update({ upvotes: mockPosts[postIndex].upvotes }).eq('id', postId);

    return { success: true, likes: mockPosts[postIndex].upvotes };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo registrar tu voto." };
  }
}

/**
 * Fetch replies for a specific thread
 */
export async function fetchPostReplies(postId: string): Promise<DbPostReply[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockReplies[postId] || [];
}

/**
 * Add a new response/reply to a thread
 */
export async function addPostReply(
  postId: string,
  content: string
): Promise<{ success: boolean; data?: DbPostReply[]; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!content.trim()) {
      return { success: false, error: "La respuesta no puede estar vacía." };
    }

    const newReply: DbPostReply = {
      id: `reply-${Date.now()}`,
      post_id: postId,
      user_id: MOCK_USER_ID,
      content: content.trim(),
      upvotes: 0,
      is_accepted: false,
      created_at: new Date().toISOString()
    };

    if (!mockReplies[postId]) {
      mockReplies[postId] = [];
    }

    mockReplies[postId].push(newReply);

    // Update reply count in mock post
    const postIndex = mockPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      mockPosts[postIndex].repliesCount += 1;
    }

    // Supabase:
    // await supabase.from('post_replies').insert(newReply);

    return { success: true, data: mockReplies[postId] };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo publicar la respuesta." };
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
    await new Promise(resolve => setTimeout(resolve, 400));

    const postIndex = mockPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return { success: false, error: "Hilo no encontrado." };
    }

    mockPosts[postIndex].is_resolved = true;

    if (replyId && mockReplies[postId]) {
      mockReplies[postId] = mockReplies[postId].map(r => 
        r.id === replyId ? { ...r, is_accepted: true } : r
      );
      
      const acceptedReply = mockReplies[postId].find(r => r.id === replyId);
      if (acceptedReply) {
        mockPosts[postIndex].bestAnswer = {
          author: "Respuesta Aceptada",
          role: "Estudiante",
          content: acceptedReply.content,
          badge: "Mejor Respuesta"
        };
      }
    }

    // Supabase:
    // await supabase.from('posts').update({ is_resolved: true }).eq('id', postId);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo actualizar la resolución del hilo." };
  }
}
