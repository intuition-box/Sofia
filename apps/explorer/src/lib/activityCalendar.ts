/**
 * Activity calendar helpers — GitHub-style contribution heatmap.
 *
 * Ported from proto-explorer/src/components/profileCharts.ts:438-510. Until
 * the real activity graph is wired (`useUserActivity` × topic), the series
 * builder produces a deterministic synthetic pattern per topic so the
 * layout + colors can be visually validated end-to-end.
 */

export const CAL_WEEKS = 18
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
 * Deterministic synthetic activity series per topic — mocks months of
 * certifications so the heatmap shape is readable even with no real data.
 *
 * Same four-peak Gaussian sum + jittered amplitude as the proto; the hash
 * derived from the topic key shifts the rhythm per topic.
 */
export function buildSyntheticCalendarSeries(topicId: string | 'all'): number[] {
  const key = `${topicId}:all`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  const offset = ((hash % 17) + 17) % 17

  const peaks = [
    { center: 20 + offset, sigma: 7, amp: 3 },
    { center: 55 + offset * 0.5, sigma: 10, amp: 4.2 },
    { center: 90, sigma: 5, amp: 2.5 },
    { center: CAL_DAYS - 6, sigma: 4, amp: 3.5 },
  ]

  const result: number[] = []
  for (let t = 0; t < CAL_DAYS; t++) {
    let intensity = 0
    for (const p of peaks) {
      const x = (t - p.center) / p.sigma
      intensity += p.amp * Math.exp(-(x * x) / 2)
    }
    const jitter = (((hash ^ (t * 131)) >>> 0) % 100) / 100
    intensity *= 0.45 + jitter * 0.75
    result.push(Math.max(0, Math.round(intensity)))
  }
  return result
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
export function computeCalendarMonthLabels(weeks = CAL_WEEKS): CalendarMonthLabel[] {
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
