import { SupabaseClient } from "@supabase/supabase-js";
import { AchievementDefinition } from "../types";
import { ACHIEVEMENT_REWARDS } from "../credits";

/**
 * Achievement System — tracks user milestones and awards WC bonuses.
 * 
 * Achievements are checked after relevant actions (post upload, follow gained,
 * battle won, etc.) and unlocked atomically via PostgreSQL RPC.
 */

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "first_post",
    title: "First Catch",
    description: "Upload your first weird image",
    reward_wc: ACHIEVEMENT_REWARDS.first_post,
    iconName: "Camera",
    category: "content",
    threshold: 1,
    checkField: "posts_count",
  },
  {
    id: "five_posts",
    title: "Certified Hunter",
    description: "Upload 5 scored posts with weirdness ≥ 30",
    reward_wc: ACHIEVEMENT_REWARDS.five_posts,
    iconName: "Target",
    category: "content",
    threshold: 5,
    checkField: "qualified_posts_count",
  },
  {
    id: "hundred_followers",
    title: "Growing Community",
    description: "Gain 100 followers",
    reward_wc: ACHIEVEMENT_REWARDS.hundred_followers,
    iconName: "Users",
    category: "social",
    threshold: 100,
    checkField: "follower_count",
  },
  {
    id: "thousand_followers",
    title: "Crowd Favorite",
    description: "Gain 1,000 followers",
    reward_wc: ACHIEVEMENT_REWARDS.thousand_followers,
    iconName: "Crown",
    category: "social",
    threshold: 1000,
    checkField: "follower_count",
  },
  {
    id: "first_vs_win",
    title: "Battle Champion",
    description: "Win your first VS battle",
    reward_wc: ACHIEVEMENT_REWARDS.first_vs_win,
    iconName: "Swords",
    category: "battles",
    threshold: 1,
    checkField: "vs_wins_count",
  },
  {
    id: "ten_vs_wins",
    title: "Undefeated",
    description: "Win 10 VS battles",
    reward_wc: ACHIEVEMENT_REWARDS.ten_vs_wins,
    iconName: "Trophy",
    category: "battles",
    threshold: 10,
    checkField: "vs_wins_count",
  },
  {
    id: "lakh_impressions",
    title: "Viral Creator",
    description: "Reach 1,00,000 total post impressions",
    reward_wc: ACHIEVEMENT_REWARDS.lakh_impressions,
    iconName: "Eye",
    category: "milestones",
    threshold: 100000,
    checkField: "total_impressions",
  },
  {
    id: "seven_day_streak",
    title: "Dedicated",
    description: "Maintain a 7-day login streak",
    reward_wc: ACHIEVEMENT_REWARDS.seven_day_streak,
    iconName: "Flame",
    category: "milestones",
    threshold: 7,
    checkField: "current_streak",
  },
  {
    id: "thirty_day_streak",
    title: "Unstoppable",
    description: "Maintain a 30-day login streak",
    reward_wc: ACHIEVEMENT_REWARDS.thirty_day_streak,
    iconName: "Zap",
    category: "milestones",
    threshold: 30,
    checkField: "current_streak",
  },
];

export interface AchievementProgress {
  definition: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: string | null;
  currentValue: number;
  progressPercent: number;
}

/**
 * Get all achievements with progress for a user.
 */
export async function getAchievementsProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AchievementProgress[]> {
  try {
    // Fetch user stats in parallel
    const [
      { data: profile },
      { data: unlockedAchievements },
      { count: postsCount },
      { count: qualifiedPostsCount },
      { count: vsWinsCount },
      { data: streakData },
    ] = await Promise.all([
      supabase.from("profiles").select("follower_count, total_impressions").eq("id", userId).single(),
      supabase.from("achievements_unlocked").select("achievement_id, unlocked_at").eq("user_id", userId),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("posts").select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("scoring_status", "completed")
        .gte("weirdness_score", 30),
      supabase.from("battles").select("id", { count: "exact", head: true })
        .eq("status", "ended")
        .in("winner_post_id", 
          // Subquery: get all post IDs owned by this user
          // We'll do a separate query for this
          []
        ),
      supabase.from("login_streaks").select("current_streak").eq("user_id", userId).single(),
    ]);

    // Get actual VS wins count (needs a joined query)
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);
    const userPostIds = userPosts?.map((p) => p.id) || [];

    let actualVsWins = 0;
    if (userPostIds.length > 0) {
      const { count } = await supabase
        .from("battles")
        .select("id", { count: "exact", head: true })
        .eq("status", "ended")
        .in("winner_post_id", userPostIds);
      actualVsWins = count ?? 0;
    }

    const unlockedMap = new Map<string, string>(
      (unlockedAchievements ?? []).map((a) => [a.achievement_id, a.unlocked_at])
    );

    // Build stats map for checking thresholds
    const statsMap: Record<string, number> = {
      posts_count: postsCount ?? 0,
      qualified_posts_count: qualifiedPostsCount ?? 0,
      follower_count: profile?.follower_count ?? 0,
      total_impressions: profile?.total_impressions ?? 0,
      vs_wins_count: actualVsWins,
      current_streak: streakData?.current_streak ?? 0,
    };

    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const currentValue = statsMap[def.checkField] ?? 0;
      const unlocked = unlockedMap.has(def.id);
      return {
        definition: def,
        unlocked,
        unlockedAt: unlocked ? unlockedMap.get(def.id) : null,
        currentValue,
        progressPercent: Math.min(100, Math.round((currentValue / def.threshold) * 100)),
      };
    });
  } catch (err) {
    console.error("getAchievementsProgress error:", err);
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      definition: def,
      unlocked: false,
      currentValue: 0,
      progressPercent: 0,
    }));
  }
}

/**
 * Check for newly unlockable achievements and unlock them.
 * Returns array of newly unlocked achievement IDs.
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  try {
    const progress = await getAchievementsProgress(supabase, userId);

    for (const ach of progress) {
      // Skip if already unlocked or not yet reached threshold
      if (ach.unlocked || ach.currentValue < ach.definition.threshold) continue;

      // Unlock via PostgreSQL RPC
      const { data } = await supabase
        .rpc("unlock_achievement", {
          p_user_id: userId,
          p_achievement_id: ach.definition.id,
          p_wc_reward: ach.definition.reward_wc,
        });

      if (data?.[0]?.newly_unlocked) {
        newlyUnlocked.push(ach.definition.id);
      }
    }
  } catch (err) {
    console.error("checkAndUnlockAchievements error:", err);
  }

  return newlyUnlocked;
}
