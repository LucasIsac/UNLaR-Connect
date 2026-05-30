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
  Search,
  FileText,
  Send,
  X,
  MessageCircle,
  Eye,
  Star,
  Trash2,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchResources,
  uploadResource,
  toggleSaveResource,
  castResourceVote,
  deleteResource,
  ResourceExtended
} from "@/actions/recursos";
import { fetchSubjects, fetchCareers } from "@/actions/perfil";
import { DbSubject, DbCareer } from "@/types/database";

const tabs = ["Recientes", "Más Valorados", "Mis Guardados", "Mis Apuntes"];

export default function RecursosPage() {
  const [resources, setResources] = useState<ResourceExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9); // Pagination state
  const [activeTab, setActiveTab] = useState(0);
  const [gridView, setGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterCarrera, setFilterCarrera] = useState("Todas");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterMateria, setFilterMateria] = useState("Todas");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [subjectsDataList, setSubjectsDataList] = useState<DbSubject[]>([]);
  const [carrerasList, setCarrerasList] = useState<DbCareer[]>([]);

  // Detailed preview modal state
  const [selectedResource, setSelectedResource] = useState<ResourceExtended | null>(null);




  // Sidebar Form States
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAxis, setNewAxis] = useState("");
  const [newType, setNewType] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isMateriaDropdownOpen, setIsMateriaDropdownOpen] = useState(false);
  const [isEjeDropdownOpen, setIsEjeDropdownOpen] = useState(false);
  const [materiaFilter, setMateriaFilter] = useState("");
  const [ejeFilter, setEjeFilter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const normalizeString = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const [predefinedMaterias, setPredefinedMaterias] = useState<string[]>(["Cargando materias..."]);
  const [predefinedEjes, setPredefinedEjes] = useState<string[]>(["Cargando ejes..."]);

  // Drag & drop styling state
  const [isDragging, setIsDragging] = useState(false);

  // Premium Toast state
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<{ id: string, storageUrl: string, title: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch resources and subjects on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [data, subjectsData, careersData] = await Promise.all([
          fetchResources(),
          fetchSubjects(),
          fetchCareers()
        ]);
        setResources(data);
        
        if (careersData) {
          setCarrerasList(careersData);
        }
        
        if (subjectsData && subjectsData.length > 0) {
          const uniqueMap = new Map<string, string>();
          subjectsData.forEach((s) => {
            if (!s.name) return;
            const norm = (s.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            if (!uniqueMap.has(norm)) {
              uniqueMap.set(norm, s.name.trim());
            }
          });
          setPredefinedMaterias(Array.from(uniqueMap.values()));
          setSubjectsDataList(subjectsData);
        } else {
          setPredefinedMaterias(["Sistemas Operativos", "Bases de Datos", "Paradigmas de Programación"]);
        }

        // Dynamically extract unique thematic axes from resources
        if (data && data.length > 0) {
          const uniqueEjesMap = new Map<string, string>();
          data.forEach((r) => {
            if (!r.thematicAxis || r.thematicAxis === "General") return;
            const norm = r.thematicAxis.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            if (!uniqueEjesMap.has(norm)) {
              uniqueEjesMap.set(norm, r.thematicAxis.trim());
            }
          });
          setPredefinedEjes(Array.from(uniqueEjesMap.values()));
        } else {
          setPredefinedEjes(["Gestión de Memoria", "Consultas SQL"]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUploadApunteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCategory.trim() || !newType.trim() || !file) {
      showToast("Por favor completá todos los campos obligatorios y seleccioná un archivo.", "error");
      return;
    }

    setActionInProgress("upload-resource");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        showToast("No estás autenticado.", "error");
        setActionInProgress(null);
        return;
      }

      showToast("Subiendo archivo, aguardá un momento...", "info");
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: storageError } = await supabase.storage
        .from('apuntes')
        .upload(filePath, file, { contentType: file.type });
        
      if (storageError) {
        console.error("Client Upload error:", storageError);
        showToast("Error al subir el archivo (verificá tu conexión).", "error");
        setActionInProgress(null);
        return;
      }

      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("filePath", filePath);
      formData.append("category", newCategory);
      formData.append("thematicAxis", newAxis || "General");
      formData.append("type", newType);
      formData.append("description", newAxis ? `Material sobre ${newAxis} (${newType}).` : `Material de tipo ${newType}.`);

      const response = await uploadResource(formData);
      if (response.success) {
        showToast("¡Apunte subido exitosamente!", "success");
        setNewTitle("");
        setFile(null);
        setNewType("");
        setIsUploadModalOpen(false);
        // Force Header points to update instantly
        window.dispatchEvent(new Event("points-updated"));
        
        // Optimistically add to list (simplificado)
        if (response.data) {
          setResources((prev) => [response.data!, ...prev]);
        }
      } else {
        showToast(response.error || "No se pudo registrar tu apunte.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Ocurrió un error inesperado al subir.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLikeResourceSubmit = async (rscId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic UI Update: Toggle likes based on hasVoted status
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === rscId) {
          return { ...r, likes: r.hasVoted ? r.likes - 1 : r.likes + 1, hasVoted: !r.hasVoted };
        }
        return r;
      })
    );

    try {
      const response = await castResourceVote(rscId);
      if (response.success && response.newScore !== undefined) {
        // Sync absolute truth from server in case of race conditions
        setResources((prev) =>
          prev.map((r) => (r.id === rscId ? { ...r, likes: response.newScore ?? r.likes } : r))
        );
      }
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

  const handleDeleteResourceSubmit = async (rscId: string, storageUrl: string) => {
    setResourceToDelete(null);
    
    // Optimistic UI Update
    setResources((prev) => prev.filter((r) => r.id !== rscId));
    setSelectedResource(null);
    showToast("Eliminando apunte...", "info");

    try {
      const response = await deleteResource(rscId, storageUrl);
      if (response.success) {
        showToast("Apunte eliminado de forma permanente.", "success");
      } else {
        showToast(response.error || "No se pudo eliminar el apunte.", "error");
        // Revert optimistic update
        const fetchAll = async () => {
          setLoading(true);
          try {
            const data = await fetchResources();
            setResources(data);
            setVisibleCount(9); // Reset pagination on full reload
          } catch (err) {
            console.error(err);
            showToast("Error al cargar los recursos.", "error");
          } finally { 
            setLoading(false);
          }
        };
        fetchAll();
      }
    } catch (err) {
      console.error(err);
      showToast("Error inesperado al eliminar.", "error");
    }
  };

  const handleDownloadResource = async (rsc: ResourceExtended) => {
    try {
      showToast("Preparando descarga...", "info");
      const response = await fetch(rsc.storage_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Get extension from URL or fallback
      const ext = rsc.storage_url.split('.').pop() || "pdf";
      a.download = `${rsc.title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("¡Descarga completada con éxito!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al intentar descargar el archivo.", "error");
    }
  };

  // Filter resources
  const filteredResources = resources.filter((rsc) => {
    // 1. Tab filter
    if (activeTab === 2 && !rsc.saved) return false; // "Mis Guardados"
    if (activeTab === 3 && !rsc.isOwner) return false; // "Mis Apuntes"
    
    // 2. Search query filter
    const matchesSearch =
      rsc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsc.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      
    // 3. Carrera filter
    // Note: If a subject has no assigned careers (orphan), we show it in ALL filters as requested.
    const matchesCarrera = filterCarrera === "Todas" || rsc.careers.length === 0 || rsc.careers.includes(filterCarrera);

    // 4. Año filter
    let matchesAno = filterAno === "Todos";
    if (!matchesAno) {
      const subject = subjectsDataList.find(s => s.name === rsc.category);
      matchesAno = subject ? subject.year.toString() === filterAno : false;
    }

    // 5. Materia filter
    const matchesMateria = filterMateria === "Todas" || rsc.category === filterMateria;

    // 6. Tipo filter
    const matchesTipo = filterTipo === "Todos" || (rsc.description && rsc.description.includes(filterTipo));

    return matchesSearch && matchesCarrera && matchesAno && matchesMateria && matchesTipo;
  }).sort((a, b) => {
    if (activeTab === 1) {
      return b.likes - a.likes; // "Más Valorados"
    }
    // "Recientes" (or any other tab): sort by upload date descending
    const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
    const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
    return dateB - dateA;
  });

  const paginatedResources = filteredResources.slice(0, visibleCount);

  return (
    <DashboardLayout>
      <div className="animate-fade-in dashboard-bg min-h-full pb-10">
        
        {/* Dynamic Premium Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className={`fixed bottom-6 right-6 z-50 border px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold text-sm backdrop-blur-xl ${
                toastMessage.type === "success" 
                  ? "bg-emerald-950/90 text-emerald-100 border-emerald-500/50 shadow-emerald-900/50" 
                  : toastMessage.type === "error"
                  ? "bg-red-950/90 text-red-100 border-red-500/50 shadow-red-900/50"
                  : "bg-primary-container/90 text-obsidian border-accent/30 shadow-accent/20"
              }`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {toastMessage.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-md" />}
              {toastMessage.type === "error" && <XCircle className="w-5 h-5 text-red-400 drop-shadow-md" />}
              {toastMessage.type === "info" && <Bot className="w-5 h-5 animate-pulse text-accent-foreground" />}
              <span>{toastMessage.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
              Banco de Recursos
            </h1>
            <p className="text-sm text-muted-foreground">
              Buscá, descargá y compartí apuntes oficiales de la comunidad estudiantil.
            </p>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-2 select-none pt-3 border-t border-border/10">
            
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

          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Carrera Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === "carrera" ? null : "carrera")}
                className="px-4 py-2 bg-background/50 border border-border/40 text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted/10 transition-colors flex items-center gap-2"
              >
                Carrera: <span className="text-accent">{filterCarrera}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFilter === "carrera" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openFilter === "carrera" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
                    className="absolute top-full left-0 mt-2 bg-card border border-border/40 rounded-xl shadow-xl overflow-hidden z-20 flex flex-col min-w-[150px]"
                  >
                    {["Todas", ...carrerasList.map(c => c.name)].map(opt => (
                      <button key={opt} onClick={() => { setFilterCarrera(opt); setOpenFilter(null); }} className={`text-left px-3 py-2 text-sm hover:bg-accent/15 transition-colors ${filterCarrera === opt ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}>
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Año Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === "ano" ? null : "ano")}
                className="px-4 py-2 bg-background/50 border border-border/40 text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted/10 transition-colors flex items-center gap-2"
              >
                Año: <span className="text-accent">{filterAno}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFilter === "ano" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openFilter === "ano" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
                    className="absolute top-full left-0 mt-2 bg-card border border-border/40 rounded-xl shadow-xl overflow-hidden z-20 flex flex-col min-w-[100px]"
                  >
                    {["Todos", "1", "2", "3", "4", "5"].map(opt => (
                      <button key={opt} onClick={() => { setFilterAno(opt); setOpenFilter(null); }} className={`text-left px-3 py-2 text-sm hover:bg-accent/15 transition-colors ${filterAno === opt ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}>
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Materia Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === "materia" ? null : "materia")}
                className="px-4 py-2 bg-background/50 border border-border/40 text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted/10 transition-colors flex items-center gap-2 max-w-[250px] truncate"
              >
                Materia: <span className="text-accent truncate">{filterMateria}</span>
                <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${openFilter === "materia" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openFilter === "materia" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
                    className="absolute top-full right-0 mt-2 bg-card border border-border/40 rounded-xl shadow-xl overflow-y-auto max-h-60 custom-scrollbar z-20 flex flex-col min-w-[200px]"
                  >
                    <button onClick={() => { setFilterMateria("Todas"); setOpenFilter(null); }} className={`text-left px-3 py-2 text-sm hover:bg-accent/15 transition-colors ${filterMateria === "Todas" ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}>
                      Todas
                    </button>
                    {predefinedMaterias.map(opt => (
                      <button key={opt} onClick={() => { setFilterMateria(opt); setOpenFilter(null); }} className={`text-left px-3 py-2 text-sm hover:bg-accent/15 transition-colors ${filterMateria === opt ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}>
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Tipo Pills */}
            <div className="flex flex-wrap items-center gap-2 ml-auto lg:ml-4">
              {["Todos", "Apunte de Teoría", "Trabajo Práctico Resuelto", "Guía de Ejercicios", "Resumen", "Otro"].map(opt => (
                <button
                  key={opt}
                  onClick={() => setFilterTipo(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    filterTipo === opt
                      ? "bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.15)]"
                      : "bg-background/50 border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-card/80"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left / Center Content: Resource list and tabs */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
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
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-glass rounded-3xl p-12 border border-dashed border-border/30 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[250px] shadow-inner"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-5 relative">
                       <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-20" />
                       <Search className="w-8 h-8 text-accent relative z-10" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-cream-bone mb-2 relative z-10">¡Acá hay mucho espacio libre!</h3>
                    <p className="text-sm text-muted-foreground max-w-md relative z-10">
                      No encontramos apuntes con esos filtros. ¡Sé el primero en compartir tu material y ayudá a la comunidad!
                    </p>
                  </motion.div>
                )}

                {/* Resource Card List / Grid Layout switching with motion */}
                <motion.div
                  layout
                  className={
                    gridView
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "space-y-3"
                  }
                >
                  {paginatedResources.map((rsc) => {
                    return (
                      <motion.div
                        layout
                        key={rsc.id}
                        onClick={() => setSelectedResource(rsc)}
                        className="bg-glass rounded-2xl p-5 flex flex-col hover:-translate-y-1 transition-all duration-300 group cursor-pointer hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] relative border border-primary/5 hover:border-accent/30 overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                            <span
                              title={rsc.category}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider inline-block max-w-[fit-content] truncate ${rsc.categoryColor}`}
                            >
                              {rsc.category}
                            </span>
                            {rsc.thematicAxis && (
                              <span title={`Eje: ${rsc.thematicAxis}`} className="text-[10px] text-muted-foreground font-semibold truncate max-w-full">
                                Eje: {rsc.thematicAxis}
                              </span>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-card/60 border border-border/20 flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        </div>

                        <h3 className="font-heading text-base font-bold text-cream-bone mb-2 group-hover:text-primary transition-colors line-clamp-2 relative z-10">
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
                              className={`p-1.5 rounded hover:bg-muted/10 transition-colors flex items-center gap-1.5 ${rsc.hasVoted ? "text-accent" : "text-muted-foreground"}`}
                              title={rsc.hasVoted ? "Quitar Me gusta" : "Me gusta"}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${rsc.hasVoted ? "fill-accent text-accent" : ""}`} />
                              <span className="text-xs font-semibold">{rsc.likes}</span>
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
            {visibleCount < filteredResources.length && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setVisibleCount(v => v + 9)}
                  className="px-5 py-2 bg-glass border border-border/40 text-muted-foreground rounded-full text-xs font-semibold hover:bg-muted/10 hover:text-foreground active:scale-95 transition-all flex items-center gap-2"
                >
                  Cargar Más
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

          {/* Right sidebar column: Upload zone */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24 self-start pb-6">

            {/* Loading placeholder sidebars if true */}
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-28" />
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-56" />
                <div className="bg-glass rounded-2xl p-5 border border-primary/5 h-80" />
              </div>
            ) : (
              <>
                {/* Sidebar upload form */}
                <div className="bg-glass rounded-2xl p-7 border border-outline-variant shadow-lg relative group">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-container to-terracotta-soft opacity-10 blur-xl group-hover:opacity-20 transition-opacity pointer-events-none" />
                  
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">Materia</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Ej: Sistemas Operativos"
                              value={newCategory}
                              onChange={(e) => { setNewCategory(e.target.value); setMateriaFilter(e.target.value); setIsMateriaDropdownOpen(true); }}
                              onFocus={(e) => { setMateriaFilter(""); setIsMateriaDropdownOpen(true); e.target.select(); }}
                              onBlur={() => setTimeout(() => setIsMateriaDropdownOpen(false), 200)}
                              className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                            />
                            <AnimatePresence>
                              {isMateriaDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
                                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-xl shadow-xl overflow-y-auto max-h-40 custom-scrollbar z-20 flex flex-col"
                                >
                                  {predefinedMaterias.filter(m => normalizeString(m).includes(normalizeString(materiaFilter))).sort((a,b) => a.localeCompare(b)).length > 0 ? (
                                    predefinedMaterias.filter(m => normalizeString(m).includes(normalizeString(materiaFilter))).sort((a,b) => a.localeCompare(b)).map((m) => (
                                      <button
                                        key={m}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); setNewCategory(m); setMateriaFilter(m); setIsMateriaDropdownOpen(false); }}
                                        className={`text-left px-3 py-2 text-xs hover:bg-accent/15 transition-colors ${newCategory === m ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}
                                      >
                                        {m}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-xs text-muted-foreground italic">
                                      {newCategory ? `Se registrará "${newCategory}" como materia nueva` : "Escribí para buscar o crear"}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                            Eje Temático (Opcional)
                            <div className="relative group/tooltip flex items-center">
                              <Info className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-accent cursor-help transition-colors" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 text-center border border-border/40">
                                Un sub-tema específico de la materia. Ej: &quot;Gestión de Memoria&quot; o &quot;Integrales&quot;. Ayuda a la IA a entender mejor el contexto.
                              </div>
                            </div>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ej: Gestión de Memoria"
                              value={newAxis}
                              onChange={(e) => { setNewAxis(e.target.value); setEjeFilter(e.target.value); setIsEjeDropdownOpen(true); }}
                              onFocus={(e) => { setEjeFilter(""); setIsEjeDropdownOpen(true); e.target.select(); }}
                              onBlur={() => setTimeout(() => setIsEjeDropdownOpen(false), 200)}
                              className="w-full bg-card/65 border border-border/40 rounded-xl py-2 px-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                            />
                            <AnimatePresence>
                              {isEjeDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
                                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-xl shadow-xl overflow-y-auto max-h-40 custom-scrollbar z-20 flex flex-col"
                                >
                                  {predefinedEjes.filter(e => normalizeString(e).includes(normalizeString(ejeFilter))).sort((a,b) => a.localeCompare(b)).length > 0 ? (
                                    predefinedEjes.filter(e => normalizeString(e).includes(normalizeString(ejeFilter))).sort((a,b) => a.localeCompare(b)).map((ej) => (
                                      <button
                                        key={ej}
                                        type="button"
                                        onMouseDown={(ev) => { ev.preventDefault(); setNewAxis(ej); setEjeFilter(ej); setIsEjeDropdownOpen(false); }}
                                        className={`text-left px-3 py-2 text-xs hover:bg-accent/15 transition-colors ${newAxis === ej ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}
                                      >
                                        {ej}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-xs text-muted-foreground italic">{newAxis ? `Se agregará "${newAxis}"` : "Escribí para buscar o crear"}</div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Tipo de Archivo <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className={`w-full bg-card/65 border border-border/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent transition-all flex justify-between items-center ${newType ? "text-foreground" : "text-muted-foreground/70"}`}
                          >
                            <span>{newType || "Seleccioná un tipo..."}</span>
                            <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isTypeDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
                                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-xl shadow-xl overflow-hidden z-20 flex flex-col"
                              >
                                {["Apunte de Teoría", "Trabajo Práctico Resuelto", "Guía de Ejercicios", "Resumen", "Otro"].map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => { setNewType(type); setIsTypeDropdownOpen(false); }}
                                    className={`text-left px-3 py-2.5 text-xs hover:bg-accent/15 transition-colors ${newType === type ? 'text-accent font-semibold bg-accent/5' : 'text-foreground'}`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Dashed Drag & Drop File Selector */}
                      <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { 
                          e.preventDefault(); 
                          setIsDragging(false); 
                          const droppedFile = e.dataTransfer.files[0];
                          if (droppedFile) {
                            if (droppedFile.size === 0) {
                              showToast("El archivo está vacío (0 bytes).", "error");
                              return;
                            }
                            if (droppedFile.size > 50 * 1024 * 1024) {
                              showToast("El archivo es demasiado grande (máx 50MB).", "error");
                              return;
                            }
                            setFile(droppedFile);
                            const nameParts = droppedFile.name.split('.');
                            const title = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : droppedFile.name;
                            setNewTitle(title);
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-8 hover:border-accent/50 transition-all duration-300 bg-card/30 cursor-pointer flex flex-col items-center justify-center text-center w-full min-h-[140px] block ${
                          isDragging ? "border-accent bg-accent/10 shadow-[0_0_30px_rgba(var(--accent-rgb),0.15)] scale-[1.02]" : "border-border/30 hover:bg-card/50"
                        }`}
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          onClick={(e) => {
                            // Reset value so onChange fires even if same file is selected
                            (e.target as HTMLInputElement).value = '';
                          }}
                          onChange={(e) => {
                            const selected = e.target.files?.[0];
                            if (selected) {
                              if (selected.size === 0) {
                                showToast("El archivo está vacío (0 bytes).", "error");
                                return;
                              }
                              if (selected.size > 50 * 1024 * 1024) {
                                showToast("El archivo es demasiado grande (máx 50MB).", "error");
                                return;
                              }
                              setFile(selected);
                              const nameParts = selected.name.split('.');
                              const title = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : selected.name;
                              setNewTitle(title);
                            }
                          }}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${isDragging ? "bg-accent/20 text-accent" : "bg-card border border-border/40 text-muted-foreground group-hover:text-accent"}`}>
                          <CloudUpload className={`w-6 h-6 transition-transform duration-300 ${isDragging ? "scale-125 animate-bounce" : ""}`} />
                        </div>
                        {file ? (
                          <>
                            <span className="text-xs text-accent font-bold mb-0.5 truncate max-w-full px-2">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB - ¡Listo para subir!</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-foreground font-semibold mb-0.5">Arrastrá tu archivo o hacé clic acá</span>
                            <span className="text-[10px] text-muted-foreground">PDF, PNG, JPG (Máx 50MB)</span>
                          </>
                        )}
                      </label>

                      <button
                        type="submit"
                        disabled={actionInProgress === "upload-resource"}
                        className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-full hover:bg-accent/90 hover:scale-[1.01] active:scale-99 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/15 mt-4 disabled:opacity-40"
                      >
                        Subir archivo
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
              className="bg-glass rounded-3xl p-6 border border-accent/20 w-full max-w-7xl relative z-10 shadow-2xl flex flex-col h-[92vh] max-h-[1000px]"
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden pr-1 flex-1 pb-2 h-full">
                
                {/* Full Width: Real PDF Previewer */}
                <div className="lg:col-span-12 flex flex-col h-full space-y-4">
                  <h3 className="font-heading text-xs font-bold text-cream-bone uppercase tracking-wider flex items-center gap-2 shrink-0">
                    <Eye className="w-4 h-4 text-accent" />
                    Vista Previa del Documento
                  </h3>

                  {/* Document actual PDF preview block */}
                  <div className="bg-obsidian/75 rounded-2xl border border-border/10 flex-1 relative overflow-hidden min-h-[400px]">
                    <iframe 
                      src={`${selectedResource.storage_url}#view=FitH`} 
                      className="w-full h-full border-none"
                      title={`Preview de ${selectedResource.title}`}
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2">
                    {selectedResource.isOwner && (
                      <button
                        onClick={() => setResourceToDelete({ id: selectedResource.id, storageUrl: selectedResource.storage_url, title: selectedResource.title })}
                        className="px-4 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Eliminar apunte"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadResource(selectedResource)}
                      className="flex-1 bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/15"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Archivo Original
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Delete Confirmation Modal */}
      <AnimatePresence>
        {resourceToDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setResourceToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] relative overflow-hidden flex flex-col items-center text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-extrabold text-foreground mb-2">¿Eliminar Apunte?</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Vas a eliminar de forma permanente <strong>&quot;{resourceToDelete.title}&quot;</strong>. Esta acción no se puede deshacer.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setResourceToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border/60 text-muted-foreground font-semibold text-sm hover:bg-muted/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteResourceSubmit(resourceToDelete.id, resourceToDelete.storageUrl)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
