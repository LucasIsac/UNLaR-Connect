"use client";

import { useState, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchDashboardStats, 
  fetchUpcomingSessions, 
  fetchRecentForumPosts, 
  updateSessionStatus,
  DashboardStats,
  UpcomingSessionExtended,
  ForumPostExtended
} from "@/actions/dashboard";

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
    repliesCount: 8
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
    repliesCount: 5
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
    repliesCount: 0
  }
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<UpcomingSessionExtended[]>([]);
  const [posts, setPosts] = useState<ForumPostExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Toggle this flag to swap between client-side mocks and Server Actions (Supabase)
  const USE_CLIENT_MOCKS = true;

  // Load all dashboard data on mount
  useEffect(() => {
    async function loadData() {
      if (USE_CLIENT_MOCKS) {
        // Simulated network delay so the user experiences the beautiful skeleton loader
        const timer = setTimeout(() => {
          setStats({
            user: {
              id: "123e4567-e89b-12d3-a456-426614174000",
              role_id: 2,
              career_id: 1,
              name: CLIENT_MOCK_USER.name,
              last_name: "Garcia",
              email: "ale.garcia@unlar.edu.ar",
              is_unlar_member: true,
              points: CLIENT_MOCK_USER.points,
              tutor_rating: CLIENT_MOCK_USER.tutor_rating,
              total_reviews: CLIENT_MOCK_USER.total_reviews,
              created_at: new Date().toISOString()
            },
            karmaLevel: 12,
            currentXP: CLIENT_MOCK_USER.points,
            nextLevelXP: 3000,
            xpPercentage: (CLIENT_MOCK_USER.points / 3000) * 100,
            recentBadges: CLIENT_MOCK_BADGES,
            notificationsCount: 3
          });
          setSessions(CLIENT_MOCK_SESSIONS);
          setPosts(CLIENT_MOCK_POSTS);
          setLoading(false);
        }, 1200); // 1.2s delay for a premium feel skeleton loading phase
        
        return () => clearTimeout(timer);
      } else {
        try {
          const [statsData, sessionsData, postsData] = await Promise.all([
            fetchDashboardStats(),
            fetchUpcomingSessions(),
            fetchRecentForumPosts()
          ]);
          
          setStats(statsData);
          setSessions(sessionsData);
          setPosts(postsData);
        } catch (err) {
          console.error("Error loading dashboard data from Server Actions:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [USE_CLIENT_MOCKS]);

  // Handle tutoring session acceptance / rejection with optimistic state updates
  const handleSessionAction = async (sessionId: string, newStatus: 'confirmed' | 'canceled') => {
    setActionInProgress(sessionId);
    
    // Optimistic UI updates
    const previousSessions = [...sessions];
    if (newStatus === 'canceled') {
      // Instantly slide out
      setSessions(prev => prev.filter(s => s.id !== sessionId));
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
    }

    if (USE_CLIENT_MOCKS) {
      // Simulating a brief Server latency on the client
      setTimeout(() => {
        setActionInProgress(null);
      }, 500);
      return;
    }

    try {
      const response = await updateSessionStatus(sessionId, newStatus);
      if (response.success && response.data) {
        setSessions(response.data);
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
      // Standard local format
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
  const currentXP = stats?.currentXP || 0;
  const nextLevelXP = stats?.nextLevelXP || 1000;
  const xpPercentage = stats?.xpPercentage || 0;
  const notificationsCount = stats?.notificationsCount || 0;

  return (
    <DashboardLayout>
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

        {/* Bento Grids Top */}
        <motion.section className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
          {/* Karma & XP Widget - Premium glassmorphic bento block */}
          <div className="bg-glass rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden hover-glow-subtle transition-all duration-300">
            {/* Ambient amber background blur glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-heading text-lg font-bold text-cream-bone mb-1">Tu Nivel de Karma</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nivel {karmaLevel}</p>
              </div>
              <span className="text-sm font-semibold text-accent">{currentXP} / {nextLevelXP} XP</span>
            </div>

            {/* Dopamine-inducing animated progress bar wrapper */}
            <div className="w-full bg-muted/65 dark:bg-muted/40 h-2.5 rounded-full mb-6 overflow-hidden border border-border/20">
              <motion.div 
                className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
                initial={{ width: 0 }}
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
                    <div 
                      key={badge.id}
                      className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-all duration-200 ${isLocked ? 'opacity-40' : 'opacity-100 hover:scale-105'}`}
                      title={badge.description}
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
                    </div>
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
            <button className="mt-6 w-full h-11 border border-border hover:border-accent bg-card/25 hover:bg-card/50 text-cream-bone font-semibold text-sm rounded-xl transition-all duration-300 flex justify-center items-center gap-2 active:scale-98">
              <span>Ver mis disponibilidades</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.section>

        {/* Main Split Content */}
        <motion.section className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={itemVariants}>
          {/* Left: Próximas Tutorías Timeline */}
          <div>
            <h3 className="font-heading text-xl font-black text-cream-bone mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              <span>Próximas Tutorías</span>
            </h3>
            
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
                  sessions.map((session, index) => {
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
              <Link 
                href="/dashboard/foros" 
                className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 group"
              >
                <span>Ver todo</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
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
    </DashboardLayout>
  );
}
