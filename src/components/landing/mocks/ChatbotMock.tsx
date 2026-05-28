"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, FileText, Send, BookOpen, AlertTriangle } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  citation?: string;
  page?: string;
  glow?: boolean;
}

export default function ChatbotMock({ isDark }: { isDark: boolean }) {
  const [activeSession, setActiveSession] = useState("Resumen de SO II");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Custom conversation flows for different session selections
  const [sessionsData, setSessionsData] = useState<Record<string, { topic: string; docsCount: number; messages: Message[] }>>({
    "Resumen de SO II": {
      topic: "Sistemas Operativos II",
      docsCount: 2,
      messages: [
        {
          sender: "user",
          text: "Explicame la diferencia entre paginación y segmentación según la cátedra.",
        },
        {
          sender: "ai",
          text: "Según los apuntes de la cátedra, la diferencia principal radica en cómo se divide lógicamente la memoria física:\n\n• Paginación: Divide la memoria en bloques de tamaño fijo (páginas). Es transparente para el programador.\n• Segmentación: Divide la memoria en segmentos de tamaño variable correspondientes a bloques lógicos del programa. Es visible para el programador.",
          citation: "Apunte_Memoria_U3.pdf",
          page: "Pág. 14",
        },
      ],
    },
    "Dudas de Álgebra": {
      topic: "Álgebra Lineal",
      docsCount: 1,
      messages: [
        {
          sender: "user",
          text: "¿Cómo calculo el rango de una matriz 3x3 de manera simple?",
        },
        {
          sender: "ai",
          text: "¡Buenas! Para calcular el rango de una matriz 3x3, lo más simple es aplicar el método de Gauss para escalonar la matriz (hacer ceros debajo de la diagonal principal). El rango final va a ser el número de filas no nulas que te queden. ¡Es una papa una vez que le agarrás la mano! 🥔",
          citation: "Algebra_Lineal_U1.pdf",
          page: "Pág. 6",
        },
      ],
    },
    "TP4 Grafos": {
      topic: "Estructuras de Datos",
      docsCount: 3,
      messages: [
        {
          sender: "user",
          text: "¿Cuándo conviene usar BFS y cuándo DFS en los ejercicios?",
        },
        {
          sender: "ai",
          text: "¡Qué hacés! BFS (búsqueda en anchura) te conviene cuando buscás el camino más corto en grafos sin pesos, porque explora nivel por nivel. DFS (profundidad) usalo si necesitás recorrer todo el grafo (por ejemplo, para detectar ciclos o resolver laberintos) porque va a fondo por una rama antes de volver.",
          citation: "Estructuras_Datos_TP4.pdf",
          page: "Pág. 32",
        },
      ],
    },
  });

  const sessionsList = [
    { title: "Resumen de SO II", time: "Hace 2h" },
    { title: "Dudas de Álgebra", time: "Ayer" },
    { title: "TP4 Grafos", time: "Hace 3d" },
  ];

  const currentSession = sessionsData[activeSession];

  // Auto-scroll chat flow to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [currentSession.messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText("");

    // 1. Add user message
    setSessionsData((prev) => ({
      ...prev,
      [activeSession]: {
        ...prev[activeSession],
        messages: [...prev[activeSession].messages, { sender: "user", text: userText }],
      },
    }));

    // 2. Trigger simulated typing status
    setIsTyping(true);

    // 3. Delayed witty AI reply
    setTimeout(() => {
      setIsTyping(false);
      setSessionsData((prev) => ({
        ...prev,
        [activeSession]: {
          ...prev[activeSession],
          messages: [
            ...prev[activeSession].messages,
            {
              sender: "ai",
              text: `Che, ¡qué buena pregunta! Pero andá a registrarte pibe, no te cuesta nada y así podés chatear con todos tus apuntes gratis en un segundo. 😉`,
              citation: "UNLaR_Connect.pdf",
              page: "Hackathon 2026",
              glow: true,
            },
          ],
        },
      }));
    }, 1300);
  };

  return (
    <div className="w-full h-full flex overflow-hidden select-none bg-background relative text-left">
      
      {/* BACKGROUND DECORATIVE GRADIENT GLOW */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.025)_0%,transparent_60%)]" />

      {/* HISTORIAL SIDEBAR (Left panel inside chat screen) */}
      <aside className="w-36 sm:w-44 bg-card/60 border-r border-border/10 flex flex-col shrink-0 p-3 h-full gap-3 select-none">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block pl-1">
          Historial
        </span>
        
        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 scrollbar-none">
          {sessionsList.map((sess) => {
            const isActive = activeSession === sess.title;
            return (
              <div
                key={sess.title}
                onClick={() => {
                  if (!isTyping) setActiveSession(sess.title);
                }}
                className={`p-2 rounded-xl border flex flex-col gap-0.5 cursor-pointer relative overflow-hidden transition-all duration-300 ${
                  isActive
                    ? "bg-accent/15 border-accent/25 text-accent shadow-sm"
                    : "bg-transparent border-transparent text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeSessionBar"
                    className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-accent" 
                  />
                )}
                <span className="text-[10px] font-bold truncate pl-1">{sess.title}</span>
                <span className="text-[8px] opacity-60 pl-1">{sess.time}</span>
              </div>
            );
          })}
        </div>
        
        <div className="pt-2 border-t border-border/10 shrink-0">
          <div className="w-full py-1.5 bg-accent text-accent-foreground font-black text-[9px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer hover:bg-accent/90 transition-all">
            <span>+ Nuevo Chat</span>
          </div>
        </div>
      </aside>

      {/* CHAT DISPLAY PANEL */}
      <div className="flex-grow flex flex-col h-full overflow-hidden bg-card/10">
        
        {/* Document context header */}
        <div className="px-5 py-3 border-b border-border/10 flex items-center justify-between bg-card/65 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent shrink-0 animate-pulse" />
            <div>
              <h5 className="font-heading font-black text-[11.5px] text-foreground leading-none">
                {currentSession.topic}
              </h5>
              <div className="flex items-center gap-1.5 text-[8.5px] text-muted-foreground mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                <span>{currentSession.docsCount} {currentSession.docsCount === 1 ? "Apunte" : "Apuntes"} en Contexto</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            <span className="text-[8.5px] font-black px-2 py-0.7 bg-card border border-border/40 text-foreground rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
              Resumir
            </span>
            <span className="text-[8.5px] font-black px-2 py-0.7 bg-accent/15 border border-accent/30 text-accent rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all">
              Autoevaluación
            </span>
          </div>
        </div>

        {/* Message stream (NO OVERFLOW SCROLLBAR ISSUE - Welcoming banner removed) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-none h-full">
          <AnimatePresence initial={false}>
            {currentSession.messages.map((msg, index) => (
              <motion.div
                key={index}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start gap-2"}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {msg.sender === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/35 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-accent" />
                  </div>
                )}
                
                <div
                  className={`px-4 py-2.5 rounded-2xl text-[10.5px] leading-relaxed max-w-[85%] relative overflow-hidden shadow-sm ${
                    msg.sender === "user"
                      ? "bg-card border border-border/20 rounded-tr-none text-foreground"
                      : "bg-card border-l-2 border-accent rounded-tl-none text-foreground"
                  }`}
                  style={{
                    borderColor: msg.sender === "ai" ? "#f59e0b" : undefined,
                    boxShadow: msg.glow ? "0 0 15px rgba(245,158,11,0.08)" : undefined
                  }}
                >
                  {msg.sender === "ai" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                  )}
                  
                  <div className="relative z-10 space-y-2">
                    <p className="whitespace-pre-line text-foreground/90">{msg.text}</p>
                    
                    {msg.citation && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 bg-card border border-border/30 rounded-md shadow-sm shrink-0 select-none">
                        <FileText className="w-3 h-3 text-secondary shrink-0" />
                        <span className="text-[8.5px] text-muted-foreground truncate max-w-[120px]">
                          {msg.citation}
                        </span>
                        <span className="bg-accent/15 text-accent text-[7.5px] px-1 py-0.2 rounded font-bold shrink-0">
                          {msg.page}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* AI Typing loading state */}
            {isTyping && (
              <motion.div
                className="flex justify-start w-full gap-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/35 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-accent animate-spin" />
                </div>
                <div className="bg-card border-l-2 border-accent/40 px-4 py-2.5 rounded-2xl rounded-tl-none text-[10px] text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce shrink-0" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce shrink-0" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce shrink-0" style={{ animationDelay: "300ms" }} />
                  <span className="text-[9px] uppercase font-black tracking-widest text-accent/80 shrink-0 ml-1">
                    Copiloto escribiendo...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Auto-scroll end anchor removed in favor of direct container scrolling */}
        </div>

        {/* INPUT AREA (Fully editable now!) */}
        <div className="p-3 border-t border-border/10 bg-card/25 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center p-1 bg-card border border-border/40 focus-within:border-accent/40 rounded-xl shadow-sm transition-all"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              placeholder={isTyping ? "Esperá a que responda..." : "Preguntale a tus apuntes..."}
              className="flex-1 bg-transparent border-none text-[10px] py-1.5 px-2 focus:ring-0 text-foreground placeholder-muted-foreground/50 w-full disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="w-6 h-6 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-accent/15 disabled:hover:text-accent"
            >
              <Send className="w-3 h-3 shrink-0" />
            </button>
          </form>
          <p className="text-[7.5px] text-muted-foreground/45 text-center mt-1.5 leading-none select-none">
            La IA puede cometer errores. Verificá siempre con tus materiales oficiales.
          </p>
        </div>
      </div>
    </div>
  );
}
