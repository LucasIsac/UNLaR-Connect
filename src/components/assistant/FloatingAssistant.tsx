"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

// ==========================================
// CONTEXT DEFINITIONS
// ==========================================

const PAGE_CONTEXT: Record<
  string,
  {
    title: string;
    description: string;
    tips: string[];
    actions: { label: string; href: string }[];
    greeting: string;
  }
> = {
  "/": {
    title: "Página de Inicio",
    description:
      "Conocé UNLaR Connect, la plataforma que conecta estudiantes de la Universidad Nacional de La Rioja.",
    tips: [
      "Registrate gratis para acceder a todas las funcionalidades",
      "Explorá el banco de apuntes para encontrar material de estudio",
      "Usá el asistente IA para preguntar sobre tus apuntes PDF",
    ],
    actions: [
      { label: "Ver Banco de Apuntes", href: "/recursos" },
      { label: "Ir al Dashboard", href: "/dashboard" },
    ],
    greeting:
      "¡Hola! Soy el asistente de UNLaR Connect. ¿En qué puedo ayudarte?",
  },
  "/dashboard": {
    title: "Dashboard",
    description:
      "Tu panel principal con resumen de actividad, reputación y accesos directos.",
    tips: [
      "Checkeá tu nivel de reputación en la tarjeta superior",
      "Mirá los próximos eventos de la universidad",
      "Accedé rápido a tus foros y tutorías desde el sidebar",
    ],
    actions: [
      { label: "Ver mi Reputación", href: "/karma" },
      { label: "Ir a Foros", href: "/foro" },
    ],
    greeting:
      "¡Bienvenido a tu dashboard! Acá tenés un resumen de toda tu actividad.",
  },
  "/recursos": {
    title: "Banco de Apuntes",
    description:
      "Compartí y encontrá apuntes, resúmenes y material de estudio por materia.",
    tips: [
      "Subí tus apuntes en PDF para ganar puntos de reputación",
      "Filtrá por materia para encontrar lo que necesitás",
      "Usá el chatbot IA para preguntar sobre el contenido de los PDFs",
    ],
    actions: [
      { label: "Subir Apunte", href: "/recursos" },
      { label: "Ir al Asistente IA", href: "/chat" },
    ],
    greeting:
      "Estás en el Banco de Apuntes. ¿Necesitás material de alguna materia?",
  },
  "/chat": {
    title: "Asistente IA",
    description:
      "Chateá con tu asistente IA que conoce tus apuntes y puede responder preguntas.",
    tips: [
      "Preguntale sobre cualquier tema de tus apuntes PDF",
      "El asistente cita las fuentes exactas de donde saca la información",
      "Podés preguntar para que te explique conceptos o te haga resúmenes",
    ],
    actions: [
      { label: "Ver Banco de Apuntes", href: "/recursos" },
      { label: "Ir al Dashboard", href: "/dashboard" },
    ],
    greeting:
      "¡Hola! Soy tu asistente IA. Preguntame lo que quieras sobre tus apuntes.",
  },
  "/foro": {
    title: "Foro Estudiantil",
    description:
      "Consultá, respondé y colaborá con tus compañeros en hilos organizados por materia.",
    tips: [
      "Creá un hilo con tu duda y ganá puntos de reputación",
      "Respondé preguntas de otros para subir tu nivel",
      "Si tu respuesta es elegida como mejor, ganás +50 puntos",
    ],
    actions: [
      { label: "Crear Nuevo Hilo", href: "/foro" },
      { label: "Ver Ranking", href: "/ranking" },
    ],
    greeting:
      "Bienvenido al Foro. ¿Tenés alguna duda académica o querés ayudar a un compañero?",
  },
  "/tutorias": {
    title: "Tutorías P2P",
    description:
      "Programá clases particulares con compañeros avanzados o ofrecé tus conocimientos.",
    tips: [
      "Filtrá tutores por materia y disponibilidad horaria",
      "Las tutorías se pueden hacer por videollamada o presencial",
      "Al completar una tutoría ganás +100 puntos de reputación",
    ],
    actions: [
      { label: "Ver Calendario", href: "/tutorias" },
      { label: "Ser Tutor", href: "/tutorias" },
    ],
    greeting:
      "Acá podés encontrar tutores o ofrecer tus servicios de tutoría. ¿Qué necesitás?",
  },
  "/karma": {
    title: "Tu Reputación",
    description:
      "Consultá tu nivel, insignias ganadas y cómo seguir ganando puntos.",
    tips: [
      "Cada acción en la plataforma te da puntos",
      "Los puntos desbloquean insignias y mejoran tu ranking",
      "Los mejores tutores aparecen primero en el ranking",
    ],
    actions: [
      { label: "Ver Ranking", href: "/ranking" },
      { label: "Ir al Foro", href: "/foro" },
    ],
    greeting:
      "Acá podés ver tu progreso de reputación. ¿Querés saber cómo ganar más puntos?",
  },
  "/ranking": {
    title: "Ranking de Estudiantes",
    description:
      "Conocé a los estudiantes más activos y colaborativos de la UNLaR.",
    tips: [
      "El ranking se actualiza en tiempo real",
      "Podés filtrar por carrera para ver compañeros de tu área",
      "Subí de nivel participando en foros y tutorías",
    ],
    actions: [
      { label: "Ver mi Reputación", href: "/karma" },
      { label: "Ir al Foro", href: "/foro" },
    ],
    greeting:
      "Estás en el ranking global. ¿Querés subir en la clasificación?",
  },
  "/eventos": {
    title: "Eventos UNLaR",
    description:
      "Seminarios, capacitaciones y actividades de la universidad.",
    tips: [
      "Inscribite a eventos para ganar +5 puntos de reputación",
      "Los eventos con inscripción abierta muestran el botón verde",
      "Revisá las fechas límite para no quedarte afuera",
    ],
    actions: [
      { label: "Ver Eventos", href: "/eventos" },
      { label: "Ir al Dashboard", href: "/dashboard" },
    ],
    greeting:
      "Acá están los próximos eventos de la UNLaR. ¿Querés inscribirte a alguno?",
  },
  "/perfil": {
    title: "Mi Perfil",
    description:
      "Editá tu información personal y configurá tu cuenta.",
    tips: [
      "Mantené tu perfil actualizado para que te encuentren en el ranking",
      "Si sos tutor, activá tu disponibilidad para recibir clases",
      "Tu foto de perfil se muestra en los foros y respuestas",
    ],
    actions: [
      { label: "Ver mi Reputación", href: "/karma" },
      { label: "Configurar Tutorías", href: "/tutorias" },
    ],
    greeting:
      "Acá podés gestionar tu perfil. ¿Necesitás ayuda con alguna configuración?",
  },
};

