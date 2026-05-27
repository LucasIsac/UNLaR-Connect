"use client";

import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Footer from "@/components/layout/Footer";
import { CONFIG } from "@/lib/constants";
import dynamic from "next/dynamic";

const NodeCanvas = dynamic(() => import("@/components/landing/NodeCanvas"), {
  ssr: false,
});

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export default function PlaceholderPage({
  title,
  subtitle,
  description,
  icon: Icon,
  badge = "Próximamente",
}: PlaceholderPageProps) {
  return (
    <SmoothScroll>
      <NodeCanvas />
      
      {/* Background */}
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Floating Navbar */}
      <div className="fixed top-0 z-50 w-full p-4 pointer-events-none">
        <header className="mx-auto max-w-6xl w-full rounded-2xl bg-background/50 backdrop-blur-2xl border border-white/5 shadow-2xl shadow-black/50 pointer-events-auto flex items-center justify-between px-6 py-3">
          {/* Brand */}
          <Link href={CONFIG.routes.home} className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="font-heading font-black text-accent text-sm relative z-10">UC</span>
            </div>
            <span className="font-heading font-black text-lg tracking-tight">
              UNLaR<span className="text-accent group-hover:text-accent/80 transition-colors">-Connect</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            <Link href={CONFIG.routes.home} className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
              Inicio
            </Link>
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

          {/* Auth Button */}
          <div className="flex items-center gap-3">
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

      {/* Main Content */}
      <main className="relative pt-36 min-h-screen flex flex-col justify-between">
        <div className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center text-center justify-center flex-grow">
          {/* Badge */}
          <span className="px-3 py-1 rounded-full text-xs font-bold text-accent bg-accent/10 border border-accent/20 mb-6 uppercase tracking-widest animate-pulse">
            {badge}
          </span>

          {/* Icon Glow */}
          <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent mb-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-accent/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
            <Icon className="w-10 h-10 relative z-10" />
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
            {title}
          </h1>
          <h2 className="text-lg text-accent font-semibold mb-6">
            {subtitle}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-10 max-w-md">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              href={CONFIG.routes.home}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-foreground hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Volvé al Inicio
            </Link>
            <Link
              href={CONFIG.routes.dashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/15 flex items-center justify-center"
            >
              Ingresá al Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </SmoothScroll>
  );
}
