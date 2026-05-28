"use client";

import Link from "next/link";
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
import { User, Settings, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";

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
        <header className="mx-auto max-w-6xl w-full rounded-2xl bg-background/50 backdrop-blur-2xl border border-border/10 dark:border-white/5 shadow-2xl shadow-[0_4px_20px_rgba(120,53,15,0.05)] dark:shadow-black/50 pointer-events-auto flex items-center justify-between px-10 py-3.5">
          {/* Brand */}
          <Link href={CONFIG.routes.home} className="flex items-center gap-3 group cursor-pointer">
            <Logo className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-heading font-black text-lg tracking-tight">
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

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href={CONFIG.routes.dashboard}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Foto de perfil de ${user.name}`}
                      className="w-full h-full object-cover"
                      src={user.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDG7kZthARJWoPUqDDIShLuxuJGHxPM6eh_dFZ6vUCJpDcMLAVUhwXYCRHRWp4g2EG0IU2Rsbhy6R-fMP4njxS_VptnFuC38SCPJY9SODYThVAvnjbCK1XZUX7gGvY80048nOa5c8BLd-8sEqOcZI_3g6HnpGk6fONgBN98bB6t-7auFl5Er-3QmIJY8I86xD7vDken6cwXb1WU2S_MjlMOmKiKLHNUwHo5JTyGIRJfxWF3gwjqpONgQHZ_ti-F5V9qgMFGH0mCDQ"}
                    />
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
                </div>
              </>
            ) : (
              <>
                <Link
                  href={CONFIG.routes.dashboard}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="relative group px-5 py-2 text-sm font-bold rounded-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-accent transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 text-accent-foreground shadow-sm">
                    Registrate Gratis
                  </span>
                </Link>
              </>
            )}
          </div>
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
