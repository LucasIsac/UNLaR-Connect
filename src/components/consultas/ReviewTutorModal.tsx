"use client";

import { useState } from "react";
import { Star, X, Send } from "lucide-react";
import { submitTutorReview } from "@/actions/reviews";

interface ReviewTutorModalProps {
  tutorId: string;
  tutorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewTutorModal({
  tutorId,
  tutorName,
  onClose,
  onSuccess,
}: ReviewTutorModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor seleccioná una cantidad de estrellas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await submitTutorReview(tutorId, rating, comment);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-card border border-border/40 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20">
          <h2 className="font-heading font-bold text-xl text-foreground">
            Calificar a {tutorName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-semibold text-center">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              ¿Cómo fue tu experiencia?
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-500 text-amber-500"
                        : "fill-muted text-muted"
                    } transition-colors`} 
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium h-4">
              {rating === 1 && "Mala"}
              {rating === 2 && "Regular"}
              {rating === 3 && "Buena"}
              {rating === 4 && "Muy Buena"}
              {rating === 5 && "¡Excelente!"}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Comentario (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Me ayudó un montón a entender el tema..."
              className="w-full h-24 resize-none bg-background/50 border border-border/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              maxLength={300}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/20 bg-muted/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-bold text-sm shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar Valoración
          </button>
        </div>
      </div>
    </div>
  );
}
