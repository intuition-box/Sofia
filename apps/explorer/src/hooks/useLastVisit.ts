/**
 * useLastVisit — tracks the previous time the user opened the Explore home,
 * so the Activity section can surface a "new since last visit" count.
 *
 * The previous timestamp is snapshotted ONCE on mount (before we overwrite
 * it) so the comparison reflects the prior session, not the current one.
 * `markVisited()` stamps the current time; call it when the home is shown.
 */
import { useCallback, useEffect, useState } from 'react'

const KEY = 'sofia:dashboard-last-visit'

export function useLastVisit(): {
  lastVisit: string | null
  markVisited: () => void
} {
  // Read the prior value once, before any write this session.
  const [lastVisit] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  })

  const markVisited = useCallback(() => {
    try {
      localStorage.setItem(KEY, new Date().toISOString())
    } catch {
      // Private mode / storage disabled — "new since" simply won't persist.
    }
  }, [])

  return { lastVisit, markVisited }
}

/** Count feed items newer than a snapshotted ISO timestamp. */
export function countNewSince(
  timestamps: string[],
  since: string | null,
): number {
  if (!since) return 0
  const cutoff = new Date(since).getTime()
  if (Number.isNaN(cutoff)) return 0
  let n = 0
  for (const ts of timestamps) {
    const t = new Date(ts).getTime()
    if (!Number.isNaN(t) && t > cutoff) n++
  }
  return n
}

/** Mark the home as visited on mount (one-shot). */
export function useMarkVisitedOnMount(markVisited: () => void): void {
  useEffect(() => {
    markVisited()
  }, [markVisited])
}
