/**
 * Platform Market Service
 * Fetches vault data (total staked, shares, supporters, the user's position
 * value and change) for platform atoms. Each platform atom on Intuition has
 * one vault per bonding curve that users can take a position in.
 */

import { useGetPositionsQuery } from '@0xsofia/graphql'
import { GRAPHQL_URL } from '@/config'

// ── Types ──

export interface PlatformVaultData {
  termId: string
  label: string
  image?: string
  /** Total staked across every curve vault (raw bigint string). */
  marketCap: string
  totalShares: string
  /** Distinct wallets holding shares > 0 on ANY curve vault (a wallet in
   *  position on both curves counts once). */
  supporterCount: number
  /** Highest current share price among the curve vaults — display only.
   *  Never multiply the user's total shares by it: shares are curve-local. */
  sharePrice: string
  // User-specific
  userShares: string
  userDeposited: string
  /** Σ(shares_curveN × sharePrice_curveN), raw bigint string. */
  userValue: string
  /** userValue − userDeposited, raw SIGNED bigint string. */
  userChange: string
  /** userChange / userDeposited in %, one decimal. null without a position. */
  userPnlPct: number | null
}

// On-chain atom images may be `ipfs://CID` URIs the browser can't fetch
// directly — rewrite them to an HTTP gateway so an <img> loads. Shared by the
// platforms list and the right rail so both resolve the same fallback image.
export function resolvePlatformImage(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url
      .slice('ipfs://'.length)
      .replace(/^ipfs\//, '')}`
  }
  return url
}

// ── GraphQL ──

const GET_ATOM_VAULT_STATS = `
  query GetAtomVaultStats($termIds: [String!]!, $address: String) {
    atoms(where: { term_id: { _in: $termIds } }) {
      term_id
      label
      image
      term {
        vaults {
          market_cap
          total_shares
          position_count
          current_share_price
          positions(where: { account_id: { _ilike: $address } }) {
            shares
            total_deposit_assets_after_total_fees
            total_redeem_assets_for_receiver
          }
        }
      }
    }
  }
`

// ── Fetch ──

interface VaultRow {
  market_cap?: string | null
  total_shares?: string | null
  position_count?: number | null
  current_share_price?: string | null
  positions?: {
    shares?: string | null
    total_deposit_assets_after_total_fees?: string | null
    total_redeem_assets_for_receiver?: string | null
  }[]
}

interface AtomRow {
  term_id: string
  label: string
  image?: string
  term?: { vaults?: VaultRow[] } | null
}

const WAD = 10n ** 18n
// Supporter pages — positions with shares > 0 on the batch's platform vaults.
const SUPPORTERS_PAGE = 1000
const SUPPORTERS_MAX_PAGES = 20

/**
 * Distinct supporter wallets per platform term_id, across every curve vault.
 * Returns null on failure so callers can fall back to a per-vault estimate
 * instead of showing 0.
 */
async function fetchDistinctSupporters(
  termIds: string[],
): Promise<Map<string, number> | null> {
  const wallets = new Map<string, Set<string>>()
  try {
    for (let page = 0; page < SUPPORTERS_MAX_PAGES; page++) {
      const data = await useGetPositionsQuery.fetcher({
        where: {
          term_id: { _in: termIds },
          shares: { _gt: '0' },
        },
        limit: SUPPORTERS_PAGE,
        offset: page * SUPPORTERS_PAGE,
      })()
      const rows = data.positions ?? []
      for (const p of rows) {
        const wallet = p.account?.id?.toLowerCase()
        if (!wallet) continue
        let set = wallets.get(p.term_id)
        if (!set) {
          set = new Set()
          wallets.set(p.term_id, set)
        }
        set.add(wallet)
      }
      if (rows.length < SUPPORTERS_PAGE) break
    }
  } catch {
    return null
  }
  const out = new Map<string, number>()
  for (const [termId, set] of wallets) out.set(termId, set.size)
  return out
}

/** Pure aggregation of one platform atom's curve vaults (exported for tests). */
/**
 * Deposits still "in" a position: total deposited minus what was already
 * taken out, floored at 0 so a partial exit doesn't distort the change.
 */
export function netDeposited(p: {
  total_deposit_assets_after_total_fees?: string | null
  total_redeem_assets_for_receiver?: string | null
}): bigint {
  const net =
    BigInt(p.total_deposit_assets_after_total_fees || '0') -
    BigInt(p.total_redeem_assets_for_receiver || '0')
  return net > 0n ? net : 0n
}

export function aggregatePlatformVaults(
  atom: AtomRow,
  supporters: Map<string, number> | null,
): PlatformVaultData {
  const vaults = atom.term?.vaults || []

  let totalMarketCap = 0n
  let totalShares = 0n
  let maxVaultPositions = 0
  let bestSharePrice = 0n
  let userShares = 0n
  let userDeposited = 0n
  let userValue = 0n

  for (const vault of vaults) {
    totalMarketCap += BigInt(vault.market_cap || '0')
    totalShares += BigInt(vault.total_shares || '0')
    maxVaultPositions = Math.max(maxVaultPositions, vault.position_count || 0)
    const sp = BigInt(vault.current_share_price || '0')
    if (sp > bestSharePrice) bestSharePrice = sp

    // Shares are curve-local: value each vault's shares at THAT vault's price.
    for (const p of vault.positions || []) {
      const shares = BigInt(p.shares || '0')
      // A fully exited position keeps its historical deposit — skip it so it
      // doesn't drag the change of the remaining position down.
      if (shares === 0n) continue
      userShares += shares
      userValue += (shares * sp) / WAD
      userDeposited += netDeposited(p)
    }
  }

  const userChange = userValue - userDeposited
  let userPnlPct: number | null = null
  if (userShares > 0n && userDeposited > 0n) {
    const pct = Number(userChange) / Number(userDeposited)
    userPnlPct = Math.round(pct * 1000) / 10
  }

  return {
    termId: atom.term_id,
    label: atom.label,
    image: atom.image,
    marketCap: String(totalMarketCap),
    totalShares: String(totalShares),
    // Fallback when the supporters query failed: the busiest single vault is
    // a lower bound that never double-counts a wallet across curves.
    supporterCount: supporters
      ? (supporters.get(atom.term_id) ?? 0)
      : maxVaultPositions,
    sharePrice: String(bestSharePrice),
    userShares: String(userShares),
    userDeposited: String(userDeposited),
    userValue: String(userShares > 0n ? userValue : 0n),
    userChange: String(userShares > 0n ? userChange : 0n),
    userPnlPct,
  }
}

export async function fetchPlatformVaultStats(
  termIds: string[],
  walletAddress?: string,
): Promise<PlatformVaultData[]> {
  if (termIds.length === 0) return []

  const address = walletAddress || '0x0000000000000000000000000000000000000000'

  const [res, supporters] = await Promise.all([
    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_ATOM_VAULT_STATS,
        variables: { termIds, address },
      }),
    }),
    fetchDistinctSupporters(termIds),
  ])

  const json = await res.json()
  const atoms: AtomRow[] = json.data?.atoms || []

  return atoms.map((atom) => aggregatePlatformVaults(atom, supporters))
}
