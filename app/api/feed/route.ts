import { NextRequest, NextResponse } from "next/server";
import { getFeedImages } from "@/lib/services/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const sortBy = (searchParams.get("sortBy") as "score" | "latest") || "score";
    const userId = searchParams.get("userId") || undefined;
    const currentUserId = searchParams.get("currentUserId") || undefined;

    const images = await getFeedImages({
      category,
      sortBy,
      userId,
      currentUserId,
    });

    return NextResponse.json({ images });
  } catch (error: unknown) {
    console.error("Feed API error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
