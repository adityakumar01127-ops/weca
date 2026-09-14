import { SupabaseClient } from "@supabase/supabase-js";
import { InteractionCreditResult } from "../types";
import { INTERACTION_CREDITS, DAILY_INTERACTION_CAP_WC } from "../credits";

/**
 * Interaction Credits System — awards WC to eligible creators when viewers
 * interact with their posts (views, likes, comments, shares, super-likes).
 * 
 * All interaction credits:
 *   1. Require the creator to be CEP-eligible
 *   2. Prevent self-interactions
 *   3. Enforce daily earning caps (500 WC/day)
 *   4. Are atomic via PostgreSQL RPC functions
 */

type InteractionType = keyof typeof INTERACTION_CREDITS;

/**
 * Award WC to a creator for a viewer interaction on their post.
 * Uses the atomic apply_interaction_credit PostgreSQL function.
 */
export async function awardInteractionCredit(
  supabase: SupabaseClient,
  postId: string,
  viewerId: string,
  interactionType: InteractionType
): Promise<InteractionCreditResult> {
  const defaultResult: InteractionCreditResult = {
    success: false,
    new_balance: 0,
    daily_used: 0,
    capped: false,
  };

  try {
    // Get post owner
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!post?.user_id) return defaultResult;

    const creatorId = post.user_id;
    const amount = INTERACTION_CREDITS[interactionType];
    const reason = `Viewer ${interactionType}: ${interactionType === "super_like" ? "💎 Super-Like" : interactionType} on post`;

    const { data, error } = await supabase
      .rpc("apply_interaction_credit", {
        p_creator_id: creatorId,
        p_viewer_id: viewerId,
        p_amount: amount,
        p_reason: reason,
        p_post_id: postId,
        p_daily_cap: DAILY_INTERACTION_CAP_WC,
      });

    if (error) {
      console.error("awardInteractionCredit RPC error:", error);
      return defaultResult;
    }

    if (data && data.length > 0) {
      return {
        success: data[0].success,
        new_balance: data[0].new_balance,
        daily_used: data[0].daily_used,
        capped: data[0].capped,
      };
    }

    return defaultResult;
  } catch (err) {
    console.error("awardInteractionCredit error:", err);
    return defaultResult;
  }
}

/**
 * Award view credit — called when a viewer dwells on a post for ≥ 3 seconds.
 */
export async function awardViewCredit(
  supabase: SupabaseClient,
  postId: string,
  viewerId: string
): Promise<InteractionCreditResult> {
  return awardInteractionCredit(supabase, postId, viewerId, "view");
}

/**
 * Award like credit — called when a viewer likes a post.
 */
export async function awardLikeCredit(
  supabase: SupabaseClient,
  postId: string,
  likerId: string
): Promise<InteractionCreditResult> {
  return awardInteractionCredit(supabase, postId, likerId, "like");
}

/**
 * Award comment credit — called when a viewer comments on a post.
 */
export async function awardCommentCredit(
  supabase: SupabaseClient,
  postId: string,
  commenterId: string
): Promise<InteractionCreditResult> {
  return awardInteractionCredit(supabase, postId, commenterId, "comment");
}

/**
 * Award share credit — called when a viewer shares a post.
 */
export async function awardShareCredit(
  supabase: SupabaseClient,
  postId: string,
  sharerId: string
): Promise<InteractionCreditResult> {
  return awardInteractionCredit(supabase, postId, sharerId, "share");
}

/**
 * Super-Like — viewer spends 5 WC, creator earns 5 WC.
 * This is a two-step transaction:
 *   1. Deduct 5 WC from viewer
 *   2. Award 5 WC to creator (with daily cap)
 */
export async function awardSuperLike(
  supabase: SupabaseClient,
  postId: string,
  viewerId: string
): Promise<{ success: boolean; viewerNewBalance?: number; creatorResult?: InteractionCreditResult; error?: string }> {
  try {
    // Get post owner
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!post?.user_id) {
      return { success: false, error: "Post not found" };
    }

    if (post.user_id === viewerId) {
      return { success: false, error: "Cannot super-like your own post" };
    }

    // Check viewer has enough balance
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", viewerId)
      .single();

    if (!viewerProfile || (viewerProfile.credits_balance ?? 0) < INTERACTION_CREDITS.super_like) {
      return { success: false, error: `Insufficient WC balance. You need ${INTERACTION_CREDITS.super_like} WC.` };
    }

    // Step 1: Deduct from viewer
    const { data: deductData, error: deductError } = await supabase
      .rpc("apply_credit_change", {
        p_user_id: viewerId,
        p_amount: -INTERACTION_CREDITS.super_like,
        p_reason: "💎 Super-Like sent on post",
        p_post_id: postId,
      });

    if (deductError) {
      return { success: false, error: "Failed to deduct WC from your balance" };
    }

    const viewerNewBalance = deductData?.[0]?.new_balance ?? 0;

    // Step 2: Award to creator (with daily cap check)
    const creatorResult = await awardInteractionCredit(supabase, postId, viewerId, "super_like");

    return {
      success: true,
      viewerNewBalance,
      creatorResult,
    };
  } catch (err: any) {
    console.error("awardSuperLike error:", err);
    return { success: false, error: err.message || "Failed to process super-like" };
  }
}

/**
 * Get today's daily earning cap usage for a user.
 */
export async function getDailyCapUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ used: number; remaining: number; cap: number }> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_earning_caps")
      .select("interaction_wc_earned")
      .eq("user_id", userId)
      .eq("cap_date", today)
      .single();

    const used = data?.interaction_wc_earned ?? 0;
    return {
      used,
      remaining: Math.max(0, DAILY_INTERACTION_CAP_WC - used),
      cap: DAILY_INTERACTION_CAP_WC,
    };
  } catch {
    return { used: 0, remaining: DAILY_INTERACTION_CAP_WC, cap: DAILY_INTERACTION_CAP_WC };
  }
}
