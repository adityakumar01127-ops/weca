import { NextRequest, NextResponse } from "next/server";
import { getPostsPaginated } from "@/lib/supabase/data";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const currentUserId = searchParams.get("currentUserId") || undefined;

    // Pagination params capped at 50 to prevent large DB transfer
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 50);

    const { posts, nextCursor, hasMore } = await getPostsPaginated({
      limit,
      cursor,
      currentUserId,
    });

    logger.info("Feed fetched", {
      count: posts.length,
      limit,
      durationMs: Date.now() - start,
    });

    return NextResponse.json(
      {
        posts,
        // Backward-compatibility alias for components expecting images array
        images: posts.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          storage_path: p.image_url,
          caption: p.caption,
          wica_score: p.weirdness_score || 0,
          author: p.profiles,
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          user_has_liked: p.user_has_liked,
          created_at: p.created_at,
          moderation_status: "approved" as const,
        })),
        nextCursor,
        hasMore,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: unknown) {
    logger.error("Feed API error", { error, durationMs: Date.now() - start });
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}

