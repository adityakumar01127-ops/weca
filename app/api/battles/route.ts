import { NextRequest, NextResponse } from "next/server";
import { getBattles, createBattle, checkBattleCreationRateLimit } from "@/lib/supabase/data";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as "active" | "ended" | null;
    const status = statusParam === "active" || statusParam === "ended" ? statusParam : undefined;

    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 50);

    // Optional user context from cookies
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

    let currentUserId: string | undefined;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId = user.id;
    }

    const battles = await getBattles(status, currentUserId, limit);
    logger.info("Battles fetched", { count: battles.length, status, limit, durationMs: Date.now() - start });
    return NextResponse.json({ success: true, battles });
  } catch (err: any) {
    logger.error("GET /api/battles error", { error: err.message, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch battles" }, { status: 500 });
  }
}

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

    const created_by = user?.id || body.created_by;
    if (!created_by) {
      return NextResponse.json({ success: false, error: "Authentication required to create a battle." }, { status: 401 });
    }

    const { post_a_id, post_b_id, vote_threshold } = body;
    if (!post_a_id || !post_b_id) {
      return NextResponse.json({ success: false, error: "Both post_a_id and post_b_id are required." }, { status: 400 });
    }

    if (post_a_id === post_b_id) {
      return NextResponse.json({ success: false, error: "A battle requires two distinct photographs." }, { status: 400 });
    }

    // Check hourly rate limit
    const rateLimit = await checkBattleCreationRateLimit(created_by);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Hourly battle creation limit reached (${rateLimit.max}/${rateLimit.max}). Please wait before starting more battles.`,
          rateLimit,
        },
        { status: 429 }
      );
    }

    const result = await createBattle({
      post_a_id,
      post_b_id,
      created_by,
      vote_threshold: vote_threshold ? Number(vote_threshold) : 50,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    logger.info("Battle created", { battleId: result.battle?.id, created_by, durationMs: Date.now() - start });
    return NextResponse.json({ success: true, battle: result.battle }, { status: 201 });
  } catch (err: any) {
    logger.error("POST /api/battles error", { error: err.message, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