const DEFAULT_CONTEXT = {
  title: "UNLaR Connect",
  description: "Plataforma de estudio y colaboración para estudiantes de la UNLaR.",
  tips: [
    "Usá el sidebar para navegar entre secciones",
    "El asistente IA puede responder preguntas sobre tus apuntes",
    "Ganá reputación participando en la comunidad",
  ],
  actions: [
    { label: "Ir al Dashboard", href: "/dashboard" },
    { label: "Ver Foros", href: "/foro" },
  ],
  greeting: "¡Hola! Soy el asistente de UNLaR Connect. ¿En qué puedo ayudarte?",
};

// ==========================================
// QUICK RESPONSES
// ==========================================

const QUICK_RESPONSES: Record<string, string[]> = {
  "/": [
    "¿Qué es UNLaR Connect?",
    "¿Cómo me registro?",
    "¿Qué funcionalidades tiene?",
  ],
  "/dashboard": [
    "¿Cómo gano puntos?",
    "¿Qué significan las insignias?",
    "¿Cómo funciona el ranking?",
  ],
  "/recursos": [
    "¿Cómo subo un apunte?",
    "¿Qué formatos acepta?",
    "¿Cómo busco material?",
  ],
  "/chat": [
    "¿Qué puedo preguntarle?",
    "¿De dónde saca la información?",
    "¿Cómo funcionan las citas?",
  ],
  "/foro": [
    "¿Cómo creo un hilo?",
    "¿Cómo gano puntos en el foro?",
    "¿Qué es la mejor respuesta?",
  ],
  "/tutorias": [
    "¿Cómo me convierto en tutor?",
    "¿Las tutorías son pagas?",
    "¿Cómo programo una clase?",
  ],
};

