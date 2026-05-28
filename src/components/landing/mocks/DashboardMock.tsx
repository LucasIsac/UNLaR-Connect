"use client";

import {
  LayoutDashboard,
  FolderOpen,
  Bot,
  MessageSquare,
  User,
  Plus,
  Search,
  Bell,
  Trophy,
  Zap,
  Users,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import Logo from "@/components/ui/Logo";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Banco de Apuntes", icon: FolderOpen, active: false },
  { label: "Asistente IA", icon: Bot, active: false },
  { label: "Foros Estudiantiles", icon: MessageSquare, active: false },
  { label: "Mi Perfil", icon: User, active: false },
];

export default function DashboardMock() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden border border-border/20 transition-colors duration-300"
      style={{
        background: isDark ? "rgba(12, 10, 9, 0.95)" : "rgba(251, 249, 245, 0.95)",
      }}
    >
      {/* Dot grid background inside mock */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)"
            : "radial-gradient(rgba(120,53,15,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* SIDEBAR */}
      <aside
        className="absolute left-0 top-0 h-full w-56 z-20 flex flex-col border-r border-border/10 transition-colors duration-300"
        style={{
          background: isDark ? "rgba(21, 19, 18, 0.9)" : "rgba(245, 243, 239, 0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border/10">
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7" />
            <div>
              <p className="font-heading font-black text-xs text-foreground leading-none">
                UNLaR<span className="text-accent">-Connect</span>
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Ing. en Sistemas</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <ul className="flex flex-col gap-1 px-2 py-4 flex-grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <div
                  className={`px-3 py-2.5 flex items-center gap-2.5 rounded-lg text-xs font-medium ${
                    item.active
                      ? "bg-accent/10 text-accent border-r-2 border-accent"
                      : "text-muted-foreground hover:bg-muted/10 transition-colors duration-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Upload CTA */}
        <div className="p-3 border-t border-border/10">
          <div className="w-full bg-accent text-accent-foreground font-bold text-[10px] py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-accent/5">
            <Plus className="w-3 h-3" />
            <span>Subí tu Apunte</span>
          </div>
        </div>
      </aside>

      {/* HEADER */}
      <header
        className="absolute top-0 right-0 left-56 h-12 z-20 flex items-center justify-between px-6 border-b border-border/10 transition-colors duration-300"
        style={{
          background: isDark ? "rgba(12, 10, 9, 0.7)" : "rgba(251, 249, 245, 0.7)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 bg-card/40 border border-border/30 rounded-full px-3 py-1.5 w-64">
          <Search className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground/60">Buscá apuntes, materias...</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
            <Trophy className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-bold text-accent">2.450 pts</span>
          </div>
          <div className="relative">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </div>
          <div className="w-6 h-6 rounded-lg bg-muted border border-border overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG7kZthARJWoPUqDDIShLuxuJGHxPM6eh_dFZ6vUCJpDcMLAVUhwXYCRHRWp4g2EG0IU2Rsbhy6R-fMP4njxS_VptnFuC38SCPJY9SODYThVAvnjbCK1XZUX7gGvY80048nOa5c8BLd-8sEqOcZI_3g6HnpGk6fONgBN98bB6t-7auFl5Er-3QmIJY8I86xD7vDken6cwXb1WU2S_MjlMOmKiKLHNUwHo5JTyGIRJfxWF3gwjqpONgQHZ_ti-F5V9qgMFGH0mCDQ"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="absolute inset-0 left-56 top-12 overflow-hidden p-5">
        {/* Welcome */}
        <div className="mb-4">
          <h2 className="font-heading text-lg font-black text-foreground">
            ¡Qué bueno verte de nuevo, <span className="text-accent">Alejandro</span>!
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tenés <span className="text-accent font-semibold">3 debates nuevos</span> en Programación II.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Karma Card */}
          <div
            className="col-span-5 rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(226,119,95,0.05) 100%)"
                : "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(226,119,95,0.03) 100%)",
              border: "1px solid rgba(245,158,11,0.12)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-foreground">Tu Nivel de Karma</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-heading text-3xl font-extrabold text-accent">Nvl. 12</span>
              <span className="text-[10px] text-muted-foreground">2.450 / 3.000 XP</span>
            </div>
            <div className="w-full bg-muted/60 dark:bg-white/5 rounded-full h-2 overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-accent animate-pulse-slow"
                style={{ width: "81%", boxShadow: "0 0 8px rgba(245,158,11,0.4)" }}
              />
            </div>
            <div className="flex gap-2">
              {[
                { icon: MessageSquare, color: "text-secondary" },
                { icon: Zap, color: "text-accent" },
                { icon: Users, color: "text-primary" },
              ].map(({ icon: Icon, color }, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg bg-card/60 border border-border/40 flex items-center justify-center"
                >
                  <Icon className={`w-3 h-3 ${color}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Subjects */}
          <div
            className="col-span-7 rounded-2xl p-5 transition-all duration-300"
            style={{
              background: isDark ? "rgba(28,25,23,0.6)" : "rgba(255,255,255,0.65)",
              border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(120,53,15,0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-foreground">Materias Sugeridas</span>
              <span className="text-[10px] text-accent font-semibold cursor-pointer">Ver todas</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Análisis Mat. II", tag: "2do Año", tagColor: "text-secondary bg-secondary/10" },
                { name: "Programación II", tag: "2do Año", tagColor: "text-accent bg-accent/10" },
              ].map((subj) => (
                <div
                  key={subj.name}
                  className="bg-card/30 border border-border/20 rounded-xl p-3 hover:border-accent/30 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${subj.tagColor}`}>
                      {subj.tag}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-bold text-foreground">{subj.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div
            className="col-span-12 rounded-2xl p-5 transition-all duration-300"
            style={{
              background: isDark ? "rgba(28,25,23,0.6)" : "rgba(255,255,255,0.65)",
              border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(120,53,15,0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-xs font-bold text-foreground block mb-3">Actividad Reciente</span>
            <div className="flex gap-8">
              {[
                {
                  icon: FileText,
                  color: "text-accent bg-accent/10",
                  text: "Maria F. subió apuntes de Derivadas Parciales",
                  time: "Hace 2 horas",
                  subject: "Análisis Mat. II",
                },
                {
                  icon: MessageSquare,
                  color: "text-secondary bg-secondary/10",
                  text: "Nueva discusión en Estructuras de Datos",
                  time: "Hace 5 horas",
                  subject: "Programación II",
                },
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex items-start gap-3 flex-1">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-[11px] text-foreground font-medium leading-snug">{act.text}</p>
                      <div className="flex gap-1.5 items-center mt-1">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground/60" />
                        <span className="text-[9px] text-muted-foreground/60">{act.time}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                        <span className="text-[9px] text-muted-foreground/60">{act.subject}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
