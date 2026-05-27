"use client";

import { Award } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function KarmaPage() {
  return (
    <PlaceholderPage
      title="Gamificación y Karma"
      subtitle="Tu colaboración tiene recompensa"
      description="Cada vez que subas apuntes valorados, ayudes en un foro o des una tutoría, vas a ganar puntos de Karma. Subí en el ranking de la comunidad y ganá reconocimiento en tu carrera académica."
      icon={Award}
    />
  );
}
