"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import SmoothScroll from "@/components/ui/SmoothScroll";
import UniConnectHero from "@/components/landing/UniConnectHero";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/layout/Footer";
import { CONFIG } from "@/lib/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { createBrowserClient } from "@/lib/supabase";
import { DbUser } from "@/types/database";

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

  return (
    <SmoothScroll>
      {/* Fixed ambient node-link canvas background */}
      <NodeCanvas />

      {/* Fixed obsidian background */}
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Sticky Floating Navbar */}
      <div className="fixed top-0 z-50 w-full p-4 pointer-events-none">
        <header className="mx-auto max-w-6xl w-full rounded-2xl bg-background/50 backdrop-blur-2xl border border-border/10 dark:border-white/5 shadow-2xl shadow-[0_4px_20px_rgba(120,53,15,0.05)] dark:shadow-black/50 pointer-events-auto flex items-center justify-between px-6 py-3">
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
                <Link
                  href={CONFIG.routes.dashboard}
                  className="w-9 h-9 rounded-xl overflow-hidden border border-border hover:border-accent transition-all shrink-0 focus:outline-none shadow-sm block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Foto de perfil de ${user.name}`}
                    className="w-full h-full object-cover"
                    src={user.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDG7kZthARJWoPUqDDIShLuxuJGHxPM6eh_dFZ6vUCJpDcMLAVUhwXYCRHRWp4g2EG0IU2Rsbhy6R-fMP4njxS_VptnFuC38SCPJY9SODYThVAvnjbCK1XZUX7gGvY80048nOa5c8BLd-8sEqOcZI_3g6HnpGk6fONgBN98bB6t-7auFl5Er-3QmIJY8I86xD7vDken6cwXb1WU2S_MjlMOmKiKLHNUwHo5JTyGIRJfxWF3gwjqpONgQHZ_ti-F5V9qgMFGH0mCDQ"}
                  />
                </Link>
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
