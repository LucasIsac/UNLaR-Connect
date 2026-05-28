"use server";

import { createServerClient, createStaticClient, getVerifiedSession } from "@/lib/supabase";
import { DbUser, DbBadge, DbUserBadge, DbNotification } from "@/types/database";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cache";

export interface UserBadgeExtended extends DbUserBadge {
  badgeName: string;
  badgeDescription: string;
  iconName?: string;
  requiredPoints: number;
}

export interface KarmaStats {
  userPoints: number;
  karmaLevel: number;
  currentXP: number;
  nextLevelXP: number;
  xpPercentage: number;
  allBadges: DbBadge[];
  earnedBadges: UserBadgeExtended[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  lastName: string;
  points: number;
  avatarUrl?: string;
  careerName?: string;
  careerId?: number;
  badgesCount: number;
}

/**
 * UNCACHED: Fetch complete karma stats for the current user
 */
async function fetchKarmaDataUncached(userId: string, accessToken: string): Promise<KarmaStats> {
  const db = createStaticClient(accessToken);

  // 1. Fetch user points
  const { data: userData, error: userError } = await db
    .from("users")
    .select("points")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    throw new Error("Usuario no encontrado en la base de datos.");
  }

  const points = userData.points || 0;
  const karmaLevel = Math.floor(points / 250) + 1;
  const nextLevelXP = karmaLevel * 250;
  const xpPercentage = Math.min(((points % 250) / 250) * 100, 100);

  // 2. Fetch all badges
  const { data: badgesData, error: badgesError } = await db
    .from("badges")
    .select("*")
    .order("required_points", { ascending: true });

  const allBadges = badgesData || [];

  // 3. Fetch user earned badges
  const { data: userBadgesData, error: userBadgesError } = await db
    .from("user_badges")
    .select(`
      *,
      badges(*)
    `)
    .eq("user_id", userId);

  const earnedBadges: UserBadgeExtended[] = (userBadgesData || []).map((ub: any) => ({
    user_id: ub.user_id,
    badge_id: ub.badge_id,
    awarded_at: ub.awarded_at,
    badgeName: ub.badges?.name || "Insignia",
    badgeDescription: ub.badges?.description || "",
    iconName: ub.badges?.icon_name || "",
    requiredPoints: ub.badges?.required_points || 0
  }));

  return {
    userPoints: points,
    karmaLevel,
    currentXP: points,
    nextLevelXP,
    xpPercentage,
    allBadges,
    earnedBadges
  };
}

/**
 * Fetch karma stats for the current user (CACHED)
 */
export async function fetchKarmaData(): Promise<KarmaStats> {
  const session = await getVerifiedSession();
  if (!session) throw new Error("No estás autenticado/a.");

  const { userId, accessToken } = session;
  console.log(`[Cache Access] fetchKarmaData for user: ${userId}`);

  return unstable_cache(
    async () => fetchKarmaDataUncached(userId, accessToken),
    ["karma-data", userId],
    {
      tags: [CACHE_TAGS.userProfile(userId), CACHE_TAGS.dashboardStats(userId), `karma-stats-${userId}`],
      revalidate: 86400
    }
  )();
}

/**
 * UNCACHED: Fetch all students sorted by points
 */
async function fetchKarmaLeaderboardUncached(accessToken: string): Promise<LeaderboardEntry[]> {
  const db = createStaticClient(accessToken);

  // Fetch users joined with career and count of badges
  const { data: usersData, error: usersError } = await db
    .from("users")
    .select(`
      id,
      name,
      last_name,
      points,
      avatar_url,
      career_id,
      careers(name),
      user_badges(badge_id)
    `)
    .eq("is_unlar_member", true)
    .is("deleted_at", null)
    .order("points", { ascending: false });

  if (usersError) {
    console.error("Error fetching leaderboard in Server Action:", usersError);
    return [];
  }

  return (usersData || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    lastName: u.last_name || "",
    points: u.points || 0,
    avatarUrl: u.avatar_url || "",
    careerId: u.career_id || undefined,
    careerName: u.careers?.name || "General",
    badgesCount: u.user_badges ? u.user_badges.length : 0
  }));
}

