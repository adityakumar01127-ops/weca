import { SupabaseClient } from "@supabase/supabase-js";
import { VS_STAKE_MIN_WC, VS_STAKE_MAX_WC, VS_PLATFORM_RAKE_PERCENT, calculateVSStakeReward } from "../credits";

/**
 * VS Battle Staking System — allows users to stake WC on head-to-head battles.
 * 
 * Flow:
 *   1. Creator A creates a staked battle (WC is escrowed from their balance)
 *   2. Creator B accepts/joins with matching stake
 *   3. Community votes
 *   4. Winner receives (total pot - 20% platform rake)
 *   5. Loser loses their staked WC
 */

export interface StakedBattleInfo {
  battleId: string;
  stakeAmount: number;
  totalPot: number;
  winnerReward: number;
  platformRake: number;
  isStaked: boolean;
  stakerA?: string;
  stakerB?: string;
}

/**
 * Create a staked VS battle.
 * Escrows WC from the creator's balance.
 */
export async function createStakedBattle(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  opponentPostId: string,
  stakeAmount: number
): Promise<{ success: boolean; battleId?: string; error?: string }> {
  try {
    // Validate stake amount
    if (stakeAmount < VS_STAKE_MIN_WC || stakeAmount > VS_STAKE_MAX_WC) {
      return {
        success: false,
        error: `Stake must be between ${VS_STAKE_MIN_WC} and ${VS_STAKE_MAX_WC} WC`,
      };
    }

    // Check balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", userId)
      .single();

    if (!profile || (profile.credits_balance ?? 0) < stakeAmount) {
      return {
        success: false,
        error: `Insufficient WC balance. You need ${stakeAmount} WC to stake.`,
      };
    }

    // Create the battle
    const { data: battle, error: battleError } = await supabase
      .from("battles")
      .insert({
        post_a_id: postId,
        post_b_id: opponentPostId,
        created_by: userId,
        status: "active",
        vote_threshold: 50,
      })
      .select("id")
      .single();

    if (battleError || !battle) {
      return { success: false, error: battleError?.message || "Failed to create battle" };
    }

    // Escrow the stake from creator's balance
    const { error: escrowError } = await supabase
      .rpc("apply_credit_change", {
        p_user_id: userId,
        p_amount: -stakeAmount,
        p_reason: `VS Battle Stake Escrow (${stakeAmount} WC)`,
        p_battle_id: battle.id,
      });

    if (escrowError) {
      // Rollback: delete the battle
      await supabase.from("battles").delete().eq("id", battle.id);
      return { success: false, error: "Failed to escrow stake amount" };
    }

    return { success: true, battleId: battle.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create staked battle" };
  }
}

/**
 * Settle a staked VS battle after voting ends.
 * Distributes pot to winner, platform takes rake.
 * 
 * Note: For now, staked battles use the same vote_threshold auto-end.
 * The settlement is called manually or via the battle auto-end trigger.
 */
export async function settleStakedBattle(
  supabase: SupabaseClient,
  battleId: string,
  stakeAmount: number
): Promise<{ success: boolean; winnerId?: string; reward?: number; error?: string }> {
  try {
    // Get battle info
    const { data: battle } = await supabase
      .from("battles")
      .select("*, post_a:posts!post_a_id(user_id), post_b:posts!post_b_id(user_id)")
      .eq("id", battleId)
      .single();

    if (!battle) {
      return { success: false, error: "Battle not found" };
    }

    if (battle.status !== "ended") {
      return { success: false, error: "Battle has not ended yet" };
    }

    if (!battle.winner_post_id) {
      // Tie — refund both stakers
      const postAUserId = (battle.post_a as any)?.user_id;
      const postBUserId = (battle.post_b as any)?.user_id;

      if (postAUserId) {
        await supabase.rpc("apply_credit_change", {
          p_user_id: postAUserId,
          p_amount: stakeAmount,
          p_reason: "VS Battle Stake Refund (Tie)",
          p_battle_id: battleId,
        });
      }
      if (postBUserId) {
        await supabase.rpc("apply_credit_change", {
          p_user_id: postBUserId,
          p_amount: stakeAmount,
          p_reason: "VS Battle Stake Refund (Tie)",
          p_battle_id: battleId,
        });
      }

      return { success: true };
    }

    // Winner gets pot minus rake
    const { winnerReward } = calculateVSStakeReward(stakeAmount);

    // Get winner user ID
    const { data: winnerPost } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", battle.winner_post_id)
      .single();

    if (!winnerPost?.user_id) {
      return { success: false, error: "Could not identify winner" };
    }

    // Award winner
    const { error: awardError } = await supabase
      .rpc("apply_credit_change", {
        p_user_id: winnerPost.user_id,
        p_amount: winnerReward,
        p_reason: `VS Battle Staked Victory! Won ${winnerReward} WC`,
        p_battle_id: battleId,
      });

    if (awardError) {
      return { success: false, error: "Failed to award winner" };
    }

    return {
      success: true,
      winnerId: winnerPost.user_id,
      reward: winnerReward,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to settle staked battle" };
  }
}

/**
 * Get stake info for a battle.
 */
export async function getStakeInfo(
  supabase: SupabaseClient,
  battleId: string
): Promise<StakedBattleInfo | null> {
  try {
    // Check if there's a stake escrow transaction for this battle
    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("amount, user_id")
      .eq("battle_id", battleId)
      .like("reason", "%Stake Escrow%");

    if (!transactions || transactions.length === 0) {
      return null; // Not a staked battle
    }

    const stakeAmount = Math.abs(transactions[0].amount);
    const { winnerReward, platformRake, totalPot } = calculateVSStakeReward(stakeAmount);

    return {
      battleId,
      stakeAmount,
      totalPot,
      winnerReward,
      platformRake,
      isStaked: true,
      stakerA: transactions[0]?.user_id,
      stakerB: transactions[1]?.user_id,
    };
  } catch {
    return null;
  }
}
