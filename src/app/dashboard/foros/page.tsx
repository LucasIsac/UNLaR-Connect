import { fetchForumPosts } from "@/actions/foros";
import ForosClient from "./ForosClient";

export default async function ForosPage() {
  const threads = await fetchForumPosts();

  return <ForosClient initialThreads={threads} />;
}
