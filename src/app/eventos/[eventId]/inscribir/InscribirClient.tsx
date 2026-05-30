"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  BookOpen,
} from "lucide-react";
import { EventExtended, registerForEvent } from "@/actions/events";

type InscribirClientProps = {
  event: EventExtended;
};

export default function InscribirClient({ event }: InscribirClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    career: "",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerForEvent(event.id);
      if (result.success) {
        setSuccess(true);
      } else {
        alert(result.error || "No se pudo completar la inscripción.");
      }
    } catch {
      alert("Hubo un problema de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-glass rounded-3xl border border-accent/20 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-cream-bone mb-2">
            ¡Inscripción exitosa!
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Te inscribiste correctamente al evento <strong className="text-foreground">{event.title}</strong>.
            {event.meeting_link && (
              <> Recibirás un email con el link de la reunión.</>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/eventos")}
              className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors"
            >
              Volver a Eventos
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-muted text-muted-foreground font-semibold py-3 rounded-xl hover:bg-muted/80 transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-glass border-b border-border/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-cream-bone">
              Inscribirme al Evento
            </h1>
            <p className="text-xs text-muted-foreground">{event.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Event Summary Card */}
        <div className="bg-glass rounded-2xl border border-border/10 p-5">
          <div className="flex items-start gap-4">
            {event.image_url && (
              <Image
                src={event.image_url}
                alt={event.title}
                width={80}
                height={80}
                className="rounded-xl object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mb-2 ${event.typeColor}`}>
                {event.typeLabel}
              </span>
              <h2 className="font-heading text-base font-bold text-cream-bone mb-2">
                {event.title}
              </h2>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{formatDate(event.start_date)} · {formatTime(event.start_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{event.registrationCount} inscriptos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inscription Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-heading text-sm font-bold text-cream-bone flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            Datos personales
          </h3>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              placeholder="Tu nombre y apellido"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              placeholder="351-1234567"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Carrera *
            </label>
            <select
              required
              value={form.career}
              onChange={(e) => updateField("career", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            >
              <option value="">Seleccioná tu carrera</option>
              <option value="ing-sistemas">Ingeniería en Sistemas</option>
              <option value="lic-computacion">Licenciatura en Ciencias de la Computación</option>
              <option value="tec-informatica">Tecnicatura en Informática</option>
              <option value="otra">Otra</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="¿Tenés alguna consulta o comentario?"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || event.isFull}
            className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/15 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : event.isFull ? (
              "Evento completo"
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar inscripción
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground/50 text-center">
            Al inscribirte, aceptás los términos y condiciones del evento.
          </p>
        </form>
      </div>
    </div>
  );
}
