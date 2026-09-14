import { SupabaseClient } from "@supabase/supabase-js";
import { LoginStreak } from "../types";

/**
 * Login Streak System — tracks consecutive daily logins and awards bonus WC.
 * 
 * Streak bonuses:
 *   Day 1-7:  5 WC/day
 *   Day 8-30: 10 WC/day
 *   Day 31+:  15 WC/day
 *   
 * Streak resets to 1 if user misses a day.
 */

export interface LoginStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  lastBonusClaimedDate: string | null;
  totalBonusEarned: number;
  canClaimToday: boolean;
  todayBonus: number;
}

/**
 * Get current login streak info for a user.
 */
export async function getLoginStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<LoginStreakInfo> {
  const defaultInfo: LoginStreakInfo = {
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: null,
    lastBonusClaimedDate: null,
    totalBonusEarned: 0,
    canClaimToday: true,
    todayBonus: 5,
  };

  try {
    const { data } = await supabase
      .from("login_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) return defaultInfo;

    const today = new Date().toISOString().split("T")[0];
    const canClaimToday = data.last_bonus_claimed_date !== today;

    // Calculate what tomorrow's streak will be for bonus preview
    let projectedStreak = data.current_streak;
    if (canClaimToday) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (data.last_login_date === yesterday) {
        projectedStreak = (data.current_streak ?? 0) + 1;
      } else if (data.last_login_date === today) {
        projectedStreak = data.current_streak ?? 1;
      } else {
        projectedStreak = 1; // Streak broken
      }
    }

    // Calculate bonus for projected streak
    let todayBonus = 5;
    if (projectedStreak >= 31) todayBonus = 15;
    else if (projectedStreak >= 8) todayBonus = 10;

    return {
      currentStreak: data.current_streak ?? 0,
      longestStreak: data.longest_streak ?? 0,
      lastLoginDate: data.last_login_date,
      lastBonusClaimedDate: data.last_bonus_claimed_date,
      totalBonusEarned: data.total_bonus_earned ?? 0,
      canClaimToday,
      todayBonus,
    };
  } catch (err) {
    console.error("getLoginStreak error:", err);
    return defaultInfo;
  }
}

/**
 * Claim daily login bonus.
 * Uses the atomic claim_daily_login_bonus PostgreSQL function.
 */
export async function claimDailyLoginBonus(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; streak: number; bonusWC: number; alreadyClaimed: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc("claim_daily_login_bonus", { p_user_id: userId });

    if (error) {
      console.error("claimDailyLoginBonus RPC error:", error);
      return { success: false, streak: 0, bonusWC: 0, alreadyClaimed: false, error: error.message };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: !result.already_claimed,
        streak: result.streak,
        bonusWC: result.bonus_wc,
        alreadyClaimed: result.already_claimed,
      };
    }

    return { success: false, streak: 0, bonusWC: 0, alreadyClaimed: false, error: "No response from server" };
  } catch (err: any) {
    console.error("claimDailyLoginBonus error:", err);
    return { success: false, streak: 0, bonusWC: 0, alreadyClaimed: false, error: err.message };
  }
}
