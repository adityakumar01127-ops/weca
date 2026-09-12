import { SupabaseClient } from "@supabase/supabase-js";
import { AbuseEvaluation } from "./types";

const MIN_ACCOUNT_AGE_DAYS = 7;
const MIN_POST_COUNT = 1;

/**
 * Evaluates abuse guards before approving or processing a cash-out payout request:
 * 1. Account Maturity: checks if account age is at least MIN_ACCOUNT_AGE_DAYS
 * 2. Post Count: checks if user has uploaded at least MIN_POST_COUNT scored posts
 * 3. Voting Cluster & Sybil Analysis: detects suspicious coordinated voting patterns,
 *    rapid voting velocity, or multi-account clusters voting unanimously.
 */
export async function evaluatePayoutAbuseGuards(
  supabase: SupabaseClient | null,
  userId: string
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

    // 3. Voting Cluster & Sybil Pattern Analysis
    // Fetch recent votes cast by this user
    const { data: userVotes } = await supabase
      .from("battle_votes")
      .select("battle_id, voted_for_post_id, created_at")
      .eq("voter_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (userVotes && userVotes.length >= 3) {
      // Check 3.1: Voting Velocity (burst of votes in under 60 seconds)
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

      // Check 3.2: Cluster Coordinated Battles (other accounts voting exactly identical to this voter at similar timestamps)
      const battleIds = Array.from(new Set(userVotes.map((v) => v.battle_id)));
      if (battleIds.length > 0) {
        const { data: coVotes } = await supabase
          .from("battle_votes")
          .select("voter_id, battle_id, voted_for_post_id, created_at")
          .in("battle_id", battleIds.slice(0, 5))
          .neq("voter_id", userId);

        if (coVotes && coVotes.length > 0) {
          // Check for tightly correlated timestamps (< 30s) on identical post picks
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
