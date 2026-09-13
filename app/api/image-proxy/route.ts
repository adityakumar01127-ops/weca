import { NextRequest, NextResponse } from "next/server";

// Fallback 1x1 transparent GIF
const FALLBACK_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // SSRF prevention: block localhost, internal loopbacks, link-local metadata
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse(new Uint8Array(FALLBACK_GIF), {
      headers: {
        "Content-Type": "image/gif",
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
      return new NextResponse(new Uint8Array(FALLBACK_GIF), {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  // SSRF defense validation
  if (!isAllowedUrl(url)) {
    return new NextResponse(new Uint8Array(FALLBACK_GIF), {
      status: 400,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    // 8-second timeout to prevent hanging connections
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "WICA-ImageProxy/1.0",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new NextResponse(new Uint8Array(FALLBACK_GIF), {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    // Determine cache lifetime based on origin
    const isSupabase = url.includes("supabase.co");
    const isUnsplash = url.includes("images.unsplash.com");
    const cacheHeader = isSupabase || isUnsplash
      ? "public, max-age=31536000, s-maxage=31536000, immutable"
      : "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

    return new NextResponse(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheHeader,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(new Uint8Array(FALLBACK_GIF), {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
