import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * POST /api/impressions — Record a post impression
 * Body: { postId: string, impressionType: "view" | "dwell_3s" | "share" | "save" }
 * 
 * Uses the atomic record_impression PostgreSQL function which handles:
 *   - Self-impression prevention
 *   - Daily deduplication
 *   - Profile impression counter updates
 *   - Creator eligibility tracking
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { postId, impressionType } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: "postId is required" }, { status: 400 });
    }

    const validTypes = ["view", "dwell_3s", "share", "save"];
    if (!impressionType || !validTypes.includes(impressionType)) {
      return NextResponse.json(
        { success: false, error: `impressionType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Use the atomic PostgreSQL function
    const { data, error } = await supabase
      .rpc("record_impression", {
        p_post_id: postId,
        p_viewer_id: user.id,
        p_impression_type: impressionType,
      });

    if (error) {
      // Unique violation is expected (dedup) — treat as success
      if (error.code === "23505") {
        return NextResponse.json({ success: true, recorded: false, message: "Already recorded" });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, recorded: data === true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
