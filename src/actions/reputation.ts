"use server";

import { createServerClient, getVerifiedSession } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";
import { POINTS_PER_LEVEL } from "@/lib/reputation-constants";

// ==========================================
// TYPES
// ==========================================

export interface ReputationStats {
  userPoints: number;
  reputationLevel: number;
  currentXP: number;
  nextLevelXP: number;
  xpPercentage: number;
  allBadges: BadgeInfo[];
  earnedBadges: BadgeInfo[];
  recentActivity: KarmaLogEntry[];
}

export interface BadgeInfo {
  id: number;
  name: string;
  description: string;
  icon_name?: string;
  required_points: number;
  earned: boolean;
  earned_at?: string;
}

export interface KarmaLogEntry {
  id: string;
  amount: number;
  reason: string;
  description?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  last_name: string;
  points: number;
  career_id?: number;
  career_name?: string;
  badges_count: number;
  avatar_url?: string;
}

// ==========================================
// HELPER: Award points to a user
// ==========================================

export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  description?: string,
  referenceId?: string
): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    const supabase = createServerClient();

    // Get current points
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const currentPoints = userData.points || 0;
    const newTotal = currentPoints + amount;

    // Update points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newTotal })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Log the change
    await supabase.from("karma_log").insert({
      user_id: userId,
      amount,
      reason,
      description: description || null,
      reference_id: referenceId || null,
    });

    // Check for new badges
    await checkAndAwardBadges(userId, newTotal);

    // Invalidate caches
    invalidateCache(CACHE_TAGS.karmaStats(userId));
    invalidateCache(CACHE_TAGS.karmaLeaderboard);
    invalidateCache(CACHE_TAGS.dashboardStats(userId));
    invalidateCache(CACHE_TAGS.userProfile(userId));

    return { success: true, newTotal };
  } catch (error: any) {
    console.error("[awardPoints] Error:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// HELPER: Check and award badges
// ==========================================

async function checkAndAwardBadges(userId: string, totalPoints: number) {
  try {
    const supabase = createServerClient();

    // Get all badges
    const { data: allBadges } = await supabase
      .from("badges")
      .select("*");

    if (!allBadges || allBadges.length === 0) return;

    // Get earned badges
    const { data: earnedBadges } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    const earnedIds = new Set((earnedBadges || []).map((b: any) => b.badge_id));

    // Check each badge
    for (const badge of allBadges) {
      if (!earnedIds.has(badge.id) && totalPoints >= badge.required_points) {
        // Award badge
        await supabase.from("user_badges").insert({
          user_id: userId,
          badge_id: badge.id,
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "¡Nueva insignia desbloqueada!",
          content: `Conseguiste la insignia "${badge.name}" por alcanzar ${badge.required_points} puntos de reputación.`,
          type: "karma",
          is_read: false,
        });
      }
    }
  } catch (error) {
    console.error("[checkAndAwardBadges] Error:", error);
  }
}

// ==========================================
// READ: Fetch reputation stats for current user
// ==========================================

export async function fetchReputationStats(): Promise<ReputationStats> {
  const session = await getVerifiedSession();
  const userId = session?.userId || "";

  return unstable_cache(
    async () => {
      if (!userId) {
        return {
          userPoints: 0,
          reputationLevel: 1,
          currentXP: 0,
          nextLevelXP: POINTS_PER_LEVEL,
          xpPercentage: 0,
          allBadges: [],
          earnedBadges: [],
          recentActivity: [],
        };
      }

      const supabase = createServerClient();

      // Get user points
      const { data: userData } = await supabase
        .from("users")
        .select("points")
        .eq("id", userId)
        .single();

      const points = userData?.points || 0;
      const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
      const currentXP = points % POINTS_PER_LEVEL;
      const nextLevelXP = POINTS_PER_LEVEL;
      const xpPercentage = (currentXP / nextLevelXP) * 100;

      // Get all badges
      const { data: allBadgesData } = await supabase
        .from("badges")
        .select("*")
        .order("required_points", { ascending: true });

      // Get earned badges
      const { data: earnedBadgesData } = await supabase
        .from("user_badges")
        .select("badge_id, awarded_at")
        .eq("user_id", userId);

      const earnedMap = new Map(
        (earnedBadgesData || []).map((eb: any) => [eb.badge_id, eb.awarded_at])
      );

      const allBadges: BadgeInfo[] = (allBadgesData || []).map((b: any) => ({
        ...b,
        earned: earnedMap.has(b.id),
        earned_at: earnedMap.get(b.id),
      }));

      const earnedBadges = allBadges.filter((b) => b.earned);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from("karma_log")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      return {
        userPoints: points,
        reputationLevel: level,
        currentXP,
        nextLevelXP,
        xpPercentage,
        allBadges,
        earnedBadges,
        recentActivity: (recentActivity || []).map((r: any) => ({
          id: r.id,
          amount: r.amount,
          reason: r.reason,
          description: r.description,
          created_at: r.created_at,
        })),
      };
    },
    ["reputation-stats", userId],
    { tags: [CACHE_TAGS.karmaStats(userId)], revalidate: 86400 }
  )();
}

// ==========================================
// READ: Fetch leaderboard
// ==========================================

export async function fetchReputationLeaderboard(): Promise<LeaderboardEntry[]> {
  return unstable_cache(
    async () => {
      const supabase = createServerClient();

      const { data: users } = await supabase
        .from("users")
        .select("id, name, last_name, points, career_id, avatar_url, deleted_at")
        .is("deleted_at", null)
        .order("points", { ascending: false })
        .limit(50);

      if (!users || users.length === 0) return [];

      // Get career names
      const { data: careers } = await supabase
        .from("careers")
        .select("id, name");

      const careerMap = new Map(
        (careers || []).map((c: any) => [c.id, c.name])
      );

      // Get badge counts
      const userIds = users.map((u: any) => u.id);
      const { data: badgeCounts } = await supabase
        .from("user_badges")
        .select("user_id")
        .in("user_id", userIds);

      const badgeCountMap: Record<string, number> = {};
      (badgeCounts || []).forEach((bc: any) => {
        badgeCountMap[bc.user_id] = (badgeCountMap[bc.user_id] || 0) + 1;
      });

      return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        last_name: u.last_name || "",
        points: u.points || 0,
        career_id: u.career_id,
        career_name: u.career_id ? careerMap.get(u.career_id) : undefined,
        badges_count: badgeCountMap[u.id] || 0,
        avatar_url: u.avatar_url,
      }));
    },
    ["reputation-leaderboard"],
    { tags: [CACHE_TAGS.karmaLeaderboard], revalidate: 86400 }
  )();
}

// ==========================================
// READ: Get reputation history
// ==========================================

export async function fetchReputationHistory(
  userId?: string
): Promise<KarmaLogEntry[]> {
  try {
    const session = await getVerifiedSession();
    const targetUserId = userId || session?.userId;

    if (!targetUserId) return [];

    const supabase = createServerClient();

    const { data } = await supabase
      .from("karma_log")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    return (data || []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      description: r.description,
      created_at: r.created_at,
    }));
  } catch (error) {
    console.error("[fetchReputationHistory] Error:", error);
    return [];
  }
}
