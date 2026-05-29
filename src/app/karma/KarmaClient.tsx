"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Award, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Lock, 
  CheckCircle2, 
  BookOpen, 
  Calendar, 
  Upload, 
  ArrowLeft,
  X 
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { simulateKarmaAporte, KarmaStats } from "@/actions/karma";
import { DbBadge } from "@/types/database";
import Link from "next/link";

interface KarmaClientProps {
  initialStats: KarmaStats;
}

interface ActiveBadge extends DbBadge {
  justUnlocked?: boolean;
  awardRecord?: { awarded_at: string } | null;
}

export default function KarmaClient({ initialStats }: KarmaClientProps) {
  const [stats, setStats] = useState<KarmaStats>(initialStats);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [activeModalBadge, setActiveModalBadge] = useState<ActiveBadge | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSimulate = (type: 'apunte' | 'foro' | 'tutoria') => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const res = await simulateKarmaAporte(type);
        if (res.success && res.data) {
          setStats(res.data);
          
          let xpEarned = 15;
          let actionText = "por responder en el foro";
          if (type === 'apunte') {
            xpEarned = 50;
            actionText = "por subir tu apunte al banco";
          } else if (type === 'tutoria') {
            xpEarned = 100;
            actionText = "por dar una clase de tutoría";
          }

          // Trigger toast notification
          setShowToast(`¡Excelente! Sumaste +${xpEarned} Puntos de Reputación ${actionText} 🚀`);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
          setTimeout(() => setShowToast(null), 4000);

          // If a new badge was unlocked, show the success modal!
          if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
            setActiveModalBadge({
              ...res.newlyUnlocked[0],
              justUnlocked: true
            });
          }
        } else {
          console.error(res.error || "Error al simular aporte.");
        }
      } catch (err) {
        console.error("Simulation error:", err);
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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

  // Predefined missions list
  const missions = [
    {
      type: 'apunte' as const,
      title: "Subí un Apunte",
      reward: "+50 Puntos",
      description: "Cargá resúmenes, guías o apuntes de examen al banco de recursos de tu materia.",
      icon: Upload,
      buttonText: "Simular Subida"
    },
    {
      type: 'foro' as const,
      title: "Ayudá en los Foros",
      reward: "+15 Puntos",
      description: "Respondé las dudas académicas de tus compañeros o abrí debates enriquecedores.",
      icon: MessageSquare,
      buttonText: "Simular Respuesta"
    },
    {
      type: 'tutoria' as const,
      title: "Dictá una Tutoría P2P",
      reward: "+100 Puntos",
      description: "Organizá un encuentro de estudio y brindá una clase virtual de apoyo a otros alumnos.",
      icon: Calendar,
      buttonText: "Simular Tutoría"
    }
  ];

  return (
    <DashboardLayout>
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50 bg-primary-container text-foreground border border-accent/20 px-5 py-3 rounded-2xl shadow-xl shadow-accent/10 flex items-center gap-3 font-semibold text-sm"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkle Particles (Simulated Confetti) */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-accent"
                initial={{
                  x: "50vw",
                  y: "50vh",
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: `${20 + Math.random() * 60}vw`,
                  y: `${20 + Math.random() * 50}vh`,
                  scale: [1, 1.5, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        className="space-y-8 pb-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Navigation back and header */}
        <motion.div className="flex flex-col gap-4 border-b border-border/10 pb-6" variants={itemVariants}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Dashboard
              </Link>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
                Reputación y <span className="text-accent font-bold">Recompensas</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu colaboración en la comunidad UNLaR te hace crecer. Ganá puntos, subí de nivel y coleccioná medallas.
              </p>
            </div>

            <Link
              href="/ranking"
              className="self-start sm:self-center px-4 py-2 text-xs font-bold border border-border hover:border-accent bg-card/30 hover:bg-card/65 rounded-xl transition-all duration-300 flex items-center gap-1.5 focus:outline-none active:scale-95 shrink-0 select-none"
            >
              <Trophy className="w-4 h-4 text-accent animate-pulse-slow" />
              <span>Ver Ranking de Alumnos</span>
            </Link>
          </div>
        </motion.div>

        {/* Top Bento Layout: Stats Progress + Simulator */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-6" variants={itemVariants}>
          {/* Progress Card (7cols) */}
          <div className="lg:col-span-7 bg-glass rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between hover-glow-subtle duration-300">
            <div className="absolute top-0 right-0 w-44 h-44 bg-accent/5 blur-[60px] rounded-full pointer-events-none" />

            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground mb-1">Puntos de Reputación</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">NIVEL {stats.karmaLevel}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-accent block leading-none">{stats.userPoints.toLocaleString()} pts</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">XP acumulado total</span>
                </div>
              </div>

              {/* Glowing XP Progress Bar */}
              <div className="w-full bg-muted/60 dark:bg-muted/40 h-3 rounded-full mb-6 overflow-hidden border border-border/20">
                <motion.div 
                  className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.xpPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-8">
                <span>Nivel {stats.karmaLevel}</span>
                <span className="text-accent">{stats.userPoints % 250} / 250 XP para Nivel {stats.karmaLevel + 1}</span>
                <span>Nivel {stats.karmaLevel + 1}</span>
              </div>
            </div>

            {/* How points are calculated details list */}
            <div className="bg-special-gradient rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider">¿Cómo sumar puntos de Reputación?</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Subir un apunte: <strong>+50 pts</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Responder en foro: <strong>+15 pts</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Resolver una duda: <strong>+50 pts</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Dar una tutoría: <strong>+100 pts</strong></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contributions Simulator Bento Card (5cols) */}
          <div className="lg:col-span-5 bg-glass rounded-3xl p-6 flex flex-col justify-between hover-glow-subtle duration-300">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                <h2 className="font-heading text-lg font-bold text-foreground">Simulador de Aportes</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                ¡Probá el sistema de gamificación! Cliqueá los botones para simular colaboraciones reales, ver tus estadísticas subir y desbloquear medallas.
              </p>
            </div>

            <div className="space-y-2.5">
              {missions.map((mission) => {
                const Icon = mission.icon;
                return (
                  <div 
                    key={mission.type}
                    className="p-3 bg-card/35 hover:bg-card/60 border border-border/20 rounded-2xl flex items-center justify-between gap-3 group transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/15 group-hover:bg-accent/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{mission.title}</h4>
                        <span className="text-[10px] text-accent font-extrabold">{mission.reward}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSimulate(mission.type)}
                      disabled={isPending}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground text-[10px] font-bold rounded-lg transition-colors active:scale-95 cursor-pointer"
                    >
                      {isPending ? "Procesando..." : mission.buttonText}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Medallas / Badges Block */}
        <motion.div className="space-y-4" variants={itemVariants}>
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            <span>Medallas de Colaboración</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Alcanzá los puntajes necesarios para ganar las insignias oficiales y lucirlas en la comunidad académica.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stats.allBadges.map((badge) => {
              const awardRecord = stats.earnedBadges.find(ub => ub.badge_id === badge.id);
              const isLocked = stats.userPoints < badge.required_points;

              return (
                <div
                  key={badge.id}
                  onClick={() => setActiveModalBadge({ ...badge, awardRecord })}
                  className={`bg-glass rounded-3xl p-5 flex flex-col justify-between border hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all duration-300 ${
                    isLocked 
                      ? 'border-border/30 opacity-60 hover:opacity-80' 
                      : 'border-accent/30 shadow-[0_0_15px_rgba(245,158,11,0.04)] dark:shadow-[0_0_20px_rgba(245,158,11,0.06)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Badge Icon Grid */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                      isLocked 
                        ? 'bg-muted/30 border-border/40 text-muted-foreground/60' 
                        : 'bg-accent/15 border-accent/25 text-accent shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    }`}>
                      {badge.icon_name === 'forum' && <MessageSquare className="w-6 h-6" />}
                      {badge.icon_name === 'handshake' && <Sparkles className="w-6 h-6" />}
                      {badge.icon_name === 'menu_book' && <BookOpen className="w-6 h-6" />}
                    </div>

                    {/* Lock / Check indicator */}
                    {isLocked ? (
                      <span className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground border border-border/30">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm animate-pulse-slow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-foreground">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{badge.description}</p>
                  </div>

                  <div className="pt-4 border-t border-border/10 mt-4 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground">Requisito</span>
                    <span className={isLocked ? 'text-muted-foreground' : 'text-accent font-extrabold'}>
                      {badge.required_points} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Medalla details / Success modal */}
      <AnimatePresence>
        {activeModalBadge && (
          <motion.div 
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModalBadge(null)}
          >
            <motion.div 
              className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col text-center focus:outline-none"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setActiveModalBadge(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Just Unlocked Celebration Header */}
              {activeModalBadge.justUnlocked && (
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold text-accent bg-accent/15 border border-accent/25 uppercase tracking-widest animate-pulse">
                    ¡Medalla Ganada! 🎉
                  </span>
                </div>
              )}

              {/* Badge visual representation */}
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border mx-auto mb-6 transition-transform duration-500 hover:rotate-12 ${
                stats.userPoints < activeModalBadge.required_points 
                  ? 'bg-muted/30 border-border/40 text-muted-foreground/60' 
                  : 'bg-accent/15 border-accent/25 text-accent shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              }`}>
                {activeModalBadge.icon_name === 'forum' && <MessageSquare className="w-10 h-10" />}
                {activeModalBadge.icon_name === 'handshake' && <Sparkles className="w-10 h-10" />}
                {activeModalBadge.icon_name === 'menu_book' && <BookOpen className="w-10 h-10" />}
              </div>

              <h3 className="font-heading text-xl font-bold text-foreground mb-1 leading-snug">
                {activeModalBadge.name}
              </h3>
              <span className="text-[10px] font-extrabold text-accent uppercase tracking-widest mb-4 block">
                {activeModalBadge.required_points} puntos de Reputación
              </span>

              <p className="text-xs text-muted-foreground leading-relaxed mb-6 bg-muted/20 border border-border/10 p-4 rounded-2xl">
                {activeModalBadge.description}
              </p>

              {/* Lock status detail or Award details */}
              <div className="text-xs font-semibold py-3 border-t border-border/10 mt-2">
                {stats.userPoints < activeModalBadge.required_points ? (
                  <p className="text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lock className="w-4 h-4 text-muted-foreground/60" />
                    <span>Te faltan <strong>{activeModalBadge.required_points - stats.userPoints} pts</strong> de Reputación para desbloquearla.</span>
                  </p>
                ) : (
                  <p className="text-green-400 flex items-center justify-center gap-1.5 select-none">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {activeModalBadge.awardRecord?.awarded_at 
                        ? `Desbloqueada el ${new Date(activeModalBadge.awardRecord.awarded_at).toLocaleDateString('es-AR')}`
                        : "¡Medalla desbloqueada con éxito!"}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
