"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { EventExtended, registerForEvent, cancelRegistration } from "@/actions/events";

type EventCardProps = {
  event: EventExtended;
  onRegister?: (eventId: string) => void;
  onClick?: (event: EventExtended) => void;
};

export default function EventCard({ event, onRegister, onClick }: EventCardProps) {
  const [isRegistered, setIsRegistered] = useState(event.isRegistered);
  const [registrationCount, setRegistrationCount] = useState(event.registrationCount);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const now = new Date();
  const deadline = new Date(event.registration_deadline);
  const startDate = new Date(event.start_date);
  const isRegistrationOpen = deadline > now && event.status === "upcoming";
  const isUpcoming = startDate > now;
  const isOngoing = event.status === "ongoing";
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

  const formatEventDate = (dateStr: string) => {
    if (!mounted) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatEventTime = (dateStr: string) => {
    if (!mounted) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div 
      onClick={() => onClick?.(event)}
      className="bg-glass rounded-2xl border border-border/10 overflow-hidden hover:border-accent/20 transition-all duration-300 group flex flex-col h-full cursor-pointer"
    >
      {/* Image / Gradient Header */}
      <div className="relative h-36 overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 via-background to-terracotta-soft/10" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${event.typeColor}`}
          >
            {event.typeLabel}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isOngoing && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/25 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              En curso
            </span>
          )}
          {!isUpcoming && !isOngoing && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
              Finalizado
            </span>
          )}
        </div>

        {/* Time label */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-bold text-foreground bg-background/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            {event.timeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-heading text-base font-bold text-cream-bone mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
          {event.description}
        </p>

        {/* Meta info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>
              {formatEventDate(event.start_date)} · {formatEventTime(event.start_date)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>
              {registrationCount} inscripto{registrationCount !== 1 ? "s" : ""}
              {spotsLeft !== null && (
                <span className="text-muted-foreground/60">
                  {" "}· {spotsLeft > 0 ? `${spotsLeft} lugares` : "Completo"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Action button */}
        {isRegistrationOpen && (
          <button
            onClick={handleRegister}
            disabled={loading || (!isRegistered && event.isFull)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
                Inscripto
              </>
            ) : event.isFull ? (
              "Completo"
            ) : (
              "Inscribirme"
            )}
          </button>
        )}

        {!isRegistrationOpen && isUpcoming && (
          <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-muted/50 text-muted-foreground border border-border/50">
            Inscripciones cerradas
          </div>
        )}
      </div>
    </div>
  );
}
