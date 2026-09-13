import { SupabaseClient } from "@supabase/supabase-js";
import { CreditTransaction } from "./types";


export const BATTLE_WINNER_BONUS_WC = 50;
export const MIN_CASHOUT_THRESHOLD_WC = 500;
export const WC_TO_USD_RATE = 0.01; // 1,000 WC = $10.00 USD
export const WC_TO_INR_RATE = 0.80; // 1,000 WC = ₹800.00 INR

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

  const base = Math.max(10, Math.round(combined / 2));
  const bonus = combined >= 160 ? 25 : combined >= 130 ? 10 : 0;
  const total = base + bonus;

  return { base, bonus, total };
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
