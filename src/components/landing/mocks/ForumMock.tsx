"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, MessageCircle, Eye, Plus, Pin, AlertTriangle } from "lucide-react";

export default function ForumMock({ isDark }: { isDark: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState("Todos los Debates");
  const [showModal, setShowModal] = useState(false);
  
  // Interactive states for likes and tooltips
  const [likedThreads, setLikedThreads] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const threads = [
    {
      title: "Grupo de estudio para rendir final de Álgebra Lineal",
      author: "Marcos G. · Ing. Sistemas",
      avatar: "MG",
      avatarBg: "bg-accent/20 border-accent/30 text-accent",
      replies: 14,
      likes: 22,
      views: 110,
      tag: "Estudio",
      tagBg: "bg-accent/10 text-accent border-accent/15",
      isPinned: true,
      category: "Mis Carreras",
    },
    {
      title: "Tutorías de Next.js y Server Actions (¡ayudo con el TP final!)",
      author: "Laura B. · Tutora Avanzada",
      avatar: "LB",
      avatarBg: "bg-secondary/20 border-secondary/30 text-secondary",
      replies: 8,
      likes: 31,
      views: 95,
      tag: "Tutorías",
      tagBg: "bg-secondary/15 text-secondary border-secondary/20",
      isPinned: false,
      category: "Tutorías Co-Estudio",
    },
    {
      title: "Resuelto completo del primer parcial de Química General",
      author: "Enzo P. · Ing. Industrial",
      avatar: "EP",
      avatarBg: "bg-accent/10 border-accent/20 text-accent/80",
      replies: 5,
      likes: 19,
      views: 74,
      tag: "Apuntes",
      tagBg: "bg-accent/5 text-accent/80 border-accent/10",
      isPinned: false,
      category: "Mis Carreras",
    },
  ];

  const toggleLike = (title: string) => {
    setLikedThreads((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const triggerTooltip = (title: string) => {
    setActiveTooltip(activeTooltip === title ? null : title);
    // Auto-fade out tooltip after 2.2 seconds
    setTimeout(() => {
      setActiveTooltip((current) => (current === title ? null : current));
    }, 2200);
  };

  const filteredThreads = threads.filter((thread) => {
    if (selectedCategory === "Todos los Debates") return true;
    return thread.category === selectedCategory;
  });

  return (
    <div className="w-full h-full p-5 flex flex-col gap-3.5 overflow-hidden select-none text-left relative">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h4 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-secondary shrink-0" />
            <span>Foros Estudiantiles</span>
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Preguntá, respondé y coordiná tutorías con otros estudiantes.
          </p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-secondary/15 border border-secondary/35 text-secondary hover:bg-secondary hover:text-white transition-all text-[9.5px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1 shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Crear Post</span>
        </button>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-4 shrink-0 pb-1 border-b border-border/10">
        {["Todos los Debates", "Mis Carreras", "Tutorías Co-Estudio"].map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <span
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[9.5px] font-black pb-1 cursor-pointer transition-all border-b-2 px-0.5 ${
                isActive
                  ? "text-secondary border-secondary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {cat}
            </span>
          );
        })}
      </div>

      {/* Threads List */}
      <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-grow scrollbar-none py-0.5">
        <AnimatePresence mode="popLayout">
          {filteredThreads.map((thread, idx) => {
            const isLiked = likedThreads[thread.title];
            const likesCount = thread.likes + (isLiked ? 1 : 0);

            return (
              <motion.div
                key={thread.title}
                layout
                className="rounded-2xl p-4 bg-card/40 border border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:border-secondary/30 hover:bg-card/60 transition-all duration-300 shadow-sm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border ${thread.avatarBg}`}>
                    {thread.avatar}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${thread.tagBg}`}>
                        {thread.tag}
                      </span>
                      {thread.isPinned && (
                        <span className="text-[8px] font-bold text-accent bg-accent/5 border border-accent/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                          <Pin className="w-2.5 h-2.5 rotate-45 shrink-0" />
                          Anclado
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground truncate">{thread.author}</span>
                    </div>
                    
                    <h5 className="font-heading font-black text-[12px] text-foreground leading-snug group-hover:text-secondary transition-colors duration-200">
                      {thread.title}
                    </h5>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3.5 pl-11 md:pl-0 shrink-0">
                  {/* Heart Like Button */}
                  <span 
                    onClick={() => toggleLike(thread.title)}
                    className="flex items-center gap-1 text-[9.5px] transition-colors cursor-pointer select-none"
                    style={{ color: isLiked ? "#ef4444" : "var(--muted-foreground)" }}
                  >
                    <Heart 
                      className="w-3.5 h-3.5 shrink-0 transition-transform active:scale-75"
                      style={{ 
                        fill: isLiked ? "#ef4444" : "none",
                        color: isLiked ? "#ef4444" : "currentColor" 
                      }} 
                    />
                    <span>{likesCount}</span>
                  </span>

                  {/* Comment Tooltip Trigger */}
                  <div className="relative">
                    <span 
                      onClick={() => triggerTooltip(thread.title)}
                      className="flex items-center gap-1 text-[9.5px] text-muted-foreground hover:text-secondary transition-colors cursor-pointer select-none"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0 active:scale-75" />
                      <span>{thread.replies}</span>
                    </span>

                    {/* Floating Argentine Tooltip Balloon */}
                    <AnimatePresence>
                      {activeTooltip === thread.title && (
                        <motion.div
                          className="absolute bottom-full mb-2.5 right-0 bg-card border border-secondary/40 text-secondary font-black text-[7.5px] tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-xl z-20 whitespace-nowrap flex items-center gap-1"
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 350, damping: 14 }}
                        >
                          ¡REGISTRATE, PIBE!
                          {/* Triangle Pointer aligned directly above the MessageCircle icon */}
                          <div className="absolute top-full right-[15px] w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] border-t-secondary/40" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Views */}
                  <span className="flex items-center gap-1 text-[9.5px] text-muted-foreground">
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    {thread.views}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* MOCK ALERT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-5 z-50 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-card border border-secondary/30 rounded-2xl p-5 max-w-[280px] text-center shadow-xl relative"
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-9 h-9 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center mx-auto text-secondary mb-3 shrink-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
              </div>
              
              <h5 className="font-heading font-black text-xs text-foreground mb-1.5 uppercase tracking-wide">
                ¡Pará un poquito!
              </h5>
              
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                Para armar debates o sumarte a tutorías en el foro tenés que registrarte primero. ¡No te quedés afuera!
              </p>
              
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full bg-secondary text-white font-black text-[9px] uppercase tracking-wider py-2 rounded-lg hover:bg-secondary/90 transition-all cursor-pointer shadow-md shadow-secondary/5"
                >
                  Registrate al toque
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full text-muted-foreground font-bold text-[8.5px] uppercase tracking-wider py-1 hover:text-foreground transition-all cursor-pointer"
                >
                  Seguir chusmeando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
