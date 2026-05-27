"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import SmoothScroll from "@/components/ui/SmoothScroll";
import HeroVoid from "@/components/landing/HeroVoid";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/layout/Footer";
import { CONFIG } from "@/lib/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Canvas loaded client-side only (no SSR needed for canvas)
const NodeCanvas = dynamic(() => import("@/components/landing/NodeCanvas"), {
  ssr: false,
});

// Heavy scroll component — code-split
const DashboardMaterialization = dynamic(
  () => import("@/components/landing/DashboardMaterialization"),
  { ssr: false }
);

export default function Home() {
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="UNLaR-Connect" className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" />
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
            <Link
              href={CONFIG.routes.dashboard}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Entrar
            </Link>
            <Link
              href={CONFIG.routes.dashboard}
              className="relative group px-5 py-2 text-sm font-bold rounded-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-accent transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 text-accent-foreground shadow-sm">
                Registrate Gratis
              </span>
            </Link>
          </div>
        </header>
      </div>


      {/* Page content - all sections */}
      <main className="relative pt-24">
        {/* Section 1+2: The Void + Hero Headline */}
        <HeroVoid />

        {/* Section 3: Feature Cards */}
        <FeatureShowcase />

        {/* Section 4: Dashboard Materialization (scroll-driven showstopper) */}
        <div id="dashboard-preview">
          <DashboardMaterialization />
        </div>

        {/* Section 5: Final CTA */}
        <FinalCTA />

        {/* Footer */}
        <Footer />
      </main>
    </SmoothScroll>
  );
}
