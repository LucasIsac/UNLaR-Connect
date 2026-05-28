"use client";

import { BookOpen } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function ApuntesPage() {
  return (
    <PlaceholderPage
      title="Banco de Apuntes"
      subtitle="¡Preparate para compartir y estudiar!"
      description="Muy pronto vas a poder subir tus resúmenes, buscar apuntes filtrados por materia y cátedra, y calificar el contenido para ayudar a otros estudiantes de la UNLaR."
      icon={BookOpen}
    />
  );
}
