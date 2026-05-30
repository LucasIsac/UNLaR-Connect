import { fetchPublicProfile } from "@/actions/perfil";
import UserProfileClient from "./UserProfileClient";

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const profile = await fetchPublicProfile(params.userId);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Usuario no encontrado</h1>
          <p className="text-sm text-muted-foreground">El perfil que buscás no existe o fue eliminado.</p>
        </div>
      </div>
    );
  }

  return <UserProfileClient profile={profile} />;
}
