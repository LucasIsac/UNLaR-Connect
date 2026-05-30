"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { EventExtended, registerForEvent, cancelRegistration } from "@/actions/events";

type EventDetailModalProps = {
  event: EventExtended | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (event) {
      setIsRegistered(event.isRegistered);
      setRegistrationCount(event.registrationCount);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const now = new Date();
  const deadline = new Date(event.registration_deadline);
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isRegistrationOpen = deadline > now && event.status === "upcoming";
  const spotsLeft = event.max_participants
    ? event.max_participants - registrationCount
    : null;

  const handleRegister = async () => {
    setLoading(true);
    try {
      if (isRegistered) {
        const result = await cancelRegistration(event.id);
        if (result.success) {
          setIsRegistered(false);
          setRegistrationCount((prev) => prev - 1);
        }
      } else {
        const result = await registerForEvent(event.id);
        if (result.success) {
          setIsRegistered(true);
          setRegistrationCount((prev) => prev + 1);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!mounted) return "";
    return new Date(dateStr).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    if (!mounted) return "";
    return new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      <div className="bg-glass rounded-3xl border border-accent/20 w-full max-w-lg relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Image Header */}
        {event.image_url && (
          <div className="relative h-48 overflow-hidden rounded-t-3xl">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Close button if no image */}
        {!event.image_url && (
          <div className="flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Type badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${event.typeColor}`}>
              {event.typeLabel}
            </span>
            <span className="text-xs text-muted-foreground">{event.timeLabel}</span>
          </div>

          {/* Title */}
          <h2 className="font-heading text-xl font-bold text-cream-bone">
            {event.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {event.description}
          </p>

          {/* Details */}
          <div className="space-y-3 bg-card/30 rounded-xl p-4 border border-border/10">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-accent shrink-0" />
              <div>
                <p className="text-foreground font-medium">{formatDate(event.start_date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(event.start_date)} - {formatTime(event.end_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-secondary shrink-0" />
              <span className="text-foreground">{event.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-accent shrink-0" />
              <span className="text-foreground">
                {registrationCount} inscripto{registrationCount !== 1 ? "s" : ""}
                {spotsLeft !== null && (
                  <span className="text-muted-foreground ml-1">
                    ({spotsLeft > 0 ? `${spotsLeft} lugares` : "Completo"})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs">
                Inscripciones cierran: {formatDate(event.registration_deadline)} a las {formatTime(event.registration_deadline)}
              </span>
            </div>
          </div>

          {/* Meeting link */}
          {event.meeting_link && (
            <a
              href={event.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Link de la reunión
            </a>
          )}

          {/* Register button */}
          {isRegistrationOpen && (
            <button
              onClick={handleRegister}
              disabled={loading || (!isRegistered && event.isFull)}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isRegistered
                  ? "bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25"
                  : event.isFull
                    ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-50"
                    : "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/10"
              } disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegistered ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Inscripto - Tocá para cancelar
                </>
              ) : event.isFull ? (
                "Completo"
              ) : (
                "Inscribirme"
              )}
            </button>
          )}

          {!isRegistrationOpen && event.status === "upcoming" && (
            <div className="w-full py-3 rounded-xl text-sm font-bold text-center bg-muted/50 text-muted-foreground border border-border/50">
              Inscripciones cerradas
            </div>
          )}

          {/* Go to inscription page button */}
          {isRegistrationOpen && !event.isFull && (
            <button
              onClick={() => {
                onClose();
                router.push(`/eventos/${event.id}/inscribir`);
              }}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
            >
              Ir a página de inscripción
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
