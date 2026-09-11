import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/supabase/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId") || searchParams.get("post_id") || searchParams.get("imageId");

    if (!postId) {
      return NextResponse.json({ error: "Missing postId or imageId parameter" }, { status: 400 });
    }

    const comments = await getComments(postId);
    return NextResponse.json({ success: true, comments });
  } catch (error: unknown) {
    console.error("Get comments error:", error);
    return NextResponse.json({ success: false, error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = body.postId || body.post_id || body.imageId;
    const userId = body.userId || body.user_id;
    const text = body.body || body.text || body.content;

    if (!postId || !userId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required comment fields (postId, userId, text)" }, { status: 400 });
    }

    const comment = await addComment({
      postId,
      userId,
      body: text.trim(),
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: unknown) {
    console.error("Add comment error:", error);
    return NextResponse.json({ success: false, error: "Failed to add comment" }, { status: 500 });
  }
}
