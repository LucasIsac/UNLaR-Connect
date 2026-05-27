"use client";

import { Library } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function MateriasPage() {
  return (
    <PlaceholderPage
      title="Materias Sugeridas"
      subtitle="Armá tu cuatrimestre inteligentemente"
      description="Te ayudamos a planificar qué cursar recomendándote materias según las correlativas aprobadas, dificultad estimada y las opiniones de otros alumnos."
      icon={Library}
    />
  );
}
