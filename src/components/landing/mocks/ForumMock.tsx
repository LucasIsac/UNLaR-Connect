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
  ArrowUp,
  ArrowDown,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import Logo from "@/components/ui/Logo";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: false },
  { label: "Banco de Apuntes", icon: FolderOpen, active: false },
  { label: "Asistente IA", icon: Bot, active: false },
  { label: "Foros Estudiantiles", icon: MessageSquare, active: true },
  { label: "Mi Perfil", icon: User, active: false },
];

const categories = [
  { label: "Todas", active: true },
  { label: "Duda Técnica", active: false },
  { label: "Consejo de Cursada", active: false },
  { label: "Ayuda con TP", active: false },
];

export default function ForumMock() {
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
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG7kZthARJWoPUqDDIShLuxuJGHxPM6eh_dFZ6vUCJpDcMLAVUhwXYCRHRWp4g2EG0IU2Rsbhy6R-fMP4njxS_VptnFuC38SCPJY9SODYThVAvnjbCK1XZUX7gGvY80048nOa5c8BLd-8sEqOcZI_3g6HnpGk6fONgBN98bB6t-7auFl5Er-3QmIJY8I86xD7vDken6cwXb1WU2S_MjlMOmKiKLHNUwHo5JTyGIRJfxWF3gwjqpONgQHZ_ti-F5V9qgMFGH0mCDQ"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="absolute inset-0 left-56 top-12 overflow-y-auto p-5 select-none scrollbar-thin">
        {/* Forum Header info */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-heading text-base font-black text-foreground">Foro Estudiantil</h2>
            <p className="text-[10px] text-muted-foreground">Sacate las dudas con tus compañeros de cursada.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-2.5 py-1.5 rounded-lg text-[9px] flex items-center gap-1">
              <Plus className="w-3 h-3" />
              <span>Creá un hilo</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 border-b border-border/10 pb-2 mb-3">
          <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground font-semibold mr-1">Filtrar:</span>
          {categories.map((cat) => (
            <span
              key={cat.label}
              className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                cat.active
                  ? "bg-accent/20 border-accent text-accent font-bold"
                  : "bg-card border-border/30 text-muted-foreground"
              }`}
            >
              {cat.label}
            </span>
          ))}
        </div>

        {/* Threads list */}
        <div className="space-y-3">
          {/* Article 1 */}
          <div
            className="rounded-xl p-3.5 border transition-colors duration-200"
            style={{
              background: isDark ? "rgba(28,25,23,0.4)" : "rgba(255,255,255,0.45)",
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(120,53,15,0.06)",
            }}
          >
            <div className="flex gap-3">
              {/* Votes block */}
              <div className="flex flex-col items-center gap-0.5 bg-card/60 border border-border/20 rounded-lg px-1.5 py-1.5 h-max shrink-0">
                <ArrowUp className="w-3 h-3 text-accent" />
                <span className="text-[10px] font-bold font-mono text-accent">42</span>
                <ArrowDown className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Thread Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-teal-400/10 border border-teal-400/25 text-teal-400 uppercase">
                      Ayuda con TP
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">Programación II</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground">Hace 2 horas</span>
                </div>

                <h3 className="font-heading text-xs font-bold text-foreground mb-1 leading-tight">
                  ¿Cómo estructurar el TP de Pilas y Colas dinámicas?
                </h3>
                <p className="text-[10px] text-muted-foreground line-clamp-1 leading-relaxed mb-2">
                  Che, ¿alguien tiene a mano el diagrama de memoria para la inserción en una lista doblemente enlazada? No me queda claro cómo reconectar los punteros en C++...
                </p>

                {/* Footer block */}
                <div className="flex justify-between items-center border-t border-border/10 pt-2 text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] text-accent font-bold">
                      L
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Lucas I.</span>
                      <span className="text-muted-foreground text-[8px] ml-1.5">
                        5.120 pts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">14 respuestas</span>
                    <span className="flex items-center gap-0.5 text-green-400 font-bold text-[8px] bg-green-500/10 border border-green-500/20 px-1 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Solucionado</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Article 2 */}
          <div
            className="rounded-xl p-3.5 border transition-colors duration-200"
            style={{
              background: isDark ? "rgba(28,25,23,0.4)" : "rgba(255,255,255,0.45)",
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(120,53,15,0.06)",
            }}
          >
            <div className="flex gap-3">
              {/* Votes block */}
              <div className="flex flex-col items-center gap-0.5 bg-card/60 border border-border/20 rounded-lg px-1.5 py-1.5 h-max shrink-0">
                <ArrowUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-bold font-mono text-foreground">19</span>
                <ArrowDown className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Thread Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-red-400/10 border border-red-400/25 text-red-400 uppercase">
                      Duda Técnica
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">Análisis Mat. II</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground">Ayer</span>
                </div>

                <h3 className="font-heading text-xs font-bold text-foreground mb-1 leading-tight">
                  Duda con la regla de la cadena para varias variables
                </h3>
                <p className="text-[10px] text-muted-foreground line-clamp-1 leading-relaxed mb-2">
                  Buenas! Estoy trabado con el teorema de diferenciabilidad. Cuando calculo las parciales de f(g(x,y)), ¿tengo que evaluar en g o en f?
                </p>

                {/* Footer block */}
                <div className="flex justify-between items-center border-t border-border/10 pt-2 text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-[9px] text-secondary font-bold">
                      M
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Martin P.</span>
                      <span className="text-muted-foreground text-[8px] ml-1.5">
                        2.450 pts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">3 respuestas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
