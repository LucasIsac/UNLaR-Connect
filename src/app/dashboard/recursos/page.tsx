import { fetchResources } from "@/actions/recursos";
import RecursosClient from "./RecursosClient";

export default async function RecursosPage() {
  const resources = await fetchResources();

  return <RecursosClient initialResources={resources} />;
}
