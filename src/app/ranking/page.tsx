"use client";

import { Trophy } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export default function RankingPage() {
  return (
    <PlaceholderPage
      title="Ranking de Estudiantes"
      subtitle="Los colaboradores más destacados"
      description="Descubrí quiénes son los estudiantes que más aportan resúmenes y respuestas de valor a nuestra comunidad académica UNLaR. ¡Vos también podés figurar acá!"
      icon={Trophy}
    />
  );
}
