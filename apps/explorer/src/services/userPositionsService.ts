/**
 * userPositionsService — every active position of the connected wallet
 * (platform atoms, other atoms, claims on both sides) for `/positions`.
 *
 * Valuation follows `platformMarketService.aggregatePlatformVaults`: shares
 * are curve-local, so each curve leg is valued at THAT vault's share price,
 * and the change is `value − deposited` where deposited is
 * deposits minus redeems (`netDeposited`) of the legs still holding shares.
 *
 * Everything returned is plain JSON (bigints as strings) — the result lives
 * in the persisted React Query cache.
 */
import {
  useGetUserMarketPositionsQuery,
  type GetUserMarketPositionsQuery,
} from '@0xsofia/graphql'
import { SEASON_POOL_TERM_ID } from '@/config'
import { extractDomain } from '@/utils/formatting'
import { netDeposited } from './platformMarketService'

type PositionRow = GetUserMarketPositionsQuery['positions'][number]

export type MarketPositionKind = 'platform' | 'claim' | 'atom'

export interface MarketPosition {
  /** Vault term_id the shares sit on (what an exit redeems). */
  termId: string
  /** Shares per bonding curve (raw strings) — exits without an RPC read */
  legs: { curveId: string; shares: string }[]
  kind: MarketPositionKind
  /** Claims only: support = the claim's vault, oppose = its counter vault. */
  side: 'support' | 'oppose' | null
  /** Claims only: the claim (triple) term_id, whatever the side. */
  claimTermId: string | null
  /** Claims only: the object atom (the page) the claim points to. */
  objectTermId: string | null
  /** Page / platform / atom name. */
  title: string
  /** Claims only: the predicate label (e.g. "visits for learning"). */
  predicateLabel: string | null
  /** Claims only: the subject label when it isn't the generic `I`. */
  subjectLabel: string | null
  url: string
  domain: string
  image: string | null
  shares: string
  /** Raw wei strings. `change` is signed. */
  deposited: string
  value: string
  change: string
  /** change / deposited in %, one decimal. null when nothing was deposited. */
  changePct: number | null
  /** Σ market cap of the vault(s) the user holds shares in (raw wei). */
  totalStaked: string
  /** Wallets in position on the busiest of those vaults. */
  supporters: number
  /** ISO timestamp of the user's first position on this term. */
  openedAt: string
}

export interface PositionsSummary {
  count: number
  totalValue: string
  totalDeposited: string
  totalChange: string
  changePct: number | null
  /** Deposits made into platform atom vaults (raw wei). */
  broughtToPlatforms: string
  platformCount: number
}

const WAD = 10n ** 18n
/** The indexer caps a query at 100 rows. */
const POSITIONS_PAGE = 100
/** Safety cap (2 000 positions). */
const MAX_PAGES = 20

/** One decimal, same rounding as platformMarketService. */
function pct(change: bigint, deposited: bigint): number | null {
  if (deposited <= 0n) return null
  return Math.round((Number(change) / Number(deposited)) * 1000) / 10
}

function atomUrl(
  atom:
    | {
        label?: string | null
        value?: { thing?: { url?: string | null } | null } | null
      }
    | null
    | undefined,
): string {
  const thingUrl = atom?.value?.thing?.url
  if (thingUrl) return thingUrl
  const label = atom?.label ?? ''
  return /^https?:\/\//i.test(label) ? label : ''
}

// ── Pure aggregation (exported for tests) ──

/**
 * Merge the curve legs of each term into one position (rows are one wallet's
 * positions). `platformTermIds` holds the platform atom term_ids (lowercase)
 * from @0xsofia/taxonomy.
 * Sorted by value, largest first.
 */
