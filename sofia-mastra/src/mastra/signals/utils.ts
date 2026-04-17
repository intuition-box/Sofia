/**
 * Calculate months elapsed since a date string (ISO 8601)
 */
export function monthsSince(dateString: string): number {
  const then = new Date(dateString)
  const now = new Date()
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth())
  return Math.max(0, months)
}

/**
 * Calculate the longest consecutive-day streak from a list of events.
 * Events must have a `created_at` ISO date field.
 */
export function calculateStreak(
  events: { created_at: string }[]
): number {
  if (events.length === 0) return 0

  const uniqueDays = [
    ...new Set(
      events.map((e) => e.created_at.slice(0, 10)) // YYYY-MM-DD
    ),
  ].sort()

  let maxStreak = 1
  let current = 1

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffMs = curr.getTime() - prev.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      current++
      maxStreak = Math.max(maxStreak, current)
    } else {
      current = 1
    }
  }

  return maxStreak
}

/**
 * Fetch wrapper that throws typed errors for 401/403 (token_expired)
 */
export async function safeFetch(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  const response = await fetch(url, { headers })

  if (response.status === 401 || response.status === 403) {
    throw new TokenExpiredError(
      `API returned ${response.status} — token expired or revoked`
    )
  }

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`)
  }

  return response
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TokenExpiredError"
  }
}

/**
 * Parse a value to a finite number, fallback to 0 if invalid.
 */
export function safeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Wrap a secondary API call so a single failure doesn't abort the whole fetcher.
 * Primary fetches (getUser, getRepos, etc.) should NOT use this — they can throw.
 */
export async function safeStep<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
  warnings: string[]
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    warnings.push(`${label}:${msg}`)
    return fallback
  }
}

/**
 * Validate a raw metrics object. Filters out NaN/Infinity, clamps negatives to 0.
 * Returns sanitized metrics + warnings for invalid entries.
 */
export function validateMetrics(raw: unknown): {
  metrics: Record<string, number>
  warnings: string[]
} {
  const metrics: Record<string, number> = {}
  const warnings: string[] = []

  if (!raw || typeof raw !== "object") {
    return { metrics, warnings: ["invalid_metrics_object"] }
  }

  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v)
    if (!Number.isFinite(n)) {
      warnings.push(`invalid_metric:${k}`)
      continue
    }
    if (n < 0) {
      warnings.push(`negative_metric:${k}`)
      metrics[k] = 0
      continue
    }
    metrics[k] = n
  }

  return { metrics, warnings }
}
