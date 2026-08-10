/**
 * In-memory per-key cooldown. Good enough to stop accidental double-submits
 * and casual spam from a single warm server instance — not a durable limiter
 * (state resets on cold start / doesn't share across instances), but needs no
 * extra DB table for what's otherwise a low-stakes guardrail.
 */
const lastActionAt = new Map<string, number>()

export const COMMUNITY_RATE_LIMIT_MS = 30_000

export function checkRateLimit(key: string, minIntervalMs: number = COMMUNITY_RATE_LIMIT_MS) {
  const now = Date.now()
  const last = lastActionAt.get(key)
  if (last !== undefined && now - last < minIntervalMs) {
    return { limited: true as const, retryAfterSeconds: Math.ceil((minIntervalMs - (now - last)) / 1000) }
  }
  lastActionAt.set(key, now)
  return { limited: false as const, retryAfterSeconds: 0 }
}
