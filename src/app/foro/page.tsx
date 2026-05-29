import { fetchForumPosts, getCurrentUserId } from "@/actions/foro";
import ForoClient from "./ForoClient";

export default async function ForoPage() {
  const [threads, currentUserId] = await Promise.all([
    fetchForumPosts(),
    getCurrentUserId(),
  ]);

  return <ForoClient initialThreads={threads} currentUserId={currentUserId} />;
}
