"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import SmoothScroll from "@/components/ui/SmoothScroll";
import UniConnectHero from "@/components/landing/UniConnectHero";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/layout/Footer";
import { CONFIG } from "@/lib/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { DbUser } from "@/types/database";
import { User, Settings, LogOut, Menu, X } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { motion, AnimatePresence } from "framer-motion";

// Canvas loaded client-side only (no SSR needed for canvas)
const NodeCanvas = dynamic(() => import("@/components/landing/NodeCanvas"), {
  ssr: false,
});

// Unified scroll-driven feature showcase component — code-split
const ScreenShowcase = dynamic(
  () => import("@/components/landing/ScreenShowcase"),
  { ssr: false }
);

export default function Home() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()
          .then(({ data: dbUser }) => {
            if (dbUser) {
              setUser(dbUser as DbUser);
            }
          });
      }
    });
  }, []);

  // Listen for clicks outside profile dropdown menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  return (
    <SmoothScroll>
      {/* Fixed ambient node-link canvas background */}
      <NodeCanvas />

      {/* Fixed obsidian background */}
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Sticky Floating Navbar */}
      <div className="fixed top-0 z-50 w-full p-4 pointer-events-none">
        <header className="mx-auto max-w-6xl w-full rounded-2xl bg-background/50 backdrop-blur-2xl border border-border/10 dark:border-white/5 shadow-2xl shadow-[0_4px_20px_rgba(120,53,15,0.05)] dark:shadow-black/50 pointer-events-auto flex flex-col px-4 sm:px-10 py-2.5 sm:py-3.5">
          {/* Top Navbar Row */}
          <div className="flex items-center justify-between w-full">
            {/* Brand */}
            <Link href={CONFIG.routes.home} className="flex items-center gap-3 group cursor-pointer">
              <Logo className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-heading font-black text-sm sm:text-lg tracking-tight">
                UNLaR<span className="text-accent group-hover:text-accent/80 transition-colors">-Connect</span>
              </span>
            </Link>

            {/* Nav links - desktop */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
              <a href="#features" className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                Plataforma
              </a>
              <Link href={CONFIG.routes.foros} className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                Comunidad
              </Link>
              <Link href={CONFIG.routes.apuntes} className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                Apuntes
              </Link>
              <Link href={CONFIG.routes.tutorias} className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all relative">
                Tutorías
                <span className="absolute top-0 right-1 w-1.5 h-1.5 bg-accent rounded-full" />
              </Link>
            </nav>

            {/* Auth Actions row container */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              
              {user ? (
                <>
                  <Link
                    href={CONFIG.routes.dashboard}
                    className="hidden md:block text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                  >
                    Ir al Dashboard
                  </Link>
                  
                  {/* User Profile Avatar dropdown center */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border transition-colors shrink-0 flex items-center justify-center ${
                        isProfileOpen ? "border-accent shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "border-border hover:border-accent"
                      }`}
                    >
                      {user.avatar_url ? (
                        <Image
                          alt={`Foto de perfil de ${user.name}`}
                          className="w-full h-full object-cover"
                          src={user.avatar_url}
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl flex items-center justify-center text-sm font-bold bg-accent/20 border border-accent/30 text-accent select-none">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>

                    {/* Profile options card */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl p-2.5 space-y-1.5 z-50 animate-fade-in-up">
                        {/* User details header */}
                        <div className="px-3.5 py-2.5 border-b border-border/10 mb-1 select-none">
                          <span className="text-xs font-black text-accent block truncate">{user.name} {user.last_name || ""}</span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{user.email}</span>
                        </div>

                        {/* Options buttons */}
                        <Link
                          href="/perfil"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>Mi Perfil</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            window.location.href = "/perfil";
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
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href={CONFIG.routes.dashboard}
                    className="hidden md:block text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:block relative group px-5 py-2 text-sm font-bold rounded-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-accent transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10 text-accent-foreground shadow-sm">
                      Registrate Gratis
                    </span>
                  </Link>
                </>
              )}

              {/* Burger Menu Button (Mobile/Tablet) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all pointer-events-auto shrink-0"
                aria-label="Menú de navegación"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Animated Mobile Accordion Navigation Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="md:hidden w-full overflow-hidden flex flex-col gap-4 mt-3 pt-3 border-t border-border/10"
              >
                <nav className="flex flex-col gap-1">
                  <a
                    href="#features"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-left"
                  >
                    Plataforma
                  </a>
                  <Link
                    href={CONFIG.routes.foros}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-left"
                  >
                    Comunidad
                  </Link>
                  <Link
                    href={CONFIG.routes.apuntes}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-left"
                  >
                    Apuntes
                  </Link>
                  <Link
                    href={CONFIG.routes.tutorias}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-left flex items-center justify-between"
                  >
                    <span>Tutorías</span>
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                  </Link>
                </nav>

                <div className="h-[1px] bg-border/10 my-1" />

                {/* Auth CTAs inside Mobile Drawer */}
                <div className="flex flex-col gap-2 pb-2">
                  {user ? (
                    <>
                      <div className="px-4 py-2 text-xs font-bold text-accent select-none block truncate">
                        Conectado como: {user.name}
                      </div>
                      <Link
                        href={CONFIG.routes.dashboard}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-center px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-foreground border border-border/10 transition-all"
                      >
                        Ir al Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full text-center px-4 py-3 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/20 text-sm font-bold transition-all"
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={CONFIG.routes.dashboard}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-center px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-foreground border border-border/10 transition-all font-sans"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-center px-4 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-black uppercase tracking-wider shadow-lg shadow-accent/10 hover:bg-accent/90 transition-all font-sans"
                      >
                        Registrate Gratis
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>


      <main className="relative">
        {/* Section 1+2: 3D Point Cloud Hero + Headline */}
        <UniConnectHero />

        {/* Section 3: Unified Scroll-driven Screen & Feature Showcase */}
        <div id="features">
          <ScreenShowcase />
        </div>

        {/* Section 5: Final CTA */}
        <FinalCTA />

        {/* Footer */}
        <Footer />
      </main>
    </SmoothScroll>
  );
}
