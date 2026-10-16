/**
 * trendingPagesService — pages (URLs) gaining positions recently, for
 * `/trending`.
 *
 * Two steps:
 *   1. Ranking — walk the latest positions on Sofia page claims (newest
 *      first) back to the window cutoff and count, per page (the claim's
 *      object atom), the positions opened in the window and the distinct
 *      wallets behind them. Cheap rows, no page metadata.
 *   2. Details — for one slice of the ranking at a time, fetch every Sofia
 *      claim on those pages: title/URL, total staked, current supporters and
 *      the earliest positions ("first to signal").
 *
 * Everything returned is plain JSON (arrays / records, bigints as strings):
 * the results live in the persisted React Query cache.
 */
import {
  useGetTrendingPagePositionsQuery,
  useGetTrendingPageDetailsQuery,
  type GetTrendingPagePositionsQuery,
  type GetTrendingPageDetailsQuery,
} from '@0xsofia/graphql'
import { SOFIA_PREDICATE_LABELS } from './sofiaFeedService'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'

// ── Config ──

export type TrendingWindow = '24h' | '7d' | '30d'

export const TRENDING_WINDOWS: { key: TrendingWindow; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
]

const HOUR = 60 * 60 * 1000
export const WINDOW_MS: Record<TrendingWindow, number> = {
  '24h': 24 * HOUR,
  '7d': 7 * 24 * HOUR,
  '30d': 30 * 24 * HOUR,
}

/** Positive page claims only — `distrust` is a counter-signal, not a page
 *  gaining support. */
export const TRENDING_PREDICATE_LABELS: string[] =
  SOFIA_PREDICATE_LABELS.filter((l) => l !== 'distrust')

/** The indexer caps a query at 100 rows. */
const POSITIONS_PAGE = 100
/** Safety cap on the ranking walk (2 000 positions). */
const MAX_POSITION_PAGES = 20
/** How many earliest supporters a card shows. */
const FIRST_SUPPORTERS = 3

// ── Types ──

export interface TrendingPageRank {
  /** Page atom term_id (the claims' object). */
  objectId: string
  /** Positions opened on the page's claims inside the window. */
  windowPositions: number
  /** Distinct wallets behind those positions. */
  windowSupporters: number
  /** ISO timestamp of the latest position in the window. */
  lastPositionAt: string
}

export interface TrendingRanking {
  ranks: TrendingPageRank[]
  /** True when the walk hit MAX_POSITION_PAGES before the cutoff — the
   *  oldest part of the window is not counted. */
  truncated: boolean
}

export interface FirstSupporter {
  address: string
  label: string
  image: string | null
  createdAt: string
}

export interface TrendingPageClaim {
  termId: string
  counterTermId: string
  predicateLabel: string
}

export interface TrendingPage extends TrendingPageRank {
  /** Same as objectId — the dedupe key of the paginated feed. */
  id: string
  title: string
  url: string
  domain: string
  favicon: string
  /** Σ market cap over every curve vault of the page's claims (raw wei). */
  totalStaked: string
  /** Distinct wallets in position (shares > 0) on any of the claims. */
  supporters: number
  claimCount: number
  /** Earliest positions across the page's claims, oldest first. */
  firstSupporters: FirstSupporter[]
  /** The claim a "Take position" targets: most supporters, then most staked. */
  mainClaim: TrendingPageClaim | null
}

type PositionRow = GetTrendingPagePositionsQuery['positions'][number]
type ClaimRow = GetTrendingPageDetailsQuery['triples'][number]

// ── Pure aggregation (exported for tests) ──

/**
 * Rank pages by the support positions opened since `sinceMs`. Oppose rows
 * (the position sits on the counter term) and rows older than the cutoff are
 * ignored. Ties break on distinct wallets, then recency.
 */
export function rankTrendingPages(
  rows: readonly PositionRow[],
  sinceMs: number,
): TrendingPageRank[] {
  const byPage: Record<
    string,
    { positions: number; wallets: Record<string, true>; last: string }
  > = {}
  for (const row of rows) {
    const triple = row.term?.triple
    if (!triple?.object_id || !row.created_at) continue
    if (row.term_id !== triple.term_id) continue
    if (new Date(row.created_at).getTime() < sinceMs) continue
    const entry = (byPage[triple.object_id] ??= {
      positions: 0,
      wallets: {},
      last: row.created_at,
    })
    entry.positions += 1
    if (row.account_id) entry.wallets[row.account_id.toLowerCase()] = true
    if (row.created_at > entry.last) entry.last = row.created_at
  }
  return Object.entries(byPage)
    .map(([objectId, e]) => ({
      objectId,
      windowPositions: e.positions,
      windowSupporters: Object.keys(e.wallets).length,
      lastPositionAt: e.last,
    }))
    .sort(
      (a, b) =>
        b.windowPositions - a.windowPositions ||
        b.windowSupporters - a.windowSupporters ||
        b.lastPositionAt.localeCompare(a.lastPositionAt),
    )
}

