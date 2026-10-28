/**
 * Trend Hunter missions — pure computation (docs/plans/TREND_HUNTER_SPEC.md).
 *
 * Everything is derived from on-chain positions (no backend state): callers
 * fetch the user's recent positions and hand them here. Days and weeks are
 * UTC, aligned with the chain; the UI shows local time.
 */

/** A position counts from a free Recommend's deposit: 0.01 TRUST lands as
 *  ~0.0097–0.0099 after fees, so the floor sits at 0.009 */
export const MISSION_MIN_DEPOSIT = 9_000_000_000_000_000n

/** Free Recommends a completed mission earns (write-relayer credits) */
export const MISSION_CREDITS = { day: 1, week: 3 } as const

/** "Back a pick": others who recommended the page in the week before you */
export const PICK_BACKERS = 3
const PICK_WINDOW_MS = 7 * 86_400_000

export type MissionId =
  | 'express-3'
  | 'back-a-pick'
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
/** Pages to tag with the topic of the week */
const WEEKLY_TARGET = 5

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

/** Someone holding a position on a claim, opened at `createdAt` (ms) */
export interface ClaimBacker {
  account: string
  createdAt: number
}

export interface DailyMissionsInput {
  positions: readonly MissionPosition[]
  /** Support positions per claim (any order); claims missing count as none */
  backers: ReadonlyMap<string, readonly ClaimBacker[]>
  /** The user's own addresses, lowercased */
  own: ReadonlySet<string>
  now?: number
}

/** The user opened the claim's earliest position */
function isPioneer(
  claimId: string,
  backers: DailyMissionsInput['backers'],
  own: ReadonlySet<string>,
): boolean {
  const list = backers.get(claimId) ?? []
  const first = list.reduce<ClaimBacker | null>(
    (a, b) => (!a || b.createdAt < a.createdAt ? b : a),
    null,
  )
  return !!first && own.has(first.account.toLowerCase())
}

/** ≥ PICK_BACKERS other accounts backed the claim in the week before `at` */
function isPick(
  claimId: string,
  at: number,
  backers: DailyMissionsInput['backers'],
  own: ReadonlySet<string>,
): boolean {
  const others = new Set(
    (backers.get(claimId) ?? [])
      .filter(
        (b) =>
          b.createdAt < at &&
          b.createdAt >= at - PICK_WINDOW_MS &&
          !own.has(b.account.toLowerCase()),
      )
      .map((b) => b.account.toLowerCase()),
  )
  return others.size >= PICK_BACKERS
}

export function computeDailyMissions({
  positions,
  backers,
  own,
  now = Date.now(),
}: DailyMissionsInput): MissionProgress[] {
  const start = startOfUtcDay(now)
  const today = positionsSince(
    positions.filter((p) => p.createdAt < start + DAY_MS),
    start,
  )
  return [
    mission(
      'express-3',
      'day',
      'Express 3 interests',
      'Recommend 3 pages today.',
      today.length,
      3,
    ),
    mission(
      'back-a-pick',
      'day',
      'Back a pick',
      `Recommend a page ${PICK_BACKERS} other people recommended this week.`,
      today.filter((p) => isPick(p.claimTermId, p.createdAt, backers, own))
        .length,
      1,
    ),
    mission(
      'pioneer',
      'day',
      'Pioneer',
      'Be the first to recommend a page.',
      today.filter((p) => isPioneer(p.claimTermId, backers, own)).length,
      1,
    ),
  ]
}

/** Page tagged with a context (topic/category) by the user, at `createdAt` */
export interface TaggedPage {
  pageKey: string
  createdAt: number
  /** The topic the tag belongs to (its own id, or its category's topic) */
  topicId?: string
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
    `Tag ${WEEKLY_TARGET} pages with ${topic.label} this week.`,
    pages.size,
    WEEKLY_TARGET,
  )
}

export interface MonthCreditsInput {
  positions: readonly MissionPosition[]
  backers: DailyMissionsInput['backers']
  own: ReadonlySet<string>
  /** Tags since the first ISO week touching the month, with their topic */
  taggedPages: readonly TaggedPage[]
  /** Topic of the week containing `at` */
  topicAt: (at: number) => WeeklyTopic
  now?: number
}

/**
 * Free Recommends the missions earned this UTC month: MISSION_CREDITS.day per
 * daily mission done on each day so far, MISSION_CREDITS.week per weekly
 * mission completed (5th tag) inside the month.
 */
export function monthMissionCredits({
  positions,
  backers,
  own,
  taggedPages,
  topicAt,
  now = Date.now(),
}: MonthCreditsInput): number {
  const d = new Date(now)
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  let credits = 0
  for (let day = monthStart; day <= now; day += DAY_MS) {
    const done = computeDailyMissions({ positions, backers, own, now: day })
    credits += done.filter((m) => m.done).length * MISSION_CREDITS.day
  }
  for (let week = startOfUtcWeek(monthStart); week <= now; week += 7 * DAY_MS) {
    const topic = topicAt(week)
    const tags = taggedPages
      .filter(
        (t) =>
          t.topicId === topic.id &&
          t.createdAt >= week &&
          t.createdAt < week + 7 * DAY_MS,
      )
      .sort((a, b) => a.createdAt - b.createdAt)
    const pages: TaggedPage[] = []
    for (const t of tags) {
      if (!pages.some((p) => p.pageKey === t.pageKey)) pages.push(t)
    }
    const fifth = pages[WEEKLY_TARGET - 1]
    if (fifth && fifth.createdAt >= monthStart && fifth.createdAt <= now)
      credits += MISSION_CREDITS.week
  }
  return credits
}
