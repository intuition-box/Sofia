// Trend Hunter monthly job (docs/plans/TREND_HUNTER_SPEC.md §4, §6).
//
//   1. walk the latest positions on Sofia page claims (newest first) back to
//      the month start → the claims that received positions this month
//   2. ordered supporters per claim (ClaimSupporters, batches of 50)
//   3. for each of the first 3 accounts of a claim: its followers = accounts
//      that positioned after it, inside the month
//   4. credibility ONCE per unique follower (MCP composite)
//   5. Flair = Σ follower credibility; a claim is "called" when ≥ 5 credible
//      followers; the claim's first staker is the Early Signal spotter
//   6. replace the month's rows (other months are kept — history)
import {
  useGetTrendingPagePositionsQuery,
  type GetTrendingPagePositionsQuery,
} from '@0xsofia/graphql'
import type { ClaimStaker } from '@0xsofia/reputation'
import { prisma } from './db'
import { CERT_PREDICATE_LABELS, ensureGraphqlConfigured } from './graphql'
import { fetchCredibility } from './mcp'
import { fetchClaimSupporters } from './supporters'

const DAY_MS = 86_400_000
/** Accounts that count as "early" on a claim */
const EARLY_RANKS = 3
/** Credible followers needed to "call" a claim */
const CALL_FOLLOWERS = 5
/** The indexer caps a query at 100 rows */
const POSITIONS_PAGE = 100
/** Safety cap on the walk (20 000 positions) */
const MAX_POSITION_PAGES = 200

/** Positive page claims only — distrust is a counter-signal */
const PAGE_PREDICATE_LABELS = CERT_PREDICATE_LABELS.filter(
  (l) => l !== 'distrust',
)

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

/** "YYYY-MM" of a timestamp (UTC) */
export const monthOf = (ts: number = Date.now()): string =>
  new Date(ts).toISOString().slice(0, 7)

function monthBounds(month: string): { start: number; end: number } {
  const [y, m] = month.split('-').map(Number)
  return { start: Date.UTC(y, m - 1, 1), end: Date.UTC(y, m, 1) }
}

interface ClaimPage {
  label: string | null
  url: string | null
}

type PositionRow = GetTrendingPagePositionsQuery['positions'][number]

/** Claims with at least one support position opened inside [start, end) */
async function fetchMonthClaims(
  start: number,
  end: number,
): Promise<Map<string, ClaimPage>> {
  ensureGraphqlConfigured()
  const claims = new Map<string, ClaimPage>()
  for (let page = 0; page < MAX_POSITION_PAGES; page++) {
    const data = await useGetTrendingPagePositionsQuery.fetcher({
      predicateLabels: [...PAGE_PREDICATE_LABELS],
      limit: POSITIONS_PAGE,
      offset: page * POSITIONS_PAGE,
    })()
    const rows: PositionRow[] = data.positions ?? []
    for (const row of rows) {
      const ts = Date.parse(row.created_at)
      const triple = row.term?.triple
      // Counter-term (oppose) rows also resolve term.triple — support only
      if (
        ts < start ||
        ts >= end ||
        !triple ||
        row.term_id !== triple.term_id
      ) {
        continue
      }
      if (!claims.has(triple.term_id)) {
        claims.set(triple.term_id, {
          label: triple.object?.label ?? null,
          url: triple.object?.value?.thing?.url ?? null,
        })
      }
    }
    const oldest = rows[rows.length - 1]
    if (
      rows.length < POSITIONS_PAGE ||
      (oldest && Date.parse(oldest.created_at) < start)
    ) {
      return claims
    }
  }
  console.warn('[trend-hunters] position walk truncated at the safety cap')
  return claims
}

interface Staker {
  account: string
  ts: number
}

/** Support stakers, one entry per account (earliest kept), oldest first */
function orderedStakers(list: readonly ClaimStaker[]): Staker[] {
  const seen = new Set<string>()
  const out: Staker[] = []
  for (const s of [...list].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  )) {
    const account = s.account.toLowerCase()
    if (seen.has(account)) continue
    seen.add(account)
    out.push({ account, ts: Date.parse(s.createdAt) })
  }
  return out
}

