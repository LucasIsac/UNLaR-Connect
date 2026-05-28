import { fetchCombinedDashboardData } from "@/actions/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { stats, sessions, posts } = await fetchCombinedDashboardData();

  return (
    <DashboardClient
      initialStats={stats}
      initialSessions={sessions}
      initialPosts={posts}
    />
  );
}
