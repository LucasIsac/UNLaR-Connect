import { fetchCombinedDashboardData } from "@/actions/dashboard";
import { fetchCombinedHeaderData } from "@/actions/perfil";
import { fetchActiveEvents, canCreateEvents } from "@/actions/events";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ stats, sessions, posts }, headerData, events, canCreate] = await Promise.all([
    fetchCombinedDashboardData(),
    fetchCombinedHeaderData(),
    fetchActiveEvents(),
    canCreateEvents(),
  ]);

  return (
    <DashboardClient
      initialStats={stats}
      initialSessions={sessions}
      initialPosts={posts}
      initialHeaderData={headerData}
      initialEvents={events}
      canCreateEvents={canCreate}
    />
  );
}
