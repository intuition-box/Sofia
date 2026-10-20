/**
 * trendingPagesService — pages (URLs) gaining positions recently, for
 * `/trending`. Reads the whole Intuition graph, not only Sofia's claims.
 *
 * Two steps:
 *   1. Ranking — walk the latest positions (newest first) back to the window
 *      cutoff, in two disjoint walks run in parallel:
 *        - Sofia page claims (Sofia predicate labels, unchanged);
 *        - claims from any app with a canonical support predicate
 *          (recommends, uses, likes, supports, follow) on a web atom.
 *      Each position's object atom is resolved to a web key (normalized URL
 *      or platform, see utils/webAtom) and counted per key: positions opened
 *      in the window and the distinct wallets behind them. The same page
 *      stored as several atoms (by Sofia and by other apps) is one key.
 *   2. Details — for one slice of the ranking at a time, fetch every page
 *      claim on every atom of those keys (ranked atoms + atoms storing the
 *      same URL / platform label): title/URL, total staked, current
 *      supporters, the earliest positions ("first to signal") and where each
 *      claim comes from (Sofia or the Intuition ecosystem).
 *
 * "Take position" targets the existing claim with the most supporters — a
 * deposit on an existing term, never a new triple.
 *
 * Everything returned is plain JSON (arrays / records, bigints as strings):
 * the results live in the persisted React Query cache.
 */
import {
  useGetTrendingPagePositionsQuery,
  useGetEcosystemPagePositionsQuery,
  useGetTrendingPageDetailsQuery,
  type GetTrendingPagePositionsQuery,
  type GetTrendingPageDetailsQuery,
} from '@0xsofia/graphql'
import { PAGE_MARKET_PREDICATE_LABEL } from '@0xsofia/taxonomy'
import {
  CANONICAL_PREDICATE_IDS,
  CANONICAL_SUPPORT_PREDICATE_LABELS,
  SOFIA_I_ATOM_ID,
} from '@/config/atomIds'
import { SOFIA_PREDICATE_LABELS } from './sofiaFeedService'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import {
  ALL_PLATFORM_LABEL_VARIANTS,
  platformLabelVariants,
  platformRefByKey,
  resolveWebKey,
  urlVariants,
  webAtomUrl,
  webKeyUrl,
} from '@/utils/webAtom'

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

/** Positive Sofia page claims only — `distrust` is a counter-signal, not a
 *  page gaining support. */
export const TRENDING_PREDICATE_LABELS: string[] =
  SOFIA_PREDICATE_LABELS.filter((l) => l !== 'distrust')

/** Every canonical support predicate id (details lookup). */
export const CANONICAL_SUPPORT_PREDICATE_IDS: string[] =
  CANONICAL_SUPPORT_PREDICATE_LABELS.map((l) => CANONICAL_PREDICATE_IDS[l])

/** Canonical support predicates the Sofia walk doesn't already cover by
 *  label (`trusts` is shared) — keeps the two ranking walks disjoint. */
export const ECOSYSTEM_PREDICATE_IDS: string[] =
  CANONICAL_SUPPORT_PREDICATE_LABELS.filter(
    (l) => !TRENDING_PREDICATE_LABELS.includes(l),
  ).map((l) => CANONICAL_PREDICATE_IDS[l])

/** The indexer caps a query at 100 rows. */
const POSITIONS_PAGE = 100
/** Safety cap on each ranking walk (2 000 positions). */
const MAX_POSITION_PAGES = 20
/** Safety cap on the details pages of one slice (1 000 claims). */
const MAX_DETAIL_PAGES = 10
/** How many earliest supporters a card shows. */
const FIRST_SUPPORTERS = 3

// ── Types ──

export interface TrendingPageRank {
  /** Web key of the page (normalized URL or `platform:<slug>`). */
  key: string
  /** Object atoms seen in the window for this key. */
  objectIds: string[]
  /** Positions opened on the page's claims inside the window. */
  windowPositions: number
  /** Distinct wallets behind those positions. */
  windowSupporters: number
  /** ISO timestamp of the latest position in the window. */
  lastPositionAt: string
}

