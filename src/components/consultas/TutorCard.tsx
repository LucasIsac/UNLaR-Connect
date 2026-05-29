"use client";

import { Star, BookOpen, Video } from "lucide-react";
import { AvailableTutor } from "@/actions/consultas";

interface TutorCardProps {
  tutor: AvailableTutor;
  onRequestCall: (tutorId: string, subjectId: number | null) => void;
  isRequesting: boolean;
  selectedSubjectId?: number | null;
}

export default function TutorCard({
  tutor,
  onRequestCall,
  isRequesting,
  selectedSubjectId,
}: TutorCardProps) {
  // Get subject names or format the subjects nicely
  const getSubjectBadges = () => {
    if (!tutor.subjects || tutor.subjects.length === 0) {
      return <span className="text-xs text-muted-foreground">Sin materias asignadas</span>;
    }
    return tutor.subjects.map((sub) => (
      <span
        key={sub.id}
        className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
          selectedSubjectId === sub.id
            ? "bg-accent/20 text-accent border border-accent/30"
            : "bg-secondary/10 text-secondary border border-secondary/20"
        }`}
      >
        {sub.name}
      </span>
    ));
  };

  // Safe rating fallback
  const rating = tutor.tutor_rating ? tutor.tutor_rating.toFixed(1) : "0.0";
  const reviews = tutor.total_reviews ?? 0;

  // Handler for instant consultation
  const handleCallRequest = () => {
    // If a subject is active or selected, use it. Otherwise use the first available subject
    const subjectId = selectedSubjectId || (tutor.subjects?.[0]?.id ?? null);
    onRequestCall(tutor.id, subjectId);
  };

  // Avatar placeholder with initials
  const initials = `${tutor.name?.[0] || ""}${tutor.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="bg-glass rounded-lg p-5 flex flex-col justify-between hover-glow-subtle transition-all duration-300 hover:scale-[1.02] border border-border/40">
      <div>
        {/* Header/Info section */}
        <div className="flex items-start gap-4 mb-4">
          {tutor.avatar_url ? (
            <img
              src={tutor.avatar_url}
              alt={`${tutor.name} ${tutor.last_name}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-accent/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-lg text-foreground truncate">
              {tutor.name} {tutor.last_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-500 shrink-0" />
                <span className="font-bold ml-1">{rating}</span>
              </div>
              <span className="text-muted-foreground">
                ({reviews} {reviews === 1 ? "consulta" : "consultas"})
              </span>
            </div>
          </div>
        </div>

        {/* Subjects list */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Materias</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
            {getSubjectBadges()}
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={handleCallRequest}
        disabled={isRequesting}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent/10 hover:shadow-accent/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>{isRequesting ? "Llamando..." : "Pedir ayuda en vivo"}</span>
      </button>
    </div>
  );
}
