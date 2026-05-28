"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useTheme } from "@/components/ui/ThemeProvider";
import DashboardMock from "./mocks/DashboardMock";
import ForumMock from "./mocks/ForumMock";
import ChatbotMock from "./mocks/ChatbotMock";

const screens = [
  {
    key: "dashboard",
    shortLabel: "dashboard",
    title: "Así se ve el",
    accentWord: "dashboard",
    accentClass: "text-accent border-accent/30",
    description: "Tu panel central con nivel de karma, materias sugeridas y actividad en tiempo real para estar al día con la facu.",
    mockup: DashboardMock,
  },
  {
    key: "foro",
    shortLabel: "foro",
    title: "Así se ve el",
    accentWord: "foro",
    accentClass: "text-secondary border-secondary/30",
    description: "Sacate las dudas de clase, debatí ejercicios con tus compañeros y ganá karma aportando respuestas clave.",
    mockup: ForumMock,
  },
  {
    key: "asistente",
    shortLabel: "asistente IA",
    title: "Así se ve el",
    accentWord: "asistente IA",
    accentClass: "text-accent bg-gradient-to-r from-accent to-terracotta-soft bg-clip-text text-transparent border-accent/30",
    description: "Chateá al toque con tus apuntes. El tutor RAG te responde usando tus propios PDFs y te dice en qué página está la respuesta.",
    mockup: ChatbotMock,
  },
];

export default function ScreenShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Track the scroll to change the active screen index
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      if (activeIndex !== 0) setActiveIndex(0);
    } else if (latest < 0.66) {
      if (activeIndex !== 1) setActiveIndex(1);
    } else {
      if (activeIndex !== 2) setActiveIndex(2);
    }
  });

  const activeScreen = screens[activeIndex];

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: "400vh" }} // Tall container for premium scroll feel
    >
      {/* Sticky Inner Wrapper */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center px-6">
        
        {/* Decorative Grid Lines Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: isDark
              ? "radial-gradient(rgba(245,158,11,0.06) 1px, transparent 1px)"
              : "radial-gradient(rgba(226,119,95,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Outer Split Container */}
        <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          
          {/* LEFT PANEL: Sticky Scroll-Driven Text Morphing (Col span 5) */}
          <div className="col-span-1 md:col-span-5 flex flex-col justify-center text-left min-h-[220px] md:min-h-0">
            {/* Section label */}
            <span className="text-xs font-bold text-accent/70 tracking-[0.2em] uppercase mb-4 block">
              Explorá la plataforma
            </span>

            {/* Title Morpher */}
            <div className="h-[75px] md:h-[110px] overflow-hidden relative mb-4">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={activeScreen.key}
                  className="font-heading text-3xl md:text-4.5xl font-black tracking-tight leading-[1.1] absolute inset-x-0"
                  initial={{ opacity: 0, y: 35, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -35, filter: "blur(6px)" }}
                  transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
                >
                  {activeScreen.title}{" "}
                  <span className="relative inline-block mt-1">
                    {/* Outline Vector Highlight */}
                    <span className="relative z-10 font-black">
                      {activeScreen.accentWord}
                    </span>
                    <span
                      className={`absolute -bottom-1 -left-1 -right-1 h-3 rounded-md bg-accent/10 border-b border-r -rotate-1 z-0 ${
                        activeIndex === 1 ? "border-secondary/20 bg-secondary/5" : "border-accent/20"
                      }`}
                    />
                  </span>
                  .
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Description Morpher */}
            <div className="min-h-[70px] md:min-h-[100px] relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeScreen.key}
                  className="text-sm md:text-base text-muted-foreground leading-relaxed absolute inset-x-0"
                  initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                >
                  {activeScreen.description}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Interactive Dot Navigator indicators */}
            <div className="flex gap-2.5 mt-8 md:mt-12">
              {screens.map((screen, idx) => (
                <button
                  key={screen.key}
                  onClick={() => {
                    const scrollPercent = idx === 0 ? 0.1 : idx === 1 ? 0.5 : 0.9;
                    if (containerRef.current) {
                      const element = containerRef.current;
                      const rect = element.getBoundingClientRect();
                      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                      const targetScroll = scrollTop + rect.top + (element.offsetHeight * scrollPercent);
                      window.scrollTo({ top: targetScroll, behavior: "smooth" });
                    }
                  }}
                  className="group flex items-center gap-2 focus:outline-none"
                  aria-label={`Ir a pantalla de ${screen.shortLabel}`}
                >
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      activeIndex === idx
                        ? `w-8 ${idx === 1 ? "bg-secondary" : "bg-accent"}`
                        : "w-2.5 bg-muted hover:bg-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 ${
                      activeIndex === idx ? "opacity-100 text-foreground" : "opacity-0 group-hover:opacity-60 text-muted-foreground"
                    }`}
                  >
                    {screen.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: Glowing Cross-fading Preview Mockups (Col span 7) */}
          <div className="col-span-1 md:col-span-7 flex justify-center items-center">
            
            {/* Framed Device Wrapper */}
            <div
              className={`relative w-full max-w-[620px] aspect-[16/10] md:h-[50vh] md:max-h-[480px] rounded-3xl p-1 bg-glass border transition-all duration-700 overflow-hidden shadow-2xl ${
                activeIndex === 0
                  ? "border-accent/15 shadow-accent/5 hover:border-accent/30"
                  : activeIndex === 1
                  ? "border-secondary/15 shadow-secondary/5 hover:border-secondary/30"
                  : "border-accent/20 shadow-accent/5 hover:border-accent/35"
              }`}
              style={{
                boxShadow: activeIndex === 1
                  ? (isDark ? "0 0 60px rgba(255,183,125,0.03), 0 30px 60px rgba(0,0,0,0.55)" : "0 0 60px rgba(255,183,125,0.01), 0 30px 60px rgba(118,52,14,0.04)")
                  : (isDark ? "0 0 60px rgba(245,158,11,0.03), 0 30px 60px rgba(0,0,0,0.55)" : "0 0 60px rgba(245,158,11,0.01), 0 30px 60px rgba(97,59,0,0.04)")
              }}
            >
              {/* Stacked mocks for seamless fading */}
              <div className="relative w-full h-full rounded-[20px] overflow-hidden">
                
                {/* 1. Dashboard Mock */}
                <div
                  className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out"
                  style={{
                    opacity: activeIndex === 0 ? 1 : 0,
                    transform: `scale(${activeIndex === 0 ? 1 : 0.975}) translateZ(0)`,
                    visibility: activeIndex === 0 ? "visible" : "hidden",
                    pointerEvents: activeIndex === 0 ? "auto" : "none",
                  }}
                >
                  <DashboardMock />
                </div>

                {/* 2. Forum Mock */}
                <div
                  className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out"
                  style={{
                    opacity: activeIndex === 1 ? 1 : 0,
                    transform: `scale(${activeIndex === 1 ? 1 : 0.975}) translateZ(0)`,
                    visibility: activeIndex === 1 ? "visible" : "hidden",
                    pointerEvents: activeIndex === 1 ? "auto" : "none",
                  }}
                >
                  <ForumMock />
                </div>

                {/* 3. Chatbot Mock */}
                <div
                  className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out"
                  style={{
                    opacity: activeIndex === 2 ? 1 : 0,
                    transform: `scale(${activeIndex === 2 ? 1 : 0.975}) translateZ(0)`,
                    visibility: activeIndex === 2 ? "visible" : "hidden",
                    pointerEvents: activeIndex === 2 ? "auto" : "none",
                  }}
                >
                  <ChatbotMock />
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
