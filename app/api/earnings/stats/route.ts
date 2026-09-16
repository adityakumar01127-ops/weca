import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getDailyCapUsage } from "@/lib/earnings/interaction-credits";
import { MONTHLY_CASHOUT_CAP_WC, wcToINR } from "@/lib/credits";

async function getSupabaseWithUser(req?: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
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

  let user = null;
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  return { supabase, user };
}

/**
 * GET /api/earnings/stats — Aggregated earning stats across all channels
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const userId = user.id;

    // 1. Daily cap usage
    const dailyCap = await getDailyCapUsage(supabase, userId);

    // 2. Monthly cashout usage
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

    const monthlyCashoutUsed = (monthPayouts ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const monthlyCashoutRemaining = Math.max(0, MONTHLY_CASHOUT_CAP_WC - monthlyCashoutUsed);

    // 3. Channel breakdown from credit_transactions
    const { data: txs } = await supabase
      .from("credit_transactions")
      .select("amount, reason, created_at")
      .eq("user_id", userId)
      .gt("amount", 0);

    const breakdown = {
      posts: 0,
      interactions: 0,
      vsBattles: 0,
      achievements: 0,
      loginStreaks: 0,
      other: 0,
      totalEarned: 0,
    };

    (txs || []).forEach((t) => {
      const reason = (t.reason || "").toLowerCase();
      const amt = t.amount;
      breakdown.totalEarned += amt;

      if (reason.includes("streak") || reason.includes("login")) {
        breakdown.loginStreaks += amt;
      } else if (reason.includes("achievement")) {
        breakdown.achievements += amt;
      } else if (reason.includes("battle") || reason.includes("vs")) {
        breakdown.vsBattles += amt;
      } else if (reason.includes("interaction") || reason.includes("viewer") || reason.includes("super-like") || reason.includes("like") || reason.includes("comment")) {
        breakdown.interactions += amt;
      } else if (reason.includes("upload") || reason.includes("post") || reason.includes("sighting") || reason.includes("score")) {
        breakdown.posts += amt;
      } else {
        breakdown.other += amt;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        dailyCap,
        monthlyCashout: {
          used: monthlyCashoutUsed,
          remaining: monthlyCashoutRemaining,
          cap: MONTHLY_CASHOUT_CAP_WC,
        },
        breakdown,
        inrEquivalent: wcToINR(breakdown.totalEarned),
      },
    });
  } catch (err: any) {
    console.error("GET /api/earnings/stats error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
