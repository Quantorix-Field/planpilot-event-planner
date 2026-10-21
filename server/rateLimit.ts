export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

interface Entry {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 1000;

/**
 * Fixed-window limiter held in memory. On serverless each warm instance keeps its
 * own counts, so this is a best-effort guard against bursts, not a hard global cap.
 */
export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now,
): RateLimiter {
  const entries = new Map<string, Entry>();

  return {
    check(key: string): RateLimitResult {
      const time = now();

      if (entries.size > MAX_TRACKED_KEYS) {
        for (const [k, entry] of entries) {
          if (entry.resetAt <= time) entries.delete(k);
        }
      }

      const current = entries.get(key);
      if (!current || current.resetAt <= time) {
        entries.set(key, { count: 1, resetAt: time + windowMs });
        return { allowed: true, retryAfterSec: 0 };
      }
      if (current.count >= limit) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((current.resetAt - time) / 1000)),
        };
      }
      current.count += 1;
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}