/** URL of a page atom: `value.thing.url` (new atoms) or the label itself
 *  (old atoms stored the URL there). Empty when the atom isn't a page. */
function pageUrl(object: ClaimRow['object']): string {
  const thingUrl = object?.value?.thing?.url
  if (thingUrl) return thingUrl
  const label = object?.label ?? ''
  return /^https?:\/\//i.test(label) ? label : ''
}

/**
 * Merge the claims of each ranked page into one card. Keeps the ranking
 * order and drops pages without a URL (e.g. `trusts` claims on accounts).
 */
export function buildTrendingPages(
  ranks: readonly TrendingPageRank[],
  claims: readonly ClaimRow[],
): TrendingPage[] {
  const claimsByPage: Record<string, ClaimRow[]> = {}
  for (const c of claims) (claimsByPage[c.object_id] ??= []).push(c)

  const out: TrendingPage[] = []
  for (const rank of ranks) {
    const pageClaims = claimsByPage[rank.objectId]
    if (!pageClaims || pageClaims.length === 0) continue
    const object = pageClaims[0].object
    const url = pageUrl(object)
    if (!url) continue
    const domain = extractDomain(url)

    let totalStaked = 0n
    const wallets: Record<string, true> = {}
    const earliest: Record<string, FirstSupporter> = {}
    let main: {
      claim: TrendingPageClaim
      supporters: number
      staked: bigint
    } | null = null

    for (const c of pageClaims) {
      let claimStaked = 0n
      for (const v of c.term?.vaults ?? []) {
        claimStaked += BigInt(v.market_cap || '0')
      }
      totalStaked += claimStaked
      const claimWallets: Record<string, true> = {}
      for (const p of c.supporters) {
        const w = p.account_id.toLowerCase()
        wallets[w] = true
        claimWallets[w] = true
      }
      for (const p of c.firstPositions) {
        const w = p.account_id.toLowerCase()
        const prev = earliest[w]
        if (prev && prev.createdAt <= p.created_at) continue
        earliest[w] = {
          address: p.account?.id ?? p.account_id,
          label: p.account?.label ?? p.account_id,
          image: p.account?.image ?? null,
          createdAt: p.created_at,
        }
      }
      const claimSupporters = Object.keys(claimWallets).length
      if (
        !main ||
        claimSupporters > main.supporters ||
        (claimSupporters === main.supporters && claimStaked > main.staked)
      ) {
        main = {
          claim: {
            termId: c.term_id,
            counterTermId: c.counter_term_id,
            predicateLabel: c.predicate?.label ?? '',
          },
          supporters: claimSupporters,
          staked: claimStaked,
        }
      }
    }

    out.push({
      ...rank,
      id: rank.objectId,
      title: object?.value?.thing?.name || object?.label || domain,
      url,
      domain,
      favicon: getFaviconUrl(domain),
      totalStaked: String(totalStaked),
      supporters: Object.keys(wallets).length,
      claimCount: pageClaims.length,
      firstSupporters: Object.values(earliest)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, FIRST_SUPPORTERS),
      mainClaim: main?.claim ?? null,
    })
  }
  return out
}

// ── Fetch ──

/** Walk the latest page-claim positions back to the window cutoff. */
export async function fetchTrendingRanking(
  timeWindow: TrendingWindow,
  now: number = Date.now(),
): Promise<TrendingRanking> {
  const sinceMs = now - WINDOW_MS[timeWindow]
  const rows: PositionRow[] = []
  let truncated = false
  for (let page = 0; page < MAX_POSITION_PAGES; page++) {
    const data = await useGetTrendingPagePositionsQuery.fetcher({
      predicateLabels: TRENDING_PREDICATE_LABELS,
      limit: POSITIONS_PAGE,
      offset: page * POSITIONS_PAGE,
    })()
    const batch = data.positions ?? []
    rows.push(...batch)
    const oldest = batch[batch.length - 1]?.created_at
    if (batch.length < POSITIONS_PAGE) break
    if (oldest && new Date(oldest).getTime() < sinceMs) break
    if (page === MAX_POSITION_PAGES - 1) truncated = true
  }
  return { ranks: rankTrendingPages(rows, sinceMs), truncated }
}

/** Page cards for one slice of the ranking. */
export async function fetchTrendingPageDetails(
  ranks: readonly TrendingPageRank[],
): Promise<TrendingPage[]> {
  if (ranks.length === 0) return []
  const data = await useGetTrendingPageDetailsQuery.fetcher({
    objectIds: ranks.map((r) => r.objectId),
    predicateLabels: TRENDING_PREDICATE_LABELS,
  })()
  return buildTrendingPages(ranks, data.triples ?? [])
}
