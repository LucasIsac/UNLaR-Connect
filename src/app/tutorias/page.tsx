import { getVerifiedSession, createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import TutoriasClient from "./TutoriasClient";

export const dynamic = "force-dynamic";

export default async function TutoriasPage() {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/auth/login");
  }

  const supabase = createServerClient();

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
    <main className="container max-w-container-max mx-auto px-4 md:px-6 py-8">
      <TutoriasClient
        currentUser={{
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          role_id: user.role_id,
          avatar_url: user.avatar_url ?? undefined,
        }}
      />
    </main>
  );
}
