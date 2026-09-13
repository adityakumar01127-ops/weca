import { createClient, SupabaseClient } from "@supabase/supabase-js";

if (typeof window === "undefined" && typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

let adminClientInstance: SupabaseClient | null = null;

/**
 * Supabase Admin Client Factory (Service Role)
 * 
 * Uses the privileged SUPABASE_SERVICE_ROLE_KEY for server-side
 * background tasks, payouts, scoring, and admin panel mutations.
 * NEVER exposed to client browsers.
 */
export function createAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("createAdminClient error: NEXT_PUBLIC_SUPABASE_URL is not set.");
    return null;
  }

  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "CRITICAL SECURITY: SUPABASE_SERVICE_ROLE_KEY is required in production for admin operations."
      );
      return null;
    }
    // Dev only: warn if falling back to anon key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) return null;
    console.warn("createAdminClient warning: Using anon key as fallback in development only.");
    return createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClientInstance;
}
