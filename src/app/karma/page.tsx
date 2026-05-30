import { fetchKarmaData, fetchUserActivity } from "@/actions/karma";
import KarmaClient from "./KarmaClient";

export const metadata = {
  title: "Reputación y Medallas - UNLaR Connect",
  description: "Tu nivel de reputación, progreso de puntos e insignias oficiales en UNLaR Connect.",
};

export default async function KarmaPage() {
  const [stats, activity] = await Promise.all([
    fetchKarmaData(),
    fetchUserActivity(),
  ]);

  return <KarmaClient initialStats={stats} initialActivity={activity} />;
}

