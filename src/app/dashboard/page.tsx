import { fetchCombinedDashboardData } from "@/actions/dashboard";
import { fetchCombinedHeaderData } from "@/actions/perfil";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const [{ stats, sessions, posts }, headerData] = await Promise.all([
    fetchCombinedDashboardData(),
    fetchCombinedHeaderData(),
  ]);

  return (
    <DashboardClient
      initialStats={stats}
      initialSessions={sessions}
      initialPosts={posts}
      initialHeaderData={headerData}
    />
  );
}
