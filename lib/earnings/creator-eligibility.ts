import { SupabaseClient } from "@supabase/supabase-js";
import { CreatorEligibility } from "../types";
import { CEP_THRESHOLDS } from "../credits";

/**
 * Creator Eligibility Program (CEP) — manages the lifecycle of a creator's
 * eligibility to earn WC from viewer interactions and convert to real money.
 * 
 * Requirements:
 *   1. Upload ≥ 5 scored posts with weirdness ≥ 30
 *   2. Gain ≥ 1,000 followers
 *   3. Reach ≥ 1,00,000 (1 Lakh) total impressions
 *   4. Achieve all within 90 days of enrollment
 *   5. No moderation strikes
 */

export interface EligibilityProgress {
  isEnrolled: boolean;
  isEligible: boolean;
  isSuspended: boolean;
  posts: { current: number; required: number; complete: boolean };
  followers: { current: number; required: number; complete: boolean };
  impressions: { current: number; required: number; complete: boolean };
  daysRemaining: number | null;
  deadlineDate: string | null;
  enrollmentDate: string | null;
  qualificationDate: string | null;
  overallProgress: number; // 0-100 percentage
}

/**
 * Enroll a user in the Creator Eligibility Program.
 * Starts the 90-day clock.
 */
export async function enrollInCreatorProgram(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from("creator_eligibility")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) {
      if (existing.status === "eligible") {
        return { success: true }; // Already eligible
      }
      if (existing.status === "suspended") {
        return { success: false, error: "Your creator account is suspended. Please contact support." };
      }
      return { success: true }; // Already enrolled
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + CEP_THRESHOLDS.deadline_days * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("creator_eligibility")
      .insert({
        user_id: userId,
        status: "pending",
        enrollment_date: now.toISOString(),
        deadline_date: deadline.toISOString(),
      });

    if (error) {
      // Likely unique constraint (already enrolled)
      if (error.code === "23505") {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    // Update profile status
    await supabase
      .from("profiles")
      .update({ creator_status: "enrolled" })
      .eq("id", userId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to enroll in creator program" };
  }
}

/**
 * Check and update a user's creator eligibility status.
 * Calls the PostgreSQL RPC function for atomic evaluation.
 */
export async function checkCreatorEligibility(
  supabase: SupabaseClient,
  userId: string
): Promise<EligibilityProgress> {
  const defaultProgress: EligibilityProgress = {
    isEnrolled: false,
    isEligible: false,
    isSuspended: false,
    posts: { current: 0, required: CEP_THRESHOLDS.min_posts, complete: false },
    followers: { current: 0, required: CEP_THRESHOLDS.min_followers, complete: false },
    impressions: { current: 0, required: CEP_THRESHOLDS.min_impressions, complete: false },
    daysRemaining: null,
    deadlineDate: null,
    enrollmentDate: null,
    qualificationDate: null,
    overallProgress: 0,
  };

  try {
    // Check enrollment
    const { data: elig } = await supabase
      .from("creator_eligibility")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!elig) return defaultProgress;

    // Call the RPC function to get latest counts and auto-promote if qualifying
    const { data: rpcResult } = await supabase
      .rpc("check_and_update_eligibility", { p_user_id: userId });

    const result = rpcResult?.[0];

    const postsCount = result?.posts_count ?? elig.qualified_posts_count ?? 0;
    const followersCount = result?.followers ?? elig.follower_count ?? 0;
    const impressionsCount = result?.impressions ?? elig.total_impressions ?? 0;
    const isEligible = result?.is_eligible ?? elig.status === "eligible";

    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (elig.deadline_date && elig.status === "pending") {
      const deadline = new Date(elig.deadline_date).getTime();
      const now = Date.now();
      daysRemaining = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
    }

    // Calculate overall progress (weighted average)
    const postsPct = Math.min(100, (postsCount / CEP_THRESHOLDS.min_posts) * 100);
    const followersPct = Math.min(100, (followersCount / CEP_THRESHOLDS.min_followers) * 100);
    const impressionsPct = Math.min(100, (impressionsCount / CEP_THRESHOLDS.min_impressions) * 100);
    const overallProgress = Math.round((postsPct + followersPct + impressionsPct) / 3);

    return {
      isEnrolled: true,
      isEligible,
      isSuspended: elig.status === "suspended",
      posts: {
        current: postsCount,
        required: CEP_THRESHOLDS.min_posts,
        complete: postsCount >= CEP_THRESHOLDS.min_posts,
      },
      followers: {
        current: followersCount,
        required: CEP_THRESHOLDS.min_followers,
        complete: followersCount >= CEP_THRESHOLDS.min_followers,
      },
      impressions: {
        current: impressionsCount,
        required: CEP_THRESHOLDS.min_impressions,
        complete: impressionsCount >= CEP_THRESHOLDS.min_impressions,
      },
      daysRemaining,
      deadlineDate: elig.deadline_date,
      enrollmentDate: elig.enrollment_date,
      qualificationDate: elig.qualification_date,
      overallProgress: isEligible ? 100 : overallProgress,
    };
  } catch (err) {
    console.error("checkCreatorEligibility error:", err);
    return defaultProgress;
  }
}

/**
 * Quick boolean check — is this user an eligible creator?
 * Lightweight: single row read, no RPC.
 */
export async function isCreatorEligible(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("creator_eligibility")
      .select("status")
      .eq("user_id", userId)
      .single();
    return data?.status === "eligible";
  } catch {
    return false;
  }
}
