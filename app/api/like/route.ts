import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/services/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageId, userId } = body;

    if (!imageId || !userId) {
      return NextResponse.json({ error: "Missing imageId or userId" }, { status: 400 });
    }

    const result = await toggleLike(imageId, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Like API error:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
