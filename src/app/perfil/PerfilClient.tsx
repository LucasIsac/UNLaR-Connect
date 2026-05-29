"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Trophy, 
  Star, 
  Award,
  BookOpen, 
  User, 
  Mail, 
  Camera, 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  X, 
  Calendar, 
  AlertCircle,
  Sparkles,
  Search,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { softDeleteAccountAction } from "@/actions/auth";
import { 
  updateUserProfile, 
  toggleTutorStatus, 
  addTutorSubject, 
  removeTutorSubject, 
  saveTutorAvailability,
  UserProfileExtended
} from "@/actions/perfil";
import { DbSubject, DbCareer, DbTutorAvailability } from "@/types/database";
import { Select } from "@/components/ui/Select";

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

type PerfilClientProps = {
  initialProfile: UserProfileExtended;
  initialTutorSubjects: DbSubject[];
  initialAvailability: DbTutorAvailability[];
  initialCareers: DbCareer[];
  initialSubjects: DbSubject[];
};

export default function PerfilClient({
  initialProfile,
  initialTutorSubjects,
  initialAvailability,
  initialCareers,
  initialSubjects,
}: PerfilClientProps) {
  const [profile, setProfile] = useState<UserProfileExtended | null>(initialProfile);
  const [tutorSubjects, setTutorSubjects] = useState<DbSubject[]>(initialTutorSubjects);
  const [availability, setAvailability] = useState<DbTutorAvailability[]>(initialAvailability);
  const [careers] = useState<DbCareer[]>(initialCareers);
  const [allSubjects] = useState<DbSubject[]>(initialSubjects);
  
  const loading = false;
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Edit Profile Form State
  const [editName, setEditName] = useState(initialProfile.name);
  const [editLastName, setEditLastName] = useState(initialProfile.last_name);
  const [editCareerId, setEditCareerId] = useState(initialProfile.career_id || 1);
  const [editAvatarUrl, setEditAvatarUrl] = useState(initialProfile.avatar_url || "");
  
  // Add Schedule Form State
  const [scheduleDay, setScheduleDay] = useState(1); // Default to Monday
  const [scheduleStart, setScheduleStart] = useState("18:30");
  const [scheduleEnd, setScheduleEnd] = useState("20:00");
  
  // Subjects Autocomplete Search
  const [subjectSearch, setSubjectSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // File input ref for avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger auto-clearing toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle autocomplete search clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Save general changes
  const handleSaveGeneralChanges = async () => {
    if (!profile) return;
    setActionInProgress("save-profile");
    try {
      const response = await updateUserProfile(editName, editLastName, editCareerId, editAvatarUrl);
      if (response.success && response.data) {
        setProfile(response.data);
        setIsEditProfileOpen(false);
        triggerToast("¡Guardamos tus datos académicos al toque! 🎉");
      } else {
        triggerToast(response.error || "No pudimos guardar los cambios.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error de conexión al guardar cambios.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 2. Toggle Tutor active status
  const handleToggleTutorActive = async (checked: boolean) => {
    if (!profile) return;
    setActionInProgress("toggle-tutor");
    
    // Optimistic UI update
    setProfile(prev => prev ? { ...prev, isTutorActive: checked } : null);
    
    try {
      const response = await toggleTutorStatus(checked);
      if (response.success) {
        triggerToast(checked 
          ? "¡Perfil de tutor activo! Ya podés recibir consultas y agendar clases."
          : "Perfil de tutor pausado. Se ocultaron tus disponibilidades."
        );
      } else {
        // Rollback
        setProfile(prev => prev ? { ...prev, isTutorActive: !checked } : null);
        triggerToast(response.error || "No se pudo cambiar el estado de tutor.");
      }
    } catch (err) {
      // Rollback
      setProfile(prev => prev ? { ...prev, isTutorActive: !checked } : null);
      console.error(err);
      triggerToast("Hubo un error de red al cambiar el perfil de tutor.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 3. Remove a tutoring subject
  const handleRemoveSubject = async (subjectId: number, name: string) => {
    setActionInProgress(`remove-subject-${subjectId}`);
    try {
      const response = await removeTutorSubject(subjectId);
      if (response.success && response.data) {
        setTutorSubjects(response.data);
        triggerToast(`Quitaste "${name}" de tus materias de tutoría.`);
      } else {
        triggerToast(response.error || "No pudimos quitar la materia.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Ocurrió un error al intentar quitar la materia.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 4. Add a tutoring subject
  const handleAddSubject = async (subject: DbSubject) => {
    setIsSearchFocused(false);
    setSubjectSearch("");
    
    if (tutorSubjects.some(s => s.id === subject.id)) {
      triggerToast(`"${subject.name}" ya está en tu lista.`);
      return;
    }
    
    setActionInProgress(`add-subject-${subject.id}`);
    try {
      const response = await addTutorSubject(subject.id);
      if (response.success && response.data) {
        setTutorSubjects(response.data);
        triggerToast(`¡Sumaste "${subject.name}" como materia que enseñás!`);
      } else {
        triggerToast(response.error || "No se pudo agregar la materia.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Tuvimos un error al agregar la materia.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 5. Add availability schedule
  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionInProgress("add-schedule");
    
    const newSlot: DbTutorAvailability = {
      id: 0, // Server assigns ID
      tutor_id: profile?.id || "",
      day_of_week: scheduleDay,
      start_time: scheduleStart,
      end_time: scheduleEnd
    };
    
    const updatedList = [...availability, newSlot].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return a.start_time.localeCompare(b.start_time);
    });
    
    try {
      const response = await saveTutorAvailability(updatedList);
      if (response.success && response.data) {
        setAvailability(response.data);
        setIsAddScheduleOpen(false);
        triggerToast(`Agregaste disponibilidad para el ${DAYS_OF_WEEK[scheduleDay]} de ${scheduleStart} a ${scheduleEnd}.`);
      } else {
        triggerToast(response.error || "No pudimos agendar el horario.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error de conexión al guardar el horario.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 6. Delete availability slot
  const handleDeleteAvailability = async (slotId: number) => {
    setActionInProgress(`delete-schedule-${slotId}`);
    
    const updatedList = availability.filter(slot => slot.id !== slotId);
    
    try {
      const response = await saveTutorAvailability(updatedList);
      if (response.success && response.data) {
        setAvailability(response.data);
        triggerToast("Se eliminó el bloque de disponibilidad.");
      } else {
        triggerToast(response.error || "No se pudo eliminar el horario.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error al procesar la baja del horario.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 7. Simulating Avatar Photo Uploading
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast("La imagen es muy pesada. Debe pesar menos de 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadstart = () => {
        setActionInProgress("upload-photo");
      };
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditAvatarUrl(result);
        if (profile) {
          setProfile({ ...profile, avatar_url: result });
        }
        setActionInProgress(null);
        triggerToast("¡Foto seleccionada al toque! Hacé clic en Guardar Cambios para confirmar.");
      };
      reader.readAsDataURL(file);
    }
  };

  // 8. Soft Delete account request
  const handleSoftDeleteAccount = async () => {
    setActionInProgress("delete-account");
    try {
      const response = await softDeleteAccountAction();
      if (response.success) {
        setIsDeleteModalOpen(false);
        triggerToast("¡Tu cuenta fue dada de baja con éxito! Te vamos a extrañar, che.");
        // Redirect to login after a brief pause
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        triggerToast(response.error || "No pudimos procesar la baja de la cuenta.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error de conexión al procesar la baja.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter subjects for autocomplete
  const filteredSubjectsForAutocomplete = allSubjects.filter(sub => {
    const isAlreadyTeaching = tutorSubjects.some(ts => ts.id === sub.id);
    const matchesSearch = sub.name.toLowerCase().includes(subjectSearch.toLowerCase());
    return !isAlreadyTeaching && matchesSearch;
  });

  // Animated stagger variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 120, damping: 14 }
    }
  };

  // ==========================================
  // ⏳ SKELETON LOADER STATE
  // Bento skeleton designed to prevent layouts shifting on mount
  // ==========================================
  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="space-y-10 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div className="space-y-3">
              <div className="h-10 bg-card/45 rounded-2xl w-56"></div>
              <div className="h-5 bg-card/45 rounded-2xl w-96"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 bg-card/45 rounded-xl w-32"></div>
              <div className="h-10 bg-card/45 rounded-xl w-32"></div>
            </div>
          </div>

          {/* Grid Columns Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column Left Skeletons */}
            <div className="space-y-6">
              <div className="h-44 bg-glass rounded-3xl border border-primary/5"></div>
              <div className="h-72 bg-glass rounded-3xl border border-primary/5"></div>
            </div>

            {/* Column Right Skeletons */}
            <div className="space-y-6">
              <div className="h-40 bg-glass rounded-3xl border border-primary/5"></div>
              <div className="h-52 bg-glass rounded-3xl border border-primary/5"></div>
              <div className="h-48 bg-glass rounded-3xl border border-primary/5"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Formatting values
  const currentLevel = Math.floor(profile.points / 200) || 12;
  const targetXp = 3000;
  const progressPercentage = Math.min((profile.points / targetXp) * 100, 100);

  return (
    <DashboardLayout>
      {/* Toast popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 bg-primary-container text-obsidian border border-accent/20 px-5 py-3 rounded-2xl shadow-xl shadow-accent/10 flex items-center gap-3 font-semibold text-sm"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <motion.div 
        className="space-y-8 pb-10"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Page Header toolbar */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border/10 pb-6"
          variants={staggerItem}
        >
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
              Mi Perfil Académico
            </h1>
            <p className="text-sm text-muted-foreground">
              Acá podés ver tus logros, editar tus datos y configurar tu disponibilidad para dar tutorías.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditName(profile.name);
                setEditLastName(profile.last_name);
                setEditCareerId(profile.career_id || 1);
                setIsEditProfileOpen(true);
              }}
              className="px-4 py-2 border border-border hover:border-accent bg-card/25 text-cream-bone font-semibold text-xs rounded-xl flex items-center gap-2 hover:scale-[1.01] active:scale-98 transition-all"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Editar Perfil</span>
            </button>
            <button
              onClick={handleSaveGeneralChanges}
              disabled={actionInProgress === "save-profile"}
              className="px-4 py-2 bg-accent text-accent-foreground font-semibold text-xs rounded-xl flex items-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-md shadow-accent/15 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </motion.div>

        {/* Balanced Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ==========================================
              COLUMNA A: PERFIL & LOGROS
             ========================================== */}
          <div className="flex flex-col gap-6">
            
            {/* Student Profile Card */}
            <motion.div 
              className="bg-glass rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden group hover:border-accent/10 transition-all duration-300"
              variants={staggerItem}
            >
              {/* Glow decoration */}
              <div className="absolute -top-20 -right-20 w-44 h-44 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Profile image with camera upload button */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full border-2 border-accent/20 p-1 bg-card/30 overflow-hidden relative shadow-lg flex items-center justify-center">
                  {editAvatarUrl ? (
                    <Image
                      alt={`Foto de perfil de ${profile.name}`}
                      className="w-full h-full object-cover rounded-full"
                      src={editAvatarUrl}
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-3xl font-black bg-accent/20 border border-accent/30 text-accent select-none">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Simulated file upload trigger overlay */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer"
                  disabled={actionInProgress === "upload-photo"}
                >
                  <Camera className="w-5 h-5 text-accent animate-pulse-slow" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="font-heading text-xl font-bold text-cream-bone truncate">
                  {profile.name} {profile.last_name}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mt-1 mb-4 font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{profile.email}</span>
                </div>
                
                {/* Career Tag (10% secondary terracotta opacity) */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/15 border border-secondary/20 text-secondary text-xs font-bold leading-none select-none max-w-full">
                  <GraduationCap className="w-4 h-4 shrink-0 text-secondary" />
                  <span className="truncate">{profile.careerName || "Ingeniería en Sistemas de Información"}</span>
                </div>
              </div>
            </motion.div>

            {/* Karma & Rewards Panel */}
            <motion.div 
              className="bg-glass rounded-3xl p-6 relative overflow-hidden group hover:border-accent/10 transition-all duration-300"
              variants={staggerItem}
            >
              {/* Background gradient grid decoration */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-accent/5 blur-[50px] rounded-full pointer-events-none" />

              <div className="flex justify-between items-end mb-6 select-none">
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-cream-bone flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" />
                    <span>Reputación Estudiantil</span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold">Tu reputación académica global</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-extrabold text-accent leading-none block">{profile.points.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">puntos totales</span>
                </div>
              </div>

              {/* Progress bar wrapper */}
              <div className="space-y-2 mb-6 select-none">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span className="text-accent">Nivel {currentLevel}</span>
                  <span>{profile.points} / {targetXp} XP</span>
                </div>
                <div className="w-full bg-muted/65 dark:bg-muted/40 h-2.5 rounded-full border border-border/20 overflow-hidden relative">
                  <motion.div 
                    className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Badges Earned */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">Insignias Comunitarias</h4>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Badge 1: Tutor Estrella (Unlocked) */}
                  <div className="bg-card/35 border border-accent/15 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:bg-card/55 transition-all cursor-pointer group/badge">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm group-hover/badge:scale-105 transition-transform shrink-0">
                      <Star className="w-5 h-5 fill-accent text-accent" />
                    </div>
                    <span className="text-[11px] font-bold text-cream-bone leading-tight">Tutor Estrella</span>
                  </div>

                  {/* Badge 2: Colaborador Destacado (Unlocked) */}
                  <div className="bg-card/35 border border-accent/15 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:bg-card/55 transition-all cursor-pointer group/badge">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-sm group-hover/badge:scale-105 transition-transform shrink-0">
                      <Award className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-[11px] font-bold text-cream-bone leading-tight">Colaborador</span>
                  </div>

                  {/* Badge 3: Lector Veloz (Locked - Alejandro points is 2450, need 3000 XP) */}
                  <div className="bg-card/10 border border-border/20 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 opacity-50 grayscale select-none cursor-not-allowed">
                    <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-center text-muted-foreground shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground leading-tight">Lector Veloz</span>
                  </div>

                </div>
              </div>

              {/* Redirección al Dashboard de Karma */}
              <div className="mt-5 border-t border-border/10 pt-4">
                <Link
                  href="/karma"
                  className="w-full h-10 border border-border hover:border-accent bg-card/25 hover:bg-card/50 text-cream-bone font-semibold text-xs rounded-xl transition-all duration-300 flex justify-center items-center gap-2 active:scale-98 cursor-pointer"
                >
                  <span>Ver mi Historial de Reputación y Medallas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </motion.div>
            
          </div>

          {/* ==========================================
              COLUMNA B: CONFIGURACIÓN DE TUTORÍA
             ========================================== */}
          <div className="flex flex-col gap-6">
            
            {/* Tutor Profile Activation Card */}
            <motion.div 
              className="bg-glass rounded-3xl p-6 relative group hover:border-accent/10 transition-all duration-300"
              variants={staggerItem}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3 select-none">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent shrink-0">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-cream-bone">Perfil de Tutor</h3>
                    <p className="text-xs text-muted-foreground font-semibold">Compartí tu conocimiento y ganá Reputación</p>
                  </div>
                </div>
                
                {/* Switch Toggle Input */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={profile.isTutorActive}
                    onChange={(e) => handleToggleTutorActive(e.target.checked)}
                    disabled={actionInProgress === "toggle-tutor"}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted/70 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-on-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent shadow-inner transition-colors" />
                </label>
              </div>

              {/* Statistics (Active only when tutor mode is enabled) */}
              <AnimatePresence initial={false}>
                {profile.isTutorActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-card/25 border border-border/10 mb-2 select-none">
                      <div className="text-center border-r border-border/20">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Valoración</span>
                        <span className="text-lg font-extrabold text-accent flex items-center justify-center gap-1 leading-none py-1">
                          {profile.tutor_rating.toFixed(1)}
                          <Star className="w-4 h-4 fill-accent text-accent" />
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Experiencia</span>
                        <span className="text-lg font-extrabold text-cream-bone leading-none block py-1">
                          {profile.total_reviews} classes
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tutoring Subjects Manager */}
            <AnimatePresence>
              {profile.isTutorActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-glass rounded-3xl p-6 relative z-30 group hover:border-accent/10 transition-all duration-300"
                >
                  <label className="block text-sm font-bold text-cream-bone mb-3 select-none">Materias que enseño</label>
                  
                  {/* Tutor subjects tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutorSubjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-medium py-1">No agregaste materias todavía. ¡Sumá una abajo!</p>
                    ) : (
                      tutorSubjects.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/25 text-accent text-xs font-bold transition-all duration-200 select-none group/tag"
                        >
                          <span>{sub.name}</span>
                          <button
                            onClick={() => handleRemoveSubject(sub.id, sub.name)}
                            disabled={actionInProgress?.startsWith("remove-subject-")}
                            className="text-accent/60 hover:text-destructive hover:bg-destructive/15 rounded-md p-0.5 shrink-0 transition-colors"
                            aria-label={`Eliminar ${sub.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Autocomplete Search input */}
                  <div className="relative" ref={searchContainerRef}>
                    <div className="relative">
                      <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="¿En qué materias podés dar una mano?"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        className="w-full bg-card/30 hover:bg-card/45 border border-border/40 focus:border-accent rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder-muted-foreground/60 font-semibold"
                      />
                    </div>

                    {/* Suggestions list drop */}
                    <AnimatePresence>
                      {isSearchFocused && subjectSearch.trim().length > 0 && (
                        <motion.ul 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-full mt-2 w-full bg-card border border-border/40 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-2"
                        >
                          {filteredSubjectsForAutocomplete.length === 0 ? (
                            <li className="text-xs text-muted-foreground p-3 text-center">No encontramos esa materia, che.</li>
                          ) : (
                            filteredSubjectsForAutocomplete.map(sub => (
                              <li key={sub.id}>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubject(sub)}
                                  className="w-full text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 focus:bg-muted/30 transition-colors focus:outline-none flex justify-between items-center"
                                >
                                  <span>{sub.name}</span>
                                  <span className="text-[9px] border border-border/30 rounded px-1.5 py-0.5 text-muted-foreground font-bold uppercase">año {sub.year}</span>
                                </button>
                              </li>
                            ))
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weekly Availability Scheduler */}
            <AnimatePresence>
              {profile.isTutorActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-glass rounded-3xl p-6 relative group hover:border-accent/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4 select-none">
                    <label className="block text-sm font-bold text-cream-bone">Disponibilidad Semanal</label>
                    <button
                      onClick={() => setIsAddScheduleOpen(true)}
                      className="text-accent hover:text-accent/80 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Agregar Horario</span>
                    </button>
                  </div>

                  {/* List of active schedules */}
                  <div className="space-y-2">
                    {availability.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-border/30 text-center select-none">
                        <AlertCircle className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1.5" />
                        <p className="text-xs text-muted-foreground font-semibold">No tenés horarios configurados para dar tutorías.</p>
                      </div>
                    ) : (
                      availability.map((slot) => (
                        <div 
                          key={slot.id} 
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-card/20 border border-border/20 hover:border-accent/30 transition-all group/slot"
                        >
                          <div className="flex items-center gap-3 select-none">
                            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
                            <span className="text-xs font-bold text-cream-bone">{DAYS_OF_WEEK[slot.day_of_week]}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground bg-card/75 border border-border/20 px-2.5 py-1 rounded-lg select-none">
                              {slot.start_time.slice(0, 5)} a {slot.end_time.slice(0, 5)}
                            </span>
                            <button
                              onClick={() => handleDeleteAvailability(slot.id)}
                              disabled={actionInProgress?.startsWith("delete-schedule-")}
                              className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                              aria-label="Borrar horario"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security & Account Settings (Danger Zone) */}
            <motion.div 
              className="bg-glass rounded-3xl p-6 relative overflow-hidden border border-[#690005]/20 hover:border-[#690005]/40 transition-all duration-300 mt-6"
              variants={staggerItem}
            >
              <div className="flex items-center gap-3 mb-4 select-none">
                <div className="w-10 h-10 rounded-2xl bg-[#690005]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] shrink-0">
                  <AlertCircle className="w-5 h-5 text-[#ffb4ab]" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-cream-bone">Zona de Peligro</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Configuración de seguridad de la cuenta</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Si decidís dar de baja tu cuenta, se suspenderá tu acceso temporalmente. Tus apuntes subidos se conservarán de forma anónima para ayudar a la comunidad de la UNLaR.
                </p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full h-11 border border-[#ffb4ab]/30 hover:border-[#ffb4ab]/70 bg-[#690005]/10 hover:bg-[#690005]/30 text-[#ffb4ab] font-bold text-xs rounded-xl transition-all duration-300 flex justify-center items-center gap-2 active:scale-98 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Dar de baja mi cuenta</span>
                </button>
              </div>
            </motion.div>

          </div>

        </div>
      </motion.div>

      {/* ==========================================
          MODALES DE INTERACCIÓN
         ========================================== */}
      
      {/* 1. Modal: Editar Perfil */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop layer */}
            <motion.div 
              className="absolute inset-0 bg-background/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileOpen(false)}
            />

            {/* Modal Box */}
            <motion.div
              className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl space-y-5"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
            >
              <div className="flex justify-between items-center border-b border-border/10 pb-3">
                <h3 className="font-heading text-base font-extrabold text-cream-bone">Editar Datos Personales</h3>
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Apellido</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Carrera Universitaria</label>
                  <Select
                    value={editCareerId}
                    onChange={(val) => setEditCareerId(Number(val))}
                    options={careers.map(car => ({ value: car.id, label: car.name }))}
                    className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal controls */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGeneralChanges}
                  disabled={actionInProgress === "save-profile"}
                  className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                  {actionInProgress === "save-profile" ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: Agregar Horario */}
      <AnimatePresence>
        {isAddScheduleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop layer */}
            <motion.div 
              className="absolute inset-0 bg-background/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddScheduleOpen(false)}
            />

            {/* Modal Box */}
            <motion.div
              className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl space-y-5"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
            >
              <div className="flex justify-between items-center border-b border-border/10 pb-3">
                <h3 className="font-heading text-base font-extrabold text-cream-bone flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Agregar Disponibilidad</span>
                </h3>
                <button 
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddAvailability} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Día de la Semana</label>
                  <Select
                    value={scheduleDay}
                    onChange={(val) => setScheduleDay(Number(val))}
                    options={[
                      { value: 1, label: "Lunes" },
                      { value: 2, label: "Martes" },
                      { value: 3, label: "Miércoles" },
                      { value: 4, label: "Jueves" },
                      { value: 5, label: "Viernes" },
                      { value: 6, label: "Sábado" },
                      { value: 0, label: "Domingo" }
                    ]}
                    className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Desde</span>
                    </label>
                    <input
                      type="time"
                      value={scheduleStart}
                      onChange={(e) => setScheduleStart(e.target.value)}
                      className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Hasta</span>
                    </label>
                    <input
                      type="time"
                      value={scheduleEnd}
                      onChange={(e) => setScheduleEnd(e.target.value)}
                      className="w-full bg-muted/30 border border-border/40 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Modal Controls */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddScheduleOpen(false)}
                    className="flex-1 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionInProgress === "add-schedule"}
                    className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                  >
                    {actionInProgress === "add-schedule" ? "Guardando..." : "Agregar Horario"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: Confirmar baja de cuenta (Soft Delete) */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop layer */}
            <motion.div 
              className="absolute inset-0 bg-background/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
            />

            {/* Modal Box */}
            <motion.div
              className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl space-y-5 animate-fade-in"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
            >
              <div className="flex justify-between items-center border-b border-border/10 pb-3">
                <h3 className="font-heading text-base font-extrabold text-cream-bone flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#ffb4ab]" />
                  <span>¿Estás seguro/a, che?</span>
                </h3>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 font-sans">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu cuenta será dada de baja de forma temporal. Tendrás una tolerancia de <span className="text-[#F59E0B] font-bold">14 días</span> para iniciar sesión y reactivarla si te arrepentís.
                </p>
                <p className="text-xs text-[#ffb4ab] font-semibold leading-relaxed">
                  ⚠ Transcurrido el plazo, la baja será permanente y no podrás recuperar tus tutorías, insignias ni nivel de Reputación.
                </p>
              </div>

              {/* Modal controls */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  No, cancelar
                </button>
                <button
                  onClick={handleSoftDeleteAccount}
                  disabled={actionInProgress === "delete-account"}
                  className="flex-1 py-2.5 bg-[#690005] hover:bg-[#93000a] text-[#ffdad6] text-xs font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                >
                  {actionInProgress === "delete-account" ? "Procesando..." : "Sí, dar de baja"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
