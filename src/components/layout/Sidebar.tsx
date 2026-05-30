"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Bot, 
  MessageSquare, 
  User, 
  Plus, 
  X,
  Award,
  Trophy,
  Video,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

// Helper to map sidebar labels to high-end organic animations when active or parent item is hovered
const getIconAnimationClass = (label: string, isActive: boolean) => {
  const animations: Record<string, string> = {
    "Dashboard": "group-hover:animate-sidebar-dashboard" + (isActive ? " animate-sidebar-dashboard" : ""),
    "Banco de Apuntes": "group-hover:animate-sidebar-apuntes" + (isActive ? " animate-sidebar-apuntes" : ""),
    "Asistente IA": "group-hover:animate-sidebar-ai" + (isActive ? " animate-sidebar-ai" : ""),
    "Tutorías": "group-hover:animate-sidebar-apuntes" + (isActive ? " animate-sidebar-apuntes" : ""),
    "Foros Estudiantiles": "group-hover:animate-sidebar-foros" + (isActive ? " animate-sidebar-foros" : ""),
    "Reputación": "group-hover:animate-sidebar-karma" + (isActive ? " animate-sidebar-karma" : ""),
    "Ranking Académico": "group-hover:animate-sidebar-ranking" + (isActive ? " animate-sidebar-ranking" : ""),
    "Eventos": "group-hover:animate-sidebar-events" + (isActive ? " animate-sidebar-events" : ""),
    "Mi Perfil": "group-hover:animate-sidebar-perfil" + (isActive ? " animate-sidebar-perfil" : ""),
  };
  return animations[label] || "";
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      label: "Banco de Apuntes",
      icon: FolderOpen,
      href: "/recursos",
    },
    {
      label: "Asistente IA",
      icon: Bot,
      href: "/chat",
      isAi: true,
    },
    {
      label: "Tutorías",
      icon: Video,
      href: "/tutorias",
      isLive: true,
    },
    {
      label: "Foros Estudiantiles",
      icon: MessageSquare,
      href: "/foro",
    },
    {
      label: "Reputación",
      icon: Award,
      href: "/karma",
    },
    {
      label: "Ranking Académico",
      icon: Trophy,
      href: "/ranking",
    },
    {
      label: "Eventos",
      icon: Calendar,
      href: "/eventos",
    },
    {
      label: "Mi Perfil",
      icon: User,
      href: "/perfil",
    },
  ];

  // ==========================================
  // 💻 DESKTOP SIDEBAR CONTENT
  // Collapsed by default (icons only), expands on hover insidepx-64 bounds.
  // ==========================================
  const desktopSidebarContent = (
    <div className="flex flex-col h-full py-6 px-3.5 justify-between select-none">
      {/* Navigation Links */}
      <ul className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "group px-4 py-3 flex items-center justify-start rounded-xl text-sm font-medium transition-all duration-200 w-full overflow-hidden",
                  isActive
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 dark:hover:bg-muted/10"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 shrink-0 transition-all duration-300 ease-in-out group-hover/sidebar:mr-4 mr-0",
                    isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground",
                    item.isAi && "text-gradient-ai",
                    getIconAnimationClass(item.label, isActive)
                  )} 
                />
                <span className={cn(
                  "opacity-0 group-hover/sidebar:opacity-100 inline-block max-w-0 group-hover/sidebar:max-w-40 transition-all duration-300 ease-in-out overflow-hidden truncate",
                  item.isAi && "text-gradient-ai font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Upload Apunte Call to Action */}
      <div className="pt-4 border-t border-border/40 mt-auto">
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-upload-apunte-modal"));
          }}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 pl-[18px] pr-3 rounded-xl transition-colors duration-200 flex justify-start items-center shadow-lg shadow-accent/10 overflow-hidden focus:outline-none"
        >
          <Plus className="w-4 h-4 shrink-0 transition-all duration-300 ease-in-out group-hover/sidebar:mr-2 mr-0" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 inline-block max-w-0 group-hover/sidebar:max-w-40 transition-all duration-300 ease-in-out overflow-hidden truncate">
            Subí tu Apunte
          </span>
        </button>
      </div>
    </div>
  );

  // ==========================================
  // 📱 MOBILE DRAWER CONTENT
  // Traditional full menu drawer with closing bounds.
  // ==========================================
  const mobileSidebarContent = (
    <div className="flex flex-col h-full bg-background/60 backdrop-blur-2xl border-r border-border/40 dark:border-white/5 p-6">
      {/* Brand Logo & Department */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40 mb-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo className="w-9 h-9" />
          <div className="text-left">
            <span className="font-heading font-black text-base tracking-tight block">
              UNLaR<span className="text-accent font-bold">-Connect</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium block -mt-1">
              Ing. en Sistemas
            </span>
          </div>
        </Link>
        {/* Close Button on Mobile */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1.5 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group px-4 py-3 flex items-center gap-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 dark:hover:bg-muted/10"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground",
                    item.isAi && "text-gradient-ai",
                    getIconAnimationClass(item.label, isActive)
                  )} 
                />
                <span className={cn(item.isAi && "text-gradient-ai font-semibold")}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Upload Apunte Call to Action */}
      <div className="pt-4 border-t border-border/40 mt-auto">
        <button 
          onClick={() => {
            if (onClose) onClose();
            window.dispatchEvent(new CustomEvent("open-upload-apunte-modal"));
          }}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex justify-center items-center gap-2 shadow-lg shadow-accent/10"
        >
          <Plus className="w-4 h-4" />
          <span>Subí tu Apunte</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Under Header top-16 h-calc, collapsed to 80px, hover to 256px) */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-30 hidden md:block transition-all duration-300 ease-in-out w-20 hover:w-64 group/sidebar bg-background/60 backdrop-blur-2xl border-r border-border/40 dark:border-white/5 overflow-hidden shadow-sm">
        {desktopSidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay backdrop) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        >
          <aside 
            className="fixed left-0 top-0 h-full w-64 z-50 shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileSidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
