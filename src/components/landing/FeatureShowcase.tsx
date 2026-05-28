"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, MessageSquare, Bot, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

// --- CUSTOM ANIMATED ICONS ---

function BancoDeApuntesIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      {/* Background fanning sheets */}
      <motion.div
        className="absolute w-5 h-6 bg-accent/20 border border-accent/30 rounded-md"
        animate={isHovered ? { x: -6, y: -5, rotate: -15, scale: 0.95 } : { x: 0, y: 0, rotate: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <motion.div
        className="absolute w-5 h-6 bg-accent/30 border border-accent/45 rounded-md"
        animate={isHovered ? { x: 6, y: -5, rotate: 15, scale: 0.95 } : { x: 0, y: 0, rotate: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Main folder icon container */}
      <motion.div
        className="absolute w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center z-10 shadow-sm"
        animate={isHovered ? { y: -2, scale: 1.08 } : { y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FolderOpen className="w-5 h-5 text-accent" />
      </motion.div>
    </div>
  );
}

function ForosYTutoriasIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      {/* Concentric ripple rings */}
      {isHovered && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-secondary/30 bg-secondary/5"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-secondary/20 bg-secondary/3"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut", delay: 0.45 }}
          />
        </>
      )}
      <motion.div
        className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center z-10 text-secondary shadow-sm"
        animate={isHovered ? { scale: 1.08, rotate: 6 } : { scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <MessageSquare className="w-5 h-5" />
      </motion.div>
    </div>
  );
}

function AsistenteIAIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm">
      <Bot className="w-5 h-5 text-accent relative z-10 animate-pulse" />
      
      {/* Sweep scanner line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_8px_var(--primary)]"
        initial={{ top: "0%" }}
        animate={isHovered ? { top: ["0%", "100%", "0%"] } : { top: "50%" }}
        transition={isHovered ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : { duration: 0.3 }}
      />
      
      {/* Ambient background glow inside icon */}
      <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
    </div>
  );
}

// --- MINI LIVE-PREVIEW ILLUSTRATIONS ---

