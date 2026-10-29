/**
 * discoveriesService — the pages a wallet discovered: it holds the page's
 * Recommend (`I | recommends | page`) and was the FIRST to take a position
 * on it (CREATOR_REWARDS_SPEC §A). The early position is what gains when
 * others follow — this makes it visible.
 *
 * Plain JSON (bigints as strings): the result lives in the persisted React
 * Query cache.
 */
import { PAGE_MARKET_PREDICATE_LABEL } from '@0xsofia/taxonomy'
import { fetchClaimSupporters } from './claimSupportersService'
import type { MarketPosition } from './userPositionsService'

const DAY_MS = 86_400_000

export interface Discovery {
  claimTermId: string
  title: string
  url: string
  domain: string
  /** Distinct wallets that took a position after the discoverer */
  followers: number
  /** Days between the discovery and the next position, null if none yet */
  leadDays: number | null
  discoveredAt: string
  /** Position value and change (wei, change signed) */
  value: string
  change: string
}

export interface DiscoveriesResult {
  discoveries: Discovery[]
  followers: number
  /** Σ change of the discovery positions (wei, signed) */
  change: string
}

export async function fetchDiscoveries(
  wallet: string,
  positions: readonly MarketPosition[],
): Promise<DiscoveriesResult> {
  const me = wallet.toLowerCase()
  const market = positions.filter(
    (p) =>
      p.kind === 'claim' &&
      p.side === 'support' &&
      p.predicateLabel === PAGE_MARKET_PREDICATE_LABEL &&
      !p.subjectLabel && // Sofia's `I`, not another subject
      !!p.claimTermId,
  )
  if (market.length === 0) return { discoveries: [], followers: 0, change: '0' }

  const supporters = await fetchClaimSupporters(
    market.map((p) => p.claimTermId!),
  )

  const discoveries: Discovery[] = []
  for (const p of market) {
    // Distinct stakers, oldest first
    const seen = new Set<string>()
    const order: { account: string; ts: number }[] = []
    for (const s of [...(supporters[p.claimTermId!]?.support ?? [])].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    )) {
      const account = s.account.toLowerCase()
      if (seen.has(account)) continue
      seen.add(account)
      order.push({ account, ts: Date.parse(s.createdAt) })
    }
    if (order[0]?.account !== me) continue
    discoveries.push({
      claimTermId: p.claimTermId!,
      title: p.title,
      url: p.url,
      domain: p.domain,
      followers: order.length - 1,
      leadDays:
        order.length > 1
          ? Math.floor((order[1].ts - order[0].ts) / DAY_MS)
          : null,
      discoveredAt: new Date(order[0].ts).toISOString(),
      value: p.value,
      change: p.change,
    })
  }

  discoveries.sort(
    (a, b) =>
      b.followers - a.followers ||
      (BigInt(b.change) > BigInt(a.change) ? 1 : -1),
  )
  return {
    discoveries,
    followers: discoveries.reduce((n, d) => n + d.followers, 0),
    change: discoveries
      .reduce((sum, d) => sum + BigInt(d.change), 0n)
      .toString(),
  }
}
