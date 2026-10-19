/**
 * portfolioHistoryService — a wallet's position value over time, for the
 * chart on `/positions`.
 *
 * Rebuilt from the indexer, no snapshot of ours:
 *   1. the wallet's daily position changes (shares + TRUST in/out per vault)
 *      → cumulative shares per vault and net TRUST put in, day by day;
 *   2. each of those vaults' daily share price (carried forward between
 *      changes) → value(day) = Σ shares × price.
 *
 * The indexer keeps share prices from 2026-02-16 on, so the series starts
 * there at the earliest (positions opened before are replayed, just not
 * plotted). Points are plain numbers in TRUST: the result lives in the
 * persisted React Query cache.
 */
import {
  useGetUserPositionHistoryQuery,
  useGetVaultPriceHistoryQuery,
  type GetUserPositionHistoryQuery,
  type GetVaultPriceHistoryQuery,
} from '@0xsofia/graphql'

type ChangeRow = GetUserPositionHistoryQuery['position_change_daily'][number]
type PriceRow =
  GetVaultPriceHistoryQuery['share_price_change_stats_daily'][number]

export interface PortfolioPoint {
  /** Day (UTC midnight, ms) */
  t: number
  /** Value of the positions held that day (TRUST) */
  value: number
  /** Net TRUST put in so far: deposits − exits (TRUST) */
  invested: number
}

const DAY_MS = 86_400_000
const WAD = 10n ** 18n
/** First day the indexer has share prices for */
export const PRICE_HISTORY_START = Date.UTC(2026, 1, 16)
const HISTORY_PAGE = 500
const MAX_HISTORY_PAGES = 40
const PRICE_PAGE = 1000
const MAX_PRICE_PAGES = 30
const TERMS_PER_PRICE_QUERY = 200

const vaultKey = (termId: string, curveId: unknown) => `${termId}:${curveId}`
const toTrust = (wei: bigint) => Number(wei) / 1e18

async function fetchChanges(addresses: string[]): Promise<ChangeRow[]> {
  const rows: ChangeRow[] = []
  for (let page = 0; page < MAX_HISTORY_PAGES; page++) {
    const data = await useGetUserPositionHistoryQuery.fetcher({
      addresses,
      limit: HISTORY_PAGE,
      offset: page * HISTORY_PAGE,
    })()
    const batch = data.position_change_daily ?? []
    rows.push(...batch)
    if (batch.length < HISTORY_PAGE) break
  }
  return rows
}

async function fetchPricesFor(termIds: string[]): Promise<PriceRow[]> {
  const rows: PriceRow[] = []
  for (let page = 0; page < MAX_PRICE_PAGES; page++) {
    const data = await useGetVaultPriceHistoryQuery.fetcher({
      termIds,
      limit: PRICE_PAGE,
      offset: page * PRICE_PAGE,
    })()
    const batch = data.share_price_change_stats_daily ?? []
    rows.push(...batch)
    if (batch.length < PRICE_PAGE) break
  }
  return rows
}

/** vault → [day, closing price] ascending, plus its opening price */
async function fetchPrices(termIds: string[]) {
  const chunks: string[][] = []
  for (let i = 0; i < termIds.length; i += TERMS_PER_PRICE_QUERY) {
    chunks.push(termIds.slice(i, i + TERMS_PER_PRICE_QUERY))
  }
  const rows = (await Promise.all(chunks.map(fetchPricesFor))).flat()
  const series = new Map<string, { t: number; price: bigint }[]>()
  const opening = new Map<string, bigint>()
  for (const r of rows) {
    if (!r.term_id || !r.bucket) continue
    const key = vaultKey(r.term_id, r.curve_id)
    const list = series.get(key) ?? []
    list.push({ t: Date.parse(r.bucket), price: BigInt(r.last_share_price) })
    series.set(key, list)
    if (!opening.has(key)) opening.set(key, BigInt(r.first_share_price))
  }
  for (const list of series.values()) list.sort((a, b) => a.t - b.t)
  return { series, opening }
}

export async function fetchPortfolioHistory(
  addresses: string[],
  now: number = Date.now(),
): Promise<PortfolioPoint[]> {
  if (addresses.length === 0) return []
  const changes = await fetchChanges(addresses)
  if (changes.length === 0) return []

  const termIds = [
    ...new Set(
      changes.map((c) => c.term_id).filter((id): id is string => !!id),
    ),
  ]
  const { series, opening } = await fetchPrices(termIds)

  // Position changes grouped by day
  const byDay = new Map<number, ChangeRow[]>()
  for (const c of changes) {
    if (!c.bucket) continue
    const t = Date.parse(c.bucket)
    const list = byDay.get(t) ?? []
    list.push(c)
    byDay.set(t, list)
  }
  const firstDay = Math.min(...byDay.keys())
  const lastDay = Math.floor(now / DAY_MS) * DAY_MS
  const plotFrom = Math.max(firstDay, PRICE_HISTORY_START)

  const shares = new Map<string, bigint>()
  const price = new Map<string, bigint>()
  const cursor = new Map<string, number>()
  let invested = 0n
  const points: PortfolioPoint[] = []

  for (let t = firstDay; t <= lastDay; t += DAY_MS) {
    for (const c of byDay.get(t) ?? []) {
      const key = vaultKey(c.term_id ?? '', c.curve_id)
      shares.set(key, (shares.get(key) ?? 0n) + BigInt(c.shares_delta_period))
      invested += BigInt(c.assets_in_period) - BigInt(c.assets_out_period)
    }
    if (t < plotFrom) continue

    let value = 0n
    for (const [key, held] of shares) {
      if (held <= 0n) continue
      const list = series.get(key) ?? []
      let i = cursor.get(key) ?? 0
      while (i < list.length && list[i].t <= t) {
        price.set(key, list[i].price)
        i++
      }
      cursor.set(key, i)
      // Before the vault's first price change: its opening price that day
      const p = price.get(key) ?? opening.get(key) ?? WAD
      value += (held * p) / WAD
    }
    points.push({ t, value: toTrust(value), invested: toTrust(invested) })
  }
  return points
}

export type PortfolioRange = '1W' | '1M' | '3M' | '1Y' | 'MAX'

export const PORTFOLIO_RANGES: { key: PortfolioRange; days: number | null }[] =
  [
    { key: '1W', days: 7 },
    { key: '1M', days: 30 },
    { key: '3M', days: 90 },
    { key: '1Y', days: 365 },
    { key: 'MAX', days: null },
  ]

export function sliceRange(
  points: PortfolioPoint[],
  range: PortfolioRange,
): PortfolioPoint[] {
  const days = PORTFOLIO_RANGES.find((r) => r.key === range)?.days
  if (!days || points.length === 0) return points
  const from = points[points.length - 1].t - days * DAY_MS
  return points.filter((p) => p.t >= from)
}

/**
 * Performance between the first and last point, deposits and exits left
 * out: Δvalue − Δinvested. The % is over what was at stake (start value +
 * new money put in during the period).
 */
export function performance(points: PortfolioPoint[]): {
  change: number
  pct: number | null
} {
  if (points.length < 2) return { change: 0, pct: null }
  const a = points[0]
  const b = points[points.length - 1]
  const flow = b.invested - a.invested
  const change = b.value - a.value - flow
  const base = a.value + Math.max(0, flow)
  return { change, pct: base > 0 ? (change / base) * 100 : null }
}
