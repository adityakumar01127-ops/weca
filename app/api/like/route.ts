import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/supabase/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = body.postId || body.post_id || body.imageId;
    const userId = body.userId || body.user_id;

    if (!postId || !userId) {
      return NextResponse.json({ error: "Missing postId or userId" }, { status: 400 });
    }

    const result = await toggleLike(postId, userId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("Like API error:", error);
    return NextResponse.json({ success: false, error: "Failed to toggle like" }, { status: 500 });
  }
}
