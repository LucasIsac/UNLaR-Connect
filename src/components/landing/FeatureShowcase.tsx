"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, MessageSquare, Bot } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

const features = [
  {
    icon: FolderOpen,
    title: "Banco de Apuntes",
    description:
      "Subí y buscá apuntes de tus materias. Filtramos de manera inteligente para que encontrés lo que necesitás al toque, filtrado por materia, año y carrera.",
    accent: "text-accent",
    glowColor: "rgba(245,158,11,0.06)",
  },
  {
    icon: MessageSquare,
    title: "Foros y Tutorías P2P",
    description:
      "¿No entendés un tema? Creá un post en el foro de tu materia o coordiná una tutoría directa con un compañero que la tenga clara.",
    accent: "text-secondary",
    glowColor: "rgba(255,183,125,0.06)",
  },
  {
    icon: Bot,
    title: "Asistente IA",
    description:
      "Chateá directamente con tus PDFs subidos. Nuestro sistema RAG responde tus dudas en segundos usando los apuntes reales de tu carrera.",
    accent: "text-accent",
    glowColor: "rgba(245,158,11,0.06)",
  },
];

export default function FeatureShowcase() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

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

  return (
    <section
      id="features"
      ref={ref}
      className="relative z-10 px-6 py-32 max-w-6xl mx-auto w-full"
    >
      {/* Section label */}
      <motion.p
        className="text-xs font-bold text-accent/70 tracking-[0.2em] uppercase text-center mb-4"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Qué encontrás adentro
      </motion.p>

      <motion.h2
        className="font-heading text-3xl sm:text-4xl font-black text-center mb-16 tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Todo lo que necesitás,{" "}
        <span className="text-accent">en un solo lugar.</span>
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              className="bg-glass rounded-3xl p-8 relative overflow-hidden group hover-glow-subtle"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.2 + i * 0.15,
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
            >
              {/* Ambient glow blob inside card */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-125"
                style={{ 
                  background: i === 1
                    ? (isDark ? "rgba(255,183,125,0.06)" : "rgba(118,52,14,0.22)")
                    : (isDark ? "rgba(245,158,11,0.06)" : "rgba(97,59,0,0.22)")
                }}
              />

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-6 ${feature.accent} group-hover:scale-105 transition-transform duration-300`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <h3 className="font-heading font-bold text-xl mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