export interface TrendingRanking {
  ranks: TrendingPageRank[]
  /** True when a walk hit MAX_POSITION_PAGES before the cutoff — the
   *  oldest part of the window is not counted. */
  truncated: boolean
}

export interface FirstSupporter {
  address: string
  label: string
  image: string | null
  createdAt: string
}

/** Where a claim comes from: written by Sofia, or by another Intuition app. */
export type ClaimSource = 'sofia' | 'ecosystem'

export interface TrendingPageClaim {
  termId: string
  counterTermId: string
  predicateLabel: string
}

/** One claim behind a page card. */
export interface TrendingClaimSummary extends TrendingPageClaim {
  subjectLabel: string
  source: ClaimSource
  /** Distinct wallets in position on this claim. */
  supporters: number
  /** Σ market cap over the claim's curve vaults (raw wei). */
  staked: string
}

export interface TrendingPage extends TrendingPageRank {
  /** Same as key — the dedupe key of the paginated feed. */
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
  /** Distinct atoms the claims point to (same page, several atoms). */
  atomCount: number
  /** Earliest positions across the page's claims, oldest first. */
  firstSupporters: FirstSupporter[]
  /** The busiest claim: most supporters, then most staked. */
  mainClaim: TrendingPageClaim | null
  /** The page market a "Take position" targets: Sofia's `I | recommends |
   *  page` claim when it exists, else the atom to create it on. */
  market: { claim: TrendingPageClaim | null; objectId: string }
  /** Sources present among the claims, Sofia first. */
  sources: ClaimSource[]
  /** Every claim behind the card, most supporters first. */
  claims: TrendingClaimSummary[]
}

/** Position row of either ranking walk (both queries share this shape). */
type PositionRow = GetTrendingPagePositionsQuery['positions'][number]
type ClaimRow = GetTrendingPageDetailsQuery['triples'][number]

// ── Pure aggregation (exported for tests) ──

/**
 * Rank pages by the support positions opened since `sinceMs`, grouping
 * object atoms by web key. Oppose rows (the position sits on the counter
 * term), rows older than the cutoff and objects that aren't web atoms are
 * ignored. Ties break on distinct wallets, then recency.
 */
