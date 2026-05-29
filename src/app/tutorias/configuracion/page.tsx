import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/supabase";
import { 
  fetchUserProfile, 
  fetchTutorSubjects, 
  fetchTutorAvailability, 
  fetchSubjects 
} from "@/actions/perfil";
import ConfiguracionTutorClient from "./ConfiguracionTutorClient";

export const metadata: Metadata = {
  title: "Configuración de Tutoría | UNLaR Connect",
  description: "Ajustá tus horarios, tarifas y materias para dar tutorías.",
};

export default async function ConfiguracionTutorPage() {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await fetchUserProfile();
  
  // If not a tutor, redirect to profile where they can activate it
  if (!profile.isTutorActive) {
    redirect("/perfil");
  }

  const [tutorSubjects, availability, allSubjects] = await Promise.all([
    fetchTutorSubjects(),
    fetchTutorAvailability(),
    fetchSubjects(),
  ]);

  return (
    <ConfiguracionTutorClient
      initialProfile={profile}
      initialTutorSubjects={tutorSubjects}
      initialAvailability={availability}
      initialSubjects={allSubjects}
    />
  );
}
