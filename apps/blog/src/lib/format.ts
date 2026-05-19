/**
 * Date / grouping helpers — pure, framework-agnostic. Kept out of the
 * components so the "26 near-identical logbook titles" scannability
 * solution (month bucketing, date-led cards) lives in one typed place.
 */

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export interface ParsedDate {
  year: number
  month: number
  day: number
}

/** Parse a `YYYY-MM-DD` string. Returns zeros for a malformed input
 *  so callers never throw on bad frontmatter-derived dates. */
export function parseDate(iso: string): ParsedDate {
  const [y, m, d] = (iso || '').split('-').map(Number)
  return {
    year: Number.isFinite(y) ? y : 0,
    month: Number.isFinite(m) ? m : 0,
    day: Number.isFinite(d) ? d : 0,
  }
}

/** `YYYY-MM` bucket key. */
export function monthKey(iso: string): string {
  return (iso || '').slice(0, 7)
}

export interface MonthLabel {
  label: string
  year: number
}

export function monthLabel(iso: string): MonthLabel {
  const { year, month } = parseDate(iso)
  return { label: MONTHS_LONG[Math.max(0, month - 1)] ?? '', year }
}

/**
 * Group a date-bearing list by month, newest bucket first, items
 * preserving their incoming order (callers pass already-sorted posts).
 */
export function groupByMonth<T extends { date: string }>(
  items: readonly T[],
): Array<[string, T[]]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = monthKey(item.date)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}
