/**
 * Simple in-memory rate limiter for auth endpoints.
 *
 * Limitation: per-instance only. On Vercel serverless, each cold start gets a
 * fresh Map, so this is best-effort protection against brute-force attempts
 * within a single instance lifetime. Acceptable for a dissertation demo; a
 * production system would use Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check whether a request from `key` (typically IP) should be rate-limited.
 * Returns `{ limited: false }` if allowed, or `{ limited: true, retryAfterMs }`
 * if the caller has exceeded the threshold.
 */
export function checkRateLimit(key: string): { limited: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false };
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    return { limited: true, retryAfterMs: entry.resetAt - now };
  }

  return { limited: false };
}

/**
 * Extract a usable IP from the request for rate limiting.
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
