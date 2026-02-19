/**
 * Streak calculation utilities
 *
 * Pure functions for calculating streak days from deposit records.
 * Extracted from useStreakLeaderboard hook.
 */

/** Format a Date as YYYY-MM-DD string. */
export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Calculate current streak (consecutive days) per user from deposit records.
 * Returns Map<lowercased address, streak days>.
 */
export function calculateStreaks(
  deposits: { receiver_id: string; created_at: string }[]
): Map<string, number> {
  // Group unique deposit dates (YYYY-MM-DD) per user
  const userDates = new Map<string, Set<string>>()
  for (const d of deposits) {
    const addr = d.receiver_id.toLowerCase()
    if (!userDates.has(addr)) userDates.set(addr, new Set())
    const day = d.created_at.slice(0, 10) // "YYYY-MM-DD"
    userDates.get(addr)!.add(day)
  }

  const result = new Map<string, number>()
  const today = new Date()
  const todayStr = toDateStr(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  for (const [addr, dates] of userDates) {
    // Start from today or yesterday
    let streak = 0
    let checkDate: Date

    if (dates.has(todayStr)) {
      checkDate = new Date(today)
    } else if (dates.has(yesterdayStr)) {
      checkDate = new Date(yesterday)
    } else {
      result.set(addr, 0)
      continue
    }

    // Count consecutive days backward
    while (dates.has(toDateStr(checkDate))) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    result.set(addr, streak)
  }

  return result
}
