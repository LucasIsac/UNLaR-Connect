"use client";

import { ShieldCheck } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function PrivacidadPage() {
  return (
    <PlaceholderPage
      title="Políticas de Privacidad"
      subtitle="Tus datos están protegidos"
      description="Te explicamos cómo guardamos y cuidamos tus datos académicos y personales, garantizando que el uso de los mismos sea puramente para mejorar tu experiencia dentro de la red UNLaR."
      icon={ShieldCheck}
      badge="Privacidad"
    />
  );
}
