"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Sparkles,
  Search,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  BookOpen,
  DollarSign,
  Eye,
  EyeOff,
  Save
} from "lucide-react";
import { 
  addTutorSubject, 
  removeTutorSubject, 
  saveTutorAvailability,
  updateTutorPreferences,
  UserProfileExtended
} from "@/actions/perfil";
import { DbSubject, DbTutorAvailability } from "@/types/database";

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

type ConfiguracionTutorClientProps = {
  initialProfile: UserProfileExtended;
  initialTutorSubjects: DbSubject[];
  initialAvailability: DbTutorAvailability[];
  initialSubjects: DbSubject[];
};

export default function ConfiguracionTutorClient({
  initialProfile,
  initialTutorSubjects,
  initialAvailability,
  initialSubjects,
}: ConfiguracionTutorClientProps) {
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfileExtended>(initialProfile);
  const [tutorSubjects, setTutorSubjects] = useState<DbSubject[]>(initialTutorSubjects);
  const [availability, setAvailability] = useState<DbTutorAvailability[]>(initialAvailability);
  const [allSubjects] = useState<DbSubject[]>(initialSubjects);
  
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // General Settings State
  const [tutorPrice, setTutorPrice] = useState<number>(profile.tutor_price || 0);
  const [contactVisibility, setContactVisibility] = useState<boolean>(profile.contact_visibility ?? true);
  const [phoneNumber, setPhoneNumber] = useState<string>(profile.phone_number || "");

  // Add Schedule Form State
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [scheduleDay, setScheduleDay] = useState(1); // Lunes
  const [scheduleStart, setScheduleStart] = useState("18:30");
  const [scheduleEnd, setScheduleEnd] = useState("20:00");

  // Subjects Autocomplete Search
  const [subjectSearch, setSubjectSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Trigger auto-clearing toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. General Preferences
  const handleSavePreferences = async () => {
    setActionInProgress("save-preferences");
    
    // Optimistic update
    const previousProfile = profile ? { ...profile } : null;
    if (profile) {
      setProfile({
        ...profile,
        tutor_price: tutorPrice,
        contact_visibility: contactVisibility,
        phone_number: phoneNumber
      });
    }
    
    try {
      const response = await updateTutorPreferences(tutorPrice, contactVisibility, phoneNumber);
      if (response.success) {
        triggerToast("Preferencias de tutor actualizadas.");
        router.refresh();
      } else {
        setProfile(previousProfile as UserProfileExtended); // Rollback
        triggerToast(response.error || "No pudimos guardar los cambios.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error de conexión al guardar preferencias.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 2. Remove subject
  const handleRemoveSubject = async (subjectId: number, name: string) => {
    setActionInProgress(`remove-subject-${subjectId}`);
    
    // Optimistic UI update
    const previousSubjects = [...tutorSubjects];
    setTutorSubjects(tutorSubjects.filter(s => s.id !== subjectId));
    
    try {
      const response = await removeTutorSubject(subjectId);
      if (response.success) {
        triggerToast(`Quitaste "${name}" de tus materias.`);
        router.refresh();
      } else {
        setTutorSubjects(previousSubjects); // Rollback
        triggerToast(response.error || "No pudimos quitar la materia.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Ocurrió un error al quitar la materia.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 3. Add subject
  const handleAddSubject = async (subject: DbSubject) => {
    setIsSearchFocused(false);
    setSubjectSearch("");
    
    if (tutorSubjects.some(s => s.id === subject.id)) {
      triggerToast(`"${subject.name}" ya está en tu lista.`);
      return;
    }
    
    setActionInProgress(`add-subject-${subject.id}`);
    
    // Optimistic UI update
    const previousSubjects = [...tutorSubjects];
    setTutorSubjects([...tutorSubjects, subject]);
    
    try {
      const response = await addTutorSubject(subject.id);
      if (response.success) {
        triggerToast(`¡Sumaste "${subject.name}" como materia!`);
        router.refresh();
      } else {
        setTutorSubjects(previousSubjects); // Rollback
        triggerToast(response.error || "No se pudo agregar la materia.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Tuvimos un error al agregar la materia.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 4. Add availability
  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionInProgress("add-schedule");
    
    const newSlot: DbTutorAvailability = {
      id: 0, 
      tutor_id: profile.id,
      day_of_week: scheduleDay,
      start_time: scheduleStart,
      end_time: scheduleEnd
    };
    
    const updatedList = [...availability, newSlot].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });
    
    const previousAvailability = [...availability];
    
    // Optimistic UI update
    setAvailability(updatedList);
    setIsAddScheduleOpen(false);
    
    try {
      const response = await saveTutorAvailability(updatedList);
      if (response.success) {
        triggerToast(`Agregaste disponibilidad para el ${DAYS_OF_WEEK[scheduleDay]}.`);
        router.refresh();
      } else {
        setAvailability(previousAvailability); // Rollback
        setIsAddScheduleOpen(true);
        triggerToast(response.error || "No pudimos agendar el horario.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error de conexión al guardar el horario.");
    } finally {
      setActionInProgress(null);
    }
  };

  // 5. Delete availability
  const handleDeleteAvailability = async (slotId: number) => {
    setActionInProgress(`delete-schedule-${slotId}`);
    const updatedList = availability.filter(slot => slot.id !== slotId);
    
    const previousAvailability = [...availability];
    
    // Optimistic UI update
    setAvailability(updatedList);
    
    try {
      const response = await saveTutorAvailability(updatedList);
      if (response.success) {
        triggerToast("Se eliminó el bloque de disponibilidad.");
        router.refresh();
      } else {
        setAvailability(previousAvailability); // Rollback
        triggerToast(response.error || "No se pudo eliminar el horario.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error al procesar la baja del horario.");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredSubjectsForAutocomplete = allSubjects.filter(sub => {
    const isAlreadyTeaching = tutorSubjects.some(ts => ts.id === sub.id);
    const matchesSearch = sub.name.toLowerCase().includes(subjectSearch.toLowerCase());
    return !isAlreadyTeaching && matchesSearch;
  });

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 14 } }
  };

  return (
    <DashboardLayout>
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

      <motion.div 
        className="space-y-8 pb-10 max-w-4xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border/10 pb-6"
          variants={staggerItem}
        >
          <button
            onClick={() => router.push("/perfil")}
            className="w-10 h-10 rounded-2xl bg-card/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-cream-bone hover:border-accent hover:bg-card/80 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
              Configuración de Tutorías
            </h1>
            <p className="text-sm text-muted-foreground">
              Ajustá tu tarifa, visibilidad de contacto, materias y horarios.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ==================================
              COLUMNA IZQUIERDA: TARIFAS & PRIVACIDAD
             ================================== */}
          <div className="space-y-6">
            <motion.div 
              className="bg-glass rounded-3xl p-6 relative group hover:border-accent/10 transition-all duration-300 flex flex-col h-full"
              variants={staggerItem}
            >
              <h2 className="font-heading text-lg font-bold text-cream-bone mb-5 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                <span>Preferencias Generales</span>
              </h2>

              <div className="space-y-5 flex-1">
                {/* Tutor Price */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Tarifa por Hora (ARS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                    <input
                      type="number"
                      value={tutorPrice || ""}
                      onChange={(e) => setTutorPrice(Number(e.target.value) || 0)}
                      placeholder="Ej: 0 para gratis"
                      className="w-full bg-card/30 hover:bg-card/45 border border-border/40 focus:border-accent rounded-xl py-2.5 pl-8 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                    Poné 0 si querés dar tutorías gratuitas (te dará más puntos de Karma).
                  </p>
                </div>

                {/* Contact Visibility */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Visibilidad de Contacto
                  </label>
                  <button
                    onClick={() => setContactVisibility(!contactVisibility)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card/30 border border-border/40 hover:border-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${contactVisibility ? 'bg-accent/10 text-accent' : 'bg-muted/20 text-muted-foreground'}`}>
                        {contactVisibility ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-bold text-cream-bone block">
                          {contactVisibility ? "Público" : "Oculto"}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {contactVisibility 
                            ? "Los estudiantes pueden ver tu email y teléfono." 
                            : "Solo te pueden contactar por el sistema."}
                        </span>
                      </div>
                    </div>
                    {/* Fake toggle thumb */}
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${contactVisibility ? 'bg-accent' : 'bg-muted/50'}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all shadow-sm ${contactVisibility ? 'right-[3px]' : 'left-[3px]'}`} />
                    </div>
                  </button>
                </div>

                {/* Phone Number (Conditionally Rendered) */}
                <AnimatePresence>
                  {contactVisibility && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Número de Teléfono / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ej: +54 9 380 4123456"
                        className="w-full bg-card/30 hover:bg-card/45 border border-border/40 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all font-semibold"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                        Opcional. Si lo ponés, los alumnos podrán contactarte más rápido.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 pt-5 border-t border-border/10">
                <button
                  onClick={handleSavePreferences}
                  disabled={actionInProgress === "save-preferences"}
                  className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-xl transition-all duration-300 flex justify-center items-center gap-2 active:scale-98 cursor-pointer shadow-md shadow-accent/15 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Preferencias</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* ==================================
              COLUMNA DERECHA: MATERIAS & HORARIOS
             ================================== */}
          <div className="space-y-6">
            
            {/* Tutoring Subjects Manager */}
            <motion.div 
              className="bg-glass rounded-3xl p-6 relative group hover:border-accent/10 transition-all duration-300 z-10"
              variants={staggerItem}
            >
              <label className="block text-sm font-bold text-cream-bone mb-3 select-none flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                Materias que enseño
              </label>
              
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

                <AnimatePresence>
                  {isSearchFocused && subjectSearch.trim().length > 0 && (
                    <motion.ul 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 top-full mt-2 w-full bg-card border border-border/40 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar p-2"
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

            {/* Weekly Availability Scheduler */}
            <motion.div 
              className="bg-glass rounded-3xl p-6 relative group hover:border-accent/10 transition-all duration-300"
              variants={staggerItem}
            >
              <div className="flex items-center justify-between mb-4 select-none">
                <label className="block text-sm font-bold text-cream-bone flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  Disponibilidad Semanal
                </label>
                <button
                  onClick={() => setIsAddScheduleOpen(!isAddScheduleOpen)}
                  className="text-accent hover:text-accent/80 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Add schedule inline form */}
              <AnimatePresence>
                {isAddScheduleOpen && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                    onSubmit={handleAddAvailability}
                  >
                    <div className="p-4 bg-card/40 border border-border/40 rounded-2xl space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Día de la semana</label>
                        <select 
                          value={scheduleDay}
                          onChange={e => setScheduleDay(Number(e.target.value))}
                          className="w-full bg-background border border-border/40 rounded-xl py-2 px-3 text-xs font-semibold focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                        >
                          {DAYS_OF_WEEK.map((day, idx) => (
                            <option key={idx} value={idx}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Desde</label>
                          <input 
                            type="time" 
                            value={scheduleStart}
                            onChange={e => setScheduleStart(e.target.value)}
                            required
                            className="w-full bg-background border border-border/40 rounded-xl py-2 px-3 text-xs font-semibold focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Hasta</label>
                          <input 
                            type="time" 
                            value={scheduleEnd}
                            onChange={e => setScheduleEnd(e.target.value)}
                            required
                            className="w-full bg-background border border-border/40 rounded-xl py-2 px-3 text-xs font-semibold focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setIsAddScheduleOpen(false)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/30 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          disabled={actionInProgress === "add-schedule"}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm shadow-accent/20"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* List of active schedules */}
              <div className="space-y-2">
                {availability.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-border/30 text-center select-none">
                    <AlertCircle className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground font-semibold">No tenés horarios configurados.</p>
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

          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