export function rankTrendingPages(
  rows: readonly PositionRow[],
  sinceMs: number,
): TrendingPageRank[] {
  const byKey: Record<
    string,
    {
      positions: number
      wallets: Record<string, true>
      objects: Record<string, true>
      last: string
    }
  > = {}
  for (const row of rows) {
    const triple = row.term?.triple
    if (!triple?.object_id || !row.created_at) continue
    if (row.term_id !== triple.term_id) continue
    if (new Date(row.created_at).getTime() < sinceMs) continue
    const key = resolveWebKey(triple.object)
    if (!key) continue
    const entry = (byKey[key] ??= {
      positions: 0,
      wallets: {},
      objects: {},
      last: row.created_at,
    })
    entry.positions += 1
    entry.objects[triple.object_id] = true
    if (row.account_id) entry.wallets[row.account_id.toLowerCase()] = true
    if (row.created_at > entry.last) entry.last = row.created_at
  }
  return Object.entries(byKey)
    .map(([key, e]) => ({
      key,
      objectIds: Object.keys(e.objects),
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

/** Predicates other apps write too: Sofia's only from Sofia's `I` */
const SHARED_PREDICATE_LABELS = ['trusts', 'recommends']

/** Sofia claim: a Sofia page predicate, and `trusts` / `recommends` (the page
 *  market) only from Sofia's `I` — other apps write them too. */
export function claimSource(
  claim: Pick<ClaimRow, 'subject_id'> & {
    predicate?: { label?: string | null } | null
  },
): ClaimSource {
  const label = claim.predicate?.label ?? ''
  if (!TRENDING_PREDICATE_LABELS.includes(label)) return 'ecosystem'
  if (
    SHARED_PREDICATE_LABELS.includes(label) &&
    claim.subject_id !== SOFIA_I_ATOM_ID
  ) {
    return 'ecosystem'
  }
  return 'sofia'
}

function claimStaked(c: ClaimRow): bigint {
  let staked = 0n
  for (const v of c.term?.vaults ?? []) staked += BigInt(v.market_cap || '0')
  return staked
}

/**
 * Merge every claim of each ranked page (across atoms and apps) into one
 * card: supporters are distinct wallets, total staked is summed, first to
 * signal is the earliest across all claims. Keeps the ranking order and drops
 * pages with no claim. Claims whose object resolves to another key are
 * ignored.
 */
export function buildTrendingPages(
  ranks: readonly TrendingPageRank[],
  claims: readonly ClaimRow[],
): TrendingPage[] {
  const claimsByKey: Record<string, ClaimRow[]> = {}
  const seenClaim: Record<string, true> = {}
  for (const c of claims) {
    if (seenClaim[c.term_id]) continue
    seenClaim[c.term_id] = true
    const key = resolveWebKey(c.object)
    if (key) (claimsByKey[key] ??= []).push(c)
  }

  const out: TrendingPage[] = []
  for (const rank of ranks) {
    const pageClaims = claimsByKey[rank.key]
    if (!pageClaims || pageClaims.length === 0) continue

    let totalStaked = 0n
    const wallets: Record<string, true> = {}
    const atoms: Record<string, true> = {}
    const earliest: Record<string, FirstSupporter> = {}
    const summaries: { claim: TrendingClaimSummary; staked: bigint }[] = []

    for (const c of pageClaims) {
      const staked = claimStaked(c)
      totalStaked += staked
      atoms[c.object_id] = true
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
      summaries.push({
        claim: {
          termId: c.term_id,
          counterTermId: c.counter_term_id,
          predicateLabel: c.predicate?.label ?? '',
          subjectLabel: c.subject?.label ?? '',
          source: claimSource(c),
          supporters: Object.keys(claimWallets).length,
          staked: String(staked),
        },
        staked,
      })
    }

    // Most supporters, then most staked; stable otherwise (first claim wins).
    const claimList: TrendingClaimSummary[] = summaries
      .map((s, i) => ({ ...s, i }))
      .sort(
        (a, b) =>
          b.claim.supporters - a.claim.supporters ||
          (b.staked > a.staked ? 1 : b.staked < a.staked ? -1 : a.i - b.i),
      )
      .map((s) => s.claim)
    const main = claimList[0]
    const marketClaim = claimList.find(
      (c) =>
        c.predicateLabel === PAGE_MARKET_PREDICATE_LABEL &&
        c.source === 'sofia',
    )
    const mainObject =
      pageClaims.find((c) => c.term_id === main.termId)?.object ??
      pageClaims[0].object

    const platform = platformRefByKey(rank.key)
    const url = webAtomUrl(mainObject) || webKeyUrl(rank.key)
    const domain = url ? extractDomain(url) : (platform?.name ?? rank.key)
    const sources: ClaimSource[] = (['sofia', 'ecosystem'] as const).filter(
      (src) => claimList.some((c) => c.source === src),
    )

    out.push({
      ...rank,
      id: rank.key,
      title:
        mainObject?.value?.thing?.name ||
        mainObject?.label ||
        platform?.name ||
        domain,
      url,
      domain,
      favicon: getFaviconUrl(domain),
      totalStaked: String(totalStaked),
      supporters: Object.keys(wallets).length,
      claimCount: pageClaims.length,
      atomCount: Object.keys(atoms).length,
      firstSupporters: Object.values(earliest)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, FIRST_SUPPORTERS),
      mainClaim: {
        termId: main.termId,
        counterTermId: main.counterTermId,
        predicateLabel: main.predicateLabel,
      },
      market: {
        claim: marketClaim
          ? {
              termId: marketClaim.termId,
              counterTermId: marketClaim.counterTermId,
              predicateLabel: marketClaim.predicateLabel,
            }
          : null,
        objectId: mainObject.term_id,
      },
      sources,
      claims: claimList,
    })
  }
  return out
}

/** Indexer lookups for one slice: ranked atoms + exact URL / label variants
 *  of each key (old atoms store the URL in the label). */
export function detailLookups(ranks: readonly TrendingPageRank[]): {
  objectIds: string[]
  objectUrls: string[]
  objectLabels: string[]
} {
  const ids = new Set<string>()
  const urls = new Set<string>()
  const labels = new Set<string>()
  for (const r of ranks) {
    for (const id of r.objectIds) ids.add(id)
    const platform = platformRefByKey(r.key)
    const keyUrls = urlVariants(r.key)
    for (const u of keyUrls) {
      urls.add(u)
      labels.add(u)
    }
    if (platform) for (const l of platformLabelVariants(platform)) labels.add(l)
  }
  return {
    objectIds: [...ids],
    objectUrls: [...urls],
    objectLabels: [...labels],
  }
}

// ── Fetch ──

/** Walk one positions query back to the window cutoff. */
async function walkPositions(
  fetchPage: (offset: number) => Promise<PositionRow[]>,
  sinceMs: number,
): Promise<{ rows: PositionRow[]; truncated: boolean }> {
  const rows: PositionRow[] = []
  let truncated = false
  for (let page = 0; page < MAX_POSITION_PAGES; page++) {
    const batch = await fetchPage(page * POSITIONS_PAGE)
    rows.push(...batch)
    const oldest = batch[batch.length - 1]?.created_at
    if (batch.length < POSITIONS_PAGE) break
    if (oldest && new Date(oldest).getTime() < sinceMs) break
    if (page === MAX_POSITION_PAGES - 1) truncated = true
  }
  return { rows, truncated }
}

/** Walk the latest Sofia + ecosystem page-claim positions back to the window
 *  cutoff and rank the pages. */
export async function fetchTrendingRanking(
  timeWindow: TrendingWindow,
  now: number = Date.now(),
): Promise<TrendingRanking> {
  const sinceMs = now - WINDOW_MS[timeWindow]
  const objectLabels = [...ALL_PLATFORM_LABEL_VARIANTS]
  const [sofia, ecosystem] = await Promise.all([
    walkPositions(
      async (offset) =>
        (
          await useGetTrendingPagePositionsQuery.fetcher({
            predicateLabels: TRENDING_PREDICATE_LABELS,
            limit: POSITIONS_PAGE,
            offset,
          })()
        ).positions ?? [],
      sinceMs,
    ),
    walkPositions(
      async (offset) =>
        (
          await useGetEcosystemPagePositionsQuery.fetcher({
            predicateIds: ECOSYSTEM_PREDICATE_IDS,
            objectLabels,
            limit: POSITIONS_PAGE,
            offset,
          })()
        ).positions ?? [],
      sinceMs,
    ),
  ])
  return {
    ranks: rankTrendingPages([...sofia.rows, ...ecosystem.rows], sinceMs),
    truncated: sofia.truncated || ecosystem.truncated,
  }
}

/** Page cards for one slice of the ranking. */
export async function fetchTrendingPageDetails(
  ranks: readonly TrendingPageRank[],
): Promise<TrendingPage[]> {
  if (ranks.length === 0) return []
  const lookups = detailLookups(ranks)
  const claims: ClaimRow[] = []
  for (let page = 0; page < MAX_DETAIL_PAGES; page++) {
    const data = await useGetTrendingPageDetailsQuery.fetcher({
      ...lookups,
      predicateLabels: TRENDING_PREDICATE_LABELS,
      predicateIds: CANONICAL_SUPPORT_PREDICATE_IDS,
      limit: POSITIONS_PAGE,
      offset: page * POSITIONS_PAGE,
    })()
    const batch = data.triples ?? []
    claims.push(...batch)
    if (batch.length < POSITIONS_PAGE) break
  }
  return buildTrendingPages(ranks, claims)
}
