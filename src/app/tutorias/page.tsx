"use client";

import { Users } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function TutoriasPage() {
  return (
    <PlaceholderPage
      title="Tutorías entre Pares"
      subtitle="Estudiar en equipo rinde más"
      description="¿Necesitás una mano con esa materia jodida? ¿O querés dar una mano a los ingresantes? Muy pronto vas a poder coordinar encuentros de tutorías y repasar juntos en la facu."
      icon={Users}
    />
  );
}
