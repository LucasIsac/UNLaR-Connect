"use server";

import { supabase } from "@/lib/supabase";
import { 
  DbUser, 
  DbTutoringSession, 
  DbPost, 
  DbBadge, 
  DbSubject,
  DbTutorAvailability,
  DbPostReply,
  DbDocument
} from "@/types/database";

// Custom return types for Server Actions
export interface DashboardStats {
  user: DbUser;
  karmaLevel: number;
  currentXP: number;
  nextLevelXP: number;
  xpPercentage: number;
  recentBadges: DbBadge[];
  notificationsCount: number;
}

export interface UpcomingSessionExtended extends Omit<DbTutoringSession, 'subject_id'> {
  subject: DbSubject;
  peerName: string;
  isTutorRole: boolean;
}

export interface ForumPostExtended extends DbPost {
  subjectName?: string;
  postTypeName: string;
  repliesCount: number;
}

// 1. Mock Data Fallbacks (For when Supabase is not fully seeded or connected yet)
const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

const MOCK_USER: DbUser = {
  id: MOCK_USER_ID,
  role_id: 2, // Estudiante
  career_id: 1, // Ing. en Sistemas
  name: "Alejandro",
  last_name: "Garcia",
  email: "ale.garcia@unlar.edu.ar",
  is_unlar_member: true,
  points: 2450, // total XP
  tutor_rating: 4.8,
  total_reviews: 15,
  created_at: new Date().toISOString()
};

const MOCK_BADGES: DbBadge[] = [
  {
    id: 1,
    name: "Colaborador Destacado",
    description: "Otorgado por responder 5 dudas en los foros comunitarios.",
    icon_name: "forum",
    required_points: 500,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Tutor Estrella",
    description: "Alcanzado al mantener un rating superior a 4.5 en 10 tutorías.",
    icon_name: "handshake",
    required_points: 1000,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Lector Veloz",
    description: "Otorgado por leer 20 recursos en el banco de apuntes.",
    icon_name: "menu_book",
    required_points: 3000, // Not unlocked yet because user has 2450 points
    created_at: new Date().toISOString()
  }
];

let mockSessions: UpcomingSessionExtended[] = [
  {
    id: "session-1",
    tutor_id: "tutor-carlos",
    student_id: MOCK_USER_ID,
    scheduled_start: new Date(new Date().setHours(18, 30, 0)).toISOString(), // Today at 18:30
    scheduled_end: new Date(new Date().setHours(20, 0, 0)).toISOString(),
    status: "confirmed",
    meeting_link: "https://meet.google.com/abc-defg-hij",
    created_at: new Date().toISOString(),
    subject: { id: 1, name: "Análisis Matemático II", year: 2 },
    peerName: "Prof. Carlos M.",
    isTutorRole: false // Alejandro is the student
  },
  {
    id: "session-2",
    tutor_id: MOCK_USER_ID,
    student_id: "student-martina",
    scheduled_start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
    scheduled_end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: "pending",
    meeting_link: "",
    created_at: new Date().toISOString(),
    subject: { id: 2, name: "Programación II", year: 2 },
    peerName: "Martina S.",
    isTutorRole: true // Alejandro is the tutor
  }
];

const MOCK_POSTS: ForumPostExtended[] = [
  {
    id: "post-1",
    user_id: "user-lucas",
    subject_id: 1,
    post_type_id: 1, // Duda Académica
    title: "¿Cómo aplicar el Teorema de Rolle en este ejercicio?",
    content: "Hola gente, no me sale aplicar las hipótesis del teorema en una función partida...",
    upvotes: 24,
    is_resolved: true,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    subjectName: "Análisis Matemático II",
    postTypeName: "Duda Académica",
    repliesCount: 8
  },
  {
    id: "post-2",
    user_id: "user-flavia",
    subject_id: 3,
    post_type_id: 2, // Consejo
    title: "Recomendaciones para el final de Sistemas Operativos",
    content: "Buenas! Rindo SO la semana que viene. ¿Qué temas suelen tomar con más frecuencia?",
    upvotes: 12,
    is_resolved: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
    subjectName: "Sistemas Operativos",
    postTypeName: "Consejo de Cursada",
    repliesCount: 5
  },
  {
    id: "post-3",
    user_id: "user-tomas",
    subject_id: 4,
    post_type_id: 3, // Compraventa
    title: "Vendo apuntes impresos de Álgebra (casi nuevos)",
    content: "Los imprimí este cuatrimestre y están en excelente estado, sin rayar.",
    upvotes: 0,
    is_resolved: false,
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(), // 10 hours ago
    subjectName: "Álgebra",
    postTypeName: "Compraventa",
    repliesCount: 0
  }
];

