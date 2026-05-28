"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  MessageSquare,
  Bot,
  FileText,
  Download,
  Send,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function FeatureShowcase() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: FolderOpen,
      title: "Banco de Apuntes",
      description:
        "Subí y buscá apuntes de tus materias. Filtramos de manera inteligente para que encontrés lo que necesitás al toque, ordenado por materia, año y carrera.",
      accent: "text-accent border-accent/20 bg-accent/5",
      accentText: "text-accent",
      previewType: "apuntes",
    },
    {
      icon: MessageSquare,
      title: "Foros y Tutorías P2P",
      description:
        "¿No entendés un tema? Creá un post en el foro de tu materia o coordiná una tutoría directa con un compañero que la tenga re clara.",
      accent: "text-secondary border-secondary/20 bg-secondary/5",
      accentText: "text-secondary",
      previewType: "foro",
    },
    {
      icon: Bot,
      title: "Asistente IA RAG",
      description:
        "Chateá directamente con tus PDFs subidos. Nuestro sistema RAG responde tus dudas en segundos usando los apuntes reales de tu carrera.",
      accent: "text-accent border-accent/20 bg-accent/5",
      accentText: "text-accent bg-gradient-to-r from-accent to-terracotta-soft bg-clip-text text-transparent",
      previewType: "ia",
    },
  ];

  return (
    <section
      id="features"
      ref={ref}
      className="relative z-10 px-6 py-28 max-w-6xl mx-auto w-full overflow-visible"
    >
      {/* Delicate horizontal glowing connection line with particles */}
      <div className="absolute top-[55%] left-24 right-24 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent -translate-y-1/2 -z-10 hidden md:block pointer-events-none overflow-visible">
        <div
          className="absolute top-0 w-1.5 h-1.5 rounded-full bg-accent -translate-y-1/2 blur-[1px] animate-pulse"
          style={{ left: "20%", animationDuration: "3s" }}
        />
        <div
          className="absolute top-0 w-1.5 h-1.5 rounded-full bg-secondary -translate-y-1/2 blur-[1px] animate-pulse"
          style={{ left: "50%", animationDuration: "4s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-0 w-1.5 h-1.5 rounded-full bg-accent -translate-y-1/2 blur-[1px] animate-pulse"
          style={{ left: "80%", animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>

      {/* Section label */}
      <motion.p
        className="text-xs font-bold text-accent/70 tracking-[0.2em] uppercase text-center mb-4"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Todo conectado
      </motion.p>

      {/* Split-Reveal Header */}
      <div className="text-center mb-20 overflow-hidden">
        <motion.h2
          className="font-heading text-3xl sm:text-4.5xl font-black tracking-tight leading-tight inline-block"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
        >
          Todo lo que necesitás,{" "}
          <motion.span
            className="text-accent inline-block relative"
            initial={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
            animate={isInView ? { opacity: 1, filter: "blur(0px)", scale: 1 } : {}}
            transition={{ duration: 0.65, delay: 0.3, ease: "easeOut" }}
          >
            en un solo lugar
            <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-accent/20 rounded border-b border-accent/10 -rotate-0.5" />
          </motion.span>
          .
        </motion.h2>
      </div>

      {/* 3-Column Spotlight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const isHovered = hoveredIndex === i;
          const isAnythingHovered = hoveredIndex !== null;

          return (
            <motion.div
              key={feature.title}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(isHovered ? null : i)} // Tap support for mobile
              className="bg-glass rounded-3xl p-6.5 relative overflow-hidden border border-border/10 cursor-pointer select-none transition-all duration-500 shadow-lg hover:shadow-2xl"
              style={{
                borderColor: isHovered
                  ? (i === 1 ? "rgba(255,183,125,0.3)" : "rgba(245,158,11,0.3)")
                  : "rgba(255,255,255,0.06)",
              }}
              animate={{
                scale: isHovered ? 1.035 : isAnythingHovered ? 0.96 : 1,
                opacity: isHovered ? 1 : isAnythingHovered ? 0.45 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
            >
              {/* Background ambient glow bloom */}
              <div
                className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-700"
                style={{
                  background: isHovered
                    ? (i === 1
                      ? (isDark ? "rgba(255,183,125,0.12)" : "rgba(118,52,14,0.28)")
                      : (isDark ? "rgba(245,158,11,0.12)" : "rgba(97,59,0,0.28)"))
                    : "rgba(0,0,0,0)",
                }}
              />

              {/* CARD TOP SECTION: Icon and Title */}
              <div className="flex items-center gap-4.5 mb-5.5">
                {/* Micro-animated Icon Container */}
                <div
                  className={`w-13 h-13 rounded-2xl border flex items-center justify-center relative overflow-hidden shrink-0 ${feature.accent}`}
                >
                  {/* Radar ripple for Forum */}
                  {i === 1 && isHovered && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-secondary/15 animate-ping opacity-60" />
                      <div className="absolute inset-0 rounded-2xl bg-secondary/10 scale-150 animate-pulse duration-1000" />
                    </>
                  )}

                  {/* Scanning Line sweep for AI */}
                  {i === 2 && isHovered && (
                    <motion.div
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent z-10"
                      animate={{ y: [-15, 35, -15] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  {/* Fan documents for Apuntes */}
                  {i === 0 && isHovered ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <motion.div
                        className="absolute w-3.5 h-4.5 bg-accent/20 border border-accent/40 rounded-[2px]"
                        initial={{ rotate: 0, x: 0 }}
                        animate={{ rotate: -22, x: -5, y: -2 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      />
                      <motion.div
                        className="absolute w-3.5 h-4.5 bg-accent/20 border border-accent/40 rounded-[2px]"
                        initial={{ rotate: 0, x: 0 }}
                        animate={{ rotate: 22, x: 5, y: -2 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      />
                      <Icon className="w-5.5 h-5.5 relative z-10" />
                    </div>
                  ) : (
                    <Icon className="w-5.5 h-5.5 transition-transform duration-300 group-hover:scale-105" />
                  )}
                </div>

                <h3 className="font-heading font-black text-xl text-foreground">
                  {feature.title}
                </h3>
              </div>

              {/* CARD EXPANDABLE BODY */}
              <motion.div
                initial={{ height: "auto" }} // Collapsed state initially doesn't hide everything, but expands with rich visuals
                className="overflow-hidden"
              >
                {/* Description - always visible, but fades slightly if not active */}
                <p className="text-xs.5 md:text-sm text-muted-foreground leading-relaxed transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Animated Mini-Preview Drawer */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 18 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                      className="overflow-hidden"
                    >
                      {/* 1. APUNTES PREVIEW */}
                      {feature.previewType === "apuntes" && (
                        <div className="bg-card/40 border border-border/20 rounded-2xl p-3 space-y-2 text-[10px]">
                          <div className="flex justify-between items-center bg-background/50 border border-border/10 p-2 rounded-xl">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-accent" />
                              <span className="font-bold truncate max-w-[120px]">Análisis_II_Resumen.pdf</span>
                            </div>
                            <span className="bg-accent/10 text-accent font-black px-1.5 py-0.5 rounded text-[8px]">AM II</span>
                          </div>
                          <div className="flex justify-between items-center bg-background/50 border border-border/10 p-2 rounded-xl">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-secondary" />
                              <span className="font-bold truncate max-w-[120px]">Algoritmos_TP3.cpp</span>
                            </div>
                            <span className="bg-secondary/10 text-secondary font-black px-1.5 py-0.5 rounded text-[8px]">Algo II</span>
                          </div>
                        </div>
                      )}

                      {/* 2. FORO PREVIEW */}
                      {feature.previewType === "foro" && (
                        <div className="bg-card/40 border border-border/20 rounded-2xl p-3 space-y-2 text-[10px] select-none">
                          <div className="flex gap-2">
                            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center font-bold text-[8px] text-accent shrink-0">
                              A
                            </div>
                            <div className="bg-background/60 border border-border/10 px-2 py-1.5 rounded-xl rounded-tl-sm max-w-[180px]">
                              Che, ¿cómo da el ejercicio 3 del TP?
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <div className="bg-secondary/10 border border-secondary/10 px-2 py-1.5 rounded-xl rounded-tr-sm max-w-[180px] text-right">
                              ¡Sale con L'Hopital! Da x = 5.
                            </div>
                            <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-[8px] text-secondary shrink-0">
                              C
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. IA PREVIEW */}
                      {feature.previewType === "ia" && (
                        <div className="bg-card/40 border border-border/20 rounded-2xl p-3 text-[10px] space-y-2 select-none">
                          <div className="flex items-center gap-1.5 font-bold text-accent">
                            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                            <span>Tutor IA RAG</span>
                          </div>
                          <div className="bg-background/60 border border-border/10 p-2 rounded-xl leading-relaxed text-muted-foreground">
                            Paginación divide la memoria física en marcos fijos... <span className="text-accent font-bold cursor-pointer underline">Ver en Apunte Pág 14</span>
                          </div>
                        </div>
                      )}

                      {/* Accent Arrow Indicator */}
                      <div className="flex items-center gap-1 mt-4 text-[10px] font-bold uppercase tracking-wider text-accent justify-end">
                        <span>Ver más</span>
                        <ArrowRight className="w-3 h-3 text-accent animate-pulse" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