const AI_RESPONSES: Record<string, string> = {
  "¿Qué es UNLaR Connect?":
    "UNLaR Connect es una plataforma web que conecta estudiantes de la UNLaR. Ofrece un banco de apuntes, foros académicos, tutorías entre pares, un chatbot con IA y un sistema de reputación.",
  "¿Cómo me registro?":
    "Hacé clic en 'Registrate Gratis' en la página de inicio. Necesitás un email válido de la universidad.",
  "¿Qué funcionalidades tiene?":
    "Tenés: Banco de Apuntes con chatbot IA, Foros por materia, Tutorías P2P con videollamada, Eventos universitarios y un sistema de Reputación con insignias.",
  "¿Cómo gano puntos?":
    "Ganás puntos creando hilos (+15), respondiendo (+10), siendo elegido como mejor respuesta (+50), recibiendo likes (+5), subiendo apuntes (+50) y completando tutorías (+100).",
  "¿Qué significan las insignias?":
    "Las insignias se desbloquean automáticamente al alcanzar ciertos niveles de puntos. Son reconocimientos de tu actividad en la plataforma.",
  "¿Cómo funciona el ranking?":
    "El ranking ordena a los estudiantes por puntos de reputación. Los 3 mejores aparecen en un podio. Podés filtrar por carrera.",
  "¿Cómo subo un apunte?":
    "Andá al Banco de Apuntes, hacé clic en 'Subí tu Apunte', elegí la materia, subí el PDF y listo. Ganás +50 puntos.",
  "¿Qué formatos acepta?":
    "Aceptamos archivos PDF. El tamaño máximo es de 15MB por archivo.",
  "¿Cómo busco material?":
    "Usá la barra de búsqueda o filtrá por materia. También podés usar el chatbot IA para preguntar sobre el contenido de los PDFs.",
  "¿Qué puedo preguntarle?":
    "Podés preguntarle sobre cualquier tema de tus apuntes PDF. Te responde citando las fuentes exactas. Por ejemplo: '¿Cuál es la diferencia entre paginación y segmentación?'",
  "¿De dónde saca la información?":
    "El asistente IA analiza los PDFs que subiste al banco de apuntes usando búsqueda semántica. Te cita la página exacta de donde saca la respuesta.",
  "¿Cómo funcionan las citas?":
    "Las citas se programan desde la sección de Tutorías. Elegís tutor, materia, horario y se agenda la clase. Puede ser por videollamada o presencial.",
  "¿Cómo creo un hilo?":
    "Andá al Foro, hacé clic en 'Creá un hilo', elegí la materia, escribí tu título y descripción. Podés adjuntar imágenes también.",
  "¿Cómo gano puntos en el foro?":
    "Creando hilos (+15), respondiendo preguntas (+10), y si tu respuesta es elegida como mejor (+50). También ganás por likes recibidos (+5).",
  "¿Qué es la mejor respuesta?":
    "Cuando creás un hilo y alguien te responde, podés marcar la mejor respuesta. El autor gana +50 puntos y vos +25 por seleccionarla.",
  "¿Cómo me convierto en tutor?":
    "Activá la opción de tutor en tu perfil. Necesitás tener un buen nivel de reputación. Después configurás tu disponibilidad horaria y las materias que podés enseñar.",
  "¿Las tutorías son pagas?":
    "Podés ofrecer tutorías gratuitas o pagas. La plataforma no cobra comisión, vos acordás el precio directamente con el alumno.",
  "¿Cómo programo una clase?":
    "Andá a Tutorías, buscá un tutor por materia, verificá su disponibilidad y solicitá una clase. El tutor puede aceptar o rechazar.",
  "default":
    "Buena pregunta. Para más información, podés revisar la sección de ayuda o preguntarme algo más específico sobre la funcionalidad que te interesa.",
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function FloatingAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't show on landing page or auth pages
  const isHidden = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/auth");

  const context = PAGE_CONTEXT[pathname] || DEFAULT_CONTEXT;
  const quickResponses = QUICK_RESPONSES[pathname] || QUICK_RESPONSES["/"];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when page changes
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [pathname]);

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response =
        AI_RESPONSES[messageText] ||
        `Buena pregunta sobre "${context.title}". ${AI_RESPONSES["default"]}`;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <>
      {/* Don't show on landing or auth pages */}
      {isHidden ? null : (
        <>
          {/* Floating Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-muted text-muted-foreground"
            : "bg-gradient-to-br from-accent to-secondary text-accent-foreground shadow-accent/30 hover:shadow-accent/50 hover:scale-110"
        }`}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Bot className="w-6 h-6" />
        )}
      </motion.button>

      {/* Notification dot when closed */}
      {!isOpen && messages.length === 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-14 h-14 pointer-events-none">
          <div className="absolute top-0 right-0 w-4 h-4 bg-secondary rounded-full animate-pulse border-2 border-background" />
        </div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-glass rounded-2xl border border-border/20 shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
            style={{ maxHeight: "calc(100vh - 8rem)" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-accent/10 to-secondary/10 border-b border-border/10 p-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Asistente UNLaR
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {context.title}
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  {/* Welcome */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                    <div className="bg-card/50 border border-border/10 rounded-xl rounded-tl-sm p-3 text-xs text-foreground leading-relaxed">
                      {context.greeting}
                    </div>
                  </div>

                  {/* Context Info */}
                  <div className="bg-accent/5 border border-accent/10 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                        Sobre esta página
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {context.description}
                    </p>
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3 h-3" />
                      Consejos
                    </p>
                    {context.tips.map((tip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(tip)}
                        className="w-full text-left text-[11px] text-muted-foreground bg-card/30 border border-border/10 rounded-lg p-2.5 hover:bg-card/50 hover:border-accent/20 transition-all flex items-center gap-2 group"
                      >
                        <ArrowRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <span>{tip}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  {context.actions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Acciones rápidas
                      </p>
                      <div className="flex gap-2">
                        {context.actions.map((action, i) => (
                          <a
                            key={i}
                            href={action.href}
                            className="flex-1 text-center text-[11px] font-semibold text-accent bg-accent/10 border border-accent/20 rounded-lg py-2 hover:bg-accent/20 transition-colors"
                          >
                            {action.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5 text-accent" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-accent text-accent-foreground rounded-tr-sm"
                            : "bg-card/50 border border-border/10 text-foreground rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div className="bg-card/50 border border-border/10 rounded-xl rounded-tl-sm px-3 py-2.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Response Chips */}
            {messages.length > 0 && (
              <div className="px-4 py-2 border-t border-border/10 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {quickResponses.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qr)}
                      className="whitespace-nowrap text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full px-2.5 py-1 hover:bg-accent/20 transition-colors shrink-0"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border/10 p-3 shrink-0">
              <div className="flex items-center gap-2 bg-card/50 border border-border/20 rounded-xl p-1.5 focus-within:border-accent/30 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escribí tu pregunta..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground focus:outline-none px-2 py-1.5"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-30 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </>
  );
}
