import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// In-memory buffer cache for ultra-fast same-origin delivery
const imageCache = new Map<string, { buffer: Buffer; contentType: string }>();
const MAX_CACHE_ENTRIES = 120;

function getFallbackBuffer(): { buffer: Buffer; contentType: string } {
  try {
    const fallbackPath = path.join(process.cwd(), "public", "anom-1.jpg");
    if (fs.existsSync(fallbackPath)) {
      return {
        buffer: fs.readFileSync(fallbackPath),
        contentType: "image/jpeg",
      };
    }
  } catch (err) {
    console.error("Fallback image read error:", err);
  }
  // Minimal 1x1 transparent GIF fallback
  return {
    buffer: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
    contentType: "image/gif",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    const fallback = getFallbackBuffer();
    return new NextResponse(new Uint8Array(fallback.buffer), {
      headers: {
        "Content-Type": fallback.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Handle data: URLs directly
  if (url.startsWith("data:")) {
    try {
      const commaIdx = url.indexOf(",");
      const meta = url.substring(5, commaIdx);
      const data = url.substring(commaIdx + 1);
      const isBase64 = meta.includes(";base64");
      const mime = meta.split(";")[0] || "image/jpeg";
      const buffer = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data));

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      const fallback = getFallbackBuffer();
      return new NextResponse(new Uint8Array(fallback.buffer), {
        headers: {
          "Content-Type": fallback.contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  // Check in-memory cache
  const cached = imageCache.get(url);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Proxy-Cache": "HIT",
      },
    });
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.warn(`Upstream image failed for ${url}: status ${response.status}`);
      const fallback = getFallbackBuffer();
      return new NextResponse(new Uint8Array(fallback.buffer), {
        headers: {
          "Content-Type": fallback.contentType,
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache image
    if (imageCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = imageCache.keys().next().value;
      if (oldestKey) imageCache.delete(oldestKey);
    }
    imageCache.set(url, { buffer, contentType });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Proxy-Cache": "MISS",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Error proxying image (${url}):`, errorMsg);
    const fallback = getFallbackBuffer();
    return new NextResponse(new Uint8Array(fallback.buffer), {
      headers: {
        "Content-Type": fallback.contentType,
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}

