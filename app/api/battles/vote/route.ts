import { NextRequest, NextResponse } from "next/server";
import { castBattleVote } from "@/lib/supabase/data";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
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

    return NextResponse.json({ success: true, battle: result.battle });
  } catch (err: any) {
    console.error("POST /api/battles/vote error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
