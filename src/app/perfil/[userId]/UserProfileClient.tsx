"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BookOpen,
  MessageSquare,
  Upload,
  Star,
  Trophy,
  Zap,
  GraduationCap,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { PublicProfile } from "@/actions/perfil";

type UserProfileClientProps = {
  profile: PublicProfile;
};

export default function UserProfileClient({ profile }: UserProfileClientProps) {
  const karmaLevel = profile.karmaLevel;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 120, damping: 14 },
    },
  };

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6 pb-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div className="flex flex-col gap-4 border-b border-border/10 pb-6" variants={itemVariants}>
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Ranking
          </Link>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          className="bg-glass rounded-3xl p-6 border border-border/10 hover-glow-subtle duration-300"
          variants={itemVariants}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-accent/15 border-2 border-accent/30 flex items-center justify-center text-accent font-black text-2xl shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
                {profile.name} {profile.last_name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {profile.career_name}
                </span>
                {profile.isTutor && (
                  <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                    <Star className="w-3 h-3 fill-accent" />
                    Tutor
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                <div className="text-center">
                  <span className="text-xl font-black text-accent block">{profile.points.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Puntos</span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-black text-foreground block">Nv. {karmaLevel}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Reputación</span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-black text-foreground block">{profile.badgesCount}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Medallas</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activity Summary */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={itemVariants}>
          <div className="bg-glass rounded-2xl p-5 border border-border/10 text-center">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <span className="text-2xl font-black text-foreground block">{profile.postsCount}</span>
            <span className="text-xs text-muted-foreground font-bold">Hilos creados</span>
          </div>

          <div className="bg-glass rounded-2xl p-5 border border-border/10 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-black text-foreground block">{profile.repliesCount}</span>
            <span className="text-xs text-muted-foreground font-bold">Respuestas</span>
          </div>

          <div className="bg-glass rounded-2xl p-5 border border-border/10 text-center">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-2xl font-black text-foreground block">{profile.resourcesCount}</span>
            <span className="text-xs text-muted-foreground font-bold">Recursos</span>
          </div>
        </motion.div>

        {/* XP Progress */}
        <motion.div className="bg-glass rounded-3xl p-6 border border-border/10" variants={itemVariants}>
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            Nivel de Reputación
          </h3>
          <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden border border-border/20">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${((profile.points % 250) / 250) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-muted-foreground">
            <span>Nivel {karmaLevel}</span>
            <span className="text-accent">{profile.points % 250} / 250 para Nivel {karmaLevel + 1}</span>
            <span>Nivel {karmaLevel + 1}</span>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
