"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import the Three.js Canvas component to avoid hydration mismatches
// and ensure it compiles strictly on the client side.
const ThreeHeroCanvas = dynamic(() => import("./ThreeHeroCanvas"), {
  ssr: false,
});

export default function UniConnectHero() {
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean | null>(null);

  // 1. RUNTIME WEBGL CAPABILITY DETECTION
  // Verifies if the browser and hardware support WebGL.
  // If not supported, we fall back to a high-end, responsive static CSS asset.
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      setIsWebGLSupported(support);
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  // Split words for the Argentine Spanish voseo headline animation reveal effect
  const headlineWords = [
    "Todo",
    "tu",
    "mundo",
    "universitario,",
    "conectado."
  ];

  return (
    <section
      id="hero-section"
      className="relative min-h-[100vh] w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden bg-background"
    >
      {/* --- BACKGROUND LAYER --- */}
      {isWebGLSupported === true ? (
        // 3D Point-Cloud Scene (Active on WebGL-supported platforms)
        <ThreeHeroCanvas />
      ) : (
        // PREMIUM CSS STATIC FALLBACK LAYER (For lower-end devices or disabled WebGL)
        // Renders an immersive, animated node-mesh radial gradient and subtle grid overlay
        <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          {/* Subtle warm amber radial spotlight (adapts dynamically in light/dark themes) */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[800px] max-h-[800px] opacity-40 bg-[radial-gradient(circle,rgba(133,83,0,0.06)_0%,rgba(148,74,35,0.02)_45%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,rgba(226,119,95,0.03)_45%,transparent_70%)] dark:opacity-30 blur-[40px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          {/* Subtle tech-academic background grid */}
          <div 
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]"
          />
        </div>
      )}

      {/* --- CONTENT OVERLAY LAYER --- */}
      {/* 
        Vignette backdrop: subtle radial shadow around screen limits 
        to ensure high typographic legibility. Adapts to theme background color.
      */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,249,245,0.1)_0%,rgba(251,249,245,0.45)_70%,#fbf9f5_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(12,10,9,0.1)_0%,rgba(12,10,9,0.75)_80%,#0C0A09_100%)] pointer-events-none -z-4" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center pt-24 pb-16 sm:pt-28 sm:pb-20">
        {/* Animated word-by-word reveal Headline (Argentine Spanish) */}
        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7.5xl font-black tracking-tight leading-[1.12] mb-8 py-2 text-foreground max-w-3xl">
          {headlineWords.map((word, i) => {
            const isConectado = word.includes("conectado");
            const cleanWord = isConectado ? "conectado" : word;
            const hasPeriod = isConectado && word.endsWith(".");

            return (
              <span
                key={i}
                className="inline-block mr-[0.25em] opacity-0 translate-y-4 animate-fade-in-up"
                style={{
                  animationDelay: `${350 + i * 90}ms`,
                }}
              >
                {isConectado ? (
                  <span className="relative inline-flex items-center mx-[0.05em]">
                    {/* Vector outline styling wrapping the main accented word */}
                    <span className="absolute -inset-x-2.5 -inset-y-1.5 border border-accent/40 bg-accent/[0.03] rounded-md transform skew-x-[-6deg] rotate-[-1deg] select-none pointer-events-none">
                      {/* Interactive Figma corner anchors */}
                      <span className="absolute -top-[3.5px] -left-[3.5px] w-1.5 h-1.5 bg-background border border-accent rounded-none" />
                      <span className="absolute -top-[3.5px] -right-[3.5px] w-1.5 h-1.5 bg-background border border-accent rounded-none" />
                      <span className="absolute -bottom-[3.5px] -left-[3.5px] w-1.5 h-1.5 bg-background border border-accent rounded-none" />
                      <span className="absolute -bottom-[3.5px] -right-[3.5px] w-1.5 h-1.5 bg-background border border-accent rounded-none" />
                      {/* Glow backdrop behind accented text */}
                      <span className="absolute inset-0 bg-accent/10 blur-[15px] -z-10 rounded-md" />
                    </span>
                    <span className="relative z-10 px-1 text-accent font-black select-none">
                      {cleanWord}
                    </span>
                    {hasPeriod && <span className="text-foreground font-black z-10">.</span>}
                  </span>
                ) : (
                  word
                )}
              </span>
            );
          })}
        </h1>

        {/* Subtitle - Argentine Spanish layout */}
        <p
          className="text-base sm:text-lg lg:text-xl text-muted-foreground/90 max-w-xl sm:max-w-2xl leading-relaxed mb-12 px-2 opacity-0 translate-y-4 animate-fade-in-up font-sans font-medium"
          style={{
            animationDelay: "1100ms",
          }}
        >
          UNLaR-Connect reúne a estudiantes, materias, comunidades y la vida del campus en una sola plataforma.
          Compartí apuntes, sacate dudas y optimizá tu estudio con IA.
        </p>

        {/* CTA Interactive Buttons - Argentine Spanish with voseo */}
        <div
          className="flex flex-col sm:flex-row gap-4 items-center justify-center opacity-0 translate-y-4 animate-fade-in-up w-full px-4 sm:w-auto"
          style={{
            animationDelay: "1350ms",
          }}
        >
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-accent-foreground font-extrabold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-accent/90 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-accent/10 hover:shadow-accent/20 cursor-pointer text-center"
          >
            Explorá
          </Link>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById("features");
              if (!target) return;
              const startY = window.scrollY;
              const endY = target.getBoundingClientRect().top + startY;
              const duration = 1400; // ms — long enough to enjoy the hero blur effect
              let startTime: number | null = null;
              const easeInOutCubic = (t: number) =>
                t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              const step = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                window.scrollTo(0, startY + (endY - startY) * easeInOutCubic(progress));
                if (progress < 1) requestAnimationFrame(step);
              };
              requestAnimationFrame(step);
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border/40 bg-white/[0.01] backdrop-blur-md text-muted-foreground font-bold text-sm tracking-wide transition-all duration-300 hover:text-foreground hover:border-border hover:bg-white/[0.04] hover:scale-[1.03] active:scale-[0.98] cursor-pointer text-center"
          >
            Mirá cómo funciona
          </a>
        </div>
      </div>

      {/* Elegant scrolling bounce vector indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-0 translate-y-4 animate-fade-in-up"
        style={{
          animationDelay: "1850ms",
        }}
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold font-sans">
          Scrolleá
        </span>
        <div
          className="w-[1.5px] h-10 bg-gradient-to-b from-accent/70 via-accent/30 to-transparent animate-scroll-pulse rounded-full"
        />
      </div>
    </section>
  );
}
