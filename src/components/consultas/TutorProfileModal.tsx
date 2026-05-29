"use client";

import { X, Star, BookOpen, Calendar, Mail, Phone, MessageSquare, ShieldAlert } from "lucide-react";
import { TutorProfileForMatching } from "@/actions/tutoring-scheduled";

interface TutorProfileModalProps {
  tutor: TutorProfileForMatching;
  onClose: () => void;
  onRequestTutoring: (tutor: TutorProfileForMatching) => void;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function TutorProfileModal({
  tutor,
  onClose,
  onRequestTutoring,
}: TutorProfileModalProps) {
  const rating = tutor.tutor_rating ? tutor.tutor_rating.toFixed(1) : "0.0";
  const reviews = tutor.total_reviews ?? 0;
  const initials = `${tutor.name?.[0] || ""}${tutor.last_name?.[0] || ""}`.toUpperCase();

  // Group availability by day
  const availabilityByDay = tutor.availability.reduce((acc, avail) => {
    const day = avail.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(avail);
    return acc;
  }, {} as Record<number, typeof tutor.availability>);

  const availableDays = Object.keys(availabilityByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-glass border border-border/40 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header / Close Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tutor Header Info */}
        <div className="flex flex-col items-center text-center mb-6">
          {tutor.avatar_url ? (
            <img
              src={tutor.avatar_url}
              alt={`${tutor.name} ${tutor.last_name}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-accent/20 mb-3"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent/10 border-4 border-accent/20 flex items-center justify-center text-accent font-black text-3xl mb-3">
              {initials}
            </div>
          )}
          
          <h2 className="font-heading font-black text-2xl text-foreground">
            {tutor.name} {tutor.last_name}
          </h2>
          
          <div className="flex items-center gap-2 mt-2 bg-muted/30 px-3 py-1 rounded-full text-sm">
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-500 shrink-0" />
              <span className="font-bold ml-1">{rating}</span>
            </div>
            <span className="text-muted-foreground font-medium">
              ({reviews} {reviews === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
          
          {/* Tarifa */}
          <div className="mt-4">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border ${
              tutor.tutor_price === 0 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                : "bg-accent/10 text-accent border-accent/20"
            }`}>
              {tutor.tutor_price === 0 ? "Tutorías Gratis" : `$${tutor.tutor_price} / hora`}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Materias */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              <BookOpen className="w-4 h-4 text-accent" />
              Materias que enseña
            </h3>
            <div className="flex flex-wrap gap-2">
              {tutor.subjects.length === 0 ? (
                <span className="text-sm text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg border border-border/10">
                  Sin materias asignadas
                </span>
              ) : (
                tutor.subjects.map((sub) => (
                  <span
                    key={sub.id}
                    className="px-3 py-1.5 text-sm rounded-xl font-semibold bg-secondary/10 text-secondary border border-secondary/20 shadow-sm"
                  >
                    {sub.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Datos de Contacto */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              <ShieldAlert className="w-4 h-4 text-accent" />
              Datos de Contacto
            </h3>
            <div className="bg-muted/20 rounded-xl p-4 border border-border/20 space-y-3">
              {tutor.contact_visibility ? (
                <>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-medium truncate">{tutor.email || "No especificado"}</span>
                  </div>
                  {tutor.phone_number && (
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="font-medium truncate">{tutor.phone_number}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed text-center py-2">
                  El tutor prefiere mantener sus datos privados. Por favor, comunícate solicitando una tutoría a través de la plataforma.
                </p>
              )}
            </div>
          </div>

          {/* Disponibilidad */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              <Calendar className="w-4 h-4 text-accent" />
              Disponibilidad Habitual
            </h3>
            <div className="bg-muted/10 rounded-xl p-4 border border-border/10">
              {availableDays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Sin horarios configurados en el sistema.
                </p>
              ) : (
                <div className="space-y-3">
                  {availableDays.map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-border/10 last:border-0 pb-3 last:pb-0">
                      <span className="font-bold text-foreground min-w-[90px] text-sm">
                        {DAY_NAMES[day]}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {availabilityByDay[day].map((slot, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-background text-muted-foreground border border-border/30 rounded-lg text-xs font-semibold"
                          >
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acción Principal */}
          <div className="pt-2">
            <button
              onClick={() => {
                onRequestTutoring(tutor);
              }}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-14 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent/10 hover:shadow-accent/20 focus:outline-none hover:scale-[1.02]"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Agendar Tutoría por el Sistema</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
