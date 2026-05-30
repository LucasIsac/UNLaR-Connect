"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Trophy, 
  Star, 
  Video, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  Check, 
  X,
  FileText,
  Calendar,
  AlertTriangle,
  Upload,
  UserCheck,
  Save,
  Send,
  Plus,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  updateSessionStatus,
  fetchTutorAvailability,
  saveTutorAvailability,
  fetchPostReplies,
  addPostReply,
  uploadApunte,
  DashboardStats,
  UpcomingSessionExtended,
  ForumPostExtended
} from "@/actions/dashboard";
import { DbTutorAvailability, DbPostReply } from "@/types/database";
import { updateUserProfile, toggleTutorStatus } from "@/actions/perfil";
import type { CombinedHeaderData } from "@/actions/perfil";
import { reactivateAccountAction, signOutAction } from "@/actions/auth";
import { Select } from "@/components/ui/Select";
import EventsSection from "@/components/events/EventsSection";
import CreateEventModal from "@/components/events/CreateEventModal";
import type { EventExtended } from "@/actions/events";

type DashboardClientProps = {
  initialStats: DashboardStats;
  initialSessions: UpcomingSessionExtended[];
  initialPosts: ForumPostExtended[];
  initialHeaderData: CombinedHeaderData;
  initialEvents?: EventExtended[];
  canCreateEvents?: boolean;
};

// ==========================================
// 💡 CLIENT-SIDE MOCK FEEDS
// Exposing static structures directly in the client component
// to guarantee instant loads and prevent Next.js Server Action 404 chunk mismatches.
// ==========================================

const CLIENT_MOCK_USER = {
  name: "Alejandro",
  points: 2450,
  tutor_rating: 4.8,
  total_reviews: 15
};

const CLIENT_MOCK_BADGES = [
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
    required_points: 3000,
    created_at: new Date().toISOString()
  }
];

const CLIENT_MOCK_SESSIONS: UpcomingSessionExtended[] = [
  {
    id: "session-1",
    tutor_id: "tutor-carlos",
    student_id: "123e4567-e89b-12d3-a456-426614174000",
    scheduled_start: new Date(new Date().setHours(18, 30, 0)).toISOString(), // Today at 18:30
    scheduled_end: new Date(new Date().setHours(20, 0, 0)).toISOString(),
    status: "confirmed",
    meeting_link: "https://meet.google.com/abc-defg-hij",
    created_at: new Date().toISOString(),
    subject: { id: 1, name: "Análisis Matemático II", year: 2 },
    peerName: "Prof. Carlos M.",
    isTutorRole: false
  },
  {
    id: "session-2",
    tutor_id: "123e4567-e89b-12d3-a456-426614174000",
    student_id: "student-martina",
    scheduled_start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
    scheduled_end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: "pending",
    meeting_link: "",
    created_at: new Date().toISOString(),
    subject: { id: 2, name: "Programación II", year: 2 },
    peerName: "Martina S.",
    isTutorRole: true
  }
];

const CLIENT_MOCK_POSTS: ForumPostExtended[] = [
  {
    id: "post-1",
    user_id: "user-lucas",
    subject_id: 1,
    post_type_id: 1,
    title: "¿Cómo aplicar el Teorema de Rolle en este ejercicio?",
    content: "Hola gente, no me sale aplicar las hipótesis del teorema en una función partida...",
    upvotes: 24,
    is_resolved: true,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    subjectName: "Análisis Matemático II",
    postTypeName: "Duda Académica",
    repliesCount: 1,
    type: "question",
    metadata: {}
  },
  {
    id: "post-2",
    user_id: "user-flavia",
    subject_id: 3,
    post_type_id: 2,
    title: "Recomendaciones para el final de Sistemas Operativos",
    content: "Buenas! Rindo SO la semana que viene. ¿Qué temas suelen tomar con más frecuencia?",
    upvotes: 12,
    is_resolved: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    subjectName: "Sistemas Operativos",
    postTypeName: "Consejo de Cursada",
    repliesCount: 1,
    type: "resource",
    metadata: {}
  },
  {
    id: "post-3",
    user_id: "user-tomas",
    subject_id: 4,
    post_type_id: 3,
    title: "Vendo apuntes impresos de Álgebra (casi nuevos)",
    content: "Los imprimí este cuatrimestre y están en excelente estado, sin rayar.",
    upvotes: 0,
    is_resolved: false,
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    subjectName: "Álgebra",
    postTypeName: "Compraventa",
    repliesCount: 0,
    type: "sell_rent",
    metadata: {
      item_name: "Apuntes de Álgebra",
      price: 1500,
      condition: "used_good",
      mode: "sell",
      location: "Sede Central"
    }
  }
];

