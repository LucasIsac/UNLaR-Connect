import { fetchActiveEvents, canCreateEvents } from "@/actions/events";
import EventosClient from "./EventosClient";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const [events, canCreate] = await Promise.all([
    fetchActiveEvents(),
    canCreateEvents(),
  ]);

  return <EventosClient initialEvents={events} canCreate={canCreate} />;
}
