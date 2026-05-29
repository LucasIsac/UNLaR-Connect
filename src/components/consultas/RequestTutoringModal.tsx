"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, BookOpen, Loader2, CheckCircle } from "lucide-react";
import { TutorProfileForMatching, fetchTutorAvailabilityForDate, requestScheduledTutoring } from "@/actions/tutoring-scheduled";
import { Select } from "@/components/ui/Select";

interface RequestTutoringModalProps {
  tutor: TutorProfileForMatching;
  onClose: () => void;
  onSuccess: () => void;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function RequestTutoringModal({
  tutor,
  onClose,
  onSuccess,
}: RequestTutoringModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    tutor.subjects[0]?.id || null
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string } | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectOptions = tutor.subjects.map((sub) => ({
    value: sub.id,
    label: sub.name,
  }));

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get maximum date (2 weeks from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split("T")[0];
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);

      try {
        const result = await fetchTutorAvailabilityForDate(tutor.id, selectedDate);
        if (result.success && result.data) {
          setAvailableSlots(result.data);
        } else {
          setError(result.error || "No pudimos cargar los horarios disponibles.");
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar horarios.");
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, tutor.id]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedSubjectId || !selectedDate || !selectedSlot) {
      setError("Completá todos los campos para continuar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scheduledStart = `${selectedDate}T${selectedSlot.start_time}`;
      const scheduledEnd = `${selectedDate}T${selectedSlot.end_time}`;

      const result = await requestScheduledTutoring({
        tutorId: tutor.id,
        subjectId: selectedSubjectId,
        scheduledStart,
        scheduledEnd,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "No pudimos crear la solicitud.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al enviar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Avatar initials
  const initials = `${tutor.name?.[0] || ""}${tutor.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-glass border border-border/40 rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-xl text-foreground">
            Pedí una tutoría
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tutor Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/20 rounded-xl border border-border/20">
          {tutor.avatar_url ? (
            <img
              src={tutor.avatar_url}
              alt={`${tutor.name} ${tutor.last_name}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-accent/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent font-bold">
              {initials}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">
              {tutor.name} {tutor.last_name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="text-amber-500">★</span>
              <span>{tutor.tutor_rating.toFixed(1)}</span>
              <span>({tutor.total_reviews} reseñas)</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Subject Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Materia
            </label>
            <Select
              value={selectedSubjectId || ""}
              onChange={(val) => setSelectedSubjectId(val ? Number(val) : null)}
              options={subjectOptions}
              placeholder="Elegí la materia..."
              className="bg-background/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm focus-within:ring-1 focus-within:ring-accent focus:outline-none font-sans"
            />
          </div>

          {/* Date Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full bg-background/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {selectedDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {DAY_NAMES[new Date(selectedDate).getDay()]}
              </p>
            )}
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5" />
              Horario disponible
            </label>
            
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border/20">
                <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedDate 
                    ? "No hay horarios disponibles para esta fecha."
                    : "Elegí una fecha para ver horarios disponibles."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedSlot?.start_time === slot.start_time
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border/30 hover:border-border/50 text-foreground"
                    }`}
                  >
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedSubjectId || !selectedDate || !selectedSlot || isSubmitting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent/10 hover:shadow-accent/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando solicitud...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar tutoría</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