// 2. Extra Mock Data for Modals Phase
let mockAvailability: DbTutorAvailability[] = [
  {
    id: 1,
    tutor_id: MOCK_USER_ID,
    day_of_week: 1, // Lunes
    start_time: "18:30",
    end_time: "20:00"
  },
  {
    id: 2,
    tutor_id: MOCK_USER_ID,
    day_of_week: 3, // Miércoles
    start_time: "16:00",
    end_time: "18:00"
  }
];

let mockReplies: Record<string, DbPostReply[]> = {
  "post-1": [
    {
      id: "reply-1",
      post_id: "post-1",
      user_id: "user-carlos",
      content: "¡Hola Ale! Sí, recordá que tenés que verificar primero que la función sea continua en el intervalo cerrado [a, b] y derivable en el abierto (a, b). En el punto de quiebre de la función partida, tenés que comprobar que los límites laterales coincidan.",
      upvotes: 5,
      is_accepted: true,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
    }
  ],
  "post-2": [
    {
      id: "reply-2",
      post_id: "post-2",
      user_id: "user-juan",
      content: "Che, estudiale a fondo el tema de Semáforos y Monitores. Siempre toman un ejercicio práctico de concurrencia y sincronización de procesos en el examen.",
      upvotes: 3,
      is_accepted: false,
      created_at: new Date(Date.now() - 1 * 3600000).toISOString()
    }
  ],
  "post-3": []
};

let mockDocuments: DbDocument[] = [];

/**
 * Fetch core statistics, level, XP, and badges earned by the user.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Artificial delay to show off the beautiful skeleton loader
  await new Promise(resolve => setTimeout(resolve, 800));

  const USE_REAL_DATABASE = false; // Set to true to enable Supabase calls

  if (USE_REAL_DATABASE) {
    try {
      const authResponse = await (supabase.auth.getUser() as any);
      const authUser = authResponse?.data?.user;
      
      if (authUser) {
        // Execute database select to fetch user metrics
        // const { data: dbUser } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        // const { data: dbBadges } = await supabase.from('user_badges').select('badges(*)').eq('user_id', authUser.id);
        // Real database mapping would happen here.
      }
    } catch (error) {
      console.error("Error fetching dashboard stats from Supabase:", error);
    }
  }

  // Calculating XP and Level: Level increases every 200 points
  const points = MOCK_USER.points;
  const karmaLevel = 12;
  const nextLevelXP = 3000;
  const xpPercentage = (points / nextLevelXP) * 100;

  return {
    user: MOCK_USER,
    karmaLevel,
    currentXP: points,
    nextLevelXP,
    xpPercentage,
    recentBadges: MOCK_BADGES,
    notificationsCount: 3
  };
}

/**
 * Fetch all upcoming tutoring sessions for the student (either as tutor or learner)
 */
export async function fetchUpcomingSessions(): Promise<UpcomingSessionExtended[]> {
  // Artificial delay to show off the beautiful skeleton loader
  await new Promise(resolve => setTimeout(resolve, 800));

  const USE_REAL_DATABASE = false; // Set to true to enable Supabase calls

  if (USE_REAL_DATABASE) {
    try {
      const authResponse = await (supabase.auth.getUser() as any);
      const authUser = authResponse?.data?.user;
      
      if (authUser) {
        // Real Database Query structure:
        // const { data: sessions } = await supabase
        //   .from('tutoring_sessions')
        //   .select('*, subject:subjects(*), tutor:users!tutor_id(name, last_name), student:users!student_id(name, last_name)')
        //   .or(`student_id.eq.${authUser.id},tutor_id.eq.${authUser.id}`)
        //   .order('scheduled_start', { ascending: true });
      }
    } catch (error) {
      console.error("Error fetching tutoring sessions from Supabase:", error);
    }
  }

  return mockSessions;
}

/**
 * Fetch recent forum activities or academic questions
 */
export async function fetchRecentForumPosts(): Promise<ForumPostExtended[]> {
  // Artificial delay to show off the beautiful skeleton loader
  await new Promise(resolve => setTimeout(resolve, 800));

  const USE_REAL_DATABASE = false; // Set to true to enable Supabase calls

  if (USE_REAL_DATABASE) {
    try {
      const authResponse = await (supabase.auth.getUser() as any);
      const authUser = authResponse?.data?.user;

      if (authUser) {
        // Real database fetch query:
        // const { data: posts } = await supabase
        //   .from('posts')
        //   .select('*, subject:subjects(name), post_type:post_types(name), replies:post_replies(count)')
        //   .order('created_at', { ascending: false })
        //   .limit(5);
      }
    } catch (error) {
      console.error("Error fetching forum posts from Supabase:", error);
    }
  }

  return MOCK_POSTS;
}

