import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { claimDailyLoginBonus, getLoginStreak } from "@/lib/earnings/login-streak";
import { checkAndUnlockAchievements } from "@/lib/earnings/achievements";

async function getSupabaseWithUser() {
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
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * GET /api/earnings/daily-bonus — Get current login streak info
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const streakInfo = await getLoginStreak(supabase, user.id);
    return NextResponse.json({ success: true, streak: streakInfo });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/earnings/daily-bonus — Claim today's login streak bonus
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const result = await claimDailyLoginBonus(supabase, user.id);

    // After claiming, check for streak-based achievements
    if (result.success) {
      const newAchievements = await checkAndUnlockAchievements(supabase, user.id);
      return NextResponse.json({
        success: true,
        streak: result.streak,
        bonusWC: result.bonusWC,
        alreadyClaimed: result.alreadyClaimed,
        newAchievements,
      });
    }

    return NextResponse.json({
      success: result.alreadyClaimed,
      streak: result.streak,
      bonusWC: result.bonusWC,
      alreadyClaimed: result.alreadyClaimed,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
