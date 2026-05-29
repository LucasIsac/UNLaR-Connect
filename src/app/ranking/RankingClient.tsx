"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  ArrowLeft, 
  Search, 
  Award, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Star,
  ChevronRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LeaderboardEntry } from "@/actions/karma";
import Link from "next/link";
import Image from "next/image";

interface RankingClientProps {
  initialLeaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

export default function RankingClient({ initialLeaderboard, currentUserId }: RankingClientProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Todos, 1 = Sistemas, 2 = Computacion, 3 = Tecnicatura

  // Filter leaderboard based on active tab career and search query
  const filteredList = leaderboard.filter(student => {
    // 1. Search Query Filter
    const matchesSearch = `${student.name} ${student.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Career Tab Filter
    if (activeTab === 0) return true; // Global
    if (activeTab === 1) return student.careerId === 1; // Sistemas
    if (activeTab === 2) return student.careerId === 2; // Computacion
    if (activeTab === 3) return student.careerId === 3; // Tecnicatura
    
    return true;
  });

  // Find current user's entry and rank
  const currentUserRankIndex = leaderboard.findIndex(s => s.id === currentUserId);
  const currentUserRank = currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : null;
  const currentUserEntry = currentUserRankIndex !== -1 ? leaderboard[currentUserRankIndex] : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 130, damping: 15 }
    }
  };

  // Top 3 Podium Winners (from filtered list)
  const podiumStudents = filteredList.slice(0, 3);
  const regularStudents = filteredList.slice(3);

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8 pb-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" variants={itemVariants}>
          <div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Dashboard
            </Link>
            <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Ranking de <span className="text-accent">Estudiantes</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conocé a los alumnos que más aportan resúmenes, foros y tutorías en UNLaR. ¡Colaborá y subí vos también!
            </p>
          </div>

          <Link
            href="/karma"
            className="self-start sm:self-center px-4 py-2 text-xs font-bold border border-border hover:border-accent bg-card/30 hover:bg-card/65 rounded-xl transition-all duration-300 flex items-center gap-1.5 focus:outline-none active:scale-95"
          >
            <Award className="w-4 h-4 text-accent animate-pulse-slow" />
            <span>Ver mis Puntos y Medallas</span>
          </Link>
        </motion.div>

        {/* Current User Standing Quick Info widget */}
        {currentUserEntry && currentUserRank && (
          <motion.div 
            className="bg-special-gradient rounded-3xl p-5 border flex flex-col sm:flex-row justify-between items-center gap-4 hover-glow-subtle duration-300"
            variants={itemVariants}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shadow-lg shadow-accent/5 shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">¡Tu posición en el Ranking de la UNLaR!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estás en el puesto <strong className="text-accent">#{currentUserRank}</strong> con <strong className="text-foreground">{currentUserEntry.points.toLocaleString()} puntos de Karma</strong>.
                </p>
              </div>
            </div>
            
            <Link
              href="/karma"
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              Sumar Puntos de Karma
            </Link>
          </motion.div>
        )}

        {/* Search & Tabs Filter Section */}
        <motion.div 
          className="bg-glass rounded-3xl p-6 space-y-4 hover-glow-subtle duration-300" 
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search query input */}
            <div className="relative w-full max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar estudiantes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/40 hover:bg-card/60 focus:bg-card/70 border border-border/40 focus:border-accent rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder-muted-foreground/60"
              />
            </div>

            {/* Career tabs filter */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/20 max-w-max self-start md:self-auto">
              {["Global", "Sistemas", "Computación", "Informática"].map((tabLabel, idx) => (
                <button
                  key={tabLabel}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all focus:outline-none cursor-pointer ${
                    activeTab === idx 
                      ? 'bg-accent text-accent-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state filter fallback */}
          {filteredList.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No se encontraron estudiantes</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No hay resultados para tu búsqueda o carrera seleccionada en esta sección del ranking.
              </p>
            </div>
          )}

          {/* Top 3 Podium Winners Grid */}
          {filteredList.length > 0 && podiumStudents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-border/10">
              {podiumStudents.map((student, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;
                
                const rankText = isFirst ? "1er Puesto" : isSecond ? "2do Puesto" : "3er Puesto";
                const rankIcon = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";

                const podiumGlow = isFirst 
                  ? 'border-accent shadow-[0_0_15px_rgba(245,158,11,0.06)]' 
                  : isSecond 
                    ? 'border-neutral-400 shadow-sm' 
                    : 'border-amber-700 shadow-sm';

                const avatarName = `${student.name.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

                const isMe = student.id === currentUserId;

                return (
                  <div
                    key={student.id}
                    className={`bg-card/45 rounded-3xl p-5 border flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 ${podiumGlow} ${
                      isMe ? 'ring-2 ring-accent' : ''
                    }`}
                  >
                    {/* Top 1 Badge Glow Layer */}
                    {isFirst && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 blur-2xl rounded-full pointer-events-none" />
                    )}

                    <span className="absolute top-4 right-4 text-xl select-none">{rankIcon}</span>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider mb-4 ${
                      isFirst 
                        ? 'bg-accent/15 border-accent/20 text-accent' 
                        : 'bg-muted/50 border-border/30 text-muted-foreground'
                    }`}>
                      {rankText}
                    </span>

                    {/* Initials Avatar Box */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black border mb-3 shrink-0 ${
                      isMe 
                        ? 'bg-accent/15 border-accent text-accent' 
                        : 'bg-muted/50 border-border text-muted-foreground'
                    }`}>
                      {student.avatarUrl ? (
                        <Image 
                          src={student.avatarUrl} 
                          alt="Foto de perfil del alumno en podio" 
                          className="w-full h-full object-cover rounded-2xl"
                          width={56}
                          height={56}
                        />
                      ) : (
                        <span>{avatarName}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-foreground truncate max-w-[140px]">
                        {student.name} {student.lastName}
                        {isMe && <span className="text-accent ml-1 font-bold">(Vos)</span>}
                      </h4>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                        {student.careerName}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-border/10 mt-4 w-full flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground">Medallas: <strong>{student.badgesCount}</strong></span>
                      <span className="text-accent font-extrabold">{student.points.toLocaleString()} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Regular Students Leaderboard Table */}
          {filteredList.length > 3 && (
            <div className="pt-6 border-t border-border/10 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Leaderboard General</h3>
              <div className="space-y-2">
                {regularStudents.map((student, idx) => {
                  const rank = idx + 4;
                  const isMe = student.id === currentUserId;
                  const avatarName = `${student.name.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

                  return (
                    <div
                      key={student.id}
                      className={`p-3 bg-card/25 border rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-card/40 ${
                        isMe 
                          ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/15' 
                          : 'border-border/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Position circle */}
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isMe ? 'bg-accent/20 text-accent' : 'bg-muted/40 text-muted-foreground'
                        }`}>
                          #{rank}
                        </span>

                        {/* Initials Avatar Box */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${
                          isMe ? 'bg-accent/15 border-accent text-accent' : 'bg-muted/60 border-border text-muted-foreground'
                        }`}>
                          {student.avatarUrl ? (
                            <Image 
                              src={student.avatarUrl} 
                              alt="Foto de perfil de la tabla" 
                              className="w-full h-full object-cover rounded-lg"
                              width={32}
                              height={32}
                            />
                          ) : (
                            <span>{avatarName}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate max-w-[160px] sm:max-w-xs">
                            {student.name} {student.lastName}
                            {isMe && <span className="text-accent ml-1 font-bold">(Vos)</span>}
                          </h4>
                          <span className="text-[9px] text-muted-foreground truncate block max-w-[180px] sm:max-w-sm mt-0.5">
                            {student.careerName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div className="hidden sm:block">
                          <span className="text-[10px] text-muted-foreground block leading-none">Medallas</span>
                          <span className="text-xs font-bold text-foreground">{student.badgesCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block leading-none">Karma</span>
                          <span className="text-xs font-extrabold text-accent">{student.points.toLocaleString()} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
