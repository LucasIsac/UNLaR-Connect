import Link from "next/link";
import { ArrowUpRight, Code2, MessageCircle, Share2 } from "lucide-react";
import { CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-border/10 bg-background/50 backdrop-blur-3xl pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top Section: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="UNLaR-Connect" className="w-8 h-8" />
              <span className="font-heading font-black text-base tracking-tight">
                UNLaR<span className="text-accent">-Connect</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hecho por y para estudiantes. La red colaborativa definitiva para potenciar tu carrera académica en la UNLaR.
            </p>
            <div className="flex gap-4 mt-2">
              <a
                href={CONFIG.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all hover-glow-subtle"
              >
                <Code2 className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all hover-glow-subtle"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all hover-glow-subtle"
              >
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Características Column */}
          <div className="flex flex-col gap-3">
            <h4 className="font-heading font-bold text-sm text-foreground mb-2">Características</h4>
            <Link href={CONFIG.routes.apuntes} className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 group">
              Banco de Apuntes <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href={CONFIG.routes.foros} className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 group">
              Foros de Discusión <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href={CONFIG.routes.chat} className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 group">
              Asistente IA con RAG <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href={CONFIG.routes.tutorias} className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 group">
              Tutorías entre Pares <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href={CONFIG.routes.karma} className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 group">
              Gamificación de Karma <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>

          {/* Comunidad Column */}
          <div className="flex flex-col gap-3">
            <h4 className="font-heading font-bold text-sm text-foreground mb-2">Comunidad</h4>
            <Link href={CONFIG.routes.sistemas} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ing. en Sistemas</Link>
            <Link href={CONFIG.routes.licSistemas} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lic. en Sistemas</Link>
            <Link href={CONFIG.routes.ranking} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ranking de Estudiantes</Link>
            <Link href={CONFIG.routes.materias} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Materias Sugeridas</Link>
          </div>

          {/* Plataforma Column */}
          <div className="flex flex-col gap-3">
            <h4 className="font-heading font-bold text-sm text-foreground mb-2">Plataforma</h4>
            <Link href={CONFIG.routes.terminos} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Términos de Servicio</Link>
            <Link href={CONFIG.routes.privacidad} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Políticas de Privacidad</Link>
            <Link href={CONFIG.routes.soporte} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Centro de Soporte</Link>
            <a
              href={CONFIG.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              Repositorio GitHub <Code2 className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground/60 text-center sm:text-left">
            © {new Date().getFullYear()} UNLaR-Connect. Un proyecto Open Source para la Universidad Nacional de La Rioja.
          </p>
        </div>
      </div>
    </footer>
  );
}
