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
 * POST /api/follows — Follow a user
 * Body: { followingId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { followingId } = await req.json();
    if (!followingId) {
      return NextResponse.json({ success: false, error: "followingId is required" }, { status: 400 });
    }

    if (followingId === user.id) {
      return NextResponse.json({ success: false, error: "Cannot follow yourself" }, { status: 400 });
    }

    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: followingId });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already following" });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/follows — Unfollow a user
 * Body: { followingId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { followingId } = await req.json();
    if (!followingId) {
      return NextResponse.json({ success: false, error: "followingId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/follows?userId=xxx&type=followers|following
 * Returns follower or following list for a user.
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || user?.id;
    const type = searchParams.get("type") || "followers";

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    if (type === "following") {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id, created_at, profiles:following_id(id, username, display_name, avatar_url)")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data, count: data?.length ?? 0 });
    }

    // Default: followers
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, created_at, profiles:follower_id(id, username, display_name, avatar_url)")
      .eq("following_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    // Check if current user follows this user
    let isFollowing = false;
    if (user && userId !== user.id) {
      const { data: followCheck } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .single();
      isFollowing = !!followCheck;
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length ?? 0,
      isFollowing,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
