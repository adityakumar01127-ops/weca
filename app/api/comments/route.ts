import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/services/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    const comments = await getComments(imageId);
    return NextResponse.json({ comments });
  } catch (error: unknown) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageId, userId, text, username, avatarUrl } = body;

    if (!imageId || !userId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required comment fields" }, { status: 400 });
    }

    const comment = await addComment(imageId, userId, text.trim(), {
      username,
      avatar_url: avatarUrl,
    });

    return NextResponse.json({ comment });
  } catch (error: unknown) {
    console.error("Add comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
