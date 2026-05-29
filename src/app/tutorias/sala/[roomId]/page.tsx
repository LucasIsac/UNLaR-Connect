import { getVerifiedSession } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { fetchCallRoom } from "@/actions/consultas";
import SalaClient from "./SalaClient";

interface SalaPageProps {
  params: {
    roomId: string;
  };
}

export const dynamic = "force-dynamic";

export default async function SalaPage({ params }: SalaPageProps) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/auth/login");
  }

  // Fetch the call room metadata
  const res = await fetchCallRoom(params.roomId);

  if (!res.success || !res.data) {
    console.error("Failed to load call room:", res.error);
    redirect("/tutorias");
  }

  const room = res.data;
  const isTutor = room.tutor_id === session.userId;

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 flex flex-col justify-between">
      <SalaClient
        room={room}
        isTutor={isTutor}
        currentUserId={session.userId}
      />
    </main>
  );
}
