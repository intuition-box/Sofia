/**
 * Activity calendar helpers — GitHub-style contribution heatmap.
 *
 * Counts come from `buildCalendarSeriesFromActivity` which buckets the
 * user's indexed CircleItem feed by (day × topic).
 */
import type { CircleItem } from '@/services/circleService'

export const CAL_WEEKS = 52
export const CAL_DAYS = CAL_WEEKS * 7

/** Returns `today`, `yesterday`, or `Nd ago`. */
export function dayLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  return `${daysAgo}d ago`
}

/** Short human date ("Mar 14") for a given offset in the past. */
export function dateStringForDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Short month label ("Mar") for the column. */
export function monthForDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short' })
}

/** 5-level bucketing used by the heatmap cell color intensity. */
export function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 2) return 2
  if (count <= 4) return 3
  return 4
}

/**
 * Real per-topic counts derived from a CircleItem feed. Each item is
 * tallied once per topic in its `topicContexts`; the day index is its
 * `timestamp`'s local-day offset from today (today → CAL_DAYS-1, yesterday
 * → CAL_DAYS-2, …). Items older than the window or without a parseable
 * timestamp are skipped.
 *
 * `quest:*` intentions are ignored — they aren't certifications and would
 * inflate the heatmap with badge claims.
 */
export function buildCalendarSeriesFromActivity(
  items: readonly CircleItem[],
  topicId: string,
): number[] {
  const counts = new Array<number>(CAL_DAYS).fill(0)
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)
  const todayMs = todayMidnight.getTime()
  const dayMs = 86_400_000

  for (const item of items) {
    if (!item.topicContexts.includes(topicId)) continue
    if (item.intentions.every((l) => l.startsWith('quest:'))) continue
    const ts = item.timestamp
    if (!ts) continue
    const itemMs = Date.parse(ts)
    if (Number.isNaN(itemMs)) continue
    // Snap to local-day midnight so DST doesn't bleed counts across days.
    const itemDay = new Date(itemMs)
    itemDay.setHours(0, 0, 0, 0)
    const daysAgo = Math.round((todayMs - itemDay.getTime()) / dayMs)
    if (daysAgo < 0 || daysAgo >= CAL_DAYS) continue
    counts[CAL_DAYS - 1 - daysAgo] += 1
  }
  return counts
}

/** One topic's contribution to the calendar. */
export interface CalendarTopicSeries {
  /** Stable id (topic slug). */
  id: string
  /** Short label shown in the legend. */
  label: string
  /** Hex/CSS color used for the legend dot + cell tint. */
  color: string
  /** CAL_DAYS-length array, index 0 = oldest, index CAL_DAYS-1 = today. */
  counts: number[]
}

/** Month header positions to render above the week columns. */
export interface CalendarMonthLabel {
  label: string
  /** 1-based column index (matches CSS `grid-column`). */
  weekIdx: number
}

/** Compute month header labels for the 18-week span ending today. */
export function computeCalendarMonthLabels(
  weeks = CAL_WEEKS,
): CalendarMonthLabel[] {
  const out: CalendarMonthLabel[] = []
  let prev = ''
  const days = weeks * 7
  for (let w = 0; w < weeks; w++) {
    const daysAgo = days - 1 - w * 7
    const month = monthForDaysAgo(daysAgo)
    if (month !== prev) {
      out.push({ label: month, weekIdx: w + 1 })
      prev = month
    }
  }
  return out
}