export default function DashboardClient({
  initialStats,
  initialSessions,
  initialPosts,
  initialHeaderData,
  initialEvents = [],
  canCreateEvents = false,
}: DashboardClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);
  const [sessions, setSessions] = useState<UpcomingSessionExtended[]>(initialSessions);
  const [posts, setPosts] = useState<ForumPostExtended[]>(initialPosts);
  const [events, setEvents] = useState<EventExtended[]>(initialEvents);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const loading = false;
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Modal Control States
  const [activeModal, setActiveModal] = useState<'availability' | 'upload' | 'post-details' | 'badge-rules' | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPostExtended | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  
  // Modal Data states
  const [availability, setAvailability] = useState<DbTutorAvailability[]>([]);
  const [replies, setReplies] = useState<DbPostReply[]>([]);
  const [newReplyText, setNewReplyText] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Onboarding Wizard states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingCareerId, setOnboardingCareerId] = useState(1);
  const [onboardingIsTutor, setOnboardingIsTutor] = useState(false);

  // Toggle this flag to swap between client-side mocks and Server Actions (Supabase)
  const USE_CLIENT_MOCKS = false;

  // Show onboarding only after hydration because it depends on sessionStorage.
  useEffect(() => {
    if (initialStats.user.career_id === null && !sessionStorage.getItem("skipped_onboarding")) {
      setIsOnboardingOpen(true);
    }
  }, [initialStats.user.career_id]);

  // Decoupled Sidebar modal activation listener
  useEffect(() => {
    const handleOpenUpload = () => {
      setActiveModal("upload");
    };
    window.addEventListener("open-upload-apunte-modal", handleOpenUpload);
    return () => {
      window.removeEventListener("open-upload-apunte-modal", handleOpenUpload);
    };
  }, []);

  // Show dynamic self-clearing toast alerts
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  // Submit welcome onboarding survey
  const handleOnboardingSubmit = async () => {
    if (!stats) return;
    setActionInProgress("onboarding");
    try {
      // 1. Update major/career
      await updateUserProfile(stats.user.name, stats.user.last_name, onboardingCareerId);
      
      // 2. Register tutor mode if toggled
      if (onboardingIsTutor) {
        await toggleTutorStatus(true);
      }

      // 3. Update local state
      setStats({
        ...stats,
        user: {
          ...stats.user,
          career_id: onboardingCareerId,
          role_id: onboardingIsTutor ? 3 : 2
        }
      });

      setIsOnboardingOpen(false);
      triggerToast("¡Bienvenido/a oficial! Tu perfil fue configurado con éxito. 🎉");
    } catch (err) {
      console.error(err);
      triggerToast("Ocurrió un error al guardar tu perfil. Intentalo de nuevo.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOnboardingSkip = () => {
    sessionStorage.setItem("skipped_onboarding", "true");
    setIsOnboardingOpen(false);
    triggerToast("Omitiste el paso. Podés configurar tu carrera cuando quieras en tu Perfil.");
  };

  const handleReactivateAccount = async () => {
    setActionInProgress("reactivate");
    try {
      const res = await reactivateAccountAction();
      if (res.success) {
        // Update local stats
        if (stats) {
          setStats({
            ...stats,
            user: {
              ...stats.user,
              deleted_at: undefined
            }
          });
        }
        triggerToast("¡Tu cuenta fue reactivada con éxito! Volviste a la comunidad. 🎉");
      } else {
        triggerToast(res.error || "No pudimos reactivar tu cuenta.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error de conexión al reactivar la cuenta.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAction();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Availability Modal Actions
  const handleOpenAvailability = async () => {
    try {
      const data = await fetchTutorAvailability();
      setAvailability(data);
      setActiveModal("availability");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDayAvailability = (dayNum: number) => {
    const exists = availability.find(a => a.day_of_week === dayNum);
    if (exists) {
      setAvailability(prev => prev.filter(a => a.day_of_week !== dayNum));
    } else {
      setAvailability(prev => [
        ...prev, 
        { id: 0, tutor_id: "123e4567-e89b-12d3-a456-426614174000", day_of_week: dayNum, start_time: "18:00", end_time: "20:00" }
      ]);
    }
  };

  const handleTimeChange = (dayNum: number, field: 'start_time' | 'end_time', val: string) => {
    setAvailability(prev => prev.map(a => {
      if (a.day_of_week === dayNum) {
        return { ...a, [field]: val };
      }
      return a;
    }));
  };

  const handleSaveAvailability = async () => {
    setActionInProgress("availability-save");
    try {
      const res = await saveTutorAvailability(availability);
      if (res.success && res.data) {
        setAvailability(res.data);
        setActiveModal(null);
        triggerToast("¡Agenda de tutorías actualizada al toque!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // 2. Forum Replies Actions
  const handleOpenPostDetails = async (post: ForumPostExtended) => {
    setSelectedPost(post);
    setReplies([]);
    setActiveModal("post-details");
    try {
      const repliesData = await fetchPostReplies(post.id);
      setReplies(repliesData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !selectedPost) return;

    setActionInProgress("add-reply");
    try {
      const res = await addPostReply(selectedPost.id, newReplyText);
      if (res.success && res.data) {
        setReplies(res.data);
        setNewReplyText("");
        
        // Dynamically increment counter on index list
        setPosts(prev => prev.map(p => {
          if (p.id === selectedPost.id) {
            return { ...p, repliesCount: p.repliesCount + 1 };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // 3. Upload Apunte Actions
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setActionInProgress("upload-doc");
    try {
      const res = await uploadApunte(uploadTitle, uploadSubjectId, "pdf");
      if (res.success && res.data) {
        // Award dynamic points locally
        if (stats) {
          const newPoints = stats.user.points + 50;
          setStats({
            ...stats,
            user: {
              ...stats.user,
              points: newPoints
            },
            xpPercentage: (newPoints / 3000) * 100
          });
        }
        setUploadTitle("");
        setActiveModal(null);
        triggerToast("¡Apunte subido! Sumaste 50 puntos de Reputación 🚀");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle tutoring session acceptance / rejection with optimistic state updates
  const handleSessionAction = async (sessionId: string, newStatus: 'confirmed' | 'canceled') => {
    setActionInProgress(sessionId);
    
    // Optimistic UI updates
    const previousSessions = [...sessions];
    if (newStatus === 'canceled') {
      // Instantly slide out
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      triggerToast("Clase rechazada.");
    } else {
      // Instantly set as confirmed
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            status: 'confirmed' as const,
            meeting_link: "https://meet.google.com/xyz-pdqk-wlm"
          };
        }
        return s;
      }));
      triggerToast("¡Clase confirmada! Agendada en tu calendario.");
    }

    if (USE_CLIENT_MOCKS) {
      setTimeout(() => {
        setActionInProgress(null);
      }, 500);
      return;
    }

    try {
      const response = await updateSessionStatus(sessionId, newStatus);
      if (response.success) {
        // Optimistic UI is already applied, just tell Next.js to refresh in background
        // and do not overwrite with potentially stale response.data
        router.refresh();
      } else {
        // Rollback on failure
        setSessions(previousSessions);
        alert(response.error || "Hubo un error al actualizar la clase.");
      }
    } catch (err) {
      setSessions(previousSessions);
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Helper function to format timestamp in Argentine style (voseo/student context)
  const formatSessionTime = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const timeString = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    const startHourStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;

    if (start.toDateString() === today.toDateString()) {
      return `Hoy ${timeString}`;
    } else if (start.toDateString() === tomorrow.toDateString()) {
      return `Mañana ${startHourStr}`;
    } else {
      return `${start.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} a las ${startHourStr}`;
    }
  };

  // Container motion variants for clean staggered entry
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 120, damping: 14 }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-10 animate-pulse">
          {/* Hero Welcome Skeleton */}
          <div className="space-y-3">
            <div className="h-10 bg-card/45 rounded-2xl w-3/4 md:w-1/2"></div>
            <div className="h-5 bg-card/45 rounded-2xl w-2/3 md:w-1/3"></div>
          </div>
          
          {/* Bento Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-52 bg-glass rounded-3xl border border-accent/5"></div>
            <div className="h-52 bg-glass rounded-3xl border border-accent/5"></div>
          </div>

          {/* Timeline & Foro Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-8 bg-card/45 rounded-2xl w-1/3"></div>
              <div className="h-44 bg-glass rounded-3xl border border-accent/5 animate-pulse"></div>
              <div className="h-44 bg-glass rounded-3xl border border-accent/5 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-card/45 rounded-2xl w-1/3"></div>
              <div className="h-24 bg-glass rounded-3xl border border-accent/5 animate-pulse"></div>
              <div className="h-24 bg-glass rounded-3xl border border-accent/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const user = stats?.user || { name: "Alejandro", points: 0, tutor_rating: 0, total_reviews: 0 };
  const karmaLevel = stats?.karmaLevel || 1;
  const currentXP = stats?.user.points || 0;
  const nextLevelXP = stats?.nextLevelXP || 3000;
  const xpPercentage = stats?.xpPercentage || 0;
  const notificationsCount = stats?.notificationsCount || 0;

  // Intercept if account is soft-deleted
  if (stats?.user?.deleted_at) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0C0A09] relative overflow-hidden px-4">
        {/* Background Ambience Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#F59E0B]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#EA4335]/10 blur-[120px] pointer-events-none" />
        
        {/* Visual Canvas Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-[#1C1917]/70 backdrop-blur-xl border border-[#F59E0B]/10 rounded-lg p-8 shadow-[0_8px_32px_rgba(12,10,9,0.5)] space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EA4335]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] mx-auto shadow-xl shadow-accent/5">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-xl font-bold text-[#e8e1df]">
                ¡Hola de nuevo, {stats.user.name}!
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tu cuenta está <span className="text-[#EA4335] font-semibold">programada para darse de baja</span> de forma definitiva.
              </p>
            </div>

            <div className="p-4 bg-muted/20 border border-border/10 rounded-2xl text-left text-xs text-muted-foreground leading-relaxed space-y-2 font-sans">
              <p>
                Recuperá todas tus tutorías planificadas, insignias ganadas, reputación acumulada y foros de discusión en un solo clic.
              </p>
              <p className="text-[#F59E0B] font-semibold">
                ⏳ Todavía estás dentro de la tolerancia de 14 días para reactivarla.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReactivateAccount}
                disabled={actionInProgress === "reactivate"}
                className="w-full h-12 bg-[#F59E0B] hover:bg-[#D97707] text-[#0C0A09] font-sans font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_20px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                {actionInProgress === "reactivate" ? (
                  <span>Reactivando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Reactivar mi cuenta al toque</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="w-full h-11 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, 3);
  const visiblePosts = showAllPosts ? posts : posts.slice(0, 3);

  return (
    <DashboardLayout initialHeaderData={initialHeaderData}>
      {/* Toast Notification Container */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50 bg-primary-container text-obsidian border border-accent/20 px-5 py-3 rounded-2xl shadow-xl shadow-accent/10 flex items-center gap-3 font-semibold text-sm"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Welcome Hero Section */}
        <motion.section className="relative" variants={itemVariants}>
          <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tight mb-2 text-cream-bone">
            ¡Hola, <span className="text-accent">{user.name}</span>!{" "}
            <span className="text-primary font-bold">Qué bueno verte de nuevo.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Tenés <span className="text-accent font-semibold">{notificationsCount} notificaciones</span> y{" "}
            <span className="text-secondary font-semibold">
              {sessions.filter(s => {
                const today = new Date();
                const sessionDate = new Date(s.scheduled_start);
                return sessionDate.toDateString() === today.toDateString() && s.status === 'confirmed';
              }).length} clases agendadas
            </span>{" "}
            para hoy.
          </p>
        </motion.section>

        {/* Events Section */}
        <motion.section variants={itemVariants}>
          <EventsSection
            events={events}
            canCreate={canCreateEvents}
            onCreateClick={() => setShowCreateEvent(true)}
          />
        </motion.section>

        {/* Bento Grids Top */}
        <motion.section className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
          {/* Karma & XP Widget - Premium glassmorphic bento block */}
          <div className="bg-glass rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden hover-glow-subtle transition-all duration-300">
            {/* Ambient amber background blur glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6">
              <Link href="/karma" className="group/karma-title flex items-center gap-1.5 focus:outline-none select-none">
                <div>
                  <h2 className="font-heading text-lg font-bold text-cream-bone mb-1 group-hover/karma-title:text-accent transition-colors flex items-center gap-1.5">
                    <span>Tu Nivel de Reputación</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover/karma-title:opacity-100 group-hover/karma-title:translate-x-0 transition-all text-accent shrink-0" />
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nivel {karmaLevel}</p>
                </div>
              </Link>
              <span className="text-sm font-semibold text-accent">{currentXP} / {nextLevelXP} XP</span>
            </div>

            {/* Dopamine-inducing animated progress bar wrapper */}
            <div className="w-full bg-muted/65 dark:bg-muted/40 h-2.5 rounded-full mb-6 overflow-hidden border border-border/20">
              <motion.div 
                className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>

            {/* Badges Earned Section */}
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Insignias Recientes
              </p>
              <div className="flex gap-4">
                {(stats?.recentBadges || []).map((badge) => {
                  const isLocked = currentXP < badge.required_points;
                  
                  return (
                    <button 
                      key={badge.id}
                      onClick={() => {
                        setSelectedBadge(badge);
                        setActiveModal("badge-rules");
                      }}
                      className={`flex flex-col items-center gap-1.5 group transition-all duration-200 focus:outline-none ${isLocked ? 'opacity-40 hover:opacity-60' : 'opacity-100 hover:scale-105'}`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                        isLocked 
                          ? 'bg-card/10 border-border/20 text-muted-foreground' 
                          : 'bg-card/50 border-accent/20 text-accent group-hover:border-accent shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                      }`}>
                        {badge.icon_name === 'forum' && <MessageSquare className="w-5 h-5" />}
                        {badge.icon_name === 'handshake' && <Sparkles className="w-5 h-5" />}
                        {badge.icon_name === 'menu_book' && <FileText className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold text-center leading-tight max-w-[80px]">
                        {badge.name.split(' ').map((word, idx) => (
                          <span key={idx} className="block">{word}</span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reputation Widget */}
          <div className="bg-glass rounded-3xl p-6 flex flex-col justify-between hover-glow-subtle transition-all duration-300">
            <div>
              <h2 className="font-heading text-lg font-bold text-cream-bone mb-4">Tu Reputación como Tutor</h2>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl md:text-5xl font-extrabold text-accent">{user.tutor_rating.toFixed(1)}</span>
                <Star className="w-8 h-8 text-accent fill-accent shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Basado en <span className="text-cream-bone font-semibold">{user.total_reviews} reseñas</span> de tus alumnos
              </p>
            </div>

            {/* High contrast, Solid border/transparent background secondary button (no gradient) */}
            <button 
              onClick={handleOpenAvailability}
              className="mt-6 w-full h-11 border border-border hover:border-accent bg-card/25 hover:bg-card/50 text-cream-bone font-semibold text-sm rounded-xl transition-all duration-300 flex justify-center items-center gap-2 active:scale-98"
            >
              <span>Ver mis disponibilidades</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.section>

        {/* Main Split Content */}
        <motion.section className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={itemVariants}>
          {/* Left: Próximas Tutorías Timeline */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-black text-cream-bone flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                <span>Próximas Tutorías</span>
              </h3>
              {sessions.length > 3 && (
                <button 
                  onClick={() => setShowAllSessions(!showAllSessions)}
                  className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 group focus:outline-none"
                >
                  <span>{showAllSessions ? "Ver menos" : "Ver todas"}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showAllSessions ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                </button>
              )}
            </div>
            
            <div className="relative border-l border-border/20 ml-4 pl-8 space-y-6">
              <AnimatePresence initial={false}>
                {sessions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card/20 rounded-2xl p-6 border border-border/10 text-center"
                  >
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">No tenés tutorías programadas por ahora.</p>
                  </motion.div>
                ) : (
                  visibleSessions.map((session) => {
                    const isPending = session.status === 'pending';
                    const isConfirmed = session.status === 'confirmed';

                    return (
                      <motion.div 
                        key={session.id} 
                        className="relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden', transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      >
                        {/* Timeline Connector Dot with Ambient Glow for Confirmed Sessions */}
                        <div className={`absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-background border-2 z-10 transition-all duration-300 ${
                          isConfirmed 
                            ? 'border-accent shadow-[0_0_10px_rgba(245,158,11,0.6)]' 
                            : 'border-border/60'
                        }`} />
                        
                        <div className="bg-glass rounded-2xl p-5 hover-glow-subtle transition-all duration-300">
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <h4 className="font-heading text-base md:text-lg font-bold text-cream-bone">
                              {session.subject.name}
                            </h4>
                            
                            {/* Badges and Tags - Pure text status with border-colors (No gradients) */}
                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md shrink-0 uppercase tracking-wide ${
                              isConfirmed 
                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                : 'bg-accent/10 border-accent/20 text-accent'
                            }`}>
                              {isConfirmed ? 'Confirmada' : 'Pendiente'}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground/60">{session.isTutorRole ? 'Alumno:' : 'Tutor:'}</span>
                              <span className="text-cream-bone">{session.peerName}</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-border" />
                            <div className="flex items-center gap-1 text-accent">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatSessionTime(session.scheduled_start, session.scheduled_end)}</span>
                            </div>
                          </div>

                          {/* Action Buttons: strictly solid/secondary borders. (Zero button gradients) */}
                          <div className="flex gap-3">
                            {isConfirmed ? (
                              session.meeting_link && (
                                <a 
                                  href={session.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-10 px-5 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-md shadow-accent/5 shrink-0"
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Unirse a la llamada</span>
                                </a>
                              )
                            ) : (
                              session.isTutorRole && (
                                <div className="flex gap-2.5 w-full sm:w-auto">
                                  <button 
                                    onClick={() => handleSessionAction(session.id, 'confirmed')}
                                    disabled={actionInProgress === session.id}
                                    className="h-10 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Aceptar clase</span>
                                  </button>
                                  <button 
                                    onClick={() => handleSessionAction(session.id, 'canceled')}
                                    disabled={actionInProgress === session.id}
                                    className="h-10 px-4 border border-border hover:border-destructive hover:text-destructive bg-card/20 text-muted-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Rechazar</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Actividad en el Foro */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-black text-cream-bone flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <span>Actividad en el Foro</span>
              </h3>
              <div className="flex items-center gap-3">
                <Link 
                  href="/foro"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  Ir al foro
                </Link>
                {posts.length > 3 && (
                  <button 
                    onClick={() => setShowAllPosts(!showAllPosts)}
                    className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 group focus:outline-none"
                  >
                    <span>{showAllPosts ? "Ver menos" : "Ver todos"}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showAllPosts ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => handleOpenPostDetails(post)}
                  className="bg-glass rounded-2xl p-4 hover:bg-card/30 hover:border-accent/25 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Materia Name Chip (10% terracotta soft background, solid text) */}
                        <span className="px-2 py-0.5 bg-secondary-container/10 border border-secondary-container/20 text-secondary text-[10px] font-bold rounded">
                          {post.postTypeName}
                        </span>
                        
                        {post.subjectName && (
                          <span className="text-[10px] text-muted-foreground/75 font-bold">
                            • {post.subjectName}
                          </span>
                        )}

                        {post.is_resolved && (
                          <span className="flex items-center gap-1 text-green-400 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resuelto</span>
                          </span>
                        )}
                      </div>
                      
                      <h5 className="font-heading text-sm md:text-base font-bold text-cream-bone group-hover:text-primary transition-colors duration-200 line-clamp-1">
                        {post.title}
                      </h5>
                    </div>

                    {/* Upvote score pill counter */}
                    <div className="flex flex-col items-center justify-center bg-card/50 border border-border/30 rounded-xl px-2.5 py-1.5 min-w-[48px] group-hover:border-accent/30 transition-colors shrink-0">
                      <Trophy className="w-4 h-4 text-accent mb-0.5" />
                      <span className="text-xs font-bold text-accent">{post.upvotes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* ==========================================
          ⭐ HIGH FIDELITY OVERLAY MODALS
          Frosted glassmorphism panels with entry zoom effects
          ========================================== */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
          >
            {/* Modal Box */}
            <motion.div 
              className="bg-card/95 border border-border/40 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] custom-scrollbar focus:outline-none"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 1. Tutor Availability Calendar Modal */}
              {activeModal === 'availability' && (
                <div className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-cream-bone">Agenda tus Tutorías</h3>
                      <p className="text-xs text-muted-foreground">Configurá tus días y bloques horarios disponibles para dar clases.</p>
                    </div>
                  </div>

                  <div className="space-y-4 py-2 flex-grow">
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((dayName, idx) => {
                      const dayNum = idx + 1; // 1 to 5
                      const activeSlot = availability.find(a => a.day_of_week === dayNum);
                      
                      return (
                        <div key={dayNum} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 border border-border/10 rounded-2xl hover:border-accent/15 transition-all">
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={!!activeSlot}
                              onChange={() => toggleDayAvailability(dayNum)}
                              className="w-4 h-4 rounded text-accent bg-card border-border/40 focus:ring-accent"
                            />
                            <span className={`font-semibold text-sm ${activeSlot ? 'text-cream-bone' : 'text-muted-foreground'}`}>{dayName}</span>
                          </label>

                          {activeSlot && (
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <input 
                                type="time" 
                                value={activeSlot.start_time.substring(0, 5)}
                                onChange={(e) => handleTimeChange(dayNum, 'start_time', e.target.value)}
                                className="bg-card border border-border/40 rounded-lg px-2.5 py-1 text-xs text-cream-bone focus:outline-none focus:border-accent"
                              />
                              <span className="text-xs text-muted-foreground">a</span>
                              <input 
                                type="time" 
                                value={activeSlot.end_time.substring(0, 5)}
                                onChange={(e) => handleTimeChange(dayNum, 'end_time', e.target.value)}
                                className="bg-card border border-border/40 rounded-lg px-2.5 py-1 text-xs text-cream-bone focus:outline-none focus:border-accent"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={handleSaveAvailability}
                    disabled={actionInProgress === "availability-save"}
                    className="w-full h-11 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{actionInProgress === "availability-save" ? 'Guardando...' : 'Actualizar Agenda'}</span>
                  </button>
                </div>
              )}

              {/* 2. Forum Post Details & Replies Modal */}
              {activeModal === 'post-details' && selectedPost && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="pb-4 border-b border-border/40">
                    <span className="px-2 py-0.5 bg-secondary-container/10 border border-secondary-container/20 text-secondary text-[10px] font-bold rounded">
                      {selectedPost.postTypeName}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-cream-bone mt-2 leading-snug">
                      {selectedPost.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed bg-muted/20 border border-border/10 p-3.5 rounded-2xl">
                      {selectedPost.content}
                    </p>
                  </div>

                  {/* Replies List container */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-4 max-h-[30vh] pr-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Respuestas</h4>
                    
                    {replies.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-medium text-center py-4">No hay respuestas escritas aún. ¡Sé el primero!</p>
                    ) : (
                      <div className="space-y-3">
                        {replies.map((reply) => (
                          <div key={reply.id} className="p-3 bg-muted/25 border border-border/10 rounded-2xl space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                              <span>Compañero Anónimo</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(reply.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-cream-bone leading-relaxed">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Reply Input Form */}
                  <form onSubmit={handleAddReply} className="flex gap-2 pt-2 border-t border-border/40">
                    <input 
                      type="text" 
                      placeholder="Escribí tu respuesta..."
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                      className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-4 py-2 text-sm text-cream-bone placeholder-muted-foreground focus:outline-none focus:border-accent"
                    />
                    <button 
                      type="submit"
                      disabled={actionInProgress === "add-reply" || !newReplyText.trim()}
                      className="h-10 w-10 shrink-0 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground rounded-xl flex items-center justify-center transition-all focus:outline-none active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* 3. Upload Apunte Document Modal */}
              {activeModal === 'upload' && (
                <form onSubmit={handleUploadDoc} className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-cream-bone">Subí tu Apunte</h3>
                      <p className="text-xs text-muted-foreground">Compartí tus conocimientos con la comunidad y ganá puntos de Reputación.</p>
                    </div>
                  </div>

                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Título del archivo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Resumen de Límites y Derivadas"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        required
                        className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl px-4 py-2.5 text-sm text-cream-bone focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Materia relacionada</label>
                      <Select 
                        value={uploadSubjectId}
                        onChange={(val) => setUploadSubjectId(Number(val))}
                        options={[
                          { value: 1, label: "Análisis Matemático II" },
                          { value: 2, label: "Programación II" },
                          { value: 3, label: "Sistemas Operativos" },
                          { value: 4, label: "Álgebra" }
                        ]}
                        className="w-full bg-muted/40 border border-border/40 focus:border-accent rounded-xl px-4 py-2.5 text-sm text-cream-bone focus:outline-none"
                      />
                    </div>

                    {/* Drag and Drop Zone Mock */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); setUploadTitle(e.dataTransfer.files[0]?.name.split('.')[0] || ""); }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                        dragOver 
                          ? 'border-accent bg-accent/5' 
                          : 'border-border/40 bg-muted/20 hover:bg-muted/30 hover:border-accent/30'
                      }`}
                    >
                      <Upload className="w-8 h-8 text-accent/60 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-cream-bone">Arrastrá tu PDF acá o hacé clic para buscar</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Soporta PDF o Imágenes (Máx. 15MB)</p>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={actionInProgress === "upload-doc" || !uploadTitle.trim()}
                    className="w-full h-11 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all focus:outline-none active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionInProgress === "upload-doc" ? 'Subiendo...' : 'Registrar Apunte'}</span>
                  </button>
                </form>
              )}

              {/* 4. Gamification Badge rules Modal */}
              {activeModal === 'badge-rules' && selectedBadge && (
                <div className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-1 items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shadow-xl shadow-accent/5">
                    {selectedBadge.icon_name === 'forum' && <MessageSquare className="w-8 h-8" />}
                    {selectedBadge.icon_name === 'handshake' && <Sparkles className="w-8 h-8" />}
                    {selectedBadge.icon_name === 'menu_book' && <FileText className="w-8 h-8" />}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-bold text-cream-bone">{selectedBadge.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wider ${
                      currentXP >= selectedBadge.required_points 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-card/10 border-border/20 text-muted-foreground'
                    }`}>
                      {currentXP >= selectedBadge.required_points ? 'Desbloqueada' : 'Bloqueada'}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                    {selectedBadge.description}
                  </p>

                  {/* Progress stats */}
                  <div className="w-full p-4 bg-muted/20 border border-border/10 rounded-2xl text-left space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground uppercase tracking-wider">Requisito de Puntos</span>
                      <span className="text-cream-bone">{selectedBadge.required_points} XP</span>
                    </div>

                    <div className="w-full bg-muted/65 dark:bg-muted/40 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentXP >= selectedBadge.required_points ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-accent'
                        }`} 
                        style={{ width: `${Math.min((currentXP / selectedBadge.required_points) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-muted-foreground text-center">
                      {currentXP >= selectedBadge.required_points ? (
                        <span className="text-green-400 flex items-center justify-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" /> ¡Logro alcanzado con éxito!
                        </span>
                      ) : (
                        <span>Te faltan <strong className="text-accent">{selectedBadge.required_points - currentXP} XP</strong> para desbloquear esta insignia.</span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveModal(null)}
                    className="w-full h-11 border border-border hover:border-accent bg-card/20 text-cream-bone font-semibold text-sm rounded-xl transition-all"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Welcome Onboarding Modal Overlay */}
      <AnimatePresence>
        {isOnboardingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-background/90 backdrop-blur-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Wizard Box */}
            <motion.div
              className="bg-card border border-border/40 w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl space-y-6 animate-fade-in relative overflow-visible"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              {/* Glow accent decoration */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shadow-xl shadow-accent/5">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="font-heading text-2xl font-black text-[#e8e1df]">
                  ¡Te damos la bienvenida a UNLaR Connect!
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  Configurá tu perfil en un toque para empezar a interactuar con toda la comunidad universitaria.
                </p>
              </div>

              {onboardingStep === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      ¿Qué carrera estás cursando?
                    </label>
                    <Select
                      value={onboardingCareerId}
                      onChange={(val) => setOnboardingCareerId(Number(val))}
                      options={[
                        { value: 1, label: "Ingeniería en Sistemas de Información (2015)" },
                        { value: 2, label: "Licenciatura en Ciencias de la Computación (2020)" },
                        { value: 3, label: "Tecnicatura en Informática (2018)" }
                      ]}
                      className="w-full bg-muted/40 border border-[#534434]/40 rounded-xl py-3 px-4 text-xs font-semibold text-foreground focus:outline-none transition-all cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={handleOnboardingSkip}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Omitir por ahora
                    </button>
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="h-10 px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-md shadow-accent/5 cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3 p-5 rounded-2xl bg-muted/20 border border-border/10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 pr-4">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          ¿Querés dar clases de tutorías?
                        </label>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Activando esta opción podrás agendar clases, ayudar a tus compañeros de años menores y sumar puntos de Reputación.
                        </p>
                      </div>

                      {/* Switch toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                        <input
                          type="checkbox"
                          checked={onboardingIsTutor}
                          onChange={(e) => setOnboardingIsTutor(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted/70 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-on-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent transition-colors" />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setOnboardingStep(1)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleOnboardingSubmit}
                      disabled={actionInProgress === "onboarding"}
                      className="h-10 px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-md shadow-accent/5 disabled:opacity-40 cursor-pointer"
                    >
                      <span>{actionInProgress === "onboarding" ? "Guardando..." : "Comenzar"}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onCreated={() => {
          setShowCreateEvent(false);
          // Events will refresh on next page load
        }}
      />
    </DashboardLayout>
  );
}
