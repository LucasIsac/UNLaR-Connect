// Page developed in collaboration with @martinprlt (https://github.com/martinprlt)
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Download,
  ThumbsUp,
  Bot,
  CloudUpload,
  ChevronDown,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  Plus,
  Search,
  Code2,
  Check,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageCircle,
  Eye,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  uploadResource,
  toggleSaveResource,
  castResourceVote,
  ResourceExtended
} from "@/actions/recursos";

const tabs = ["Recientes", "Más Valorados", "Mis Guardados"];

type RecursosClientProps = {
  initialResources: ResourceExtended[];
};

export default function RecursosClient({ initialResources }: RecursosClientProps) {
  const [resources, setResources] = useState<ResourceExtended[]>(initialResources);
  const loading = false;
  const [activeTab, setActiveTab] = useState(0);
  const [gridView, setGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // AI Active Context states (keeps a list of Resource objects currently active)
  const [aiContextList, setAiContextList] = useState<ResourceExtended[]>(
    () => initialResources.length > 1 ? [initialResources[1]] : []
  );

  // Detailed preview modal state
  const [selectedResource, setSelectedResource] = useState<ResourceExtended | null>(null);

  // Mini AI chat mockup states inside the preview modal
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Simulated PDF pages state
  const [currentPage, setCurrentPage] = useState(1);
  const totalMockPages = 12;

  // Sidebar Form States
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Sistemas Operativos");
  const [newAxis, setNewAxis] = useState("Gestión de Memoria");
  const [newType, setNewType] = useState("Apunte de Teoría");

  // Drag & drop styling state
  const [isDragging, setIsDragging] = useState(false);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initialize mini chatbot messages when a resource is selected
  useEffect(() => {
    if (!selectedResource) return;
    setChatMessages([
      {
        role: "assistant",
        content: `¡Hola! Soy tu asistente de IA. Leí completo el documento "${selectedResource.title}". ¿Qué querés preguntarme o resumir sobre él?`
      }
    ]);
    setChatInput("");
    setCurrentPage(1);
  }, [selectedResource]);

  const handleToggleAiContext = (rsc: ResourceExtended, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = aiContextList.some((item) => item.id === rsc.id);

    if (exists) {
      setAiContextList((prev) => prev.filter((item) => item.id !== rsc.id));
      showToast(`Quitaste "${rsc.title.slice(0, 20)}..." del contexto AI.`);
    } else {
      setAiContextList((prev) => [...prev, rsc]);
      showToast(`Agregaste "${rsc.title.slice(0, 20)}..." al contexto AI.`);
    }
  };

  const handleRemoveAiContextItem = (id: string) => {
    setAiContextList((prev) => prev.filter((item) => item.id !== id));
    showToast("Material quitado del contexto de IA.");
  };

  const handleUploadApunteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setActionInProgress("upload-resource");
    try {
      const response = await uploadResource(newTitle, newCategory, newAxis, newType);
      if (response.success && response.data) {
        setResources((prev) => [response.data!, ...prev]);
        showToast("¡Apunte subido! Sumaste 50 puntos de Karma y ya está listo para el Asistente AI 🚀");
        setNewTitle("");
      } else {
        showToast(response.error || "No se pudo registrar tu apunte.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLikeResourceSubmit = async (rscId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic UI Update
    setResources((prev) =>
      prev.map((r) => (r.id === rscId ? { ...r, likes: r.likes + 1 } : r))
    );
    showToast("¡Gracias por tu valoración! Aportás a la comunidad.");

    try {
      await castResourceVote(rscId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSaveResourceSubmit = async (rscId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic UI Update
    setResources((prev) =>
      prev.map((r) => (r.id === rscId ? { ...r, saved: !r.saved } : r))
    );

    try {
      const response = await toggleSaveResource(rscId);
      if (response.success) {
        showToast(response.saved ? "Guardado en tus favoritos ⭐️" : "Quitado de favoritos.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMiniChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedResource) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Artificial dynamic stream phase
      await new Promise((resolve) => setTimeout(resolve, 1200));

      let aiResp = `Che, te comento que según el documento de "${selectedResource.category}", en el apartado de "${selectedResource.thematicAxis}", se explica en profundidad que los principales conceptos a dominar son la resolución del caso y la aplicación del marco práctico.`;
      
      if (userMsg.toLowerCase().includes("resumi") || userMsg.toLowerCase().includes("resumen")) {
        aiResp = `Mirá, te armé un resumen al toque de este apunte:
1. **Introducción práctica**: Detalla el contexto de las guías de estudio.
2. **Conceptos Clave**: Sincronización, lógica y optimización de variables.
3. **Casos de TP**: Ejercicios resueltos paso a paso por ${selectedResource.authorName}.
¿Querés que profundice en algún punto?`;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: aiResp }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Filter resources
  const filteredResources = resources.filter((rsc) => {
    // 1. Tab filter
    if (activeTab === 2 && !rsc.saved) return false; // "Mis Guardados"
    
    // 2. Search query filter
    const matchesSearch =
      rsc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsc.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesSearch;
  }).sort((a, b) => {
    if (activeTab === 1) {
      return b.likes - a.likes; // "Más Valorados"
    }
    return b.id.localeCompare(a.id); // "Recientes" (fallback ID sort)
  });

  return (
    <DashboardLayout>
      <div className="animate-fade-in dashboard-bg min-h-full pb-10">
        
        {/* Dynamic Success Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="fixed bottom-6 right-6 z-50 bg-primary-container text-obsidian border border-accent/20 px-5 py-3 rounded-2xl shadow-xl shadow-accent/10 flex items-center gap-3 font-semibold text-sm"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Bot className="w-5 h-5 animate-pulse text-accent-foreground" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
              Banco de Recursos
            </h1>
            <p className="text-sm text-muted-foreground">
              Buscá, descargá y compartí apuntes oficiales de la comunidad estudiantil.
            </p>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-2 select-none">
            
            {/* Search Input bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscá apuntes, materias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-glass border border-border/40 rounded-full text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            <button className="px-3 py-1.5 bg-glass border border-border/40 text-muted-foreground rounded-full text-xs font-semibold hover:bg-muted/10 transition-colors flex items-center gap-1.5">
              Carrera: <span className="text-accent">Sistemas</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 bg-glass border border-border/40 text-muted-foreground rounded-full text-xs font-semibold hover:bg-muted/10 transition-colors flex items-center gap-1.5">
              Año: <span className="text-accent">Todos</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 bg-glass border border-border/40 text-muted-foreground rounded-full text-xs font-semibold hover:bg-muted/10 transition-colors flex items-center gap-1.5">
              Tipo: <span className="text-accent">PDFs</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Center Content: Resource list and tabs */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Navigation Tabs and Grid Layout Switcher */}
            <div className="flex items-center gap-4 border-b border-border/10 pb-2 mb-4 overflow-x-auto select-none">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`text-sm font-semibold pb-2 px-2 transition-colors whitespace-nowrap ${
                    activeTab === i
                      ? "text-accent border-b-2 border-accent font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="ml-auto flex gap-1 bg-card/45 border border-border/15 p-1 rounded-lg">
                <button
                  onClick={() => setGridView(true)}
                  className={`p-1.5 rounded transition-colors ${
                    gridView
                      ? "bg-accent/15 text-accent font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vista de grilla"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView(false)}
                  className={`p-1.5 rounded transition-colors ${
                    !gridView
                      ? "bg-accent/15 text-accent font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mount loading skeletons when loading is true */}
            {loading ? (
              <div className={gridView ? "grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse" : "space-y-3 animate-pulse"}>
                {[1, 2, 4, 6].map((n) => (
                  <div key={n} className="bg-glass rounded-2xl p-5 border border-primary/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="w-24 h-4 bg-muted/40 rounded" />
                      <div className="w-7 h-7 bg-muted/40 rounded" />
                    </div>
                    <div className="w-3/4 h-6 bg-muted/40 rounded" />
                    <div className="w-full h-10 bg-muted/40 rounded" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="w-16 h-4 bg-muted/40 rounded" />
                      <div className="w-16 h-4 bg-muted/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* List empty state */}
                {filteredResources.length === 0 && (
                  <div className="bg-glass rounded-2xl p-8 border border-border/20 text-center text-muted-foreground">
                    <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-semibold">No se encontraron apuntes cargados en esta sección.</p>
                    <p className="text-xs mt-1">¡Cargá tu material en el panel derecho para empezar!</p>
                  </div>
                )}

                {/* Resource Card List / Grid Layout switching with motion */}
                <motion.div
                  layout
                  className={
                    gridView
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-3"
                  }
                >
                  {filteredResources.map((rsc) => {
                    const isActiveInContext = aiContextList.some((item) => item.id === rsc.id);
                    return (
                      <motion.div
                        layout
                        key={rsc.id}
                        onClick={() => setSelectedResource(rsc)}
                        className="bg-glass rounded-2xl p-5 flex flex-col hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer hover:border-accent/25 relative border border-primary/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider inline-block w-max ${rsc.categoryColor}`}
                            >
                              {rsc.category}
                            </span>
                            {rsc.thematicAxis && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Eje: {rsc.thematicAxis}
                              </span>
                            )}
                          </div>

                          {/* AI Context selection button */}
                          <button
                            onClick={(e) => handleToggleAiContext(rsc, e)}
                            className={`p-1.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                              isActiveInContext
                                ? "bg-accent/20 border-accent text-accent"
                                : "bg-card/50 border-border/20 text-muted-foreground hover:text-accent hover:border-accent/40"
                            }`}
                            title={isActiveInContext ? "Quitar del contexto AI" : "Guardar en contexto AI"}
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="font-heading text-base font-bold text-cream-bone mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {rsc.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                          {rsc.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-border/10">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-accent/25 flex items-center justify-center text-[9px] font-bold text-accent">
                                {rsc.authorName.charAt(0)}
                              </div>
                              <span className="text-[11px] text-foreground font-medium">
                                {rsc.authorName}
                              </span>
                            </div>
                            {rsc.uploadedDate && (
                              <span className="text-[9px] text-muted-foreground mt-0.5">
                                Subido el {rsc.uploadedDate}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <button
                              onClick={(e) => handleLikeResourceSubmit(rsc.id, e)}
                              className="flex items-center gap-1 hover:text-accent transition-colors group/btn text-xs"
                              title="Valorar apunte"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span className="text-[11px]">{rsc.likes}</span>
                            </button>
                            <button
                              onClick={(e) => handleToggleSaveResourceSubmit(rsc.id, e)}
                              className={`p-1 rounded hover:bg-muted/10 transition-colors ${rsc.saved ? "text-accent" : ""}`}
                              title={rsc.saved ? "Quitar de favoritos" : "Guardar favorito"}
                            >
                              <Star className={`w-3.5 h-3.5 ${rsc.saved ? "fill-accent text-accent" : ""}`} />
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}

            {/* Load more button */}
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => showToast("Cargando más apuntes oficiales de la nube...")}
                className="px-5 py-2 bg-glass border border-border/40 text-muted-foreground rounded-full text-xs font-semibold hover:bg-muted/10 hover:text-foreground active:scale-95 transition-all flex items-center gap-2"
              >
                Cargar Más
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Right sidebar column: Upload zone and AI active context list */}
          <div className="space-y-6">

            {/* Loading placeholder sidebars if true */}
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-28" />
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-56" />
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-80" />
              </div>
            ) : (
              <>
                {/* Dynamic AI Active Context List */}
                <div className="bg-glass rounded-2xl p-5 relative border border-border/10">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
                    <Bot className="w-20 h-20 text-accent" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-accent mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Contexto Activo AI
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Tenés <strong className="text-foreground">{aiContextList.length} apuntes</strong> seleccionados para consultar directo con el Asistente AI.
                  </p>
                  
                  <AnimatePresence initial={false}>
                    {aiContextList.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 text-center border border-dashed border-border/30 rounded-xl text-[11px] text-muted-foreground animate-fade-in-up"
                      >
                        No hay apuntes en tu contexto. Seleccioná tocando el ícono de robot en cualquier tarjeta.
                      </motion.div>
                    ) : (
                      <motion.ul className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {aiContextList.map((item) => (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
                            className="bg-card/75 p-2 rounded-xl border border-border/20 flex justify-between items-center text-xs"
                          >
                            <span className="text-[11px] text-cream-bone truncate pr-2 font-medium flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                              {item.title}
                            </span>
                            <button
                              onClick={() => handleRemoveAiContextItem(item.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-muted/20 p-1 rounded transition-colors shrink-0"
                              title="Quitar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                  
                  <button 
                    onClick={() => {
                      if (aiContextList.length > 0) {
                        showToast("Abriendo Asistente AI con el contexto seleccionado...");
                      }
                    }}
                    disabled={aiContextList.length === 0}
                    className="w-full border border-accent/40 text-accent hover:bg-accent/15 transition-all text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Preguntar al Asistente IA
                  </button>
                </div>

                {/* Sidebar upload form */}
                <div className="bg-glass rounded-2xl p-6 border border-outline-variant shadow-lg relative overflow-hidden group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-container to-terracotta-soft opacity-10 blur-xl group-hover:opacity-20 transition-opacity" />
                  
                  <div className="relative z-10">
                    <h3 className="font-heading text-lg font-bold text-cream-bone mb-4 text-center">Subí tu Material</h3>
                    
                    <form onSubmit={handleUploadApunteSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Título del Apunte</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Resumen Completo Unidad 4"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">Materia</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                          >
                            <option>Sistemas Operativos</option>
                            <option>Bases de Datos</option>
                            <option>Paradigmas de Prog.</option>
                            <option>Análisis Matemático II</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">Eje Temático</label>
                          <select
                            value={newAxis}
                            onChange={(e) => setNewAxis(e.target.value)}
                            className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                          >
                            <option>Gestión de Memoria</option>
                            <option>Consultas SQL</option>
                            <option>Integrales Múltiples</option>
                            <option>Programación Funcional</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Tipo de Archivo</label>
                        <select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                        >
                          <option>Apunte de Teoría</option>
                          <option>Trabajo Práctico Resuelto</option>
                          <option>Examen Anterior</option>
                          <option>Otro</option>
                        </select>
                      </div>

                      {/* Dashed Drag & Drop simulator */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); showToast("¡Archivo detectado! Completá el título y dale a subir."); }}
                        className={`border-2 border-dashed rounded-xl p-5 hover:border-accent/50 transition-colors bg-card/30 cursor-pointer flex flex-col items-center justify-center text-center ${
                          isDragging ? "border-accent bg-accent/5" : "border-border/30"
                        }`}
                      >
                        <CloudUpload className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? "scale-110 text-accent" : "text-muted-foreground"}`} />
                        <span className="text-xs text-foreground font-semibold mb-0.5">Arrastrá tu archivo o hacé clic acá</span>
                        <span className="text-[10px] text-muted-foreground">PDF, DOCX (Máx 50MB)</span>
                      </div>

                      <button
                        type="submit"
                        disabled={actionInProgress === "upload-resource"}
                        className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-full hover:bg-accent/90 hover:scale-[1.01] active:scale-99 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/15 mt-4 disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                        Subir y Procesar con IA
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      {/* Dynamic Resource Details & PDF Previewer & AI Chat Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResource(null)}
            />

            <motion.div
              className="bg-glass rounded-3xl p-6 border border-accent/20 w-full max-w-4xl relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-border/10 pb-4 mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${selectedResource.categoryColor}`}>
                      {selectedResource.category}
                    </span>
                    <span>• Eje: {selectedResource.thematicAxis}</span>
                    <span>• Creador: {selectedResource.authorName}</span>
                  </div>
                  <h2 className="font-heading text-lg md:text-xl font-bold text-cream-bone leading-tight">
                    {selectedResource.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors focus:outline-none shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two Column details body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
                
                {/* Left Column: PDF Previewer Mockup */}
                <div className="space-y-4">
                  <h3 className="font-heading text-xs font-bold text-cream-bone uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-accent" />
                    Vista Previa del Documento
                  </h3>

                  {/* Document preview block */}
                  <div className="bg-obsidian/75 rounded-2xl p-6 aspect-[4/3] border border-border/10 flex flex-col justify-between relative overflow-hidden select-none">
                    
                    {/* Glowing background dots decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-[30px] rounded-full" />
                    
                    {/* PDF header details mockup */}
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-white/5 pb-2">
                      <span className="font-mono truncate w-2/3">{selectedResource.title.toLowerCase().replace(/\s+/g, '-')}.pdf</span>
                      <span className="font-semibold text-accent uppercase">PDF Reader</span>
                    </div>

                    {/* PDF main preview pages mockup */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-6 space-y-3">
                      <FileText className="w-12 h-12 text-accent/80 animate-pulse" />
                      <div className="space-y-1 w-full max-w-[250px]">
                        <p className="text-xs font-semibold text-cream-bone leading-tight">
                          Resumen - Universidad Nacional de La Rioja
                        </p>
                        <p className="text-[10px] text-muted-foreground italic truncate">
                          Sistemas & Apuntes de {selectedResource.category}
                        </p>
                        
                        {/* Mock content text lines */}
                        <div className="w-full h-1 bg-muted/20 rounded mt-3" />
                        <div className="w-3/4 h-1 bg-muted/20 rounded mx-auto" />
                      </div>
                    </div>

                    {/* PDF page controllers footer */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-white/5 pt-2 select-none">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 hover:text-foreground disabled:opacity-30 transition-opacity"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-mono">Página {currentPage} de {totalMockPages}</span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalMockPages, p + 1))}
                        disabled={currentPage === totalMockPages}
                        className="p-1 hover:text-foreground disabled:opacity-30 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => showToast("¡Apunte descargado! Guardado en descargas local.")}
                      className="flex-1 bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/15"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF Completo
                    </button>
                    
                    <button
                      onClick={(e) => handleToggleAiContext(selectedResource, e)}
                      className={`px-4 rounded-xl border transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-semibold ${
                        aiContextList.some((item) => item.id === selectedResource.id)
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-card/50 border-border/20 text-muted-foreground hover:text-accent hover:border-accent/40"
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                      {aiContextList.some((item) => item.id === selectedResource.id) ? "En Contexto AI" : "Cargar en Contexto"}
                    </button>
                  </div>
                </div>

                {/* Right Column: Dynamic RAG Chat Interface Terminal mockup */}
                <div className="flex flex-col h-[380px] bg-obsidian/45 rounded-2xl border border-border/10 p-4 relative overflow-hidden">
                  
                  {/* Glowing background amber decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none" />

                  <h3 className="font-heading text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2 relative z-10 select-none">
                    <Bot className="w-4 h-4" />
                    Preguntale al Asistente IA
                  </h3>

                  {/* Chat messages layout list */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-2 space-y-3.5 relative z-10">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 max-w-[85%] ${
                          msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black border ${
                          msg.role === "user" 
                            ? "bg-accent/25 border-accent text-accent" 
                            : "bg-card border-border/30 text-muted-foreground"
                        }`}>
                          {msg.role === "user" ? "U" : "IA"}
                        </div>
                        <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "bg-card/65 border border-border/5 text-muted-foreground"
                        }`}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Chat loader streaming display */}
                    {chatLoading && (
                      <div className="flex items-start gap-2.5 mr-auto max-w-[85%] animate-pulse">
                        <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black bg-card border border-border/30 text-muted-foreground">
                          IA
                        </div>
                        <div className="bg-card/65 border border-border/5 text-muted-foreground rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat input box trigger form */}
                  <form onSubmit={handleMiniChatSend} className="mt-3 pt-3 border-t border-white/5 relative z-10 flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ej: ¿Qué temas toma el examen libre?"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-card/60 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="bg-accent text-accent-foreground font-semibold px-3 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
