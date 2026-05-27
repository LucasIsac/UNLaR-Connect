"use client";

import { HelpCircle } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function SoportePage() {
  return (
    <PlaceholderPage
      title="Centro de Soporte"
      subtitle="Estamos para ayudarte"
      description="¿Tuviste un problema con el sistema o tenés dudas de cómo usar alguna función? Contactanos directamente y nuestro equipo del centro de estudiantes te dará soporte al toque."
      icon={HelpCircle}
    />
  );
}