interface EarlyClaim {
  claimId: string
  early: Staker[]
  /** Followers of each early account, inside the month */
  followersOf: Map<string, Staker[]>
}

export interface TrendHunterRunStats {
  month: string
  claims: number
  hunters: number
  signals: number
  uniqueCredibilityAddresses: number
  durationMs: number
}

export async function computeTrendHunters(
  month: string = monthOf(),
): Promise<TrendHunterRunStats> {
  const startedAt = performance.now()
  const { start, end } = monthBounds(month)

  // 1 + 2: this month's claims and their ordered supporters
  const claimPages = await fetchMonthClaims(start, end)
  const supporters = await fetchClaimSupporters([...claimPages.keys()])

  // 3: followers of each early account, within the month
  const work: EarlyClaim[] = []
  const followerUnion = new Set<string>()
  for (const [claimId, claim] of supporters) {
    const stakers = orderedStakers(claim.support)
    const early = stakers.slice(0, EARLY_RANKS)
    const followersOf = new Map<string, Staker[]>()
    for (const e of early) {
      const followers = stakers.filter(
        (s) =>
          s.account !== e.account && s.ts > e.ts && s.ts >= start && s.ts < end,
      )
      if (followers.length === 0) continue
      followersOf.set(e.account, followers)
      for (const f of followers) followerUnion.add(f.account)
    }
    if (followersOf.size > 0) work.push({ claimId, early, followersOf })
  }

  // 4: shared credibility table
  const credibility = await fetchCredibility([...followerUnion])
  const credible = (s: Staker) => (credibility.get(s.account) ?? 0) > 0

  // 5: Flair, calls and Early Signals
  const flair = new Map<string, number>()
  const calls = new Map<string, number>()
  const signals: {
    claimId: string
    wallet: string
    leadDays: number
    followers: number
  }[] = []
  for (const { claimId, early, followersOf } of work) {
    for (const [account, followers] of followersOf) {
      const score = followers.reduce(
        (sum, f) => sum + (credibility.get(f.account) ?? 0),
        0,
      )
      if (score > 0) flair.set(account, (flair.get(account) ?? 0) + score)
      const credibleFollowers = followers.filter(credible)
      if (credibleFollowers.length < CALL_FOLLOWERS) continue
      calls.set(account, (calls.get(account) ?? 0) + 1)
      // The spotter is the claim's first staker
      if (account === early[0].account) {
        signals.push({
          claimId,
          wallet: account,
          leadDays: Math.floor(
            (credibleFollowers[CALL_FOLLOWERS - 1].ts - early[0].ts) / DAY_MS,
          ),
          followers: credibleFollowers.length,
        })
      }
    }
  }

  // 6: rank and replace the month's rows
  const computedAt = new Date()
  const hunterRows = [...flair]
    .sort((a, b) => b[1] - a[1])
    .map(([wallet, score], i) => ({
      month,
      wallet,
      flair: score,
      rank: i + 1,
      calls: calls.get(wallet) ?? 0,
      computedAt,
    }))
  const signalRows = signals
    .sort((a, b) => b.followers - a.followers || b.leadDays - a.leadDays)
    .map((s, i) => ({
      month,
      ...s,
      rank: i + 1,
      pageLabel: claimPages.get(s.claimId)?.label ?? null,
      pageUrl: claimPages.get(s.claimId)?.url ?? null,
      computedAt,
    }))

  await prisma.$transaction([
    prisma.trendHunterMonth.deleteMany({ where: { month } }),
    prisma.earlySignal.deleteMany({ where: { month } }),
    ...(hunterRows.length > 0
      ? [prisma.trendHunterMonth.createMany({ data: hunterRows })]
      : []),
    ...(signalRows.length > 0
      ? [prisma.earlySignal.createMany({ data: signalRows })]
      : []),
  ])

  const stats: TrendHunterRunStats = {
    month,
    claims: claimPages.size,
    hunters: hunterRows.length,
    signals: signalRows.length,
    uniqueCredibilityAddresses: followerUnion.size,
    durationMs: Math.round(performance.now() - startedAt),
  }
  console.log('[trend-hunters] compute done', stats)
  return stats
}
