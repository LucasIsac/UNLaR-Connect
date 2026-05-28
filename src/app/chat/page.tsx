"use client";

import { Bot } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function ChatPage() {
  return (
    <PlaceholderPage
      title="Asistente de Estudio IA"
      subtitle="Chateá con tus apuntes mediante Inteligencia Artificial"
      description="Subí tus archivos PDF de cátedras y nuestro asistente IA te va a responder dudas puntuales citando exactamente las páginas del apunte. ¡Estudiá más rápido y sin rodeos!"
      icon={Bot}
    />
  );
}
