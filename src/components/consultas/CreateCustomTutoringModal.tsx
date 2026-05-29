"use client";

import { useState, useEffect } from "react";
import { X, Search, Clock, CalendarDays, Loader2, CheckCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchStudents, createCustomTutoring, StudentSearchResult } from "@/actions/tutoring-custom";
import { DbSubject } from "@/types/database";

interface CreateCustomTutoringModalProps {
  tutorSubjects: DbSubject[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCustomTutoringModal({
  tutorSubjects,
  onClose,
  onSuccess,
}: CreateCustomTutoringModalProps) {
  const [customTitle, setCustomTitle] = useState("");

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No debounced search needed anymore

  const handleSubmit = async () => {
    if (!customTitle.trim() || !selectedSubjectId || !selectedDate || !startTime || !endTime) {
      setError("Por favor completa todos los campos.");
      return;
    }

    // Validate times
    if (startTime >= endTime) {
      setError("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const scheduledStart = `${selectedDate}T${startTime}:00`;
    const scheduledEnd = `${selectedDate}T${endTime}:00`;

    const result = await createCustomTutoring({
      studentId: null, // No DB user
      title: customTitle.trim(),
      subjectId: Number(selectedSubjectId),
      scheduledStart,
      scheduledEnd,
    });

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Ocurrió un error inesperado.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-glass border border-border/40 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20">
          <h2 className="font-heading font-bold text-xl text-foreground">
            Crear Tutoría Personalizada
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Title Input */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5" />
              Nombre del Alumno (o Título)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Ej: Juan Pérez - Repaso Final"
              className="w-full bg-background/50 border border-border/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Materia
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="w-full bg-background/50 border border-border/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="" disabled>Seleccioná una materia...</option>
              {tutorSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <CalendarDays className="w-3.5 h-3.5" />
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-background/50 border border-border/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Desde
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-background/50 border border-border/30 rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Hasta
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-background/50 border border-border/30 rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/20 bg-muted/5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-muted/50 hover:bg-muted text-foreground px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !customTitle.trim() || !selectedSubjectId || !selectedDate || !startTime || !endTime}
            className="flex-[2] bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
