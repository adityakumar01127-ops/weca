import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAchievementsProgress, checkAndUnlockAchievements } from "@/lib/earnings/achievements";

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
 * GET /api/earnings/achievements — Get achievement progress for authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Auto-check and unlock any newly satisfied achievements
    const newlyUnlocked = await checkAndUnlockAchievements(supabase, user.id);
    const achievements = await getAchievementsProgress(supabase, user.id);

    return NextResponse.json({
      success: true,
      achievements,
      newlyUnlocked,
    });
  } catch (err: any) {
    console.error("GET /api/earnings/achievements error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
