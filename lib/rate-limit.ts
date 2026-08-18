/**
 * In-memory per-key cooldown. Good enough to stop accidental double-submits
 * and casual spam from a single warm server instance — not a durable limiter
 * (state resets on cold start / doesn't share across instances), but needs no
 * extra DB table for what's otherwise a low-stakes guardrail.
 */
const lastActionAt = new Map<string, number>()

/** Saving your own tag/icon — cheap, private, not a spam vector, so just enough to absorb double-clicks. */
export const SAVE_RATE_LIMIT_MS = 3_000

/** Publishing to the Community library — the actual DB-spam/flooding concern. */
export const PUBLISH_RATE_LIMIT_MS = 3_000

export function checkRateLimit(key: string, minIntervalMs: number) {
  const now = Date.now()
  const last = lastActionAt.get(key)
  if (last !== undefined && now - last < minIntervalMs) {
    return { limited: true as const, retryAfterSeconds: Math.ceil((minIntervalMs - (now - last)) / 1000) }
  }
  lastActionAt.set(key, now)
  return { limited: false as const, retryAfterSeconds: 0 }
}
