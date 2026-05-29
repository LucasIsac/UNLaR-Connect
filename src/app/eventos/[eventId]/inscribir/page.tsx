import { fetchActiveEvents } from "@/actions/events";
import InscribirClient from "./InscribirClient";

export default async function InscribirPage({ params }: { params: { eventId: string } }) {
  const events = await fetchActiveEvents();
  const event = events.find((e) => e.id === params.eventId);

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Evento no encontrado</h1>
          <p className="text-sm text-muted-foreground">El evento que buscás no existe o fue cancelado.</p>
        </div>
      </div>
    );
  }

  return <InscribirClient event={event} />;
}
