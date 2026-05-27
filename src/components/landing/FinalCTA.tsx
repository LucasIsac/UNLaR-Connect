"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTA() {
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
      { threshold: 0.02 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Content */}
      <motion.p
        className="text-xs font-bold text-accent/60 tracking-[0.2em] uppercase mb-6"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        Tu turno
      </motion.p>

      <motion.h2
        className="font-heading text-4xl sm:text-6xl font-black tracking-tight max-w-3xl leading-[1.05] mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
      >
        Esto es lo que{" "}
        <span className="text-accent">te espera.</span>
      </motion.h2>

      <motion.p
        className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
      >
        Unite a los estudiantes de la UNLaR que ya están usando la plataforma para
        estudiar mejor, conectarse y aprender con IA.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      >
        <Link
          href="/dashboard"
          className="inline-block px-10 py-4 rounded-xl bg-accent text-accent-foreground font-bold text-sm tracking-wide hover:bg-accent/90 transition-colors shadow-xl shadow-accent/10"
        >
          Registrate ahora, es gratis
        </Link>
      </motion.div>

      {/* Divider line */}
      <motion.div
        className="w-px h-20 bg-gradient-to-b from-accent/20 to-transparent mx-auto mt-20"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={isInView ? { opacity: 1, scaleY: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{ originY: 0 }}
      />

    </section>
  );
}
