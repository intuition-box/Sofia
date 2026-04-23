/**
 * Compact duration formatter.
 *
 *   59          → "59s"
 *   120         → "2m"
 *   3600        → "1h"
 *   86_400 * 2  → "2d"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}
