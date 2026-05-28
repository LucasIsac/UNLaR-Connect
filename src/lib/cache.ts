import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  userProfile: (userId: string) => `user-profile-${userId}`,
  dashboardStats: (userId: string) => `dashboard-stats-${userId}`,
  upcomingSessions: (userId: string) => `upcoming-sessions-${userId}`,
  tutorAvailability: (userId: string) => `tutor-availability-${userId}`,
  tutorSubjects: (userId: string) => `tutor-subjects-${userId}`,
  postReplies: (postId: string) => `post-replies-${postId}`,
  forumPosts: "forum-posts",
  recentForumPosts: "recent-forum-posts",
  resources: "resources",
  careersList: "careers-list",
  subjectsList: "subjects-list",
};

/**
 * Safely trigger cache tag revalidation on mutations.
 */
export function invalidateCache(tag: string) {
  try {
    revalidateTag(tag);
    console.log(`[Cache Invalidation] Successfully revalidated tag: ${tag}`);
  } catch (error) {
    console.error(`[Cache Invalidation] Failed to invalidate cache tag: ${tag}`, error);
  }
}
