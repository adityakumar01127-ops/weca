import { NextRequest, NextResponse } from "next/server";
import { castBattleVote } from "@/lib/supabase/data";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json();

    const voter_id = user?.id || body.voter_id;
    if (!voter_id) {
      return NextResponse.json({ success: false, error: "Authentication required to vote in battles." }, { status: 401 });
    }

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
      adminSupabase || supabase
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
