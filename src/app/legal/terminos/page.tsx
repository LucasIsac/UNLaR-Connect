"use client";

import { Scale } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function TerminosPage() {
  return (
    <PlaceholderPage
      title="Términos de Servicio"
      subtitle="Reglas claras de convivencia"
      description="Conocé los términos de uso del servicio, moderación de resúmenes y normas básicas para mantener una comunidad amigable, productiva y respetuosa para todos."
      icon={Scale}
      badge="Legal"
    />
  );
}
