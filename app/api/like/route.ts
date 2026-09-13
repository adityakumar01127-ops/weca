import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/supabase/data";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const postId = body.postId || body.post_id || body.imageId;
    const userId = body.userId || body.user_id;

    if (!postId || !userId) {
      return NextResponse.json({ error: "Missing postId or userId" }, { status: 400 });
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
