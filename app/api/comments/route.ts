import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/supabase/data";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId") || searchParams.get("post_id") || searchParams.get("imageId");

    if (!postId) {
      return NextResponse.json({ error: "Missing postId or imageId parameter" }, { status: 400 });
    }

    const comments = await getComments(postId);
    logger.info("Comments fetched", { postId, count: comments.length, durationMs: Date.now() - start });
    return NextResponse.json({ success: true, comments });
  } catch (error: unknown) {
    logger.error("Get comments error", { error, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const postId = body.postId || body.post_id || body.imageId;
    const userId = body.userId || body.user_id;
    const text = body.body || body.text || body.content;

    if (!postId || !userId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required comment fields (postId, userId, text)" }, { status: 400 });
    }

    // Input sanitization / length limit
    const trimmed = text.trim();
    if (trimmed.length > 1000) {
      return NextResponse.json(
        { error: "Comment too long. Maximum allowed length is 1,000 characters." },
        { status: 400 }
      );
    }

    // Rate limiting per user
    const rateCheck = rateLimiter.check(`comment:${userId}`, RATE_PRESETS.comment);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many comments. Please wait before posting again." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const comment = await addComment({
      postId,
      userId,
      body: trimmed,
    });

    logger.info("Comment added", { postId, userId, commentId: comment.id, durationMs: Date.now() - start });
    return NextResponse.json({ success: true, comment });
  } catch (error: unknown) {
    logger.error("Add comment error", { error, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: "Failed to add comment" }, { status: 500 });
  }
}
