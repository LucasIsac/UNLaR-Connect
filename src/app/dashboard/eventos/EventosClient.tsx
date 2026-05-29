"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { EventExtended, cancelEvent } from "@/actions/events";
import EventCard from "@/components/events/EventCard";
import EventDetailModal from "@/components/events/EventDetailModal";
import CreateEventModal from "@/components/events/CreateEventModal";

type EventosClientProps = {
  initialEvents: EventExtended[];
  canCreate: boolean;
};

export default function EventosClient({ initialEvents, canCreate }: EventosClientProps) {
  const [events, setEvents] = useState<EventExtended[]>(initialEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventExtended | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventExtended | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm("¿Cancelás este evento?")) return;
    const result = await cancelEvent(eventId);
    if (result.success) {
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status: "cancelled" as const } : e));
      showToast("Evento cancelado.");
    } else {
      showToast(result.error || "No se pudo cancelar.");
    }
  };

  const handleEditEvent = (event: EventExtended) => {
    setEditingEvent(event);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingEvent(null);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in dashboard-bg min-h-full pb-10">

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-accent text-accent-foreground border border-accent/20 px-5 py-3 rounded-2xl shadow-xl shadow-accent/10 font-semibold text-sm">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone">
              Eventos UNLaR
            </h1>
            <p className="text-sm text-muted-foreground">
              Seminarios, capacitaciones, diplomaturas y más.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => { setEditingEvent(null); setShowCreateModal(true); }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-accent/10"
            >
              <Plus className="w-4 h-4" />
              Crear Evento
            </button>
          )}
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="relative group/card">
                <EventCard event={event} onClick={() => setDetailEvent(event)} />
                {canCreate && event.status !== "cancelled" && (
                  <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                      title="Editar evento"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCancelEvent(event.id)}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Cancelar evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-glass rounded-2xl border border-border/10 p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground font-semibold mb-1">
              No hay eventos creados
            </p>
            <p className="text-xs text-muted-foreground/60">
              {canCreate ? "Creá el primer evento para la comunidad UNLaR" : "Los eventos aparecerán acá cuando se publiquen"}
            </p>
          </div>
        )}

        {/* Create/Edit Event Modal */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          editEvent={editingEvent}
          onCreated={(event) => {
            if (event) {
              setEvents((prev) => [event, ...prev]);
              showToast("¡Evento creado!");
            } else if (editingEvent) {
              setEvents((prev) => prev.map((e) => e.id === editingEvent.id ? { ...e, ...editingEvent } : e));
              showToast("Evento actualizado!");
            }
            handleModalClose();
          }}
        />

        {/* Event Detail Modal */}
        <EventDetailModal
          event={detailEvent}
          isOpen={!!detailEvent}
          onClose={() => setDetailEvent(null)}
        />
      </div>
    </DashboardLayout>
  );
}
