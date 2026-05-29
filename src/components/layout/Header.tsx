"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, Bell, Award, User, LogOut, Settings, Calendar, Trophy, Sparkles, Check, Trash2, X, ArrowLeft, SlidersHorizontal } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import Logo from "../ui/Logo";
import { fetchCombinedHeaderData } from "@/actions/perfil";
import type { CombinedHeaderData, UserProfileExtended } from "@/actions/perfil";
import { signOutAction } from "@/actions/auth";
import { fetchNotificationsAction, markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/actions/notifications";
import { DbNotification } from "@/types/database";

type HeaderProps = {
  onMenuToggle: () => void;
  initialData?: CombinedHeaderData;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  activeScope?: "foro" | "apuntes" | "materias" | "todos";
  onScopeChange?: (scope: "foro" | "apuntes" | "materias" | "todos") => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
};

export default function Header({
  onMenuToggle,
  initialData,
  searchQuery,
  onSearchChange,
  activeScope,
  onScopeChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  searchPlaceholder,
  showSearch = true,
}: HeaderProps) {
  const [profile, setProfile] = useState<UserProfileExtended | null>(initialData?.profile ?? null);
  const [notifications, setNotifications] = useState<DbNotification[]>(initialData?.notifications ?? []);
  
  // Dropdowns active state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Global search center state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Ref hooks for click outside listeners
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Load user profile & notifications on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadData(attempt = 1) {
      if (initialData) return;

      try {
        const { profile, notifications } = await fetchCombinedHeaderData();
        if (!isCancelled) {
          setProfile(profile);
          setNotifications(notifications);
        }
      } catch (err) {
        console.error("Error loading header metrics:", err);
        if (!isCancelled && attempt < 3) {
          window.setTimeout(() => loadData(attempt + 1), attempt * 350);
        }
      }
    }
    loadData();

    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchNotificationsAction();
        if (!isCancelled) {
          setNotifications(fresh);
        }
      } catch (err) {
        console.error(err);
      }
    }, 30000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [initialData]);

  // Listen for clicks outside dropdown menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput = document.activeElement && (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.getAttribute("contenteditable") === "true"
      );

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await signOutAction();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await markNotificationAsReadAction(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    // Optimistic UI update
    setNotifications([]);
    try {
      await markAllNotificationsAsReadAction();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header suppressHydrationWarning className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 md:px-20 lg:px-28 h-16 bg-background/50 backdrop-blur-xl border-b border-border/40 shadow-sm transition-colors duration-300">
      {/* Left: Brand Logo (desktop) & Mobile toggle */}
      <div suppressHydrationWarning className="flex items-center gap-6 shrink-0">
        {/* Desktop Brand Logo */}
        <Link suppressHydrationWarning href="/dashboard" className="hidden md:flex items-center gap-3 shrink-0 group">
          <Logo className="w-8 h-8 transition-transform duration-300 group-hover:scale-105" />
          <div suppressHydrationWarning className="flex flex-col text-left">
            <span className="font-heading font-black text-sm tracking-tight leading-none text-foreground">
              UNLaR<span className="text-accent font-bold">-Connect</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold leading-none mt-0.5">
              {profile?.careerName || "Ing. en Sistemas"}
            </span>
          </div>
        </Link>

        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 md:hidden transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center Search Bar */}
      {showSearch && (
        <div ref={searchContainerRef} className="absolute left-1/2 -translate-x-1/2 max-w-[460px] w-full hidden md:block z-50">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder || "Buscá apuntes, materias o dudas..."}
              value={searchQuery ?? ""}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full bg-card/30 hover:bg-card/50 focus:bg-card/70 border border-border/40 focus:border-accent rounded-full py-2 pl-10 pr-20 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder-muted-foreground/60 shadow-inner"
            />
            {/* Action buttons inside search bar: Clear & Keyboard indicator */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && onSearchChange && (
                <button
                  onClick={() => onSearchChange("")}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-block text-[10px] font-bold text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded border border-border/20 shadow-sm font-mono select-none pointer-events-none">
                /
              </span>
            </div>
          </div>

          {/* Bento Filters Panel (Popover) */}
          {isSearchFocused && (
            <div className="absolute left-0 right-0 mt-2 bg-card/90 backdrop-blur-2xl border border-border/30 rounded-2xl shadow-2xl p-4 space-y-4 animate-fade-in z-50">
              {/* Scope Row */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Filtrar en:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "foro", label: "Foro" },
                    { key: "apuntes", label: "Apuntes y Recursos" },
                    { key: "materias", label: "Materias" },
                  ].map((scope) => {
                    const isActive = activeScope === scope.key;
                    return (
                      <button
                        key={scope.key}
                        onClick={() => onScopeChange?.(scope.key as any)}
                        disabled={!onScopeChange}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                          isActive
                            ? "bg-accent/15 border-accent text-accent font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            : "bg-muted/20 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {scope.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Context Parameters (Accordion-like slide down) */}
              {activeScope === "foro" && (
                <div className="pt-3 border-t border-border/10 space-y-3.5 animate-fade-in">
                  {/* Category Filter */}
                  {onCategoryChange && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Categoría del Hilo:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "Todas", label: "Todas" },
                          { value: "question", label: "Preguntas" },
                          { value: "resource", label: "Recursos" },
                          { value: "tutoring", label: "Tutorías" },
                          { value: "borrow", label: "Préstamos" },
                          { value: "sell_rent", label: "Compra/Alquiler" },
                        ].map((cat) => {
                          const isActive = selectedCategory === cat.value;
                          return (
                            <button
                              key={cat.value}
                              onClick={() => onCategoryChange(cat.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                isActive
                                  ? "bg-accent/20 border-accent text-accent font-bold"
                                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/25"
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status Filter */}
                  {onStatusChange && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Estado de Publicación:
                      </span>
                      <div className="flex gap-1.5">
                        {[
                          { value: "all", label: "Todas" },
                          { value: "resolved", label: "Solucionadas" },
                          { value: "open", label: "Abiertas (Sin resolver)" },
                        ].map((stat) => {
                          const isActive = selectedStatus === stat.value;
                          return (
                            <button
                              key={stat.value}
                              onClick={() => onStatusChange(stat.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                isActive
                                  ? "bg-accent/20 border-accent text-accent font-bold"
                                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/25"
                              }`}
                            >
                              {stat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeScope === "apuntes" && (
                <div className="pt-3 border-t border-border/10 space-y-3 animate-fade-in">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Tipo de Apunte:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Todos", "Resúmenes", "Exámenes", "Trabajos Prácticos"].map((t) => (
                        <button
                          key={t}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/40 bg-card text-muted-foreground/60 cursor-not-allowed"
                          disabled
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Año de Carrera:
                    </span>
                    <div className="flex gap-1.5">
                      {["1° Año", "2° Año", "3° Año", "4° Año", "5° Año"].map((yr) => (
                        <button
                          key={yr}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/40 bg-card text-muted-foreground/60 cursor-not-allowed"
                          disabled
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex justify-between items-center border-t border-border/15 pt-3.5 text-xs">
                {(searchQuery || selectedCategory !== "Todas" || (selectedStatus && selectedStatus !== "all")) ? (
                  <button
                    onClick={() => {
                      if (onSearchChange) onSearchChange("");
                      if (onCategoryChange) onCategoryChange("Todas");
                      if (onStatusChange) onStatusChange("all");
                    }}
                    className="text-accent hover:text-accent/80 font-bold transition-colors"
                  >
                    Limpiar filtros
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Atajo: Presioná <kbd className="bg-muted px-1 py-0.5 rounded font-mono font-bold">/</kbd> para buscar
                  </span>
                )}
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="px-3 py-1 bg-muted hover:bg-muted/70 text-foreground font-semibold rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right: Actions (Points, notifications, profile, theme) */}
      <div suppressHydrationWarning className="flex items-center gap-4 z-20">
        {/* Mobile Search Button (shows only when screen is small) */}
        {showSearch && (
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 md:hidden transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Karma Points Badge */}
        <Link href="/karma" className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full hover:scale-[1.03] transition-transform duration-200 cursor-pointer select-none">
          <Award className="w-4 h-4 text-accent animate-pulse-slow" />
          <span className="text-xs font-bold text-accent tracking-wide">
            {profile ? profile.points.toLocaleString() : "..."} pts
          </span>
        </Link>


        {/* Notifications Icon dropdown center */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
              isNotificationsOpen ? "bg-muted/35 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            )}
          </button>

          {/* Notifications List floating modal */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-border/10 pb-2">
                <span className="text-xs font-bold text-cream-bone flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-accent" />
                  Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-accent hover:text-accent/80 font-bold transition-colors"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground select-none">
                    No tenés notificaciones pendientes. 👍
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border transition-all duration-200 flex gap-2.5 relative group ${
                        notif.is_read 
                          ? "bg-card/20 border-border/10 opacity-70" 
                          : "bg-accent/5 border-accent/15 hover:border-accent/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        notif.type === 'tutorias' 
                          ? 'bg-secondary/15 text-secondary' 
                          : notif.type === 'karma' 
                            ? 'bg-accent/15 text-accent' 
                            : 'bg-primary-container/15 text-foreground'
                      }`}>
                        {notif.type === 'tutorias' && <Calendar className="w-4 h-4" />}
                        {notif.type === 'karma' && <Trophy className="w-4 h-4" />}
                        {notif.type === 'sistema' && <Sparkles className="w-4 h-4" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 select-none">
                        <p className="text-xs font-bold text-cream-bone leading-tight mb-0.5 truncate">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">{notif.content}</p>
                      </div>

                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 rounded-md bg-card/60 hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
                          title="Marcar como leída"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggler */}
        <ThemeToggle />

        {/* User Profile Avatar dropdown center */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className={`w-9 h-9 rounded-xl overflow-hidden border transition-colors shrink-0 flex items-center justify-center ${
              isProfileOpen ? "border-accent shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "border-border hover:border-accent"
            }`}
          >
            {profile?.avatar_url ? (
              <Image
                alt="Foto de perfil del alumno"
                className="w-full h-full object-cover"
                src={profile.avatar_url}
                width={36}
                height={36}
              />
            ) : (
              <div className="w-full h-full rounded-xl flex items-center justify-center text-sm font-bold bg-accent/20 border border-accent/30 text-accent select-none">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </button>

          {/* Profile options card */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl p-2.5 space-y-1.5 z-50 animate-fade-in-up">
              {/* User details header */}
              {profile && (
                <div className="px-3.5 py-2.5 border-b border-border/10 mb-1 select-none">
                  <span className="text-xs font-black text-accent block truncate">{profile.name} {profile.last_name}</span>
                  <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{profile.email}</span>
                </div>
              )}

              {/* Options buttons */}
              <Link
                href="/dashboard/perfil"
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Mi Perfil</span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  window.location.href = "/dashboard/perfil";
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Configuración</span>
              </button>
              
              <div className="h-[1px] bg-border/15 my-1" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#ffb4ab] hover:bg-destructive/15 hover:text-destructive rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && showSearch && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in md:hidden">
          {/* Top Search Input Bar */}
          <div className="h-16 px-4 border-b border-border/40 flex items-center gap-3 bg-card/60 backdrop-blur-xl">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                <Search className="w-4 h-4" />
              </span>
              <input
                ref={mobileSearchInputRef}
                type="text"
                autoFocus
                placeholder={searchPlaceholder || "Buscá apuntes, materias..."}
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-card/30 border border-border/40 focus:border-accent rounded-full py-2.5 pl-10 pr-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder-muted-foreground/60"
              />
              {searchQuery && onSearchChange && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Filters Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-background">
            {/* Scope Row */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Filtrar en:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "foro", label: "Foro" },
                  { key: "apuntes", label: "Apuntes y Recursos" },
                  { key: "materias", label: "Materias" },
                ].map((scope) => {
                  const isActive = activeScope === scope.key;
                  return (
                    <button
                      key={scope.key}
                      onClick={() => onScopeChange?.(scope.key as any)}
                      disabled={!onScopeChange}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                        isActive
                          ? "bg-accent/15 border-accent text-accent font-bold"
                          : "bg-muted/20 border-transparent text-muted-foreground"
                      }`}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scope Specific sub-filters */}
            {activeScope === "foro" && (
              <div className="space-y-5 pt-4 border-t border-border/10">
                {onCategoryChange && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Categoría del Hilo:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "Todas", label: "Todas" },
                        { value: "question", label: "Preguntas" },
                        { value: "resource", label: "Recursos" },
                        { value: "tutoring", label: "Tutorías" },
                        { value: "borrow", label: "Préstamos" },
                        { value: "sell_rent", label: "Compra / Alquiler" },
                      ].map((cat) => {
                        const isActive = selectedCategory === cat.value;
                        return (
                          <button
                            key={cat.value}
                            onClick={() => onCategoryChange(cat.value)}
                            className={`py-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                              isActive
                                ? "bg-accent/20 border-accent text-accent font-bold"
                                : "bg-card border-border/40 text-muted-foreground"
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {onStatusChange && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Estado de Publicación:
                    </span>
                    <div className="flex flex-col gap-2">
                      {[
                        { value: "all", label: "Todas" },
                        { value: "resolved", label: "Solucionadas" },
                        { value: "open", label: "Abiertas (Sin resolver)" },
                      ].map((stat) => {
                        const isActive = selectedStatus === stat.value;
                        return (
                          <button
                            key={stat.value}
                            onClick={() => onStatusChange(stat.value)}
                            className={`py-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                              isActive
                                ? "bg-accent/20 border-accent text-accent font-bold"
                                : "bg-card border-border/40 text-muted-foreground"
                            }`}
                          >
                            {stat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeScope === "apuntes" && (
              <div className="space-y-5 pt-4 border-t border-border/10">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Tipo de Apunte:
                  </span>
                  <div className="grid grid-cols-2 gap-2 opacity-50">
                    {["Todos", "Resúmenes", "Exámenes", "Trabajos Prácticos"].map((t) => (
                      <button
                        key={t}
                        className="py-3 rounded-xl text-xs font-semibold border border-border/40 bg-card text-muted-foreground cursor-not-allowed"
                        disabled
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Apply Actions Bar */}
          <div className="p-4 border-t border-border/40 bg-card/60 backdrop-blur-xl flex gap-3">
            {(searchQuery || selectedCategory !== "Todas" || (selectedStatus && selectedStatus !== "all")) && (
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange("");
                  if (onCategoryChange) onCategoryChange("Todas");
                  if (onStatusChange) onStatusChange("all");
                }}
                className="flex-1 py-3 rounded-xl border border-border bg-transparent text-foreground hover:bg-muted/10 font-bold text-xs transition-all text-center"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="flex-1 py-3 bg-accent text-accent-foreground rounded-xl font-bold text-xs hover:scale-[1.02] transition-all text-center shadow-lg shadow-accent/10"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </header>
  );
}
