"use client";

import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { EventExtended } from "@/actions/events";
import EventCard from "./EventCard";
import EventDetailModal from "./EventDetailModal";

type EventsSectionProps = {
  events: EventExtended[];
  canCreate: boolean;
  onCreateClick?: () => void;
};

export default function EventsSection({ events, canCreate, onCreateClick }: EventsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventExtended | null>(null);

  const visibleEvents = showAll ? events : events.slice(0, 3);

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-cream-bone">
              Próximos Eventos
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Seminarios, capacitaciones y más de la UNLaR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={onCreateClick}
              className="text-[11px] font-bold text-accent hover:text-accent/80 transition-colors px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/15"
            >
              + Crear Evento
            </button>
          )}
          {events.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {showAll ? "Ver menos" : "Ver todos"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} onClick={() => setDetailEvent(event)} />
          ))}
        </div>
      ) : (
        canCreate && (
          <div className="bg-glass rounded-2xl border border-border/10 p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">
              No hay eventos próximos
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Creá el primer evento para la comunidad UNLaR
            </p>
          </div>
        )
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={detailEvent}
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
      />
    </section>
  );
}
