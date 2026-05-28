"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, Sparkles, Code2, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.05 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Framer Motion Magnetic Button Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 140, mass: 0.15 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // magnetic pull ratio (0.3)
    mouseX.set(x * 0.3);
    mouseY.set(y * 0.3);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Scoped Canvas Particle Convergence Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animFrame: number;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      speed: number;
      radius: number;
      alpha: number;
      wiggleSeed: number;
    };

    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
      init();
    }

    function init() {
      particles = [];
      const count = window.innerWidth < 768 ? 30 : 65;
      for (let i = 0; i < count; i++) {
        // Spawn particles closer to outer bounds
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = Math.max(width, height) * 0.4 + Math.random() * 200;
        const x = width / 2 + Math.cos(angle) * spawnDist;
        const y = height / 2 + Math.sin(angle) * spawnDist;

        particles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          speed: Math.random() * 0.75 + 0.3,
          radius: Math.random() * 1.5 + 0.5,
          alpha: 0,
          wiggleSeed: Math.random() * 100,
        });
      }
    }

    function tick() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      const targetX = width / 2;
      const targetY = height / 2 - 80; // approximate Y position of CTA button center

      const isCurrentDark = document.documentElement.classList.contains("dark");
      const COLOR = isCurrentDark ? "245, 158, 11" : "120, 53, 15"; // Vibrant Amber or Terracotta Brown

      for (let p of particles) {
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Reset if they get too close to the button (converged)
        if (dist < 40) {
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = Math.max(width, height) * 0.5;
          p.x = targetX + Math.cos(angle) * spawnDist;
          p.y = targetY + Math.sin(angle) * spawnDist;
          p.alpha = 0;
        }

        // Attraction vector towards target Y/X
        p.vx = (dx / dist) * p.speed;
        p.vy = (dy / dist) * p.speed;

        // Apply orbital force drift
        const orbitAngle = Math.atan2(dy, dx) + Math.PI / 2;
        const orbitPull = 0.15; // swirl force
        p.vx += Math.cos(orbitAngle) * orbitPull;
        p.vy += Math.sin(orbitAngle) * orbitPull;

        // Organic wavy movement
        p.x += p.vx + Math.sin(dist * 0.015 + p.wiggleSeed) * 0.18;
        p.y += p.vy + Math.cos(dist * 0.015 + p.wiggleSeed) * 0.18;

        // Opacity mapping (Fades in from edges, fades out very close to the center)
        if (dist > 300) {
          p.alpha = Math.min(p.alpha + 0.01, 0.35);
        } else if (dist < 150) {
          p.alpha = Math.max(p.alpha - 0.02, 0);
        } else {
          p.alpha = 0.35;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR}, ${p.alpha})`;
        ctx.fill();
      }

      animFrame = requestAnimationFrame(tick);
    }

    resize();
    tick();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const stats = [
    {
      icon: Heart,
      title: "100% Gratis",
      desc: "Creado por y para estudiantes. Sin suscripciones ni costos ocultos.",
      accentClass: "text-red-400 border-red-500/20 bg-red-500/5",
    },
    {
      icon: Sparkles,
      title: "Tutor IA 24/7",
      desc: "Tus PDFs convertidos en conocimiento dinámico, disponible al instante.",
      accentClass: "text-accent border-accent/20 bg-accent/5",
    },
    {
      icon: Code2,
      title: "Código Abierto",
      desc: "Colaborativo, transparente y hospedado para toda la comunidad UNLaR.",
      accentClass: "text-secondary border-secondary/20 bg-secondary/5",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative z-10 min-h-screen py-32 flex flex-col items-center justify-center px-6 text-center overflow-hidden w-full"
    >
      {/* Background convergence canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-20">
        <div
          className={`w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-500 ${
            isDark ? "bg-accent/5" : "bg-primary/5"
          }`}
        />
      </div>

      {/* SECTION TOP: Copy */}
      <motion.p
        className="text-xs font-bold text-accent/70 tracking-[0.2em] uppercase mb-5"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        Llegó tu turno
      </motion.p>

      <motion.h2
        className="font-heading text-4xl sm:text-6.5xl font-black tracking-tight max-w-3xl leading-[1.05] mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.75, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
      >
        ¿Todavía estudiás{" "}
        <span className="text-accent relative inline-block">
          solo
          <span className="absolute -bottom-1 left-0 right-0 h-2 rounded bg-accent/15 border-b border-accent/20" />
        </span>
        ?
      </motion.h2>

      <motion.p
        className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
      >
        Unite a los estudiantes de la UNLaR que ya conectaron su forma de aprender, coordinan tutorías y estudian con inteligencia artificial.
      </motion.p>

      {/* SECTION MIDDLE: Magnetic spring CTA button */}
      <motion.div
        className="relative z-20 mb-24 px-8 py-8 cursor-pointer flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
      >
        {/* Glow ambient ring pulses */}
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center">
          <motion.div
            className="absolute w-52 h-20 rounded-full border border-accent/20 bg-accent/5 -z-10"
            animate={{
              scale: isHovered ? [1, 1.25, 1] : [1, 1.1, 1],
              opacity: isHovered ? [0.4, 0.05, 0.4] : [0.2, 0.05, 0.2],
            }}
            transition={{
              duration: isHovered ? 1.5 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-44 h-16 rounded-full border border-accent/30 -z-10"
            animate={{
              scale: isHovered ? [1, 1.15, 1] : [1, 1.05, 1],
              opacity: isHovered ? [0.6, 0.1, 0.6] : [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: isHovered ? 1.2 : 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </div>

        {/* The actual magnetic button container */}
        <motion.div
          style={{ x: springX, y: springY }}
          className="relative"
          whileHover={{ scale: 1.035 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-11 py-4.5 rounded-2xl bg-accent text-accent-foreground font-black text-sm.5 tracking-wide hover:bg-accent/95 shadow-2xl shadow-accent/20 transition-all active:shadow-accent/10 select-none"
          >
            <span>Registrate Gratis</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>

      {/* SECTION BOTTOM: Honest, premium qualitative stats blocks */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left select-none relative z-10 mt-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              className="bg-glass border border-border/10 rounded-2xl.5 p-6 hover-glow-subtle flex flex-col justify-between"
              initial={{ opacity: 0, y: 35 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.3 + idx * 0.15,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
              <div>
                {/* Stat Icon */}
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-5 shrink-0 ${stat.accentClass}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <h3 className="font-heading font-black text-base.5 text-foreground mb-2">
                  {stat.title}
                </h3>
                <p className="text-xs.5 text-muted-foreground leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
