/**
 * Fixed-window rate limiter. In-memory = per server instance, which is fine
 * for development but NOT sufficient on Vercel's multi-instance runtime.
 * Phase 8: swap the store for Upstash Redis (UPSTASH_REDIS_REST_URL) — same API.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || cur.reset <= now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  cur.count++;
  return { ok: cur.count <= limit, remaining: Math.max(0, limit - cur.count), retryAfter: Math.ceil((cur.reset - now) / 1000) };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}
