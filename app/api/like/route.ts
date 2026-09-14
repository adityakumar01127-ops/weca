import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/supabase/data";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to like posts." }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const postId = body.postId || body.post_id || body.imageId;

    if (!postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    // Rate limit per user
    const rateCheck = rateLimiter.check(`like:${userId}`, RATE_PRESETS.like);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many likes. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const result = await toggleLike(postId, userId);
    logger.info("Like toggled", { postId, userId, liked: result.liked, durationMs: Date.now() - start });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error("Like API error", { error, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: "Failed to toggle like" }, { status: 500 });
  }
}

