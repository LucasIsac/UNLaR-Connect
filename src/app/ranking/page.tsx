import { fetchKarmaLeaderboard } from "@/actions/karma";
import { getVerifiedSession } from "@/lib/supabase";
import RankingClient from "./RankingClient";

export const metadata = {
  title: "Ranking de Estudiantes - UNLaR Connect",
  description: "Conocé a los alumnos más destacados y los mayores aportes por carrera en UNLaR Connect.",
};

export default async function RankingPage() {
  const leaderboard = await fetchKarmaLeaderboard();
  const session = await getVerifiedSession();

  return (
    <RankingClient 
      initialLeaderboard={leaderboard} 
      currentUserId={session?.userId} 
    />
  );
}

