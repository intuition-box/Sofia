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
