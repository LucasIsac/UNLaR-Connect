"use client";

import { MessagesSquare } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function ForosPage() {
  return (
    <PlaceholderPage
      title="Foros de la Comunidad"
      subtitle="Debatí, consultá y compartí"
      description="Armá hilos de discusión para debatir sobre materias, profesores, horarios y proyectos de investigación. Un espacio directo para conectar con todos tus compañeros de carrera."
      icon={MessagesSquare}
    />
  );
}
