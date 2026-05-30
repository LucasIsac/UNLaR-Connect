"use client";

import Image from "next/image";
import { Star, BookOpen, Calendar, MessageSquare } from "lucide-react";
import { TutorProfileForMatching } from "@/actions/tutoring-scheduled";

interface ScheduledTutorCardProps {
  tutor: TutorProfileForMatching;
  onRequestTutoring: (tutor: TutorProfileForMatching) => void;
  isSelected?: boolean;
  isOnline?: boolean;
  currentUserId: string;
  onRateTutor: (tutorId: string, tutorName: string) => void;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ScheduledTutorCard({
  tutor,
  onRequestTutoring,
  isSelected = false,
  isOnline = false,
  currentUserId,
  onRateTutor,
  onClick,
}: ScheduledTutorCardProps & { onClick?: () => void }) {
  const rating = tutor.tutor_rating ? tutor.tutor_rating.toFixed(1) : "0.0";
  const reviews = tutor.total_reviews ?? 0;

  // Avatar placeholder with initials
  const initials = `${tutor.name?.[0] || ""}${tutor.last_name?.[0] || ""}`.toUpperCase();

  // Group availability by day
  const availabilityByDay = tutor.availability.reduce((acc, avail) => {
    const day = avail.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(avail);
    return acc;
  }, {} as Record<number, typeof tutor.availability>);

  // Get available days sorted
  const availableDays = Object.keys(availabilityByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div 
      onClick={onClick}
      className={`bg-muted/10 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between hover-glow-subtle transition-all duration-300 hover:scale-[1.02] border-2 cursor-pointer shadow-md ${
      isSelected ? "border-accent shadow-lg shadow-accent/20" : "border-border/60 hover:border-accent/40"
    }`}>
      <div>
        {/* Header/Info section */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            {tutor.avatar_url ? (
              <Image
                src={tutor.avatar_url}
                alt={`${tutor.name} ${tutor.last_name}`}
                width={56}
                height={56}
                className="rounded-full object-cover border-2 border-accent/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                {initials}
              </div>
            )}
            {isOnline && (
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full shadow-sm shadow-emerald-500/50" 
                title="En línea ahora" 
              />
            )}
          </div>

          <div className="flex-1 min-w-0 flex justify-between items-start">
            <div>
              <h3 className="font-heading font-semibold text-lg text-foreground truncate">
                {tutor.name} {tutor.last_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm flex-wrap">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500 shrink-0" />
                  <span className="font-bold ml-1">{rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({reviews} {reviews === 1 ? "reseña" : "reseñas"})
                </span>
                
                {currentUserId !== tutor.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRateTutor(tutor.id, `${tutor.name} ${tutor.last_name}`);
                    }}
                    className="ml-2 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-md transition-colors"
                  >
                    Calificar
                  </button>
                )}
              </div>
            </div>
            
            {/* Price Badge */}
            <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
              tutor.tutor_price === 0 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                : "bg-accent/10 text-accent border-accent/20"
            }`}>
              {tutor.tutor_price === 0 ? "Gratis" : `$${tutor.tutor_price}/h`}
            </span>
          </div>
        </div>

        {/* Subjects list */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Materias</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
            {tutor.subjects.length === 0 ? (
              <span className="text-xs text-muted-foreground">Sin materias asignadas</span>
            ) : (
              tutor.subjects.map((sub) => (
                <span
                  key={sub.id}
                  className="px-2.5 py-1 text-xs rounded-full font-medium bg-secondary/10 text-secondary border border-secondary/20"
                >
                  {sub.name}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Weekly Availability */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Disponibilidad semanal</span>
          </div>
          <div className="space-y-1.5">
            {availableDays.length === 0 ? (
              <span className="text-xs text-muted-foreground">Sin horarios configurados</span>
            ) : (
              availableDays.slice(0, 3).map((day) => (
                <div key={day} className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground w-8">{DAY_NAMES[day]}</span>
                  <div className="flex flex-wrap gap-1">
                    {availabilityByDay[day].map((slot, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-accent/10 text-accent rounded-md font-medium"
                      >
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
            {availableDays.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{availableDays.length - 3} días más
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRequestTutoring(tutor);
        }}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent/10 hover:shadow-accent/20 focus:outline-none group mt-2"
      >
        <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Pedí una tutoría</span>
      </button>
    </div>
  );
}
