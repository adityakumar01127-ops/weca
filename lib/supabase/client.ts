import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Ensure Node server environments without native WebSocket support (e.g. Node 20) do not crash
if (typeof window === "undefined" && typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

let clientInstance: SupabaseClient | null = null;

/**
 * Supabase Browser Client Factory
 * 
 * In browser environment, maintains a singleton instance to prevent
 * connection exhaustion, memory bloat, and duplicated realtime subscriptions.
 */
const DEFAULT_SUPABASE_URL = "https://qaaeshezrdxfsaxlpmzo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_b6LZZeIIuTHXEvIr17jYBQ_VoI1toIY";

export function createClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  // Browser environment: singleton pattern
  if (typeof window !== "undefined") {
    if (!clientInstance) {
      clientInstance = createBrowserClient(supabaseUrl, supabaseKey);
    }
    return clientInstance;
  }

  // Server-side invocation (e.g. Server Component or API handler)
  return createBrowserClient(supabaseUrl, supabaseKey);
}
