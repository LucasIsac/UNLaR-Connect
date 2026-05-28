"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bot, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

// --- ANIMATED COUNTER COMPONENT ---

function Counter({
  value,
  suffix = "",
  duration = 1.8,
  delay = 0,
  startTrigger,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  delay?: number;
  startTrigger: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startTrigger) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Easing: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    const timeoutId = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timeoutId);
  }, [value, duration, delay, startTrigger]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

// --- PARTICLE CLASS FOR CANVAS ---

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  speed: number;
}

// --- MAIN CTA SECTION ---

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const [isInView, setIsInView] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // IntersectionObserver to trigger animations
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

  // Ambient Particle Convergence Canvas logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: CanvasParticle[] = [];
    const particleCount = 40;

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Helper to spawn particles at edges
    const createParticle = (w: number, h: number, randomStart = false): CanvasParticle => {
      let x = Math.random() * w;
      let y = Math.random() * h;
      
      if (!randomStart) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = 0; y = Math.random() * h; } // Left
        else if (edge === 1) { x = w; y = Math.random() * h; } // Right
        else if (edge === 2) { x = Math.random() * w; y = 0; } // Top
        else { x = Math.random() * w; y = h; } // Bottom
      }

      return {
        x,
        y,
        vx: 0,
        vy: 0,
        alpha: Math.random() * 0.45 + 0.1,
        size: Math.random() * 1.5 + 0.6,
        speed: Math.random() * 0.45 + 0.15,
      };
    };

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(canvas.width, canvas.height, true));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Adapt particle colors to theme HSL (Dark: Amber 245, 158, 11 | Light: Terracotta 120, 53, 15)
      const isHtmlDark = document.documentElement.classList.contains("dark");
      const particleColor = isHtmlDark ? "245, 158, 11" : "148, 74, 35";

      particles.forEach((p, idx) => {
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 45) {
          // Respawn at edges when sucked into central button gravity
          particles[idx] = createParticle(canvas.width, canvas.height);
        } else {
          // Gravitational pull inward
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
          
          // Micro noise drift
          p.x += (Math.random() - 0.5) * 0.25;
          p.y += (Math.random() - 0.5) * 0.25;

          // Draw
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleColor}, ${p.alpha * (dist > 160 ? 1 : dist / 160)})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Magnetic Button hover tracker
  const handleMouseMove = (e: React.MouseEvent) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    
    // Capped cursor attraction translation (stretching button position towards cursor)
    setButtonPos({ x: x * 0.45, y: y * 0.45 });
  };

  const handleMouseLeave = () => {
    setButtonPos({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const statCards = [
    {
      value: 100,
      suffix: "%",
      label: "Gratuito y Libre",
      description: "Código abierto, sin vueltas ni publicidades molestas.",
      icon: CheckCircle2,
      accent: "text-accent border-accent/15",
    },
    {
      value: 24,
      suffix: "/7",
      label: "Soporte con Asistente IA",
      description: "Chateá con tus apuntes a cualquier hora al toque.",
      icon: Bot,
      accent: "text-secondary border-secondary/15",
    },
    {
      value: 5,
      suffix: "+",
      label: "Carreras Integradas",
      description: "Sistemas, Industrial, Enfermería y más integrándose.",
      icon: BookOpen,
      accent: "text-accent border-accent/15",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative z-10 min-h-screen py-24 flex flex-col items-center justify-center px-6 text-center overflow-hidden"
    >
      {/* 2D CANVAS GRAVITY VORTEX LAYER */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none -z-20" />

      {/* Ambient static backdrop glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-30">
        <div
          className={`w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-1000 opacity-20 ${
            isDark ? "bg-accent/10" : "bg-primary/20"
          }`}
        />
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        {/* Tu Turno Label */}
        <motion.p
          className="text-[11px] font-black text-accent/80 tracking-[0.25em] uppercase mb-6"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          Es tu turno
        </motion.p>

        {/* Argentine Provocative Headline */}
        <motion.h2
          className="font-heading text-4xl sm:text-6xl font-black tracking-tight max-w-3xl leading-[1.1] mb-6 flex flex-col items-center justify-center gap-1 select-none"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span>¿Todavía estudiás</span>
          <span className="relative px-5 py-1.5 text-accent inline-block select-none mt-1">
            <span className="absolute inset-0 bg-accent/5 dark:bg-accent/10 border border-accent/15 rounded-xl -z-10" />
            tan solo?
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed mb-16 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        >
          Unite a los estudiantes de la UNLaR que ya conectaron su forma de aprender, colaborar y salvar el cuatrimestre.
        </motion.p>

        {/* PROVABLE STATISTIC BLOCKS (No fake numbers!) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-16 px-4 relative z-10">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="rounded-2xl p-5 bg-card/45 border border-border/10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-accent/20 transition-all duration-300 backdrop-blur-md shadow-sm"
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
              >
                {/* Micro accent glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className={`w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center mb-3.5 ${stat.accent} shadow-sm shrink-0`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                
                <div className="font-heading text-2xl font-black text-foreground mb-1 select-none">
                  <Counter
                    value={stat.value}
                    suffix={stat.suffix}
                    delay={0.4 + idx * 0.15}
                    startTrigger={isInView}
                  />
                </div>
                
                <span className="text-[11px] font-bold text-foreground mb-1 block">
                  {stat.label}
                </span>
                
                <p className="text-[10px] text-muted-foreground/80 leading-normal max-w-[200px] text-center">
                  {stat.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* MAGNETIC REGISTER CTA BUTTON WITH CONCENTRIC GLOWS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            animate={{ x: buttonPos.x, y: buttonPos.y }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            className="relative p-1"
          >
            {/* Concentric amber idle expansion glows */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
              <motion.div
                className="absolute rounded-2xl border border-accent/25 w-[105%] h-[105%]"
                animate={isHovered ? { scale: [1, 1.45], opacity: [0.7, 0] } : { scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: isHovered ? 1.4 : 2.2, ease: "easeOut" }}
              />
              <motion.div
                className="absolute rounded-2xl border border-accent/15 w-[105%] h-[105%]"
                animate={isHovered ? { scale: [1, 1.25], opacity: [0.5, 0] } : { scale: [1, 1.15], opacity: [0.35, 0] }}
                transition={{ repeat: Infinity, duration: isHovered ? 1.4 : 2.2, ease: "easeOut", delay: isHovered ? 0.7 : 1.1 }}
              />
            </div>

            {/* Main Magnetic CTA Link */}
            <Link
              href="/dashboard"
              className="relative inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-accent text-accent-foreground font-black text-sm tracking-wider uppercase shadow-xl hover:bg-accent/95 shadow-accent/10 active:scale-95 transition-all select-none"
              style={{
                boxShadow: isHovered
                  ? (isDark ? "0 10px 40px rgba(245, 158, 11, 0.22)" : "0 10px 40px rgba(148, 74, 35, 0.16)")
                  : "0 4px 14px rgba(0,0,0,0.02)",
              }}
            >
              <span>Registrate ahora, es gratis</span>
              <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom vertical node link divider line */}
        <motion.div
          className="w-px h-20 bg-gradient-to-b from-accent/20 to-transparent mx-auto mt-24"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={isInView ? { opacity: 1, scaleY: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ originY: 0 }}
        />
      </div>
    </section>
  );
}
