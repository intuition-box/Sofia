/**
 * Pure rules of the relayer: what a request may contain, what it becomes
 * on-chain, and whether quota and budget allow it. No I/O — tested in
 * policy.test.ts.
 */
import {
  CANONICAL_PREDICATE_IDS,
  contextAtomRefForSlug,
  IN_CONTEXT_OF_PREDICATE_ID,
  SOFIA_I_ATOM_ID,
} from '@0xsofia/taxonomy'
import { encodePacked, keccak256, toHex, type Hex } from 'viem'

/** Pages per request (the daily quota caps it anyway) */
export const MAX_PAGES_PER_REQUEST = 5
/** Tags per page — each one is a claim the relayer pays for too */
export const MAX_TAGS_PER_PAGE = 2
/** Budget held per triple until the real cost is known: creation (~0.1) +
 *  Sofia's fixed fee (0.1) + deposit + 5% — rounded up */
export const RESERVE_PER_TRIPLE_WEI = 250_000_000_000_000_000n // 0.25 TRUST

const WEI = 10n ** 18n
const BYTES32 = /^0x[0-9a-fA-F]{64}$/

const TRIPLE_SALT = keccak256(toHex('TRIPLE_SALT'))
const COUNTER_SALT = keccak256(toHex('COUNTER_SALT'))

/** Same id as MultiVault.calculateTripleId, computed locally */
export function calculateTripleId(
  subjectId: string,
  predicateId: string,
  objectId: string,
): Hex {
  return keccak256(
    encodePacked(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [TRIPLE_SALT, subjectId as Hex, predicateId as Hex, objectId as Hex],
    ),
  )
}

/** Same id as MultiVault.getCounterIdFromTripleId: the claim's oppose vault */
export function calculateCounterId(tripleId: string): Hex {
  return keccak256(
    encodePacked(['bytes32', 'bytes32'], [COUNTER_SALT, tripleId as Hex]),
  )
}

/** The page's Recommend claim: I | recommends | page */
export const recommendClaimId = (objectId: string): Hex =>
  calculateTripleId(
    SOFIA_I_ATOM_ID,
    CANONICAL_PREDICATE_IDS.recommends as Hex,
    objectId,
  )

export interface PageRequest {
  objectId: Hex
  tags: string[]
}

/** The request body, validated — or why it's refused */
export function parseRequest(
  body: unknown,
): { pages: PageRequest[] } | { error: string } {
  const raw = (body as { pages?: unknown })?.pages
  if (!Array.isArray(raw) || raw.length === 0) return { error: 'No pages' }
  if (raw.length > MAX_PAGES_PER_REQUEST)
    return { error: `At most ${MAX_PAGES_PER_REQUEST} pages per request` }
  const pages = new Map<string, PageRequest>()
  for (const p of raw) {
    const objectId = (p as { objectId?: unknown })?.objectId
    const tags = (p as { tags?: unknown })?.tags ?? []
    if (typeof objectId !== 'string' || !BYTES32.test(objectId))
      return { error: 'Invalid page id' }
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string'))
      return { error: 'Invalid tags' }
    pages.set(objectId.toLowerCase(), {
      objectId: objectId.toLowerCase() as Hex,
      tags: [...new Set(tags as string[])].slice(0, MAX_TAGS_PER_PAGE),
    })
  }
  return { pages: [...pages.values()] }
}

/** A tag slug → its atom, when it already exists on-chain (v1 mints none) */
export function tagAtomId(slug: string): Hex | null {
  const ref = contextAtomRefForSlug(slug)
  return ref?.kind === 'known' ? (ref.termId as Hex) : null
}

export interface PlannedTriple {
  subjectId: Hex
  predicateId: Hex
  objectId: Hex
  tripleId: Hex
  /** 2: the page market; 1: tags (nested triples) */
  curveId: 1n | 2n
}

/** Opposes: a deposit on each page claim's counter vault (curve 2) */
export function buildOpposePlan(objectIds: readonly string[]): PlannedTriple[] {
  const recommends = CANONICAL_PREDICATE_IDS.recommends as Hex
  return objectIds.map((objectId) => ({
    subjectId: SOFIA_I_ATOM_ID as Hex,
    predicateId: recommends,
    objectId: objectId as Hex,
    tripleId: calculateCounterId(recommendClaimId(objectId)),
    curveId: 2n,
  }))
}