export function aggregateUserPositions(
  rows: readonly PositionRow[],
  platformTermIds: ReadonlySet<string>,
): MarketPosition[] {
  const byTerm: Record<
    string,
    {
      row: PositionRow
      shares: bigint
      deposited: bigint
      value: bigint
      staked: bigint
      supporters: number
      openedAt: string
      legs: { curveId: string; shares: string }[]
    }
  > = {}
  // One leg per (term, curve) — offset pagination can repeat a row when a
  // position lands between two page fetches.
  const seenLegs: Record<string, true> = {}

  for (const row of rows) {
    const shares = BigInt(row.shares || '0')
    if (shares === 0n) continue
    const leg = `${row.term_id}:${String(row.curve_id)}`
    if (seenLegs[leg]) continue
    seenLegs[leg] = true
    const price = BigInt(row.vault?.current_share_price || '0')
    const entry = (byTerm[row.term_id] ??= {
      row,
      shares: 0n,
      deposited: 0n,
      value: 0n,
      staked: 0n,
      supporters: 0,
      openedAt: row.created_at,
      legs: [],
    })
    entry.legs.push({ curveId: String(row.curve_id), shares: String(shares) })
    entry.shares += shares
    entry.value += (shares * price) / WAD
    entry.deposited += netDeposited(row)
    entry.staked += BigInt(row.vault?.market_cap || '0')
    entry.supporters = Math.max(
      entry.supporters,
      row.vault?.position_count ?? 0,
    )
    if (row.created_at < entry.openedAt) entry.openedAt = row.created_at
  }

  const out: MarketPosition[] = []
  for (const [termId, e] of Object.entries(byTerm)) {
    const term = e.row.term
    const triple = term?.triple
    const change = e.value - e.deposited
    const base = {
      termId,
      legs: e.legs,
      shares: String(e.shares),
      deposited: String(e.deposited),
      value: String(e.value),
      change: String(change),
      changePct: pct(change, e.deposited),
      totalStaked: String(e.staked),
      supporters: e.supporters,
      openedAt: e.openedAt,
    }

    if (triple) {
      const url = atomUrl(triple.object)
      const subject = triple.subject?.label ?? null
      out.push({
        ...base,
        kind: 'claim',
        side: termId === triple.term_id ? 'support' : 'oppose',
        claimTermId: triple.term_id,
        objectTermId: triple.object?.term_id ?? null,
        title:
          triple.object?.value?.thing?.name || triple.object?.label || 'Claim',
        predicateLabel: triple.predicate?.label ?? null,
        subjectLabel: subject && subject !== 'I' ? subject : null,
        url,
        domain: url ? extractDomain(url) : '',
        image: triple.object?.image ?? null,
      })
      continue
    }

    const atom = term?.atom
    const url = atomUrl(atom)
    out.push({
      ...base,
      kind: platformTermIds.has(termId.toLowerCase()) ? 'platform' : 'atom',
      side: null,
      claimTermId: null,
      objectTermId: null,
      // The Beta season ended — deposits no longer flow there, but existing
      // shares stay withdrawable from here (Exit).
      title:
        termId.toLowerCase() === SEASON_POOL_TERM_ID.toLowerCase()
          ? 'Beta Season Pool (ended)'
          : atom?.value?.thing?.name || atom?.label || 'Atom',
      predicateLabel: null,
      subjectLabel: null,
      url,
      domain: url ? extractDomain(url) : '',
      image: atom?.image ?? null,
    })
  }

  return out.sort((a, b) => {
    const d = BigInt(b.value) - BigInt(a.value)
    return d > 0n ? 1 : d < 0n ? -1 : 0
  })
}

export function summarizePositions(
  positions: readonly MarketPosition[],
): PositionsSummary {
  let value = 0n
  let deposited = 0n
  let platforms = 0n
  let platformCount = 0
  for (const p of positions) {
    value += BigInt(p.value)
    deposited += BigInt(p.deposited)
    if (p.kind === 'platform') {
      platforms += BigInt(p.deposited)
      platformCount += 1
    }
  }
  const change = value - deposited
  return {
    count: positions.length,
    totalValue: String(value),
    totalDeposited: String(deposited),
    totalChange: String(change),
    changePct: pct(change, deposited),
    broughtToPlatforms: String(platforms),
    platformCount,
  }
}

// ── Fetch ──

export interface UserPositionsResult {
  positions: MarketPosition[]
  /** True when MAX_PAGES was reached — older positions are left out. */
  truncated: boolean
}

export async function fetchUserPositions(
  addresses: string[],
  platformTermIds: ReadonlySet<string>,
): Promise<UserPositionsResult> {
  if (addresses.length === 0) return { positions: [], truncated: false }
  const rows: PositionRow[] = []
  let truncated = false
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await useGetUserMarketPositionsQuery.fetcher({
      addresses,
      limit: POSITIONS_PAGE,
      offset: page * POSITIONS_PAGE,
    })()
    const batch = data.positions ?? []
    rows.push(...batch)
    if (batch.length < POSITIONS_PAGE) break
    if (page === MAX_PAGES - 1) truncated = true
  }
  return {
    positions: aggregateUserPositions(rows, platformTermIds),
    truncated,
  }
}
