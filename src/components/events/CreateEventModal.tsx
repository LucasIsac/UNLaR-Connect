"use client";

import { useState, useRef, useEffect } from "react";
import { X, Calendar, Loader2, Upload, Image } from "lucide-react";
import { createEvent, editEvent } from "@/actions/events";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";

import { EventExtended } from "@/actions/events";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (event: any) => void;
  editingEvent?: EventExtended | null;
};

const EVENT_TYPES = [
  { value: "seminario", label: "Seminario" },
  { value: "capacitacion", label: "Capacitación" },
  { value: "diplomatura", label: "Diplomatura" },
  { value: "taller", label: "Taller" },
  { value: "conferencia", label: "Conferencia" },
  { value: "otro", label: "Otro" },
];

export default function CreateEventModal({ isOpen, onClose, onCreated, editingEvent }: CreateEventModalProps) {
  const isEditing = !!editingEvent;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editingEvent?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "seminario",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    location: "",
    meeting_link: "",
    max_participants: "",
    image_url: "",
  });

  // Update form when editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title || "",
        description: editingEvent.description || "",
        event_type: editingEvent.event_type || "seminario",
        start_date: editingEvent.start_date ? new Date(editingEvent.start_date).toISOString().slice(0, 16) : "",
        end_date: editingEvent.end_date ? new Date(editingEvent.end_date).toISOString().slice(0, 16) : "",
        registration_deadline: editingEvent.registration_deadline ? new Date(editingEvent.registration_deadline).toISOString().slice(0, 16) : "",
        location: editingEvent.location || "",
        meeting_link: editingEvent.meeting_link || "",
        max_participants: editingEvent.max_participants?.toString() || "",
        image_url: editingEvent.image_url || "",
      });
      setImagePreview(editingEvent.image_url || null);
    } else {
      setForm({
        title: "",
        description: "",
        event_type: "seminario",
        start_date: "",
        end_date: "",
        registration_deadline: "",
        location: "",
        meeting_link: "",
        max_participants: "",
        image_url: "",
      });
      setImagePreview(null);
    }
    setError(null);
  }, [editingEvent]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const supabase = createClient();
      const fileName = `event-${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("apuntes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("apuntes")
        .getPublicUrl(fileName);

      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      setImagePreview(URL.createObjectURL(file));
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const result = await editEvent(editingEvent.id, {
          ...form,
          max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
        });
        if (result.success) {
          onCreated?.(null);
          onClose();
        } else {
          setError(result.error || "No se pudo editar el evento.");
        }
      } else {
        const result = await createEvent({
          ...form,
          max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
        });
        if (result.success) {
          onCreated?.(result.event);
          onClose();
        } else {
          setError(result.error || "No se pudo crear el evento.");
        }
      }
    } catch {
      setError("Hubo un problema de conexión.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      <div className="bg-glass rounded-3xl border border-accent/20 w-full max-w-lg relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-glass/95 backdrop-blur-sm border-b border-border/10 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-cream-bone">
                {isEditing ? "Editar Evento" : "Crear Evento"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isEditing ? "Modificá los datos del evento" : "Publicá un seminario, capacitación o taller"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Título del Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Seminario de Inteligencia Artificial"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Tipo de Evento *
            </label>
            <Select
              value={form.event_type}
              onChange={(val) => updateField("event_type", String(val))}
              options={EVENT_TYPES}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Descripción *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contá de qué trata el evento..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Imagen de portada (opcional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-xl border border-border/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setForm((prev) => ({ ...prev, image_url: "" }));
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full border border-dashed border-border/60 rounded-xl py-6 text-center text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors flex flex-col items-center gap-2"
              >
                {uploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Image className="w-6 h-6" />
                    <span className="text-xs font-semibold">Elegí una imagen de portada</span>
                    <span className="text-[10px] opacity-60">JPG, PNG • Máx 5MB</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Fecha y hora de inicio *
              </label>
              <input
                type="datetime-local"
                required
                value={form.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Fecha y hora de fin *
              </label>
              <input
                type="datetime-local"
                required
                value={form.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
                className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Registration deadline */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Cierre de inscripciones *
            </label>
            <input
              type="datetime-local"
              required
              value={form.registration_deadline}
              onChange={(e) => updateField("registration_deadline", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Ubicación *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Aula 301, Edificio Norte o Virtual"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Meeting link */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Link de la reunión (opcional)
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              value={form.meeting_link}
              onChange={(e) => updateField("meeting_link", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Max participants */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Cupo máximo (opcional)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Sin límite si se deja vacío"
              value={form.max_participants}
              onChange={(e) => updateField("max_participants", e.target.value)}
              className="w-full bg-card/65 border border-border/40 rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/15 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                {isEditing ? "Guardar Cambios" : "Publicar Evento"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