/** Recommend claims first (tags hang off them), then the tags */
export function buildPlan(pages: readonly PageRequest[]): {
  claims: PlannedTriple[]
  tags: PlannedTriple[]
} {
  const claims: PlannedTriple[] = []
  const tags: PlannedTriple[] = []
  const recommends = CANONICAL_PREDICATE_IDS.recommends as Hex
  for (const page of pages) {
    const claimId = recommendClaimId(page.objectId)
    claims.push({
      subjectId: SOFIA_I_ATOM_ID as Hex,
      predicateId: recommends,
      objectId: page.objectId,
      tripleId: claimId,
      curveId: 2n,
    })
    for (const slug of page.tags) {
      const tag = tagAtomId(slug)
      if (!tag) continue
      tags.push({
        subjectId: claimId,
        predicateId: IN_CONTEXT_OF_PREDICATE_ID as Hex,
        objectId: tag,
        tripleId: calculateTripleId(claimId, IN_CONTEXT_OF_PREDICATE_ID, tag),
        curveId: 1n,
      })
    }
  }
  return { claims, tags }
}

export interface Usage {
  month: number
  day: number
  /** Second opinions today (their own cap) */
  opinionsDay?: number
}

export interface Limits {
  quotaMonthly: number
  quotaDaily: number
  budgetMonthlyWei: bigint
  budgetDailyWei: bigint
  /** Second opinions a day, outside the Recommend quota */
  opinionsDaily?: number
}

/** What the relayer spent, this month / today (wei) */
export interface Spent {
  month: bigint
  day: bigint
}

/**
 * Limits once a Trend Hunter's credits are added: earned Recommends raise the
 * month's and the day's quota alike (the relayer-wide budgets stay hard)
 */
export function withCredits(limits: Limits, credits: number): Limits {
  const extra = Math.max(0, Math.floor(credits))
  return {
    ...limits,
    quotaMonthly: limits.quotaMonthly + extra,
    quotaDaily: limits.quotaDaily + extra,
  }
}

/** Recommends this account may still get today */
export function quotaLeft(used: Usage, limits: Limits): number {
  return Math.max(
    0,
    Math.min(limits.quotaMonthly - used.month, limits.quotaDaily - used.day),
  )
}

/** Second opinions this account may still get today */
export const opinionsLeft = (used: Usage, limits: Limits): number =>
  Math.max(0, (limits.opinionsDaily ?? 0) - (used.opinionsDay ?? 0))

/**
 * Second opinions first, within today's allowance; the rest counts against
 * the Recommend quota
 */
export function splitOpinions<T>(
  items: readonly T[],
  isOpinion: (item: T) => boolean,
  left: number,
): { opinions: T[]; quota: T[] } {
  const opinions: T[] = []
  const quota: T[] = []
  for (const item of items) {
    if (isOpinion(item) && opinions.length < left) opinions.push(item)
    else quota.push(item)
  }
  return { opinions, quota }
}

/** Why a request can't be sponsored, or null */
export function refusal(
  recommendCount: number,
  used: Usage,
  limits: Limits,
  spent: Spent,
  reserveWei: bigint,
  opinionCount = 0,
): string | null {
  if (opinionCount > opinionsLeft(used, limits))
    return 'Daily free opinions used — come back tomorrow'
  if (recommendCount > 0 && limits.quotaDaily - used.day < recommendCount)
    return used.day >= limits.quotaDaily
      ? 'Daily free Recommends used — come back tomorrow'
      : `Only ${limits.quotaDaily - used.day} free Recommends left today`
  if (recommendCount > 0 && limits.quotaMonthly - used.month < recommendCount)
    return used.month >= limits.quotaMonthly
      ? 'Monthly free Recommends used'
      : `Only ${limits.quotaMonthly - used.month} free Recommends left this month`
  if (spent.month + reserveWei > limits.budgetMonthlyWei)
    return 'Free Recommends are paused for this month'
  if (spent.day + reserveWei > limits.budgetDailyWei)
    return 'Free Recommends are paused until tomorrow'
  return null
}

export const trustToWei = (trust: number) =>
  (BigInt(Math.round(trust * 1e6)) * WEI) / 1_000_000n

/** Start of the UTC month / day — quota windows */
export function windowStarts(now: Date): { month: Date; day: Date } {
  return {
    month: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    day: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ),
  }
}
