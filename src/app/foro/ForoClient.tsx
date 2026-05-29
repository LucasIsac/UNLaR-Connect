// Page developed in collaboration with @martinprlt (https://github.com/martinprlt)
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  MessageSquare,
  Pencil,
  SlidersHorizontal,
  Star,
  Plus,
  ArrowUp,
  ArrowDown,
  Flame,
  CheckCircle2,
  X,
  Search,
  BookOpen,
  Send,
  MessageCircle,
  GraduationCap,
  Calendar,
  Coins,
  Package,
  MapPin,
  Clock,
  Sparkles,
  Trash2,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createForumPost,
  castPostVote,
  fetchPostReplies,
  addPostReply,
  resolvePost,
  interactWithPost,
  editPost,
  editReply,
  deletePost,
  deleteReply,
  fetchUserVotes,
  fetchTopContributors,
  fetchPopularTags,
  ForumPostExtended,
  TopContributor,
  PopularTag,
} from "@/actions/foro";
import { DbPostReply } from "@/types/database";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";

const categories = [
  { label: "Todas", value: "Todas", color: "text-foreground bg-muted border-border/40" },
  { label: "Preguntas", value: "question", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  { label: "Recursos", value: "resource", color: "text-accent bg-accent/10 border-accent/20" },
  { label: "Tutorías", value: "tutoring", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { label: "Préstamos", value: "borrow", color: "text-teal-400 bg-teal-400/10 border-teal-400/20" },
  { label: "Compra / Alquiler", value: "sell_rent", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
];

type ForoClientProps = {
  initialThreads: ForumPostExtended[];
  currentUserId: string | null;
};

export default function ForoClient({ initialThreads, currentUserId: initialUserId }: ForoClientProps) {
  const [threads, setThreads] = useState<ForumPostExtended[]>(initialThreads);
  const loading = false;
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);

  const handleScopeChange = (scope: "foro" | "apuntes" | "materias" | "todos") => {
    if (scope === "apuntes") {
      window.location.href = "/recursos";
    } else if (scope === "foro") {
      window.location.href = "/foro";
    } else if (scope === "materias") {
      window.location.href = "/materias";
    }
  };
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumPostExtended | null>(null);
  
  // Thread comments loading state
  const [replies, setReplies] = useState<DbPostReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newReplyText, setNewReplyText] = useState("");

  // Voting state (maps thread.id to 'up' | 'down' | null)
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down" | null>>(() =>
    Object.fromEntries(initialThreads.map((thread) => [thread.id, thread.userVote || null]))
  );

  // New Thread Form States
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSubject, setNewSubject] = useState("Programación II");
  const [newType, setNewType] = useState<'question' | 'resource' | 'tutoring' | 'borrow' | 'sell_rent'>("question");

  // Type-specific field states
  const [itemCondition, setItemCondition] = useState<'new' | 'used_good' | 'used_fair'>("used_good");
  const [itemName, setItemName] = useState("");
  const [itemAvailability, setItemAvailability] = useState("");
  const [itemLocation, setItemLocation] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemMode, setItemMode] = useState<'sell' | 'rent'>("sell");
  const [tutoringSubject, setTutoringSubject] = useState("");
  const [tutoringPriceType, setTutoringPriceType] = useState<'free' | 'paid'>("free");
  const [tutoringPrice, setTutoringPrice] = useState("");
  const [tutoringModality, setTutoringModality] = useState<'online' | 'present' | 'hybrid'>("online");
  const [tutoringAvailability, setTutoringAvailability] = useState("");
  
  // Image upload state
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postImageUrl, setPostImageUrl] = useState("");
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  
  // Reply image upload state
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [replyImageUrl, setReplyImageUrl] = useState("");
  const [uploadingReplyImage, setUploadingReplyImage] = useState(false);

  // Edit states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Image upload handler
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen no puede superar 5MB.");
      return;
    }

    setUploadingPostImage(true);
    try {
      const supabase = createClient();
      const fileName = `foro-post-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("apuntes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("apuntes")
        .getPublicUrl(fileName);

      setPostImageUrl(urlData.publicUrl);
      setPostImagePreview(URL.createObjectURL(file));
    } catch (err: any) {
      showToast(err.message || "No se pudo subir la imagen.");
    } finally {
      setUploadingPostImage(false);
    }
  };

  // Reply image upload handler
  const handleReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen no puede superar 5MB.");
      return;
    }

    setUploadingReplyImage(true);
    try {
      const supabase = createClient();
      const fileName = `foro-reply-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("apuntes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("apuntes")
        .getPublicUrl(fileName);

      setReplyImageUrl(urlData.publicUrl);
      setReplyImagePreview(URL.createObjectURL(file));
    } catch (err: any) {
      showToast(err.message || "No se pudo subir la imagen.");
    } finally {
      setUploadingReplyImage(false);
    }
  };

  // Load user ID, votes, contributors and tags on mount
  useEffect(() => {
    async function loadInit() {
      try {
        // Try to get userId from client-side Supabase if server-side failed
        let userId = initialUserId;
        if (!userId) {
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();
          userId = data?.user?.id ?? null;
          setCurrentUserId(userId);
        }

        const [contribs, tags] = await Promise.all([
          fetchTopContributors(),
          fetchPopularTags(),
        ]);
        setTopContributors(contribs);
        setPopularTags(tags);

        if (userId && initialThreads.length > 0) {
          const votes = await fetchUserVotes(initialThreads.map((t) => t.id));
          setUserVotes(votes);
        }
      } catch (err) {
        console.error("Error loading forum init data:", err);
      }
    }
    loadInit();
  }, []);

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

    const newVote = currentVote === direction ? null : direction;
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, upvotes: t.upvotes + diff } : t))
    );
    setUserVotes((prev) => ({ ...prev, [threadId]: newVote }));

    try {
      const response = await castPostVote(threadId, direction);
      if (!response.success) {
        throw new Error(response.error || "No se pudo guardar tu voto.");
      }

      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, upvotes: response.likes ?? t.upvotes, userVote: response.userVote ?? null } : t))
      );
      setSelectedThread((prev) =>
        prev && prev.id === threadId
          ? { ...prev, upvotes: response.likes ?? prev.upvotes, userVote: response.userVote ?? null }
          : prev
      );
      setUserVotes((prev) => ({ ...prev, [threadId]: response.userVote ?? null }));
    } catch (err) {
      console.error(err);
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, upvotes: t.upvotes - diff } : t))
      );
      setUserVotes((prev) => ({ ...prev, [threadId]: currentVote }));
      showToast("No se pudo guardar tu voto. Probá de nuevo.");
    }
  };

  const handlePostInteraction = async (actionType: "interest" | "reserve" | "deliver" | "return") => {
    if (!selectedThread) return;

    setActionInProgress(actionType);
    try {
      const response = await interactWithPost(selectedThread.id, actionType);
      if (response.success && response.updatedPost) {
        setThreads((prev) =>
          prev.map((t) => (t.id === selectedThread.id ? response.updatedPost! : t))
        );
        setSelectedThread(response.updatedPost);
        
        if (actionType === "interest") {
          showToast("¡Expresaste interés! Se envió una notificación al dueño/a 🚀");
        } else if (actionType === "reserve") {
          showToast("¡Artículo reservado con éxito! 📦");
        } else if (actionType === "deliver") {
          showToast("¡Artículo marcado como entregado! 👍");
        } else if (actionType === "return") {
          showToast("¡Artículo devuelto! Vuelve a estar disponible 🔄");
        }
      } else {
        showToast(response.error || "No se pudo realizar la acción.");
      }
    } catch (err) {
      console.error(err);
      showToast("Hubo un problema de conexión.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    let metadata: Record<string, unknown> = {};
    if (newType === 'tutoring') {
      metadata = {
        subject: tutoringSubject || newSubject,
        price_type: tutoringPriceType,
        price: tutoringPriceType === 'paid' ? parseFloat(tutoringPrice) || 0 : undefined,
        modality: tutoringModality,
        availability: tutoringAvailability || "A coordinar"
      };
    } else if (newType === 'borrow') {
      metadata = {
        item_name: itemName || newTitle,
        condition: itemCondition,
        availability: itemAvailability || "Lunes a Viernes",
        location: itemLocation || "Sede Central",
        status: "available"
      };
    } else if (newType === 'sell_rent') {
      metadata = {
        item_name: itemName || newTitle,
        price: parseFloat(itemPrice) || 0,
        condition: itemCondition,
        mode: itemMode,
        location: itemLocation || "Sede Central"
      };
    }

    setActionInProgress("create-post");
    try {
      const response = await createForumPost(newTitle, newDesc, newSubject, newType, metadata, postImageUrl || undefined);
      if (response.success && response.data) {
        setThreads((prev) => [response.data!, ...prev]);
        setIsCreateModalOpen(false);
        showToast("¡Publicación realizada! Sumaste 15 puntos de Reputación 🚀");
        
        // Reset inputs
        setNewTitle("");
        setNewDesc("");
        setItemName("");
        setItemPrice("");
        setItemLocation("");
        setItemAvailability("");
        setTutoringSubject("");
        setTutoringPrice("");
        setTutoringAvailability("");
        setPostImagePreview(null);
        setPostImageUrl("");
      } else {
        showToast(response.error || "Error al crear la publicación.");
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
    if ((!newReplyText.trim() && !replyImageUrl) || !selectedThread) return;

    setActionInProgress("add-reply");
    try {
      const response = await addPostReply(selectedThread.id, newReplyText, replyImageUrl || undefined);
      if (response.success && response.data) {
        setReplies(response.data);
        setNewReplyText("");
        setReplyImagePreview(null);
        setReplyImageUrl("");
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
    const matchesCategory = selectedCategory === "Todas" || t.type === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subjectName || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "resolved" && t.is_resolved) ||
      (selectedStatus === "open" && !t.is_resolved);

    return matchesCategory && matchesSearch && matchesStatus;
  });

  // Delete handlers
  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Borrás este hilo? No se puede deshacer.")) return;
    setActionInProgress("delete-" + postId);
    const result = await deletePost(postId);
    if (result.success) {
      setThreads((prev) => prev.filter((t) => t.id !== postId));
      setSelectedThread(null);
      showToast("Hilo borrado.");
    } else {
      showToast(result.error || "No se pudo borrar.");
    }
    setActionInProgress(null);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("¿Borrás esta respuesta?")) return;
    setActionInProgress("delete-reply-" + replyId);
    const result = await deleteReply(replyId);
    if (result.success) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      showToast("Respuesta borrada.");
    } else {
      showToast(result.error || "No se pudo borrar.");
    }
    setActionInProgress(null);
  };

  // Edit handlers
  const startEditPost = (thread: ForumPostExtended) => {
    setEditingPostId(thread.id);
    setEditPostTitle(thread.title);
    setEditPostContent(thread.content);
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId || !editPostTitle.trim() || !editPostContent.trim()) return;
    setActionInProgress("edit-post");
    const result = await editPost(editingPostId, editPostTitle, editPostContent);
    if (result.success) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === editingPostId ? { ...t, title: editPostTitle.trim(), content: editPostContent.trim() } : t
        )
      );
      setSelectedThread((prev) =>
        prev && prev.id === editingPostId
          ? { ...prev, title: editPostTitle.trim(), content: editPostContent.trim() }
          : prev
      );
      setEditingPostId(null);
      showToast("Hilo editado.");
    } else {
      showToast(result.error || "No se pudo editar.");
    }
    setActionInProgress(null);
  };

  const startEditReply = (reply: DbPostReply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const handleSaveEditReply = async () => {
    if (!editingReplyId || !editReplyContent.trim()) return;
    setActionInProgress("edit-reply");
    const result = await editReply(editingReplyId, editReplyContent);
    if (result.success) {
      setReplies((prev) =>
        prev.map((r) =>
          r.id === editingReplyId ? { ...r, content: editReplyContent.trim() } : r
        )
      );
      setEditingReplyId(null);
      showToast("Respuesta editada.");
    } else {
      showToast(result.error || "No se pudo editar.");
    }
    setActionInProgress(null);
  };

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeScope="foro"
      onScopeChange={handleScopeChange}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      selectedStatus={selectedStatus}
      onStatusChange={setSelectedStatus}
      searchPlaceholder="Buscá hilos o materias..."
      showSearch={true}
    >
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
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
                Foro Estudiantil
              </h1>
              <p className="text-sm text-muted-foreground">
                Resolvé tus dudas académicas, compartí tus conocimientos y ganá puntos de karma.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 select-none">
              {/* Action button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-98 transition-all shrink-0 shadow-lg shadow-accent/10 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Creá un hilo
              </button>
            </div>
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
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    selectedCategory === cat.value
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

                            {/* Thread Image */}
                            {thread.image_url && (
                              <img
                                src={thread.image_url}
                                alt="Imagen del hilo"
                                className="w-full h-32 object-cover rounded-lg border border-border/30 mb-4"
                              />
                            )}

                            {/* Type-specific structured metadata layout */}
                            {thread.type === 'tutoring' && thread.metadata && (
                              <div className="mb-4 flex flex-wrap gap-2 text-xs bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                                  Materia: <strong className="text-foreground">{thread.metadata.subject || thread.subjectName}</strong>
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                                  Modalidad: <strong className="text-foreground">{thread.metadata.modality === 'online' ? 'Virtual' : thread.metadata.modality === 'present' ? 'Presencial' : 'Híbrido'}</strong>
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                  <Coins className="w-3.5 h-3.5 text-blue-400" />
                                  Costo: <strong className="text-foreground">{thread.metadata.price_type === 'free' ? 'Gratuita' : `Paga ($${thread.metadata.price})`}</strong>
                                </span>
                              </div>
                            )}

                            {thread.type === 'borrow' && thread.metadata && (
                              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-teal-500/5 border border-teal-500/10 rounded-xl p-3">
                                <div className="space-y-1">
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5 text-teal-400" />
                                    Artículo: <strong className="text-foreground">{thread.metadata.item_name}</strong>
                                  </span>
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                                    Estado: <strong className="text-foreground">{thread.metadata.condition === 'new' ? 'Nuevo' : thread.metadata.condition === 'used_good' ? 'Excelente' : 'Detalles de uso'}</strong>
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                                    Ubicación: <strong className="text-foreground">{thread.metadata.location}</strong>
                                  </span>
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                                    Disponibilidad: <strong className="text-foreground">{thread.metadata.availability}</strong>
                                  </span>
                                </div>
                                <div className="col-span-1 sm:col-span-2 pt-1.5 border-t border-border/5 flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-muted-foreground">Estado del Préstamo:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    thread.metadata.status === 'available' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    thread.metadata.status === 'reserved' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    thread.metadata.status === 'delivered' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  }`}>
                                    {thread.metadata.status === 'available' ? 'Disponible' :
                                     thread.metadata.status === 'reserved' ? 'Reservado' :
                                     thread.metadata.status === 'delivered' ? 'Entregado' : 'Devuelto'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {thread.type === 'sell_rent' && thread.metadata && (
                              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
                                <div className="space-y-1">
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5 text-purple-400" />
                                    Artículo: <strong className="text-foreground">{thread.metadata.item_name}</strong>
                                  </span>
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                                    Condición: <strong className="text-foreground">{thread.metadata.condition === 'new' ? 'Nuevo' : thread.metadata.condition === 'used_good' ? 'Excelente' : 'Detalles de uso'}</strong>
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                    Ubicación: <strong className="text-foreground">{thread.metadata.location}</strong>
                                  </span>
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <Coins className="w-3.5 h-3.5 text-purple-400" />
                                    Modo: <strong className="text-foreground">{thread.metadata.mode === 'sell' ? 'Venta' : 'Alquiler'}</strong>
                                  </span>
                                </div>
                                <div className="col-span-1 sm:col-span-2 pt-1.5 border-t border-border/5 flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-purple-400">Precio de Publicación:</span>
                                  <span className="text-xs font-mono font-black text-foreground bg-purple-500/15 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                                    ${thread.metadata.price}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Author info & Actions */}
                            <div className="flex justify-between items-center border-t border-border/10 pt-3">
                              
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-[11px] text-accent font-black">
                                  {thread.authorName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    {thread.authorName}
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
                        key={tag.tag}
                        onClick={() => setSearchQuery(`#${tag.tag}`)}
                        className="bg-card hover:bg-muted/15 border border-border/30 text-[11px] text-muted-foreground px-2.5 py-1 rounded-full transition-colors focus:outline-none"
                      >
                        #{tag.tag}
                        <span className="ml-1 text-[9px] opacity-60">{tag.count}</span>
                      </button>
                    ))}
                    {popularTags.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No hay etiquetas aún.</p>
                    )}
                  </div>
                </div>

                {/* Top Contributors */}
                <div className="bg-glass rounded-2xl p-5 border border-border/10">
                  <h4 className="font-heading text-xs font-bold text-cream-bone uppercase tracking-wider mb-3">
                    Top Contribuyentes
                  </h4>
                  <div className="space-y-3">
                    {topContributors.map((contrib, idx) => (
                      <div
                        key={contrib.id}
                        className="flex justify-between items-center bg-card/30 p-2.5 rounded-xl border border-border/5 hover:border-accent/25 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground block">
                              {contrib.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {contrib.points.toLocaleString()} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {topContributors.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No hay contribuyentes aún.</p>
                    )}
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

              <form onSubmit={handleCreateThreadSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                
                {/* Choose Publication Type */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                    ¿Qué querés publicar?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {([
                      { type: 'question', label: 'Pregunta', icon: MessageSquare, desc: 'Dudas sobre materias o temas académicos' },
                      { type: 'resource', label: 'Recurso', icon: BookOpen, desc: 'Compartir apuntes, resúmenes o libros' },
                      { type: 'tutoring', label: 'Tutoría', icon: GraduationCap, desc: 'Ofrecer o buscar clases de apoyo' },
                      { type: 'borrow', label: 'Préstamo', icon: Package, desc: 'Pedir prestado o prestar útiles/insumos' },
                      { type: 'sell_rent', label: 'Compra / Alquiler', icon: Coins, desc: 'Compraventa o alquiler de recursos universitarios' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setNewType(opt.type)}
                        className={`p-3 rounded-2xl border text-left flex gap-3 transition-all duration-200 ${
                          newType === opt.type
                            ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/5'
                            : 'bg-card/45 border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                        }`}
                      >
                        <opt.icon className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold block">{opt.label}</span>
                          <span className="text-[10px] leading-tight block mt-0.5 text-muted-foreground">{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common fields: Title & Body */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Título de la Publicación
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newType === 'question' ? 'Ej: ¿Cómo resolvemos el ejercicio 5 del TP2?' :
                      newType === 'resource' ? 'Ej: Resumen completo Análisis Matemático II - Primer Parcial' :
                      newType === 'tutoring' ? 'Ej: Doy clases de apoyo para Álgebra y Programación I' :
                      newType === 'borrow' ? 'Ej: Necesito prestada una regla T para dibujo técnico' :
                      'Ej: Vendo calculadora científica Casio fx-95 en excelente estado'
                    }
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                {/* Common Materia Field */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Materia Relacionada
                  </label>
                  <Select
                    value={newSubject}
                    onChange={(val) => setNewSubject(String(val))}
                    options={[
                      { value: "Análisis Matemático II", label: "Análisis Matemático II" },
                      { value: "Programación II", label: "Programación II" },
                      { value: "Algoritmos y Estructuras de Datos", label: "Algoritmos y Estructuras de Datos" },
                      { value: "Sistemas Operativos", label: "Sistemas Operativos" },
                      { value: "General", label: "General / Sin materia" }
                    ]}
                    className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                {/* Type-specific Fields */}
                {newType === 'tutoring' && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-blue-400">Detalles de la Tutoría</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Cátedra/Tema</label>
                        <input
                          type="text"
                          placeholder="Ej: Álgebra Lineal"
                          value={tutoringSubject}
                          onChange={(e) => setTutoringSubject(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Modalidad</label>
                        <Select
                          value={tutoringModality}
                          onChange={(val) => setTutoringModality(val as 'online' | 'present' | 'hybrid')}
                          options={[
                            { value: 'online', label: 'Virtual' },
                            { value: 'present', label: 'Presencial' },
                            { value: 'hybrid', label: 'Híbrido' }
                          ]}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Costo</label>
                        <div className="flex gap-2">
                          {(['free', 'paid'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setTutoringPriceType(m)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                                tutoringPriceType === m
                                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                  : 'bg-card/65 border-border/40 text-muted-foreground'
                              }`}
                            >
                              {m === 'free' ? 'Gratuita' : 'Paga'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {tutoringPriceType === 'paid' && (
                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Precio por Hora ($)</label>
                          <input
                            type="number"
                            placeholder="Ej: 1500"
                            value={tutoringPrice}
                            onChange={(e) => setTutoringPrice(e.target.value)}
                            className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Días/Horas Disponibles</label>
                        <input
                          type="text"
                          placeholder="Ej: Martes y Jueves 16 a 18 hs"
                          value={tutoringAvailability}
                          onChange={(e) => setTutoringAvailability(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newType === 'borrow' && (
                  <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-teal-400">Detalles del Préstamo</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Nombre del Artículo</label>
                        <input
                          type="text"
                          placeholder="Ej: Arduino Uno R3"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Condición/Estado</label>
                        <Select
                          value={itemCondition}
                          onChange={(val) => setItemCondition(val as 'new' | 'used_good' | 'used_fair')}
                          options={[
                            { value: 'new', label: 'Nuevo' },
                            { value: 'used_good', label: 'Excelente estado' },
                            { value: 'used_fair', label: 'Con detalles de uso' }
                          ]}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Ubicación / Campus de Entrega</label>
                        <input
                          type="text"
                          placeholder="Ej: Módulo de Sistemas"
                          value={itemLocation}
                          onChange={(e) => setItemLocation(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Disponibilidad</label>
                        <input
                          type="text"
                          placeholder="Ej: Miércoles y Viernes"
                          value={itemAvailability}
                          onChange={(e) => setItemAvailability(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newType === 'sell_rent' && (
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-purple-400">Detalles de la Transacción</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Artículo</label>
                        <input
                          type="text"
                          placeholder="Ej: Calculadora Casio fx-95"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Condición/Estado</label>
                        <Select
                          value={itemCondition}
                          onChange={(val) => setItemCondition(val as 'new' | 'used_good' | 'used_fair')}
                          options={[
                            { value: 'new', label: 'Nuevo' },
                            { value: 'used_good', label: 'Excelente estado' },
                            { value: 'used_fair', label: 'Con detalles de uso' }
                          ]}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Modalidad</label>
                        <div className="flex gap-2">
                          {(['sell', 'rent'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setItemMode(m)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                                itemMode === m
                                  ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                                  : 'bg-card/65 border-border/40 text-muted-foreground'
                              }`}
                            >
                              {m === 'sell' ? 'Venta' : 'Alquiler'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Precio ($)</label>
                        <input
                          type="number"
                          placeholder="Ej: 3500"
                          value={itemPrice}
                          onChange={(e) => setItemPrice(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Lugar de Entrega</label>
                        <input
                          type="text"
                          placeholder="Ej: Módulo de Sistemas o Sede"
                          value={itemLocation}
                          onChange={(e) => setItemLocation(e.target.value)}
                          className="w-full bg-card/65 border border-border/40 rounded-xl py-1.5 px-3 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description Body */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Descripción / Detalles de la Publicación
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      newType === 'question' ? 'Contanos tu duda detalladamente para que tus compañeros o profesores puedan ayudarte...' :
                      newType === 'resource' ? 'Describí el recurso que estás compartiendo (de qué materia es, qué temas incluye, etc.)...' :
                      newType === 'tutoring' ? 'Describí el formato de tus clases, temas específicos en los que podés ayudar, etc...' :
                      newType === 'borrow' ? 'Especificá para qué vas a usar el artículo, cuándo pensás devolverlo, etc...' :
                      'Detallá las características del artículo en venta o alquiler...'
                    }
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Imagen (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageUpload}
                    className="hidden"
                    id="post-image-upload"
                  />
                  {postImagePreview ? (
                    <div className="relative">
                      <img
                        src={postImagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-xl border border-border/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPostImagePreview(null);
                          setPostImageUrl("");
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="post-image-upload"
                      className={`flex flex-col items-center justify-center w-full border border-dashed border-border/60 rounded-xl py-4 text-center text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors cursor-pointer ${
                        uploadingPostImage ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {uploadingPostImage ? (
                        <span className="text-xs">Subiendo...</span>
                      ) : (
                        <>
                          <span className="text-xs font-semibold">Elegí una imagen</span>
                          <span className="text-[10px] opacity-60 mt-0.5">JPG, PNG • Máx 5MB</span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={actionInProgress === "create-post"}
                  className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/15 mt-6 disabled:opacity-40"
                >
                  <BookOpen className="w-4 h-4" />
                  Publicar en el Foro Colaborativo
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
                <div className="min-w-0 flex-1">
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
                  {editingPostId === selectedThread.id ? (
                    <input
                      type="text"
                      value={editPostTitle}
                      onChange={(e) => setEditPostTitle(e.target.value)}
                      className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  ) : (
                    <h2 className="font-heading text-lg md:text-xl font-bold text-cream-bone leading-tight">
                      {selectedThread.title}
                    </h2>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedThread.authorId === currentUserId && editingPostId !== selectedThread.id && (
                    <>
                      <button
                        onClick={() => startEditPost(selectedThread)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-muted/10 transition-colors"
                        title="Editar hilo"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(selectedThread.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Borrar hilo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {editingPostId === selectedThread.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveEditPost}
                        disabled={actionInProgress === "edit-post"}
                        className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingPostId(null)}
                        className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => { setSelectedThread(null); setEditingPostId(null); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable thread content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
                
                {/* Main post body */}
                <div className="space-y-4">
                  {editingPostId === selectedThread.id ? (
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      className="w-full bg-card/25 border border-border/40 rounded-xl py-3 px-4 text-sm text-foreground/90 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                      rows={6}
                    />
                  ) : (
                    <p className="text-sm text-foreground/90 leading-relaxed bg-card/25 p-4 rounded-xl border border-border/5">
                      {selectedThread.content}
                    </p>
                  )}
                  
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

                {/* Modal Structured Metadata */}
                {selectedThread.type === 'tutoring' && selectedThread.metadata && (
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-blue-400 flex items-center gap-1.5 text-sm">
                      <GraduationCap className="w-4.5 h-4.5" />
                      Detalles de la Tutoría Académica
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-muted-foreground block">Materia / Cátedra</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.subject}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Modalidad</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.modality === 'online' ? 'Virtual' : selectedThread.metadata.modality === 'present' ? 'Presencial' : 'Híbrido'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Costo de la Sesión</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.price_type === 'free' ? 'Gratuita' : `Paga ($${selectedThread.metadata.price})`}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Disponibilidad Horaria</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.availability}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedThread.type === 'borrow' && selectedThread.metadata && (
                  <div className="bg-teal-500/5 border border-teal-500/15 rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-teal-400 flex items-center gap-1.5 text-sm">
                      <Package className="w-4.5 h-4.5" />
                      Detalles del Préstamo de Recursos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-muted-foreground block">Artículo / Insumo</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.item_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Condición</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.condition === 'new' ? 'Nuevo' : selectedThread.metadata.condition === 'used_good' ? 'Excelente' : 'Detalles de uso'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Ubicación / Campus</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.location}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Disponibilidad</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.availability}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/5 flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Estado del Artículo:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        selectedThread.metadata.status === 'available' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                        selectedThread.metadata.status === 'reserved' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' :
                        selectedThread.metadata.status === 'delivered' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                        'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                      }`}>
                        {selectedThread.metadata.status === 'available' ? 'Disponible' :
                         selectedThread.metadata.status === 'reserved' ? 'Reservado' :
                         selectedThread.metadata.status === 'delivered' ? 'Entregado' : 'Devuelto'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedThread.type === 'sell_rent' && selectedThread.metadata && (
                  <div className="bg-purple-500/5 border border-purple-500/15 rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-purple-400 flex items-center gap-1.5 text-sm">
                      <Coins className="w-4.5 h-4.5" />
                      Detalles de Compra / Alquiler
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-muted-foreground block">Artículo / Insumo</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.item_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Condición</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.condition === 'new' ? 'Nuevo' : selectedThread.metadata.condition === 'used_good' ? 'Excelente' : 'Detalles de uso'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Ubicación / Campus</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.location}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Modalidad</span>
                        <span className="text-sm font-semibold text-foreground">{selectedThread.metadata.mode === 'sell' ? 'Venta' : 'Alquiler'}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/5 flex items-center justify-between">
                      <span className="font-bold text-purple-400 text-sm">Precio de Oferta:</span>
                      <span className="text-sm font-mono font-black text-foreground bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-xl">
                        ${selectedThread.metadata.price}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive Trust Action Layer */}
                {selectedThread.type !== 'question' && selectedThread.type !== 'resource' && (
                  <div className="p-4 bg-glass border border-border/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-cream-bone flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-accent" />
                        Acción Colaborativa
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {selectedThread.authorName === "Tu Perfil" || selectedThread.user_id === currentUserId
                          ? "Gestioná los estados y reservas de tu publicación."
                          : "Contactate con tu compañero de forma segura y directa."
                        }
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
                      {!(selectedThread.authorName === "Tu Perfil" || selectedThread.user_id === currentUserId) && (
                        <button
                          onClick={() => handlePostInteraction("interest")}
                          disabled={actionInProgress !== null}
                          className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-accent/15 disabled:opacity-40"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Me interesa
                        </button>
                      )}

                      {selectedThread.type === 'borrow' && selectedThread.metadata && (
                        <>
                          {/* Borrower Actions */}
                          {!(selectedThread.authorName === "Tu Perfil" || selectedThread.user_id === currentUserId) && selectedThread.metadata.status === 'available' && (
                            <button
                              onClick={() => handlePostInteraction("reserve")}
                              disabled={actionInProgress !== null}
                              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-teal-500/15 disabled:opacity-40"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Reservar artículo
                            </button>
                          )}
                          
                          {/* Owner Actions */}
                          {(selectedThread.authorName === "Tu Perfil" || selectedThread.user_id === currentUserId) && (
                            <>
                              {selectedThread.metadata.status === 'reserved' && (
                                <button
                                  onClick={() => handlePostInteraction("deliver")}
                                  disabled={actionInProgress !== null}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/15 disabled:opacity-40"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Marcar Entregado
                                </button>
                              )}
                              {selectedThread.metadata.status === 'delivered' && (
                                <button
                                  onClick={() => handlePostInteraction("return")}
                                  disabled={actionInProgress !== null}
                                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-500/15 disabled:opacity-40"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Marcar Devuelto
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Solved Trigger box for thread owner */}
                {!selectedThread.is_resolved && selectedThread.authorId === currentUserId && (
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
                                    {reply.user_id === currentUserId ? "Tu Perfil" : "Estudiante"}
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

                              {editingReplyId === reply.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editReplyContent}
                                    onChange={(e) => setEditReplyContent(e.target.value)}
                                    className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleSaveEditReply}
                                      disabled={actionInProgress === "edit-reply"}
                                      className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <Save className="w-3 h-3" /> Guardar
                                    </button>
                                    <button
                                      onClick={() => setEditingReplyId(null)}
                                      className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                    {reply.content}
                                  </p>
                                  {reply.image_url && (
                                    <img
                                      src={reply.image_url}
                                      alt="Imagen de la respuesta"
                                      className="w-full max-h-48 object-cover rounded-lg border border-border/30 mb-2"
                                    />
                                  )}
                                </>
                              )}

                              <div className="flex items-center gap-3 mt-1">
                                {/* Accept as best answer */}
                                {!selectedThread.is_resolved && selectedThread.authorId === currentUserId && reply.user_id !== currentUserId && (
                                  <button
                                    onClick={() => handleMarkAsSolved(reply.id)}
                                    className="text-[10px] text-accent hover:text-accent/80 font-bold flex items-center gap-1 focus:outline-none"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    Aceptar como mejor respuesta
                                  </button>
                                )}
                                {/* Edit own reply */}
                                {reply.user_id === currentUserId && editingReplyId !== reply.id && (
                                  <button
                                    onClick={() => startEditReply(reply)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-1"
                                  >
                                    <Pencil className="w-3 h-3" /> Editar
                                  </button>
                                )}
                                {/* Delete own reply */}
                                {reply.user_id === currentUserId && (
                                  <button
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="text-[10px] text-red-400/70 hover:text-red-400 font-bold flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> Borrar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

              {/* Reply Form Footer */}
              <div className="mt-4 border-t border-border/10 pt-4 space-y-3">
                {/* Reply Image Preview */}
                {replyImagePreview && (
                  <div className="relative">
                    <img
                      src={replyImagePreview}
                      alt="Reply preview"
                      className="w-full h-24 object-cover rounded-xl border border-border/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReplyImagePreview(null);
                        setReplyImageUrl("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleAddReplySubmit} className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReplyImageUpload}
                    className="hidden"
                    id="reply-image-upload"
                  />
                  <label
                    htmlFor="reply-image-upload"
                    className={`p-2.5 text-muted-foreground hover:text-accent transition-colors rounded-lg cursor-pointer flex items-center justify-center ${
                      uploadingReplyImage ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingReplyImage ? (
                      <span className="text-[10px]">...</span>
                    ) : (
                      <span className="material-symbols-outlined">image</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="Escribí una respuesta..."
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
