import { SupabaseClient } from "@supabase/supabase-js";
import { AbuseEvaluation } from "./types";
import { MONTHLY_CASHOUT_CAP_WC, MIN_CASHOUT_THRESHOLD_WC } from "./credits";

const MIN_ACCOUNT_AGE_DAYS = 30;
const MIN_POST_COUNT = 5;

/**
 * Evaluates abuse guards before approving or processing a cash-out payout request:
 * 1. Creator Eligibility: checks if user has achieved creator_eligible status
 * 2. Account Maturity: checks if account age is at least MIN_ACCOUNT_AGE_DAYS
 * 3. Post Count: checks if user has uploaded at least MIN_POST_COUNT scored posts
 * 4. Monthly Cashout Cap: enforces MONTHLY_CASHOUT_CAP_WC per calendar month
 * 5. Voting Cluster & Sybil Analysis: detects suspicious coordinated voting patterns,
 *    rapid voting velocity, or multi-account clusters voting unanimously.
 */
export async function evaluatePayoutAbuseGuards(
  supabase: SupabaseClient | null,
  userId: string,
  requestedAmount?: number
): Promise<AbuseEvaluation> {
  const reasons: string[] = [];
  let riskScore = 0;

  if (!supabase) {
    return {
      isSuspicious: false,
      riskScore: 0,
      reasons: [],
    };
  }

  try {
    // 0. Creator Eligibility Check
    const { data: eligibility } = await supabase
      .from("creator_eligibility")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (!eligibility || eligibility.status !== "eligible") {
      reasons.push("User has not achieved Creator Eligible status. Complete the Creator Eligibility Program first.");
      riskScore += 80;
    }

    // 1. Account Age Check
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at, username")
      .eq("id", userId)
      .single();

    if (profile?.created_at) {
      const createdAt = new Date(profile.created_at).getTime();
      const ageInDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);

      if (ageInDays < MIN_ACCOUNT_AGE_DAYS) {
        reasons.push(`Account age is ${ageInDays.toFixed(1)} days (minimum recommended: ${MIN_ACCOUNT_AGE_DAYS} days)`);
        riskScore += 35;
      }
    }

    // 2. Verified Upload Post Count Check
    const { count: postCount, error: countErr } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!countErr && (postCount === null || postCount < MIN_POST_COUNT)) {
      reasons.push(`User has uploaded ${postCount || 0} posts (minimum required for payout: ${MIN_POST_COUNT})`);
      riskScore += 40;
    }

    // 3. Monthly Cashout Cap Check
    if (requestedAmount) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: monthPayouts } = await supabase
        .from("payout_requests")
        .select("amount")
        .eq("user_id", userId)
        .in("status", ["pending", "approved", "paid"])
        .gte("requested_at", monthStart)
        .lte("requested_at", monthEnd);

      const totalThisMonth = (monthPayouts ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
      const remainingCap = MONTHLY_CASHOUT_CAP_WC - totalThisMonth;

      if (requestedAmount > remainingCap) {
        reasons.push(
          `Monthly cashout cap exceeded. Used ${totalThisMonth} WC of ${MONTHLY_CASHOUT_CAP_WC} WC limit. ` +
          `Remaining: ${Math.max(0, remainingCap)} WC. Requested: ${requestedAmount} WC.`
        );
        riskScore += 50;
      }
    }

    // 4. Voting Cluster & Sybil Pattern Analysis
    // Fetch recent votes cast by this user
    const { data: userVotes } = await supabase
      .from("battle_votes")
      .select("battle_id, voted_for_post_id, created_at")
      .eq("voter_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (userVotes && userVotes.length >= 3) {
      // Check 4.1: Voting Velocity (burst of votes in under 60 seconds)
      const voteTimes = userVotes.map((v) => new Date(v.created_at).getTime());
      let rapidVoteBursts = 0;
      for (let i = 0; i < voteTimes.length - 1; i++) {
        const deltaSeconds = (voteTimes[i] - voteTimes[i + 1]) / 1000;
        if (deltaSeconds >= 0 && deltaSeconds < 10) {
          rapidVoteBursts++;
        }
      }

      if (rapidVoteBursts >= 2) {
        reasons.push("Unusual voting velocity: multiple votes cast in under 10-second intervals");
        riskScore += 30;
      }

      // Check 4.2: Cluster Coordinated Battles
      const battleIds = Array.from(new Set(userVotes.map((v) => v.battle_id)));
      if (battleIds.length > 0) {
        const { data: coVotes } = await supabase
          .from("battle_votes")
          .select("voter_id, battle_id, voted_for_post_id, created_at")
          .in("battle_id", battleIds.slice(0, 5))
          .neq("voter_id", userId);

        if (coVotes && coVotes.length > 0) {
          let correlatedClusterVotes = 0;
          for (const uv of userVotes) {
            const uTime = new Date(uv.created_at).getTime();
            const matches = coVotes.filter(
              (cv) =>
                cv.battle_id === uv.battle_id &&
                cv.voted_for_post_id === uv.voted_for_post_id &&
                Math.abs(new Date(cv.created_at).getTime() - uTime) < 30000
            );
            if (matches.length >= 2) {
              correlatedClusterVotes++;
            }
          }

          if (correlatedClusterVotes >= 2) {
            reasons.push("Suspicious voting cluster: synchronized votes detected with affiliated accounts");
            riskScore += 45;
          }
        }
      }
    }

    // 5. Self-impression inflation check
    const { count: selfImpressions } = await supabase
      .from("post_impressions")
      .select("id", { count: "exact", head: true })
      .eq("viewer_id", userId)
      .in("post_id",
        (await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId)
        ).data?.map((p) => p.id) ?? []
      );

    if (selfImpressions && selfImpressions > 0) {
      reasons.push(`Self-impression inflation detected: ${selfImpressions} self-views found`);
      riskScore += 20;
    }
  } catch (err) {
    console.warn("evaluatePayoutAbuseGuards error:", err);
  }

  const finalScore = Math.min(100, Math.max(0, riskScore));
  return {
    isSuspicious: finalScore >= 30 || reasons.length > 0,
    riskScore: finalScore,
    reasons,
  };
}

