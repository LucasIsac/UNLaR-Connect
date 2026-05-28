// Page developed in collaboration with @martinprlt (https://github.com/martinprlt)
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ThumbsUp,
  MessageSquare,
  Pencil,
  SlidersHorizontal,
  Star,
  User,
  Plus,
  ArrowUp,
  ArrowDown,
  Code2,
  Flame,
  CheckCircle2,
  X,
  Search,
  BookOpen,
  Send,
  MessageCircle,
  GraduationCap,
  Calendar,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createForumPost,
  castPostVote,
  fetchPostReplies,
  addPostReply,
  resolvePost,
  ForumPostExtended
} from "@/actions/foros";
import { DbPostReply } from "@/types/database";

const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

const categories = [
  { label: "Todas", color: "text-foreground bg-muted border-border/40" },
  { label: "Duda Técnica", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  { label: "Consejo de Cursada", color: "text-accent bg-accent/10 border-accent/20" },
  { label: "Ayuda con TP", color: "text-teal-400 bg-teal-400/10 border-teal-400/20" },
];

const popularTags = [
  "#DudaTécnica",
  "#AyudaConTP",
  "#ConsejoDeCursada",
  "#MaterialDeEstudio",
  "#IngSistemas",
];

const topContributors = [
  { 
    name: "Prof. A. Martinez", 
    role: "Profesor Adjunto", 
    career: "Análisis Matemático II", 
    points: 8450, 
    rank: 1,
    badges: ["Docente Destacado", "Mentor de Oro", "Respuesta Sabia"],
    type: "Docente"
  },
  { 
    name: "Carla S.", 
    role: "Ayudante Alumna", 
    career: "Ingeniería en Sistemas", 
    points: 5120, 
    rank: 2,
    badges: ["Colaborador de Bronce", "Ayudante Pro", "Veloz en Código"],
    type: "Ayudante"
  },
  { 
    name: "Tu Perfil", 
    role: "Estudiante", 
    career: "Ingeniería en Sistemas", 
    points: 2450, 
    rank: 3,
    badges: ["Colaborador Activo", "Lector Veloz"],
    type: "Estudiante"
  },
];

type ForosClientProps = {
  initialThreads: ForumPostExtended[];
};

export default function ForosClient({ initialThreads }: ForosClientProps) {
  const [threads, setThreads] = useState<ForumPostExtended[]>(initialThreads);
  const loading = false;
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumPostExtended | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<typeof topContributors[0] | null>(null);
  
  // Thread comments loading state
  const [replies, setReplies] = useState<DbPostReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newReplyText, setNewReplyText] = useState("");

  // Voting state (maps thread.id to 'up' | 'down' | null)
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down" | null>>({});

  // New Thread Form States
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSubject, setNewSubject] = useState("Programación II");
  const [newCategory, setNewCategory] = useState("Duda Técnica");

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch replies when thread is selected
  useEffect(() => {
    if (!selectedThread) return;
    const threadId = selectedThread.id;
    async function loadReplies() {
      setRepliesLoading(true);
      try {
        const repliesData = await fetchPostReplies(threadId);
        setReplies(repliesData);
      } catch (err) {
        console.error("Error fetching post replies:", err);
      } finally {
        setRepliesLoading(false);
      }
    }
    loadReplies();
  }, [selectedThread]);

  const handleVote = async (threadId: string, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVote = userVotes[threadId] || null;

    // Optimistic UI update
    let diff = 0;
    if (currentVote === direction) {
      diff = direction === "up" ? -1 : 1;
    } else if (currentVote) {
      diff = direction === "up" ? 2 : -2;
    } else {
      diff = direction === "up" ? 1 : -1;
    }

    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, upvotes: t.upvotes + diff } : t))
    );
    setUserVotes((prev) => ({
      ...prev,
      [threadId]: currentVote === direction ? null : direction,
    }));

    try {
      await castPostVote(threadId, direction, currentVote);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, upvotes: t.upvotes - diff } : t))
      );
      setUserVotes((prev) => ({ ...prev, [threadId]: currentVote }));
      showToast("No se pudo guardar tu voto. Probá de nuevo.");
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setActionInProgress("create-post");
    try {
      const response = await createForumPost(newTitle, newDesc, newSubject, newCategory);
      if (response.success && response.data) {
        setThreads((prev) => [response.data!, ...prev]);
        setIsCreateModalOpen(false);
        showToast("¡Hilo publicado! Sumaste 15 puntos de Karma 🚀");
        
        // Reset inputs
        setNewTitle("");
        setNewDesc("");
      } else {
        showToast(response.error || "Error al crear el hilo.");
      }
    } catch (err) {
      console.error(err);
      showToast("Hubo un problema de conexión.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !selectedThread) return;

    setActionInProgress("add-reply");
    try {
      const response = await addPostReply(selectedThread.id, newReplyText);
      if (response.success && response.data) {
        setReplies(response.data);
        setNewReplyText("");
        showToast("¡Respuesta enviada!");
        
        // Update reply count in main list
        setThreads((prev) =>
          prev.map((t) => (t.id === selectedThread.id ? { ...t, repliesCount: t.repliesCount + 1 } : t))
        );
      } else {
        showToast(response.error || "No se pudo guardar tu comentario.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAsSolved = async (replyId?: string) => {
    if (!selectedThread) return;

    try {
      const response = await resolvePost(selectedThread.id, replyId);
      if (response.success) {
        showToast("¡Tema marcado como Solucionado! 🚀");
        
        // Update states locally
        setThreads((prev) =>
          prev.map((t) => (t.id === selectedThread.id ? { ...t, is_resolved: true } : t))
        );
        setSelectedThread((prev) => (prev ? { ...prev, is_resolved: true } : null));

        if (replyId) {
          setReplies((prev) =>
            prev.map((r) => (r.id === replyId ? { ...r, is_accepted: true } : r))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesCategory = selectedCategory === "Todas" || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subjectName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="animate-fade-in dashboard-bg min-h-full pb-10">
        
        {/* Toast alert popup */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="fixed bottom-6 right-6 z-50 bg-primary-container text-obsidian border border-accent/20 px-5 py-3 rounded-2xl shadow-xl shadow-accent/10 flex items-center gap-3 font-semibold text-sm"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Flame className="w-5 h-5 animate-pulse text-accent-foreground" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
              Foro Estudiantil
            </h1>
            <p className="text-sm text-muted-foreground">
              Resolvé tus dudas académicas, compartí tus conocimientos y ganá puntos de karma.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscá hilos o materias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-60 pl-9 pr-4 py-2 bg-glass border border-border/40 rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
            
            {/* Action button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-98 transition-all shrink-0 shadow-lg shadow-accent/10"
            >
              <Plus className="w-4 h-4" />
              Creá un hilo
            </button>
          </div>
        </div>

        {/* Main layout bento-grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main thread column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Category selection bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border/10 pb-3 mb-4 select-none">
              <div className="text-xs text-muted-foreground mr-2 font-semibold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtrar:
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    selectedCategory === cat.label
                      ? "bg-accent/20 border-accent text-accent font-bold"
                      : "bg-glass border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mount Skeletons Loader if Loading is true */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-glass rounded-2xl p-5 border border-primary/5 animate-pulse flex gap-4"
                  >
                    <div className="flex flex-col items-center gap-1 bg-card/45 rounded-xl px-2 py-3 h-24 w-11 shrink-0">
                      <div className="w-4 h-4 bg-muted/40 rounded" />
                      <div className="w-6 h-5 bg-muted/40 rounded mt-1" />
                      <div className="w-4 h-4 bg-muted/40 rounded mt-1" />
                    </div>
                    <div className="flex-grow space-y-3">
                      <div className="flex gap-2">
                        <div className="w-20 h-4.5 bg-muted/40 rounded" />
                        <div className="w-28 h-4.5 bg-muted/40 rounded" />
                      </div>
                      <div className="w-3/4 h-6 bg-muted/40 rounded" />
                      <div className="w-full h-10 bg-muted/40 rounded" />
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted/40" />
                          <div className="w-20 h-4 bg-muted/40 rounded" />
                        </div>
                        <div className="w-24 h-4 bg-muted/40 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Empty state if no threads match */}
                {filteredThreads.length === 0 && (
                  <div className="bg-glass rounded-2xl p-8 border border-border/20 text-center text-muted-foreground">
                    <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/55" />
                    <p className="text-sm font-semibold">No se encontraron hilos que coincidan con tu búsqueda.</p>
                    <p className="text-xs mt-1">¡Sé el primero en crear uno sobre este tema!</p>
                  </div>
                )}

                {/* List of threads with motion */}
                <motion.div layout className="space-y-4">
                  {filteredThreads.map((thread) => {
                    const userVote = userVotes[thread.id] || null;
                    return (
                      <motion.article
                        layout
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
                        className="bg-glass rounded-2xl p-5 border border-primary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300 relative group cursor-pointer"
                      >
                        <div className="flex gap-4">
                          
                          {/* Left: Interactive upvote counter */}
                          <div className="flex flex-col items-center gap-1 bg-card/45 border border-border/15 rounded-xl px-2 py-3 h-max min-w-[45px] shrink-0 select-none">
                            <button
                              onClick={(e) => handleVote(thread.id, "up", e)}
                              className={`p-1 rounded transition-colors ${
                                userVote === "up"
                                  ? "text-accent bg-accent/15"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/15"
                              }`}
                              title="Voto positivo"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <span className={`text-sm font-bold font-mono transition-colors ${
                              userVote === "up" ? "text-accent" : userVote === "down" ? "text-red-400" : "text-foreground"
                            }`}>
                              {thread.upvotes}
                            </span>
                            <button
                              onClick={(e) => handleVote(thread.id, "down", e)}
                              className={`p-1 rounded transition-colors ${
                                userVote === "down"
                                  ? "text-red-400 bg-red-400/15"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/15"
                              }`}
                              title="Voto negativo"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Right: Thread details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-3 mb-2 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${thread.categoryColor}`}>
                                  {thread.category}
                                </span>
                                {thread.subjectName && (
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    • {thread.subjectName}
                                  </span>
                                )}
                              </div>
                              
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(thread.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                              </span>
                            </div>

                            <h2 className="font-heading text-base md:text-lg font-bold text-cream-bone mb-2 group-hover:text-primary transition-colors duration-200">
                              {thread.title}
                            </h2>
                            
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                              {thread.content}
                            </p>

                            {/* Author info & Actions */}
                            <div className="flex justify-between items-center border-t border-border/10 pt-3">
                              
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-[11px] text-accent font-black">
                                  {thread.authorName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    {thread.authorName}
                                    {thread.githubUsername && (
                                      <span className="text-[9px] bg-accent/20 px-1 py-0.2 rounded text-accent font-bold">Colaborador</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Flame className="w-3 h-3 text-accent" />
                                    {thread.authorKarma.toLocaleString()} karma
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors text-xs font-semibold">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{thread.repliesCount} respuestas</span>
                                </button>
                                {thread.is_resolved && (
                                  <span className="flex items-center gap-1 text-green-400 font-bold text-[10px] bg-green-500/10 border border-green-500/25 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Solucionado</span>
                                  </span>
                                )}
                              </div>

                            </div>

                            {/* Best Answer Section preview */}
                            {thread.bestAnswer && (
                              <div className="mt-4 pl-4 border-l-2 border-accent/30">
                                <div className="bg-card/20 rounded-xl p-3.5 relative border border-accent/10">
                                  <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                                    <span className="font-bold text-accent">
                                      {thread.bestAnswer.author}
                                    </span>
                                    <span className="text-[8px] bg-accent-foreground/10 text-accent-foreground px-1 py-0.2 rounded font-mono">
                                      {thread.bestAnswer.role}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {thread.bestAnswer.content}
                                  </p>
                                </div>
                              </div>
                            )}

                          </div>

                        </div>
                      </motion.article>
                    );
                  })}
                </motion.div>
              </>
            )}

          </div>

          {/* Right sidebar column */}
          <div className="lg:col-span-4 space-y-6">

            {/* Pulsing right widgets skeleton if loading */}
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-36" />
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-32" />
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-44" />
              </div>
            ) : (
              <>
                {/* Popular Tags */}
                <div className="bg-glass rounded-2xl p-5 border border-border/10">
                  <h4 className="font-heading text-xs font-bold text-cream-bone uppercase tracking-wider mb-3">
                    Etiquetas Populares
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {popularTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="bg-card hover:bg-muted/15 border border-border/30 text-[11px] text-muted-foreground px-2.5 py-1 rounded-full transition-colors focus:outline-none"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Contributors list with interactive modal profile triggers */}
                <div className="bg-glass rounded-2xl p-5 border border-border/10">
                  <h4 className="font-heading text-xs font-bold text-cream-bone uppercase tracking-wider mb-3">
                    Top Contribuyentes
                  </h4>
                  <div className="space-y-3">
                    {topContributors.map((contrib) => (
                      <div
                        key={contrib.name}
                        onClick={() => setSelectedContributor(contrib)}
                        className="flex justify-between items-center bg-card/30 p-2.5 rounded-xl border border-border/5 hover:border-accent/25 transition-all duration-200 cursor-pointer"
                        title="Ver Perfil Académico"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                            {contrib.rank}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground block">
                              {contrib.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {contrib.role}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] bg-accent/15 border border-accent/25 text-accent font-bold px-1.5 py-0.5 rounded">
                          {contrib.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      {/* 1. Creá un hilo Backdrop modal form */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
            />

            <motion.div
              className="bg-glass rounded-3xl p-6 border border-accent/20 w-full max-w-lg relative z-10 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-lg font-bold text-cream-bone">
                  Crear un Nuevo Hilo
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateThreadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Título del Hilo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: ¿Cómo resolvemos el ejercicio 5 del TP2?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Materia / Cátedra
                    </label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    >
                      <option>Análisis Matemático II</option>
                      <option>Programación II</option>
                      <option>Algoritmos y Estructuras de Datos</option>
                      <option>Sistemas Operativos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Categoría
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    >
                      <option>Duda Técnica</option>
                      <option>Consejo de Cursada</option>
                      <option>Ayuda con TP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Descripción / Cuerpo de la duda
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Contanos tu duda detalladamente para que tus compañeros o profesores puedan ayudarte..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionInProgress === "create-post"}
                  className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/15 mt-6 disabled:opacity-40"
                >
                  <BookOpen className="w-4 h-4" />
                  Publicar Hilo Académico
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Thread Details & Comments Modal */}
      <AnimatePresence>
        {selectedThread && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedThread(null)}
            />

            <motion.div
              className="bg-glass rounded-3xl p-6 border border-accent/20 w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[85vh]"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start gap-4 mb-4 border-b border-border/10 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${selectedThread.categoryColor}`}>
                      {selectedThread.category}
                    </span>
                    {selectedThread.subjectName && (
                      <span className="text-xs text-muted-foreground font-semibold">
                        {selectedThread.subjectName}
                      </span>
                    )}
                    {selectedThread.is_resolved && (
                      <span className="flex items-center gap-1 text-green-400 font-bold text-[10px] bg-green-500/10 border border-green-500/25 px-1.5 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solucionado</span>
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading text-lg md:text-xl font-bold text-cream-bone leading-tight">
                    {selectedThread.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedThread(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors focus:outline-none shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable thread content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
                
                {/* Main post body */}
                <div className="space-y-4">
                  <p className="text-sm text-foreground/90 leading-relaxed bg-card/25 p-4 rounded-xl border border-border/5">
                    {selectedThread.content}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      Por: <strong className="text-foreground">{selectedThread.authorName}</strong> • {new Date(selectedThread.created_at).toLocaleDateString("es-AR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4.5 h-4.5 text-accent" />
                      {selectedThread.upvotes} votos
                    </span>
                  </div>
                </div>

                {/* Solved Trigger box for thread owner */}
                {!selectedThread.is_resolved && selectedThread.authorName === "Tu Perfil" && (
                  <div className="p-4 bg-accent/5 border border-accent/25 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent animate-bounce" />
                      <div>
                        <p className="text-xs font-bold text-cream-bone">¿Encontraste la solución?</p>
                        <p className="text-[10px] text-muted-foreground">Marcá tu hilo como solucionado para ayudar a otros estudiantes.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsSolved()}
                      className="px-3.5 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:scale-103 active:scale-97 transition-transform shrink-0"
                    >
                      Resolver
                    </button>
                  </div>
                )}

                {/* Replies / Comments Section */}
                <div className="border-t border-border/10 pt-4 space-y-4">
                  <h3 className="font-heading text-sm font-bold text-cream-bone flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-accent" />
                    Respuestas Académicas
                  </h3>

                  {repliesLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2].map((n) => (
                        <div key={n} className="bg-card/20 rounded-xl p-3.5 space-y-2 border border-primary/5">
                          <div className="w-20 h-4 bg-muted/40 rounded" />
                          <div className="w-full h-8 bg-muted/40 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {replies.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          Ningún comentario todavía. ¡Sé el primero en responder!
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {replies.map((reply) => (
                            <div 
                              key={reply.id} 
                              className={`rounded-xl p-4 border transition-all duration-200 ${
                                reply.is_accepted 
                                  ? "bg-accent/5 border-accent/30 shadow-[0_0_12px_rgba(245,158,11,0.05)]" 
                                  : "bg-card/30 border-border/5"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-accent">
                                    {reply.user_id === "user-prof-garcia" ? "Prof. García" : reply.user_id === MOCK_USER_ID ? "Tu Perfil" : "Estudiante"}
                                  </span>
                                  <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground font-mono">
                                    {reply.user_id === "user-prof-garcia" ? "Profesor" : "Estudiante"}
                                  </span>
                                  {reply.is_accepted && (
                                    <span className="flex items-center gap-1 text-[9px] text-accent bg-accent-foreground/10 px-2 py-0.2 rounded-full font-bold">
                                      <Star className="w-2.5 h-2.5 fill-accent" />
                                      Mejor Respuesta
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                {reply.content}
                              </p>
                              
                              {/* Accept comment buttons for original owner */}
                              {!selectedThread.is_resolved && selectedThread.authorName === "Tu Perfil" && reply.user_id !== MOCK_USER_ID && (
                                <button
                                  onClick={() => handleMarkAsSolved(reply.id)}
                                  className="text-[10px] text-accent hover:text-accent/80 font-bold flex items-center gap-1 focus:outline-none"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  Aceptar como mejor respuesta
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

              {/* Reply Form Footer */}
              <form onSubmit={handleAddReplySubmit} className="mt-4 border-t border-border/10 pt-4 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Escribí una respuesta con voseo..."
                  value={newReplyText}
                  onChange={(e) => setNewReplyText(e.target.value)}
                  className="flex-1 bg-card/60 border border-border/40 rounded-xl py-2.5 px-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                />
                <button
                  type="submit"
                  disabled={actionInProgress === "add-reply"}
                  className="bg-accent text-accent-foreground font-semibold px-4 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 shadow-lg shadow-accent/15"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Top Contributor profile details modal */}
      <AnimatePresence>
        {selectedContributor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContributor(null)}
            />

            <motion.div
              className="bg-glass rounded-3xl p-6 border border-accent/20 w-full max-w-sm relative z-10 shadow-2xl text-center flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <button
                onClick={() => setSelectedContributor(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-accent/25 border-2 border-accent flex items-center justify-center text-accent font-black text-xl mb-4 shadow-lg shadow-accent/10">
                {selectedContributor.name.charAt(0)}
              </div>

              <h3 className="font-heading text-lg font-bold text-cream-bone mb-1">
                {selectedContributor.name}
              </h3>
              
              <span className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-4 border border-border/10">
                {selectedContributor.role}
              </span>

              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                <div className="bg-card/45 p-3 rounded-xl border border-border/5">
                  <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Cátedra</span>
                  <span className="text-xs font-semibold text-foreground block truncate mt-0.5">{selectedContributor.career}</span>
                </div>
                <div className="bg-card/45 p-3 rounded-xl border border-border/5">
                  <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Ranking</span>
                  <span className="text-xs font-semibold text-accent block mt-0.5 font-mono">#{selectedContributor.rank} Global</span>
                </div>
              </div>

              {/* Contributor Badges details */}
              <div className="w-full space-y-2.5 text-left border-t border-border/10 pt-4">
                <h4 className="font-heading text-xs font-bold text-cream-bone flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" />
                  Insignias Académicas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContributor.badges.map((badge) => (
                    <span
                      key={badge}
                      className="bg-accent/10 border border-accent/25 text-accent text-[10px] font-bold px-2 py-1 rounded-lg"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile only) */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-lg flex items-center justify-center z-50 transition-colors hover:scale-105 active:scale-95"
      >
        <Pencil className="w-6 h-6" />
      </button>

    </DashboardLayout>
  );
}
