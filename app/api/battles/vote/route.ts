import { NextRequest, NextResponse } from "next/server";
import { castBattleVote } from "@/lib/supabase/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required to vote in battles." }, { status: 401 });
    }
    const voter_id = user.id;

    const body = await req.json();
    const { battle_id, voted_for_post_id } = body;
    if (!battle_id || !voted_for_post_id) {
      return NextResponse.json({ success: false, error: "Missing battle_id or voted_for_post_id." }, { status: 400 });
    }

    // Rate limit per user
    const rateCheck = rateLimiter.check(`vote:${voter_id}`, RATE_PRESETS.battleVote);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Voting too rapidly. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const adminSupabase = createAdminClient();
    const result = await castBattleVote(
      {
        battle_id,
        voter_id,
        voted_for_post_id,
      },
      adminSupabase || undefined
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    logger.info("Battle vote cast", { battle_id, voter_id, voted_for_post_id, durationMs: Date.now() - start });
    return NextResponse.json({ success: true, battle: result.battle });
  } catch (err: any) {
    logger.error("POST /api/battles/vote error", { error: err.message, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

