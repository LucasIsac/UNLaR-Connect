"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Search, Download, Star, Eye, ArrowUpRight } from "lucide-react";

export default function ResourcesMock({ isDark }: { isDark: boolean }) {
  const subjects = ["Todos", "Análisis I", "Álgebra", "Sistemas", "Química"];
  const [selectedSubject, setSelectedSubject] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const documents = [
    {
      title: "Resumen de Derivadas y Límites",
      subject: "Análisis Mat. I",
      subjectKey: "Análisis I",
      author: "Sofia R.",
      rating: 4.9,
      downloads: 142,
      views: 320,
      size: "1.4 MB",
      date: "Hace 2 días",
      glow: "rgba(245,158,11,0.1)",
      description: "Resumen completo de límites, continuidad y derivadas con ejercicios prácticos resueltos para el primer parcial.",
    },
    {
      title: "Guía de Espacios Vectoriales",
      subject: "Álgebra Lineal",
      subjectKey: "Álgebra",
      author: "Carlos M.",
      rating: 4.8,
      downloads: 98,
      views: 210,
      size: "2.1 MB",
      date: "Hace 4 días",
      glow: "rgba(255,183,125,0.1)",
      description: "Conceptos clave de subespacios vectoriales, independencia lineal, bases y transformaciones de la cátedra.",
    },
    {
      title: "Práctica Resuelta TP3 - Grafos",
      subject: "Estructuras de Datos",
      subjectKey: "Sistemas",
      author: "Hernán F.",
      rating: 5.0,
      downloads: 184,
      views: 450,
      size: "980 KB",
      date: "Ayer",
      glow: "rgba(245,158,11,0.1)",
      description: "Resolución del TP3 detallando grafos conexos, árboles de expansión y algoritmos de búsqueda más comunes.",
    },
  ];

  // Filter documents based on search and subject
  const filteredDocuments = documents.filter((doc) => {
    const matchesSubject = selectedSubject === "Todos" || doc.subjectKey === selectedSubject;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="w-full h-full p-5 flex flex-col gap-4 overflow-hidden select-none text-left">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h4 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-accent shrink-0" />
            <span>Banco de Apuntes</span>
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Buscá y descargá resúmenes de tu carrera cargados por otros estudiantes.
          </p>
        </div>
        
        {/* Search */}
        <div className="flex items-center gap-2 bg-card/60 border border-border/30 rounded-full px-3 py-1.5 w-full sm:w-52 shrink-0">
          <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar apuntes..."
            className="w-full bg-transparent border-none text-[10.5px] p-0 focus:ring-0 text-foreground placeholder-muted-foreground/40 leading-tight"
          />
        </div>
      </div>

      {/* Subjects Category Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {subjects.map((sub) => {
          const isActive = selectedSubject === sub;
          return (
            <span
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`text-[9.5px] font-black px-3.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-card/40 border-border/20 text-muted-foreground hover:border-accent/30 hover:text-foreground"
              }`}
            >
              {sub}
            </span>
          );
        })}
      </div>

      {/* Grid of Note Cards (2 Columns to avoid squeezing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto pr-1 flex-1 py-0.5 scrollbar-none">
        <AnimatePresence mode="popLayout">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc, idx) => (
              <motion.div
                key={doc.title}
                layout
                className="rounded-2xl p-4 bg-card/50 border border-border/20 flex flex-col justify-between relative overflow-hidden group hover:border-accent/30 hover:bg-card/75 transition-all duration-300 shadow-sm h-fit self-start w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                {/* Soft backdrop glow on hover */}
                <div 
                  className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[32px] pointer-events-none opacity-25 transition-all duration-500 group-hover:scale-125 bg-gradient-to-br from-accent/20 to-transparent"
                />
                
                <div className="relative z-10 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[8px] font-black text-accent tracking-wider uppercase bg-accent/10 px-2 py-0.5 rounded-md border border-accent/10">
                      {doc.subject}
                    </span>
                    <span className="text-[8.5px] text-muted-foreground shrink-0">{doc.date}</span>
                  </div>
                  
                  <h5 className="font-heading font-black text-[11.5px] text-foreground leading-tight group-hover:text-accent transition-colors duration-200">
                    {doc.title}
                  </h5>
                  
                  <p className="text-[9.5px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                  
                  <p className="text-[8.5px] text-muted-foreground">
                    Subido por: <span className="font-semibold text-foreground">{doc.author}</span>
                  </p>
                </div>
                
                {/* Stats Footer */}
                <div className="mt-3.5 pt-2.5 border-t border-border/10 flex items-center justify-between relative z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent">
                      <Star className="w-2.5 h-2.5 fill-accent shrink-0" />
                      {doc.rating}
                    </span>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/20" />
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <Download className="w-2.5 h-2.5 shrink-0" />
                      {doc.downloads}
                    </span>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/20" />
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground animate-pulse">
                      <Eye className="w-2.5 h-2.5 shrink-0" />
                      {doc.views}
                    </span>
                  </div>
                  
                  <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              layout
              className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground col-span-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FolderOpen className="w-8 h-8 opacity-30 mb-2 text-accent animate-bounce" />
              <p className="text-xs font-black text-foreground">Che, no hay apuntes cargados acá</p>
              <p className="text-[9.5px] mt-1 text-muted-foreground/75 px-6">
                ¡Sé el primero en subir un apunte para salvar a la vagancia de {selectedSubject}!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
