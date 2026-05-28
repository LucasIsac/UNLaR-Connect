import { fetchKarmaData } from "@/actions/karma";
import KarmaClient from "./KarmaClient";

export const metadata = {
  title: "Puntos de Karma y Medallas - UNLaR Connect",
  description: "Tu nivel de Karma, progreso de XP e insignias oficiales en UNLaR Connect.",
};

export default async function KarmaPage() {
  const stats = await fetchKarmaData();

  return <KarmaClient initialStats={stats} />;
}

