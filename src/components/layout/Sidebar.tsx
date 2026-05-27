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
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
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
      href: "/dashboard/recursos",
    },
    {
      label: "Asistente IA",
      icon: Bot,
      href: "/dashboard/asistente",
      isAi: true,
    },
    {
      label: "Foros Estudiantiles",
      icon: MessageSquare,
      href: "/dashboard/foros",
    },
    {
      label: "Mi Perfil",
      icon: User,
      href: "/dashboard/perfil",
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/70 dark:bg-card/30 backdrop-blur-xl border-r border-border/40 p-6">
      {/* Brand Logo & Department */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40 mb-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-heading font-black text-primary-foreground text-sm shadow-md shadow-primary/10">
            UC
          </div>
          <div>
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
            className="md:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
                    ? "bg-accent/15 text-accent border-r-2 border-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 dark:hover:bg-muted/10"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground",
                    item.isAi && "text-gradient-ai"
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
        <button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex justify-center items-center gap-2 shadow-lg shadow-accent/10">
          <Plus className="w-4 h-4" />
          <span>Subí tu Apunte</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="fixed left-0 top-0 h-full w-64 z-30 hidden md:block">
        {sidebarContent}
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
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