/**
 * Fetch all students sorted by points (CACHED)
 */
export async function fetchKarmaLeaderboard(): Promise<LeaderboardEntry[]> {
  const session = await getVerifiedSession();
  const accessToken = session?.accessToken ?? "";

  console.log("[Cache Access] fetchKarmaLeaderboard");

  return unstable_cache(
    async () => fetchKarmaLeaderboardUncached(accessToken),
    ["karma-leaderboard"],
    {
      tags: ["karma-leaderboard", CACHE_TAGS.careersList],
      revalidate: 86400
    }
  )();
}

/**
 * Mutates user points to simulate completing an action and earning karma points
 */
export async function simulateKarmaAporte(
  actionType: 'apunte' | 'foro' | 'tutoria'
): Promise<{ success: boolean; data?: KarmaStats; newlyUnlocked: DbBadge[]; error?: string }> {
  try {
    const session = await getVerifiedSession();
    if (!session) {
      return { success: false, newlyUnlocked: [], error: "No estás autenticado/a." };
    }

    const { userId } = session;
    const db = createServerClient();

    // 1. Get current user profile and points
    const { data: dbUser, error: userError } = await db
      .from("users")
      .select("points")
      .eq("id", userId)
      .single();

    if (userError || !dbUser) {
      return { success: false, newlyUnlocked: [], error: "Usuario no encontrado." };
    }

    // 2. Define action parameters
    let xpGained = 15;
    let actionName = "participar en foros";
    if (actionType === 'apunte') {
      xpGained = 50;
      actionName = "subir un apunte";
    } else if (actionType === 'tutoria') {
      xpGained = 100;
      actionName = "completar una tutoría";
    }

    const newPoints = (dbUser.points || 0) + xpGained;

    // 3. Update user points in database
    const { error: updateError } = await db
      .from("users")
      .update({ points: newPoints })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 4. Check for newly unlocked badges
    // Fetch all badges
    const { data: allBadges } = await db
      .from("badges")
      .select("*")
      .order("required_points", { ascending: true });

    // Fetch user's existing badges
    const { data: existingBadges } = await db
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    const existingBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));
    const newlyUnlocked: DbBadge[] = [];

    if (allBadges) {
      for (const badge of allBadges) {
        if (newPoints >= badge.required_points && !existingBadgeIds.has(badge.id)) {
          // Award this badge!
          const { error: insertBadgeError } = await db
            .from("user_badges")
            .insert({
              user_id: userId,
              badge_id: badge.id,
              awarded_at: new Date().toISOString()
            });

          if (!insertBadgeError) {
            newlyUnlocked.push(badge);

            // Create notification for unlocking badge
            await db.from("notifications").insert({
              user_id: userId,
              title: "¡Medalla Desbloqueada! 🏆",
              content: `Desbloqueaste la medalla "${badge.name}" por alcanzar ${badge.required_points} puntos de Karma. ¡Seguí así!`,
              type: "karma",
              is_read: false
            });
          } else {
            console.error("Error inserting user badge record:", insertBadgeError);
          }
        }
      }
    }

    // 5. Create general notification for XP points gained
    await db.from("notifications").insert({
      user_id: userId,
      title: "¡Karma ganado! ⚡",
      content: `Sumaste +${xpGained} puntos de Karma por ${actionName}.`,
      type: "karma",
      is_read: false
    });

    // 6. Invalidate caches
    invalidateCache(CACHE_TAGS.userProfile(userId));
    invalidateCache(CACHE_TAGS.dashboardStats(userId));
    invalidateCache("karma-leaderboard");
    invalidateCache(`karma-stats-${userId}`);

    // Fetch fresh stats to return
    const freshStats = await fetchKarmaDataUncached(userId, session.accessToken);

    return {
      success: true,
      data: freshStats,
      newlyUnlocked
    };
  } catch (error: any) {
    console.error("Error simulating karma aporte:", error);
    return { success: false, newlyUnlocked: [], error: error.message || "Hubo un error al procesar el aporte." };
  }
}
