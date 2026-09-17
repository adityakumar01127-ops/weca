import { SupabaseClient } from "@supabase/supabase-js";
import { CreditTransaction } from "./types";


// ==============================================================================
// WC ECONOMY CONSTANTS
// ==============================================================================

// Core conversion rates
export const BATTLE_WINNER_BONUS_WC = 50;
export const MIN_CASHOUT_THRESHOLD_WC = 1000;
export const WC_TO_USD_RATE = 0.001;   // 1,000 WC = $1.00 USD
export const WC_TO_INR_RATE = 0.10;    // 1,000 WC = ₹100.00 INR

// Daily and monthly caps
export const DAILY_INTERACTION_CAP_WC = 500;
export const MONTHLY_CASHOUT_CAP_WC = 50000;  // ₹5,000/month max

// Interaction credit rates (WC awarded to eligible creator)
export const INTERACTION_CREDITS = {
  view:       0.1,   // 3-second dwell view
  like:       1,     // Like
  comment:    2,     // Comment
  share:      3,     // Share
  super_like: 5,     // Super-like (viewer pays 5 WC)
  save:       1,     // Save to collection
} as const;

// VS Battle staking
export const VS_STAKE_MIN_WC = 20;
export const VS_STAKE_MAX_WC = 100;
export const VS_PLATFORM_RAKE_PERCENT = 20; // 20% of pot goes to platform

// Login streak daily bonuses
export const LOGIN_STREAK_BONUSES = {
  day_1_7:  5,   // Days 1-7: 5 WC/day
  day_8_30: 10,  // Days 8-30: 10 WC/day
  day_31:   15,  // Days 31+: 15 WC/day
} as const;

// Creator Eligibility Program (CEP) thresholds
export const CEP_THRESHOLDS = {
  min_posts: 5,
  min_post_weirdness: 30,
  min_followers: 1000,
  min_impressions: 100000,  // 1 lakh
  deadline_days: 90,
} as const;

// Achievement definitions
export const ACHIEVEMENT_REWARDS: Record<string, number> = {
  first_post:           25,
  five_posts:           100,
  hundred_followers:    50,
  thousand_followers:   200,
  first_vs_win:         75,
  ten_vs_wins:          500,
  lakh_impressions:     300,
  seven_day_streak:     50,
  thirty_day_streak:    150,
};


// ==============================================================================
// POST SCORING → WC CALCULATION
// ==============================================================================

/**
 * Formula converting a post's weirdness_score (0-100) + uniqueness_score (0-100)
 * into Weird Credits (WC) added to the author's balance.
 * 
 * - Base = Average of the two scores (minimum 10 WC to reward every genuine finding)
 * - Rarity Bonus:
 *   - Combined >= 160 (Legendary Anomaly): +25 WC bonus
 *   - Combined >= 130 (Reality-Breaking): +10 WC bonus
 */
export function calculatePostScoringCredits(
  weirdnessScore: number,
  uniquenessScore: number
): { base: number; bonus: number; total: number } {
  const safeW = Math.max(0, Math.min(100, Math.round(weirdnessScore || 0)));
  const safeU = Math.max(0, Math.min(100, Math.round(uniquenessScore || 0)));
  const combined = safeW + safeU;

  // Ineligible / mundane submissions (both scores below 30) receive 0 credits
  if (safeW < 30 && safeU < 30) {
    return { base: 0, bonus: 0, total: 0 };
  }

  const base = Math.max(10, Math.round(combined / 2));
  const bonus = combined >= 160 ? 25 : combined >= 130 ? 10 : 0;
  const total = base + bonus;

  return { base, bonus, total };
}


// ==============================================================================
// EARNINGS HELPER FUNCTIONS
// ==============================================================================

/**
 * Calculate WC earned from a viewer interaction.
 * Returns the WC amount the creator should receive.
 */
export function getInteractionCreditAmount(
  interactionType: keyof typeof INTERACTION_CREDITS
): number {
  return INTERACTION_CREDITS[interactionType] ?? 0;
}

/**
 * Convert WC balance to INR display value.
 */
export function wcToINR(wcAmount: number): number {
  return Math.round(wcAmount * WC_TO_INR_RATE * 100) / 100;
}

/**
 * Format INR value for display (₹XX.XX)
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate VS battle staked rewards.
 * Winner gets (total pot - platform rake). Platform keeps the rake.
 */
export function calculateVSStakeReward(
  stakeAmount: number
): { winnerReward: number; platformRake: number; totalPot: number } {
  const totalPot = stakeAmount * 2;
  const platformRake = Math.round(totalPot * VS_PLATFORM_RAKE_PERCENT / 100);
  const winnerReward = totalPot - platformRake;
  return { winnerReward, platformRake, totalPot };
}

/**
 * Get login streak bonus amount for a given streak day count.
 */
export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 31) return LOGIN_STREAK_BONUSES.day_31;
  if (streakDays >= 8) return LOGIN_STREAK_BONUSES.day_8_30;
  return LOGIN_STREAK_BONUSES.day_1_7;
}

/**
 * Check if user can cash out based on monthly cap.
 * Returns remaining WC that can be cashed out this month.
 */
export function getRemainingMonthlyCashout(
  cashedOutThisMonth: number
): number {
  return Math.max(0, MONTHLY_CASHOUT_CAP_WC - cashedOutThisMonth);
}


export interface RecordCreditTransactionParams {
  userId: string;
  amount: number; // positive = earn, negative = deduction
  reason: string;
  postId?: string | null;
  battleId?: string | null;
  payoutRequestId?: string | null;
}

/**
 * Atomically modifies user's credits_balance AND inserts an immutable log row
 * into the credit_transactions table.
 * 
 * Never increments or decrements balance without creating a transaction log row.
 */
export async function recordCreditTransaction(
  supabase: SupabaseClient | null,
  params: RecordCreditTransactionParams
): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
  if (!supabase) {
    return {
      success: false,
      newBalance: 0,
      error: "Database client is required to record credit transactions in production",
    };
  }

  try {
    // Enforce atomic PostgreSQL RPC function (prevents race conditions at scale)
    const { data, error: rpcError } = await supabase.rpc("apply_credit_change", {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_reason: params.reason,
      p_post_id: params.postId || null,
      p_battle_id: params.battleId || null,
      p_payout_request_id: params.payoutRequestId || null,
    });

    if (rpcError) {
      console.error("Credit transaction RPC error:", rpcError);
      return { success: false, newBalance: 0, error: rpcError.message };
    }

    if (data && data.length > 0) {
      return {
        success: true,
        newBalance: data[0].new_balance,
        transactionId: data[0].transaction_id,
      };
    }

    return {
      success: false,
      newBalance: 0,
      error: "No transaction row returned from apply_credit_change RPC",
    };
  } catch (err: any) {
    console.error("recordCreditTransaction error:", err);
    return {
      success: false,
      newBalance: 0,
      error: err.message || "Failed to record credit transaction",
    };
  }
}
