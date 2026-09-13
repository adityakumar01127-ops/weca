import { NextRequest, NextResponse } from "next/server";
import { getFeedImages } from "@/lib/services/data";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const sortBy = (searchParams.get("sortBy") as "score" | "latest") || "score";
    const userId = searchParams.get("userId") || undefined;
    const currentUserId = searchParams.get("currentUserId") || undefined;

    // Pagination params capped at 50 to prevent large DB transfer
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 50);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const images = await getFeedImages({
      category,
      sortBy,
      userId,
      currentUserId,
    });

    const startIndex = (page - 1) * limit;
    const paginatedImages = images.slice(startIndex, startIndex + limit);

    logger.info("Feed fetched", {
      count: paginatedImages.length,
      page,
      limit,
      durationMs: Date.now() - start,
    });

    return NextResponse.json(
      {
        images: paginatedImages,
        pagination: {
          page,
          limit,
          total: images.length,
          hasMore: startIndex + limit < images.length,
        },
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
