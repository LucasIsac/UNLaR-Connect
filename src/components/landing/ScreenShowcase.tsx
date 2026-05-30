"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { FolderOpen, MessageSquare, Bot, ArrowRight, BookOpen, Layers } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import ResourcesMock from "./mocks/ResourcesMock";
import ForumMock from "./mocks/ForumMock";
import ChatbotMock from "./mocks/ChatbotMock";

export default function ScreenShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Check viewport width dynamically to disable scroll hijacking on mobile/tablets
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Set up scroll tracking for desktop sticky scroll triggers
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Dynamically map scroll progress to active index (desktop only)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (isMobile) return;
    // 3 sections spanning from 0 to 1
    if (latest < 0.35) {
      setActiveIndex(0);
    } else if (latest < 0.68) {
      setActiveIndex(1);
    } else {
      setActiveIndex(2);
    }
  });

  const features = [
    {
      title: "Banco de Apuntes",
      tagline: "Filtrado inteligente P2P",
      description:
        "Subí y buscá apuntes de tus materias. Filtramos de manera inteligente para que encontrés lo que necesitás al toque, segmentado por carrera, materia y año. Sumá puntos colaborando.",
      icon: FolderOpen,
      colorClass: "text-accent border-accent/20",
      glowColor: "rgba(245, 158, 11, 0.08)",
      mockup: ResourcesMock,
    },
    {
      title: "Foros Estudiantiles",
      tagline: "Resolución colaborativa",
      description:
        "¿No entendés un tema? Creá un post en el foro de tu materia o coordiná una tutoría directa con un compañero avanzado que la tenga clara. Aprendé en comunidad de forma simple.",
      icon: MessageSquare,
      colorClass: "text-secondary border-secondary/20",
      glowColor: "rgba(255, 183, 125, 0.08)",
      mockup: ForumMock,
    },
    {
      title: "Asistente de IA",
      tagline: "Chatbot RAG instantáneo",
      description:
        "Chateá directamente con tus PDFs subidos. Nuestro sistema de Inteligencia Artificial responde tus dudas en segundos usando los apuntes reales de tu carrera. Explicaciones precisas al instante.",
      icon: Bot,
      colorClass: "text-accent border-accent/20",
      glowColor: "rgba(245, 158, 11, 0.08)",
      mockup: ChatbotMock,
    },
  ];

  const activeFeature = features[activeIndex];
  const MockupComponent = activeFeature.mockup;

  return (
    <section
      ref={containerRef}
      id="features"
      className="relative z-10 w-full"
      style={{ height: isMobile ? "auto" : "320vh" }} // auto height on mobile, 320vh on desktop
    >
      {/* BACKGROUND GRAPHIC DETAILS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={isMobile ? "absolute inset-0 overflow-hidden" : "sticky top-0 h-screen w-full overflow-hidden"}>
          <div
            className="absolute top-1/4 right-1/4 w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] rounded-full blur-[100px] sm:blur-[140px] pointer-events-none transition-all duration-1000 -z-10 opacity-20 sm:opacity-30"
            style={{
              background: activeFeature.glowColor,
            }}
          />
        </div>
      </div>

      {/* STICKY/RELATIVE CONTENT WRAPPER */}
      <div className={isMobile ? "relative h-auto py-12 md:py-16 w-full flex flex-col justify-start overflow-visible" : "sticky top-0 h-screen w-full overflow-hidden flex items-center"}>
        <div className={isMobile ? "max-w-6xl mx-auto w-full px-4 flex flex-col gap-6" : "max-w-6xl mx-auto w-full px-6 flex flex-col justify-center h-full pt-28 pb-14"}>
          
          {/* HEADER SECTION */}
          <div className="mb-2 shrink-0 text-center md:text-left">
            <motion.p
              className="text-[10px] font-black text-accent/80 tracking-[0.25em] uppercase mb-3 block"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
            >
              Todo en un solo lugar
            </motion.p>
            
            <h2 className="font-heading text-2xl sm:text-4xl font-black tracking-tight leading-tight flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1">
              <span>Así funciona la plataforma</span>
              <span className="relative px-3.5 py-1 text-accent select-none inline-block">
                <span className="absolute inset-0 bg-accent/5 dark:bg-accent/10 border border-accent/15 rounded-xl -z-10" />
                por dentro.
              </span>
            </h2>
          </div>

          {/* SPLIT LAYOUT CONTAINER */}
          <div className={isMobile ? "flex flex-col gap-6 w-full" : "grid grid-cols-12 gap-8 md:gap-12 items-center flex-grow overflow-hidden h-[70vh] max-h-[610px]"}>
            
            {/* LEFT COLUMN: FEATURES STORYLINE & PROGRESS INDICATOR */}
            <div className={isMobile ? "w-full flex flex-col gap-4" : "col-span-12 md:col-span-4 flex gap-6 h-full items-center pl-3.5"}>
              
              {/* Interactive Quick-Tab Selector inside Top (Shown on mobile above the content for better usability) */}
              {isMobile && (
                <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 py-2 px-3.5 rounded-2xl bg-card/45 border border-border/10 w-full justify-start select-none scrollbar-none">
                  {features.map((feat, idx) => {
                    const isActive = activeIndex === idx;
                    
                    return (
                      <button
                        key={feat.title}
                        onClick={() => setActiveIndex(idx)}
                        className={`text-[9.5px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shrink-0 ${
                          isActive
                            ? "bg-accent/15 border border-accent/25 text-accent shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {feat.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Vertical Node-Link Progress Indicator (Desktop only) */}
              {!isMobile && (
                <div className="relative h-[85%] hidden md:flex flex-col items-center shrink-0 w-10">
                  <div className="absolute top-4 bottom-4 w-[1.5px] bg-border/25 rounded" />
                  
                  {/* Scroll progress path overlay */}
                  <motion.div 
                    className="absolute top-4 w-[1.5px] bg-accent origin-top rounded"
                    style={{ 
                      scaleY: scrollYProgress,
                      height: "calc(100% - 32px)"
                    }}
                  />

                  {features.map((feat, idx) => {
                    const Icon = feat.icon;
                    const isActive = activeIndex === idx;
                    
                    return (
                      <motion.div
                        key={feat.title}
                        className="absolute z-10 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                        style={{
                          top: `${idx * 50}%`,
                          y: "-50%"
                        }}
                        onClick={() => {
                          if (containerRef.current) {
                            const containerTop = containerRef.current.offsetTop;
                            const segmentHeight = containerRef.current.offsetHeight / 3;
                            window.scrollTo({
                              top: containerTop + idx * segmentHeight + 50,
                              behavior: "smooth"
                            });
                          }
                        }}
                        animate={{
                          backgroundColor: isActive ? (isDark ? "#1d1b1a" : "#eae8e4") : (isDark ? "#151312" : "#fbf9f5"),
                          borderColor: isActive ? "#f59e0b" : "rgba(245,158,11,0.2)",
                          borderWidth: "1.5px",
                          boxShadow: isActive ? "0 0 12px rgba(245,158,11,0.3)" : "none",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className={`w-3 h-3 ${isActive ? "text-accent" : "text-muted-foreground/60"}`} />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Descriptions container */}
              <div className={isMobile ? "w-full min-h-[140px] flex flex-col justify-center" : "flex-1 flex flex-col gap-6 justify-center"}>
                {isMobile ? (
                  /* Mobile: Render only the active description card with smooth layout animation transitions */
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      className="flex flex-col text-left rounded-2xl p-4 bg-card/30 border border-border/10 backdrop-blur-md"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22 }}
                    >
                      <span className="text-[10px] font-black uppercase text-accent/80 tracking-wider mb-1">
                        {activeFeature.tagline}
                      </span>
                      <h3 className="font-heading font-black text-lg text-foreground mb-2">
                        {activeFeature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activeFeature.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  /* Desktop storyline view */
                  features.map((feat, idx) => {
                    const isActive = activeIndex === idx;
                    
                    return (
                      <motion.div
                        key={feat.title}
                        className="flex flex-col text-left cursor-pointer"
                        onClick={() => {
                          if (containerRef.current) {
                            const containerTop = containerRef.current.offsetTop;
                            const segmentHeight = containerRef.current.offsetHeight / 3;
                            window.scrollTo({
                              top: containerTop + idx * segmentHeight + 50,
                              behavior: "smooth"
                            });
                          }
                        }}
                        animate={{
                          opacity: isActive ? 1.0 : 0.35,
                          scale: isActive ? 1.02 : 0.98,
                          x: isActive ? 4 : 0,
                        }}
                        transition={{ type: "spring", stiffness: 250, damping: 22 }}
                      >
                        <span className="text-[10px] font-black uppercase text-accent/80 tracking-wider mb-1">
                          {feat.tagline}
                        </span>
                        <h3 className="font-heading font-black text-lg md:text-xl text-foreground mb-2 flex items-center gap-2">
                          <span>{feat.title}</span>
                          {isActive && (
                            <motion.span 
                              layoutId="accentDot" 
                              className="w-1.5 h-1.5 rounded-full bg-accent"
                            />
                          )}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                          {feat.description}
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: SCREEN MOCK CONTAINER */}
            <div className={isMobile ? "w-full flex flex-col items-center" : "col-span-12 md:col-span-8 flex flex-col items-center justify-center h-full"}>
              
              {/* Interactive Quick-Tab Selector (Header above mockup frame - Desktop only) */}
              {!isMobile && (
                <div className="flex gap-1.5 mb-4 px-2 py-1 rounded-xl bg-card/45 border border-border/10 shrink-0">
                  {features.map((feat, idx) => {
                    const isActive = activeIndex === idx;
                    
                    return (
                      <button
                        key={feat.title}
                        onClick={() => {
                          if (containerRef.current) {
                            const containerTop = containerRef.current.offsetTop;
                            const segmentHeight = containerRef.current.offsetHeight / 3;
                            window.scrollTo({
                              top: containerTop + idx * segmentHeight + 50,
                              behavior: "smooth"
                            });
                          }
                        }}
                        className={`text-[9px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-accent/15 border border-accent/25 text-accent"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {feat.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main screen mock frame */}
              <div
                className="relative w-full rounded-2xl overflow-hidden border border-border/15 transition-all duration-500 bg-card/35 backdrop-blur-md shadow-2xl flex flex-col"
                style={{
                  height: isMobile ? "490px" : "90%",
                  maxHeight: isMobile ? "none" : "540px",
                  boxShadow: isDark
                    ? "0 0 60px rgba(245,158,11,0.02), 0 30px 60px rgba(0,0,0,0.5)"
                    : "0 0 60px rgba(245,158,11,0.01), 0 30px 60px rgba(120,53,15,0.05)",
                }}
              >
                {/* Dot grid inside mock */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300 -z-10"
                  style={{
                    backgroundImage: isDark
                      ? "radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)"
                      : "radial-gradient(rgba(120,53,15,0.03) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Topbar frame replica (Simulates a real application header) */}
                <div className="h-8 border-b border-border/10 flex items-center px-4 justify-between bg-card/60 backdrop-blur-md shrink-0 select-none">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest pl-6">
                    UNLaR-Connect Web Client
                  </div>
                  <div className="w-8" />
                </div>

                {/* Dynamic Screen Mock switcher */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      className="absolute inset-0 w-full h-full"
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.01, y: -10 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                    >
                      <MockupComponent isDark={isDark} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
