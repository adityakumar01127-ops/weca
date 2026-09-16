import { NextRequest, NextResponse } from "next/server";
import { getProfileWithPosts } from "@/lib/supabase/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || searchParams.get("userId");

    if (!username) {
      return NextResponse.json({ error: "Username or user ID required" }, { status: 400 });
    }

    const { profile, posts } = await getProfileWithPosts(username);
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        username: profile.username || "explorer",
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio || "",
        note: profile.note ?? null,
        gender: profile.gender ?? null,
        pronouns: profile.pronouns ?? null,
        website: profile.website ?? null,
        is_ai_profile: Boolean(profile.is_ai_profile),
        followers_count: profile.followers_count ?? profile.follower_count ?? 0,
        following_count: profile.following_count ?? 0,
        total_wc: profile.credits_balance || 0,
        tier: profile.tier || "Certified Weird",
        created_at: profile.created_at,
      },
      images: posts.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        storage_path: p.image_url,
        caption: p.caption,
        wica_score: p.weirdness_score || 0,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        created_at: p.created_at,
        moderation_status: "approved" as const,
      })),
      posts,
    });
  } catch (error: unknown) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
  }
}

