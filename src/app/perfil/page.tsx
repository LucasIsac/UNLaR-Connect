import {
  fetchCareers,
  fetchSubjects,
  fetchTutorAvailability,
  fetchTutorSubjects,
  fetchUserProfile,
} from "@/actions/perfil";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const [
    profile,
    tutorSubjects,
    availability,
    careers,
    subjects,
  ] = await Promise.all([
    fetchUserProfile(),
    fetchTutorSubjects(),
    fetchTutorAvailability(),
    fetchCareers(),
    fetchSubjects(),
  ]);

  return (
    <PerfilClient
      initialProfile={profile}
      initialTutorSubjects={tutorSubjects}
      initialAvailability={availability}
      initialCareers={careers}
      initialSubjects={subjects}
    />
  );
}