function BancoDeApuntesPreview({ isHovered }: { isHovered: boolean }) {
  const chips = [
    { label: "Análisis I", color: "bg-accent/10 border-accent/20 text-accent dark:bg-accent/10" },
    { label: "Álgebra", color: "bg-secondary/15 border-secondary/25 text-secondary dark:bg-secondary/10" },
    { label: "Física I", color: "bg-accent/10 border-accent/20 text-accent/80 dark:bg-accent/5" },
  ];
  
  return (
    <motion.div 
      className="mt-6 pt-4 border-t border-border/10 w-full overflow-hidden flex flex-col gap-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {/* Mock Search Box */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/60 border border-border/40 text-xs text-muted-foreground shadow-sm">
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="truncate">Buscar apuntes de Análisis...</span>
        <motion.div
          className="w-[1.5px] h-3 bg-accent"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      </div>
      
      {/* Floating Chips */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, idx) => (
          <motion.span
            key={chip.label}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${chip.color} shadow-sm`}
            animate={isHovered ? {
              y: [0, idx % 2 === 0 ? -3 : 3, 0],
              scale: 1.03
            } : { y: 0, scale: 1 }}
            transition={isHovered ? {
              repeat: Infinity,
              duration: 2.2 + idx * 0.4,
              ease: "easeInOut"
            } : { duration: 0.3 }}
          >
            {chip.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

function ForosYTutoriasPreview({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.div 
      className="mt-6 pt-4 border-t border-border/10 w-full overflow-hidden flex flex-col gap-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col gap-3 pl-1">
        {/* Connection node spine line */}
        <div className="absolute left-[11px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed border-border/40" />

        {/* User Question */}
        <div className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[8px] font-bold text-secondary shrink-0 shadow-sm">
            LM
          </div>
          <div className="bg-card/70 border border-border/40 rounded-2xl rounded-tl-none p-2.5 text-[10.5px] leading-relaxed text-foreground shadow-sm max-w-[85%]">
            <span className="font-bold text-secondary block text-[8px] mb-0.5 uppercase tracking-wider">Lucas M. · Sistemas</span>
            ¿Alguien tiene el resuelto de Álgebra de ayer?
          </div>
        </div>

        {/* Reply Bubble */}
        <motion.div
          className="flex items-start gap-2.5 pl-3"
          initial={{ opacity: 0, x: -8 }}
          animate={isHovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
        >
          <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[8px] font-bold text-accent shrink-0 shadow-sm">
            IA
          </div>
          <div className="bg-card/85 border border-accent/25 rounded-2xl rounded-tl-none p-2.5 text-[10.5px] leading-relaxed text-foreground shadow-sm max-w-[85%] relative">
            <span className="font-bold text-accent block text-[8px] mb-0.5 uppercase tracking-wider">Isabel A. · Tutora</span>
            ¡Hola! Sí, lo acabo de subir al banco de apuntes.
            
            {/* Love badge */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-secondary text-white flex items-center justify-center text-[7px] border border-card"
              animate={isHovered ? { scale: [0, 1.25, 1] } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 10, delay: 0.45 }}
            >
              ❤️
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AsistenteIAPreview({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.div 
      className="mt-6 pt-4 border-t border-border/10 w-full overflow-hidden flex flex-col gap-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <div className="flex flex-col gap-3">
        {/* PDF Card */}
        <div className="relative flex items-center justify-between px-3 py-1.5 rounded-xl bg-card border border-border/50 text-[10px] font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-[9px] px-1 bg-red-500/10 rounded">PDF</span>
            <span className="truncate max-w-[110px] text-muted-foreground">Apunte_Algebra_U3.pdf</span>
          </div>
          {/* Scan visual sweep */}
          <motion.div
            className="absolute inset-0 bg-accent/5 rounded-xl border border-accent/20 pointer-events-none"
            animate={isHovered ? { opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          />
          <span className="text-[9px] text-accent/80 font-bold shrink-0">1.2 MB</span>
        </div>

        {/* Connection flow line */}
        <div className="relative h-4 flex items-center justify-center">
          <div className="absolute top-0 bottom-0 w-[1px] border-l border-dotted border-accent/60" />
          {isHovered && (
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ y: [-8, 8] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />
          )}
        </div>

        {/* AI Answer Bubble */}
        <div className="bg-gradient-to-r from-accent/5 via-card to-card border border-accent/20 rounded-xl p-2.5 shadow-md relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-accent" />
          <div className="flex items-center gap-1 mb-1">
            <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
            <span className="text-[8px] font-black tracking-widest text-accent uppercase">ASISTENTE IA</span>
          </div>
          <div className="text-[10px] leading-relaxed text-muted-foreground">
            {isHovered ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                Che, según la pág. 14, si los rangos coinciden, el sistema es compatible.
              </motion.span>
            ) : (
              <span>Subí tu PDF y preguntame dudas al toque...</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- MAIN FEATURE SHOWCASE ---

export default function FeatureShowcase() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const [isInView, setIsInView] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: BancoDeApuntesIcon,
      preview: BancoDeApuntesPreview,
      title: "Banco de Apuntes",
      tagline: "Filtrado inteligente P2P",
      description:
        "Subí y buscá apuntes de tus materias. Filtramos de manera inteligente para que encontrés lo que necesitás al toque, segmentado por carrera, materia y año.",
      accent: "text-accent",
      gradient: isDark 
        ? "from-amber-500/10 via-amber-500/5 to-transparent" 
        : "from-amber-600/10 via-amber-600/5 to-transparent",
    },
    {
      icon: ForosYTutoriasIcon,
      preview: ForosYTutoriasPreview,
      title: "Foros y Tutorías",
      tagline: "Resolución colaborativa",
      description:
        "¿No entendés un tema? Creá un post en el foro de tu materia o coordiná una tutoría directa con un compañero avanzado que la tenga clara.",
      accent: "text-secondary",
      gradient: isDark 
        ? "from-secondary-fixed-dim/10 via-secondary-fixed-dim/5 to-transparent" 
        : "from-secondary/15 via-secondary/5 to-transparent",
    },
    {
      icon: AsistenteIAIcon,
      preview: AsistenteIAPreview,
      title: "Asistente IA",
      tagline: "Chatbot RAG instantáneo",
      description:
        "Chateá directamente con tus PDFs subidos. Nuestro sistema de Inteligencia Artificial responde tus dudas en segundos usando los apuntes reales de tu carrera.",
      accent: "text-accent",
      gradient: isDark 
        ? "from-amber-500/10 via-amber-500/5 to-transparent" 
        : "from-amber-600/10 via-amber-600/5 to-transparent",
    },
  ];

  const activeIdx = hoveredIndex !== null ? hoveredIndex : activeMobileIndex;

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative z-10 px-6 py-28 max-w-6xl mx-auto w-full overflow-hidden"
    >
      {/* SECTION TOP LABEL */}
      <motion.p
        className="text-[11px] font-bold text-accent/80 tracking-[0.25em] uppercase text-center mb-4"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Descubrí la plataforma
      </motion.p>

      {/* TWO-PART SCROLL REVEAL HEADLINE */}
      <div className="font-heading text-3xl sm:text-5xl font-black text-center mb-20 tracking-tight leading-tight flex flex-col items-center justify-center gap-3">
        <motion.span
          className="text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          Todo lo que necesitás,
        </motion.span>
        
        <motion.span
          className="relative px-5 py-2 text-accent inline-block select-none"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        >
          {/* Custom vector-highlight outline */}
          <motion.span
            className="absolute inset-0 bg-accent/5 dark:bg-accent/10 border border-accent/20 rounded-2xl -z-10"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
            style={{ originX: 0 }}
          />
          en un solo lugar.
        </motion.span>
      </div>

      <div className="relative">
        {/* DESKTOP NODE-LINK NETWORK LINES (Horizontal) */}
        <div className="absolute inset-0 pointer-events-none md:block hidden z-0 overflow-hidden">
          <svg className="w-full h-full opacity-30 dark:opacity-20" viewBox="0 0 1000 400" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ffb77d" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Dynamic dotted path connecting left to center card */}
            <motion.path
              d="M 180 180 Q 330 250, 500 180"
              stroke="url(#netGrad)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              animate={{ strokeDashoffset: [-20, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            />
            {/* Dynamic dotted path connecting center to right card */}
            <motion.path
              d="M 500 180 Q 670 110, 820 180"
              stroke="url(#netGrad)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              animate={{ strokeDashoffset: [20, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            />
          </svg>
        </div>

        {/* MOBILE NODE-LINK NETWORK LINES (Vertical) */}
        <div className="absolute inset-0 pointer-events-none md:hidden block z-0 overflow-hidden py-10">
          <svg className="w-full h-full opacity-20" viewBox="0 0 200 800" fill="none" preserveAspectRatio="none">
            <motion.path
              d="M 100 80 L 100 720"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              animate={{ strokeDashoffset: [-20, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            />
          </svg>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-start">
          {features.map((feature, i) => {
            const IconComponent = feature.icon;
            const PreviewComponent = feature.preview;
            const isHovered = activeIdx === i;
            const isDimmed = activeIdx !== null && activeIdx !== i;

            return (
              <motion.div
                key={feature.title}
                className="bg-glass rounded-[24px] p-7 md:p-8 relative overflow-hidden group border border-border/10 cursor-pointer shadow-md select-none w-full hover:border-accent/20 transition-colors duration-500"
                onClick={() => setActiveMobileIndex(activeMobileIndex === i ? null : i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                animate={{
                  scale: isHovered ? 1.025 : isDimmed ? 0.96 : 1.0,
                  opacity: isDimmed ? 0.45 : 1.0,
                  boxShadow: isHovered 
                    ? (isDark ? "0 10px 30px rgba(245, 158, 11, 0.08)" : "0 10px 30px rgba(120, 53, 15, 0.05)")
                    : "0 4px 12px rgba(0,0,0,0.02)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 24,
                }}
                layout
              >
                {/* Background Gradient Blob */}
                <div
                  className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[48px] pointer-events-none transition-all duration-700 -z-10 ${
                    isHovered ? "scale-150 opacity-80" : "scale-100 opacity-30"
                  } bg-gradient-to-br ${feature.gradient}`}
                />

                {/* Card Header (always visible) */}
                <div className="flex items-center gap-4 mb-4">
                  <IconComponent isHovered={isHovered} />
                  <div>
                    <span className="text-[10px] uppercase font-black text-accent/80 tracking-widest block mb-0.5">
                      {feature.tagline}
                    </span>
                    <h3 className="font-heading font-black text-lg md:text-xl text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                </div>

                {/* Card Description */}
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed transition-colors duration-300 group-hover:text-foreground/90">
                  {feature.description}
                </p>

                {/* Animated Mini Preview illustration (dynamic reveal) */}
                <AnimatePresence>
                  {isHovered && (
                    <PreviewComponent isHovered={isHovered} />
                  )}
                </AnimatePresence>

                {/* Bottom Expansion Indicator (Desktop only) */}
                <div className="mt-4 flex items-center justify-end h-4 md:block hidden overflow-hidden">
                  <motion.div
                    className="flex items-center gap-1.5 text-[10px] font-bold text-accent"
                    animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span>Ver más</span>
                    <ArrowRight className="w-3 h-3" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
