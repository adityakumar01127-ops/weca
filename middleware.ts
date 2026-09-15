import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * WICA Production Middleware
 * 
 * 1. Auth-protects private routes (redirect to /login)
 * 2. Validates session on protected API routes (return 401)
 * 3. Adds security headers to all responses
 * 4. IP-based rate limiting for API routes
 */

// Routes that require authentication (redirect to /login if not authenticated)
const PROTECTED_PAGE_ROUTES = [
  "/admin",
  "/wallet",
  "/settings",
  "/upload",
  "/messages",
];

// API routes that require authentication (return 401 if not authenticated)
const PROTECTED_API_ROUTES = [
  "/api/like",
  "/api/comments",
  "/api/posts",
  "/api/upload-and-score",
  "/api/score-post",
  "/api/battles",
  "/api/wallet",
  "/api/admin",
  "/api/profile",
  "/api/earnings",
  "/api/impressions",
  "/api/follows",
];


// Sliding window rate limiter (in-memory, per-process)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMITS: Record<string, number> = {
  "/api/feed": 120,        // 120 requests/min
  "/api/like": 60,         // 60 requests/min
  "/api/comments": 30,     // 30 requests/min
  "/api/posts": 30,        // 30 requests/min
  "/api/upload-and-score": 10, // 10 requests/min
  "/api/score-post": 10,   // 10 requests/min
  "/api/battles": 30,      // 30 requests/min
  "/api/wallet": 20,       // 20 requests/min
  "/api/earnings": 60,     // 60 requests/min
  "/api/impressions": 120, // 120 requests/min
  "/api/follows": 60,      // 60 requests/min
  "/api/admin": 30,        // 30 requests/min
  "/api/profile": 60,      // 60 requests/min
  "/api/image-proxy": 200, // 200 requests/min (high for images)
  "/api/health": 30,       // 30 requests/min
  default: 60,             // 60 requests/min for unmatched
};

// Cleanup stale rate limit entries periodically
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes
let lastCleanup = Date.now();

function cleanupRateLimits() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - RATE_LIMIT_WINDOW_MS * 2;
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, filtered);
    }
  }
}

function checkRateLimit(ip: string, routePrefix: string): { allowed: boolean; remaining: number; limit: number } {
  cleanupRateLimits();

  const limit = RATE_LIMITS[routePrefix] || RATE_LIMITS.default;
  const key = `${ip}:${routePrefix}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = rateLimitMap.get(key) || [];
  const recentTimestamps = timestamps.filter((t) => t > windowStart);
  recentTimestamps.push(now);
  rateLimitMap.set(key, recentTimestamps);

  const count = recentTimestamps.length;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}

function getRoutePrefix(pathname: string): string {
  // Match the most specific route prefix
  const allRoutes = Object.keys(RATE_LIMITS).filter((r) => r !== "default");
  const match = allRoutes
    .sort((a, b) => b.length - a.length) // longest first
    .find((r) => pathname.startsWith(r));
  return match || "default";
}

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "on",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|webp|woff|woff2|ttf|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  // Get client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // --- Rate Limiting for API routes ---
  if (pathname.startsWith("/api/")) {
    const routePrefix = getRoutePrefix(pathname);
    const rateCheck = checkRateLimit(ip, routePrefix);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please slow down.",
          retryAfterSeconds: 60,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            ...SECURITY_HEADERS,
          },
        }
      );
    }
  }

  // --- Auth check ---
  const isProtectedPage = PROTECTED_PAGE_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicApiGet =
    (pathname.startsWith("/api/comments") && req.method === "GET") ||
    (pathname.startsWith("/api/posts") && req.method === "GET") ||
    (pathname.startsWith("/api/battles") && req.method === "GET") ||
    (pathname.startsWith("/api/profile") && req.method === "GET");
  const isProtectedApi = !isPublicApiGet && PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtectedPage || isProtectedApi) {
    // Permit service-to-service calls that provide the true Supabase Service Role Key
    const authHeader = req.headers.get("authorization");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
      const res = NextResponse.next();
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.headers.set(key, value);
      });
      return res;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qaaeshezrdxfsaxlpmzo.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_b6LZZeIIuTHXEvIr17jYBQ_VoI1toIY";

    if (!supabaseUrl || !supabaseAnonKey) {
      // Supabase not configured — block protected routes
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "Service unavailable" },
          { status: 503, headers: SECURITY_HEADERS }
        );
      }
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    const res = NextResponse.next();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          } catch {}
        },
      },
    });

    let user = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }

    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: SECURITY_HEADERS }
        );
      }
      // Redirect to login for protected pages
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Add security headers and rate limit headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      res.headers.set(key, value);
    });

    if (pathname.startsWith("/api/")) {
      const routePrefix = getRoutePrefix(pathname);
      const limit = RATE_LIMITS[routePrefix] || RATE_LIMITS.default;
      const rateCheck = checkRateLimit(ip, routePrefix);
      res.headers.set("X-RateLimit-Limit", String(limit));
      res.headers.set("X-RateLimit-Remaining", String(rateCheck.remaining));
    }

    return res;
  }

  // --- Public routes: add security headers only ---
  const res = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Add HSTS in production
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
