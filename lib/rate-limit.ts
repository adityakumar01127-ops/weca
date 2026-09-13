/**
 * Sliding Window Rate Limiter
 * 
 * In-memory sliding window rate limiter with automatic stale key eviction.
 * Used across API routes for defense-in-depth throttling alongside edge middleware.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  limit: number;
  /** Window size in milliseconds (defaults to 60,000 = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

class SlidingWindowRateLimiter {
  private store: Map<string, number[]> = new Map();
  private lastCleanup: number = Date.now();
  private cleanupIntervalMs: number = 60_000; // Run garbage collection once per minute

  public check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowMs || 60_000;
    const windowStart = now - windowMs;

    this.cleanup(windowMs);

    const timestamps = this.store.get(identifier) || [];
    // Retain only requests within the active sliding window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= config.limit) {
      const oldestInWindow = validTimestamps[0];
      const resetAt = oldestInWindow + windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        retryAfterSeconds,
        resetAt,
      };
    }

    validTimestamps.push(now);
    this.store.set(identifier, validTimestamps);

    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - validTimestamps.length,
      retryAfterSeconds: 0,
      resetAt: now + windowMs,
    };
  }

  private cleanup(windowMs: number) {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) {
      return;
    }
    this.lastCleanup = now;

    const expiryCutoff = now - windowMs * 2;
    for (const [key, timestamps] of this.store.entries()) {
      const active = timestamps.filter((t) => t > expiryCutoff);
      if (active.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, active);
      }
    }
  }

  public reset(identifier: string) {
    this.store.delete(identifier);
  }
}

// Global singleton instance so state persists across hot module reloads in dev
const globalForLimiter = globalThis as unknown as {
  __WICA_RATE_LIMITER__?: SlidingWindowRateLimiter;
};

export const rateLimiter =
  globalForLimiter.__WICA_RATE_LIMITER__ || new SlidingWindowRateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalForLimiter.__WICA_RATE_LIMITER__ = rateLimiter;
}

/**
 * Standard preset limits per action/endpoint
 */
export const RATE_PRESETS = {
  feed: { limit: 120, windowMs: 60_000 },
  like: { limit: 60, windowMs: 60_000 },
  comment: { limit: 30, windowMs: 60_000 },
  postCreate: { limit: 10, windowMs: 60_000 },
  uploadAndScore: { limit: 10, windowMs: 60_000 },
  battleVote: { limit: 30, windowMs: 60_000 },
  walletPayout: { limit: 10, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
} as const;
