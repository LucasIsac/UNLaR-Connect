"use client";

import Link from "next/link";
import { Menu, Search, Bell, Award } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import Logo from "../ui/Logo";

type HeaderProps = {
  onMenuToggle: () => void;
};

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-45 flex items-center justify-between px-6 md:px-10 h-16 bg-background/50 backdrop-blur-xl border-b border-border/40 shadow-sm transition-colors duration-300">
      {/* Left: Brand Logo (desktop) & Mobile toggle & Search Bar */}
      <div className="flex flex-1 items-center gap-6">
        {/* Desktop Brand Logo */}
        <Link href="/dashboard" className="hidden md:flex items-center gap-3 shrink-0 group">
          <Logo
            className="w-8 h-8 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col text-left">
            <span className="font-heading font-black text-sm tracking-tight leading-none text-foreground">
              UNLaR<span className="text-accent font-bold">-Connect</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold leading-none mt-0.5">
              Ing. en Sistemas
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

        {/* Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscá apuntes, materias o dudas..."
            className="w-full bg-card/30 hover:bg-card/50 focus:bg-card/70 border border-border/40 focus:border-accent rounded-full py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder-muted-foreground/60"
          />
        </div>
      </div>

      {/* Right: Actions (Points, notifications, profile, theme) */}
      <div className="flex items-center gap-4">
        {/* Mobile Search Button (shows only when screen is small) */}
        <button className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 sm:hidden transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {/* Karma Points Badge - Micro dopamine animation */}
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full hover:scale-[1.03] transition-transform duration-200 cursor-pointer select-none">
          <Award className="w-4 h-4 text-accent animate-pulse-slow" />
          <span className="text-xs font-bold text-accent tracking-wide">2.450 pts</span>
        </div>

        {/* Notifications Icon with Indicator */}
        <button className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Theme Toggler */}
        <ThemeToggle />

        {/* User Profile Avatar */}
        <button className="w-9 h-9 rounded-xl overflow-hidden border border-border hover:border-accent transition-colors flex items-center justify-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Foto de perfil del alumno"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG7kZthARJWoPUqDDIShLuxuJGHxPM6eh_dFZ6vUCJpDcMLAVUhwXYCRHRWp4g2EG0IU2Rsbhy6R-fMP4njxS_VptnFuC38SCPJY9SODYThVAvnjbCK1XZUX7gGvY80048nOa5c8BLd-8sEqOcZI_3g6HnpGk6fONgBN98bB6t-7auFl5Er-3QmIJY8I86xD7vDken6cwXb1WU2S_MjlMOmKiKLHNUwHo5JTyGIRJfxWF3gwjqpONgQHZ_ti-F5V9qgMFGH0mCDQ"
          />
        </button>
      </div>
    </header>
  );
}
