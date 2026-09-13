import { NextResponse } from "next/server";

/**
 * WICA Health Check Endpoint
 * 
 * Used by uptime monitors, load balancers, and deployment checks.
 * Returns structured health status for all critical dependencies.
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "error" | "unconfigured"; latencyMs?: number; message?: string }> = {};

  // 1. Check Supabase connectivity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const dbStart = Date.now();
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      checks.supabase = {
        status: res.ok ? "ok" : "error",
        latencyMs: Date.now() - dbStart,
        message: res.ok ? `Connected (HTTP ${res.status})` : `HTTP ${res.status}`,
      };
    } catch (err) {
      checks.supabase = {
        status: "error",
        latencyMs: Date.now() - dbStart,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  } else {
    checks.supabase = { status: "unconfigured", message: "SUPABASE_URL or key not set" };
  }

  // 2. Check Gemini API key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "your-gemini-api-key-here" && geminiKey.trim() !== "") {
    checks.gemini = { status: "ok", message: "API key configured" };
  } else {
    checks.gemini = { status: "unconfigured", message: "GEMINI_API_KEY not set" };
  }

  // 3. Check environment
  checks.environment = {
    status: "ok",
    message: process.env.NODE_ENV || "development",
  };

  // 4. Memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  checks.memory = {
    status: heapUsedMB < heapTotalMB * 0.9 ? "ok" : "error",
    message: `${heapUsedMB}MB / ${heapTotalMB}MB heap`,
  };

  // Overall status
  const hasErrors = Object.values(checks).some((c) => c.status === "error");
  const overallStatus = hasErrors ? "degraded" : "healthy";
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.2.0",
      uptime: process.uptime(),
      responseTimeMs: totalLatency,
      checks,
    },
    {
      status: hasErrors ? 503 : 200,
      headers: {
        "Cache-Control": "no-cache, no-store",
      },
    }
  );
}
