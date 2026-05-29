import { fetchForumPosts, getCurrentUserId } from "@/actions/foros";
import ForosClient from "./ForosClient";

export default async function ForosPage() {
  const [threads, currentUserId] = await Promise.all([
    fetchForumPosts(),
    getCurrentUserId(),
  ]);

  return <ForosClient initialThreads={threads} currentUserId={currentUserId} />;
}
