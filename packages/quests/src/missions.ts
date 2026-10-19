/**
 * Trend Hunter missions — pure computation (docs/plans/TREND_HUNTER_SPEC.md).
 *
 * Everything is derived from on-chain positions (no backend state): callers
 * fetch the user's recent positions and hand them here. Days and weeks are
 * UTC, aligned with the chain; the UI shows local time.
 */

/** A position only counts from this deposit (0.1 TRUST) — anti-dust */
export const MISSION_MIN_DEPOSIT = 100_000_000_000_000_000n

export type MissionId =
  | 'express-3'
  | 'back-a-trend'
  | 'pioneer'
  | 'topic-of-week'

export interface MissionProgress {
  id: MissionId
  period: 'day' | 'week'
  title: string
  description: string
  progress: number
  target: number
  done: boolean
}

/** One of the user's page claims, opened at `createdAt` (ms) */
export interface MissionPosition {
  claimTermId: string
  /** Normalized page key (same key Trending uses) */
  pageKey: string
  createdAt: number
  /** Total deposited (wei) */
  deposit: bigint
}

export interface WeeklyTopic {
  id: string
  label: string
}

const DAY_MS = 86_400_000

export const startOfUtcDay = (now: number = Date.now()): number =>
  Math.floor(now / DAY_MS) * DAY_MS

/** Monday 00:00 UTC of the current ISO week */
export function startOfUtcWeek(now: number = Date.now()): number {
  const day = startOfUtcDay(now)
  const weekday = (new Date(day).getUTCDay() + 6) % 7 // Monday = 0
  return day - weekday * DAY_MS
}

/** ISO week number (1–53) */
export function isoWeek(now: number = Date.now()): number {
  const d = new Date(startOfUtcDay(now))
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return (
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / DAY_MS -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  )
}

/** Deterministic rotation over the taxonomy topics, one per ISO week */
export const topicOfWeek = <T extends WeeklyTopic>(
  topics: readonly T[],
  now: number = Date.now(),
): T => topics[isoWeek(now) % topics.length]

/** Qualifying positions opened since `since`, one per page (earliest kept) */
export function positionsSince(
  positions: readonly MissionPosition[],
  since: number,
): MissionPosition[] {
  const byPage = new Map<string, MissionPosition>()
  for (const p of positions) {
    if (p.createdAt < since || p.deposit < MISSION_MIN_DEPOSIT) continue
    const prev = byPage.get(p.pageKey)
    if (!prev || p.createdAt < prev.createdAt) byPage.set(p.pageKey, p)
  }
  return [...byPage.values()]
}

const mission = (
  id: MissionId,
  period: MissionProgress['period'],
  title: string,
  description: string,
  progress: number,
  target: number,
): MissionProgress => ({
  id,
  period,
  title,
  description,
  progress: Math.min(progress, target),
  target,
  done: progress >= target,
})

export interface DailyMissionsInput {
  positions: readonly MissionPosition[]
  /** Page keys currently in Trending (7 days, top 50) */
  trendingKeys: ReadonlySet<string>
  /** Claims the user opened today where nobody else held a position before */
  pioneerClaimIds: ReadonlySet<string>
  now?: number
}

export function computeDailyMissions({
  positions,
  trendingKeys,
  pioneerClaimIds,
  now = Date.now(),
}: DailyMissionsInput): MissionProgress[] {
  const today = positionsSince(positions, startOfUtcDay(now))
  return [
    mission(
      'express-3',
      'day',
      'Express 3 interests',
      'Take a position on 3 pages today.',
      today.length,
      3,
    ),
    mission(
      'back-a-trend',
      'day',
      'Back a trend',
      'Take a position on a page from Trending (7 days).',
      today.filter((p) => trendingKeys.has(p.pageKey)).length,
      1,
    ),
    mission(
      'pioneer',
      'day',
      'Pioneer',
      'Be the first to take a position on a page.',
      // Any claim of a page counts (a page can carry several claims)
      new Set(
        positions
          .filter(
            (p) =>
              p.createdAt >= startOfUtcDay(now) &&
              p.deposit >= MISSION_MIN_DEPOSIT &&
              pioneerClaimIds.has(p.claimTermId),
          )
          .map((p) => p.pageKey),
      ).size,
      1,
    ),
  ]
}

/** Page tagged with a context (topic/category) by the user, at `createdAt` */
export interface TaggedPage {
  pageKey: string
  createdAt: number
}

export function computeWeeklyMission(
  topic: WeeklyTopic,
  taggedPages: readonly TaggedPage[],
  now: number = Date.now(),
): MissionProgress {
  const since = startOfUtcWeek(now)
  const pages = new Set(
    taggedPages.filter((t) => t.createdAt >= since).map((t) => t.pageKey),
  )
  return mission(
    'topic-of-week',
    'week',
    `Topic of the week: ${topic.label}`,
    `Tag 5 pages with ${topic.label} this week.`,
    pages.size,
    5,
  )
}
