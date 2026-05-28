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
  BookOpen,
  Clock,
  Sparkles,
  Lock,
  FileText,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import Logo from "@/components/ui/Logo";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: false },
  { label: "Banco de Apuntes", icon: FolderOpen, active: false },
  { label: "Asistente IA", icon: Bot, active: true },
  { label: "Foros Estudiantiles", icon: MessageSquare, active: false },
  { label: "Mi Perfil", icon: User, active: false },
];

export default function ChatbotMock() {
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
        className="absolute left-0 top-0 h-full w-44 z-20 flex flex-col border-r border-border/10 transition-colors duration-300"
        style={{
          background: isDark ? "rgba(21, 19, 18, 0.9)" : "rgba(245, 243, 239, 0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Brand */}
        <div className="px-3 py-4 border-b border-border/10">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <div>
              <p className="font-heading font-black text-[10px] text-foreground leading-none">
                UNLaR<span className="text-accent">-Connect</span>
              </p>
              <p className="text-[8px] text-muted-foreground mt-0.5">Ing. en Sistemas</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <ul className="flex flex-col gap-1 px-1 py-3 flex-grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <div
                  className={`px-2 py-2 flex items-center gap-2 rounded-lg text-[10px] font-medium ${
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
      </aside>

      {/* CHAT SESSIONS COLUMN */}
      <aside
        className="absolute left-44 top-0 h-full w-44 z-10 flex flex-col border-r border-border/10 transition-colors duration-300"
        style={{
          background: isDark ? "rgba(16, 14, 13, 0.8)" : "rgba(249, 247, 243, 0.8)",
        }}
      >
        <div className="p-3 border-b border-border/10">
          <h3 className="text-[10px] font-bold text-foreground">Historial de Chats</h3>
          <div className="w-full mt-2 py-1.5 bg-accent text-accent-foreground font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer">
            <Plus className="w-2.5 h-2.5" />
            <span>Nueva Conversación</span>
          </div>
        </div>
        <div className="p-2 space-y-1.5 overflow-y-auto flex-grow text-[9px] select-none">
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-2 relative overflow-hidden">
            <div className="absolute left-0 top-0 w-0.5 h-full bg-accent"></div>
            <p className="font-semibold text-foreground truncate">Resumen de SO II</p>
            <span className="text-muted-foreground text-[8px]">Hace 2 horas</span>
          </div>
          <div className="hover:bg-muted/10 rounded-lg p-2">
            <p className="font-semibold text-foreground truncate">Dudas de Álgebra</p>
            <span className="text-muted-foreground text-[8px]">Ayer</span>
          </div>
          <div className="hover:bg-muted/10 rounded-lg p-2">
            <p className="font-semibold text-foreground truncate">Práctica TP4 Grafos</p>
            <span className="text-muted-foreground text-[8px]">Hace 3 días</span>
          </div>
        </div>
      </aside>

      {/* HEADER */}
      <header
        className="absolute top-0 right-0 left-[22rem] h-12 z-20 flex items-center justify-between px-4 border-b border-border/10 transition-colors duration-300"
        style={{
          background: isDark ? "rgba(12, 10, 9, 0.7)" : "rgba(251, 249, 245, 0.7)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-bold text-accent">2.450 pts</span>
        </div>
        {/* Próximamente Badge */}
        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.05)]">
          <Sparkles className="w-2.5 h-2.5 text-accent animate-pulse" />
          <span className="text-[8px] font-extrabold text-accent uppercase tracking-wider">Próximamente</span>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="absolute inset-0 left-[22rem] top-12 overflow-y-auto p-4 select-none scrollbar-none flex flex-col justify-between">
        {/* Subject Header */}
        <div className="border-b border-border/10 pb-2 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-accent shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-foreground truncate max-w-[120px]">Sistemas Operativos II</p>
              <p className="text-[8px] text-muted-foreground">2 Documentos en Contexto</p>
            </div>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 space-y-3 my-2 overflow-y-auto flex flex-col justify-start">
          {/* User Message */}
          <div className="flex justify-end w-full">
            <div className="bg-card/70 border border-border/30 text-foreground text-[10px] px-3 py-2 rounded-xl rounded-tr-sm max-w-[200px] leading-relaxed">
              Explicame la diferencia entre paginación y segmentación según la cátedra.
            </div>
          </div>

          {/* AI Response */}
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-accent" />
            </div>
            <div className="flex-1 bg-accent/5 border-l-2 border-accent text-[9px] px-3 py-2 rounded-xl rounded-tl-sm leading-relaxed max-w-[220px]">
              <p className="font-semibold text-foreground mb-1">Según la cátedra en los apuntes oficiales:</p>
              <ul className="list-disc pl-3.5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Paginación:</strong> Divide memoria física en marcos de tamaño fijo y memoria lógica en páginas. Es transparente al programador.</li>
                <li><strong className="text-foreground">Segmentación:</strong> Divide en bloques de tamaño variable que son unidades lógicas (pila, datos). Es visible al programador.</li>
              </ul>
              {/* PDF Citation Badge */}
              <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-card border border-border/40 rounded text-[7px] text-muted-foreground font-mono">
                <FileText className="w-2.5 h-2.5 text-accent" />
                <span>Apunte_U3_Memoria.pdf</span>
                <span className="text-accent font-bold">Pág. 14</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar mock */}
        <div className="pt-2 border-t border-border/10 flex items-center gap-1.5">
          <div className="flex-grow bg-card/45 border border-border/30 rounded-lg px-2.5 py-1.5 text-[9px] text-muted-foreground flex items-center justify-between">
            <span>Preguntale a tus apuntes...</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
          </div>
        </div>
      </div>

      {/* Locked overlay style banner */}
      <div className="absolute inset-0 z-30 bg-background/5 border border-amber-500/10 pointer-events-none rounded-2xl flex items-center justify-center">
        {/* Subtly darkened bottom banner for CTA feeling */}
      </div>
    </div>
  );
}