/**
 * Update the status of a tutoring session (Accept class or Reject/Cancel class)
 */
export async function updateSessionStatus(
  sessionId: string, 
  newStatus: 'confirmed' | 'canceled'
): Promise<{ success: boolean; data?: UpcomingSessionExtended[]; error?: string }> {
  try {
    // 1. Authenticate user
    const authResponse = await (supabase.auth.getUser() as any);
    const authUser = authResponse?.data?.user;

    // In local development or fallback mode, we mutate our local mock state:
    const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      if (newStatus === 'canceled') {
        // Remove the rejected session or set status to canceled
        mockSessions = mockSessions.filter(s => s.id !== sessionId);
      } else {
        mockSessions[sessionIndex].status = 'confirmed';
        // Simulating videocall link assignment
        mockSessions[sessionIndex].meeting_link = "https://meet.google.com/xyz-pdqk-wlm";
      }

      // If authUser is valid, we would update Supabase:
      if (authUser) {
        // await supabase.from('tutoring_sessions').update({ status: newStatus }).eq('id', sessionId);
      }

      return { success: true, data: mockSessions };
    }

    return { success: false, error: "Clase no encontrada." };
  } catch (error) {
    console.error("Error updating session status:", error);
    return { success: false, error: "Hubo un problema al procesar tu solicitud." };
  }
}

/**
 * Fetch active tutor availability schedule slots
 */
export async function fetchTutorAvailability(): Promise<DbTutorAvailability[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockAvailability;
}

/**
 * Save active tutor availability calendar slots
 */
export async function saveTutorAvailability(
  availabilityList: DbTutorAvailability[]
): Promise<{ success: boolean; data?: DbTutorAvailability[]; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate inputs
    mockAvailability = availabilityList.map((slot, index) => ({
      ...slot,
      id: slot.id || index + 1,
      tutor_id: MOCK_USER_ID
    }));

    // In a live Supabase environment, we would do:
    // await supabase.from('tutor_availability').delete().eq('tutor_id', MOCK_USER_ID);
    // await supabase.from('tutor_availability').insert(availabilityList);

    return { success: true, data: mockAvailability };
  } catch (error) {
    console.error("Error saving tutor availability:", error);
    return { success: false, error: "Hubo un problema al actualizar tu agenda." };
  }
}

/**
 * Fetch all replies/comments associated with a forum post
 */
export async function fetchPostReplies(postId: string): Promise<DbPostReply[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockReplies[postId] || [];
}

/**
 * Submit a new reply comment to a forum post
 */
export async function addPostReply(
  postId: string,
  content: string
): Promise<{ success: boolean; data?: DbPostReply[]; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!content.trim()) {
      return { success: false, error: "El comentario no puede estar vacío." };
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
    
    // Append to local state
    mockReplies[postId].push(newReply);

    // Increment repliesCount on the matching post
    const postIndex = MOCK_POSTS.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      MOCK_POSTS[postIndex].repliesCount += 1;
    }

    // Supabase equivalent query:
    // await supabase.from('post_replies').insert(newReply);

    return { success: true, data: mockReplies[postId] };
  } catch (error) {
    console.error("Error adding post reply:", error);
    return { success: false, error: "Hubo un problema al enviar tu comentario." };
  }
}

/**
 * Upload a document metadata entry (mock document registration)
 */
export async function uploadApunte(
  title: string,
  subjectId: number,
  fileType: string
): Promise<{ success: boolean; data?: DbDocument; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!title.trim()) {
      return { success: false, error: "El título del apunte es obligatorio." };
    }

    const newDoc: DbDocument = {
      id: `doc-${Date.now()}`,
      user_id: MOCK_USER_ID,
      subject_id: subjectId,
      title: title.trim(),
      document_type: fileType,
      storage_url: `https://supabase-storage.unlarconnect/apuntes/${title.toLowerCase().replace(/\s+/g, '-')}.${fileType}`,
      uploaded_at: new Date().toISOString(),
      upvotes: 0
    };

    mockDocuments.push(newDoc);

    // Award XP points to user for uploading a document (gamification match)
    MOCK_USER.points += 50; // Award 50 points

    // Supabase equivalent queries:
    // await supabase.storage.from('apuntes').upload(filePath, file);
    // await supabase.from('documents').insert(newDoc);
    // await supabase.from('users').update({ points: points + 50 }).eq('id', MOCK_USER_ID);

    return { success: true, data: newDoc };
  } catch (error) {
    console.error("Error uploading apunte:", error);
    return { success: false, error: "Hubo un problema al registrar tu apunte." };
  }
}

