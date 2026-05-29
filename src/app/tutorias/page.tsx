import { getVerifiedSession, createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import TutoriasClient from "./TutoriasClient";
import { fetchCombinedHeaderData } from "@/actions/perfil";

export const dynamic = "force-dynamic";

export default async function TutoriasPage() {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/auth/login");
  }

  const [headerData, supabase] = await Promise.all([
    fetchCombinedHeaderData().catch((err) => {
      console.error("Failed to load header data in TutoriasPage:", err);
      return undefined;
    }),
    createServerClient(),
  ]);

  // Fetch complete user profile details
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, last_name, role_id, avatar_url")
    .eq("id", session.userId)
    .single();

  if (error || !user) {
    console.error("Failed to load user profile in TutoriasPage:", error);
    redirect("/dashboard");
  }

  return (
    <TutoriasClient
      currentUser={{
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        role_id: user.role_id,
        avatar_url: user.avatar_url ?? undefined,
      }}
      initialHeaderData={headerData}
    />
  );
}
