/**
 * Platform Market Service
 * Fetches vault data (market cap, shares, positions, PnL) for platform atoms.
 * Each platform atom on Intuition has a vault that users can deposit into.
 */

import { GRAPHQL_URL } from "@/config"

// ── Types ──

export interface PlatformVaultData {
  termId: string
  label: string
  image?: string
  marketCap: string // raw bigint string
  totalShares: string
  positionCount: number
  sharePrice: string
  // User-specific
  userShares: string
  userDeposited: string
  userPnlPct: number | null
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
          }
        }
      }
    }
  }
`

// ── Fetch ──

export async function fetchPlatformVaultStats(
  termIds: string[],
  walletAddress?: string,
): Promise<PlatformVaultData[]> {
  if (termIds.length === 0) return []

  const address = walletAddress || "0x0000000000000000000000000000000000000000"

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: GET_ATOM_VAULT_STATS,
      variables: { termIds, address },
    }),
  })

  const json = await res.json()
  const atoms = json.data?.atoms || []

  return atoms.map((atom: any) => {
    const vaults = atom.term?.vaults || []

    // Aggregate across all curve vaults
    let totalMarketCap = 0n
    let totalShares = 0n
    let totalPositionCount = 0
    let bestSharePrice = 0n
    let userShares = 0n
    let userDeposited = 0n

    for (const vault of vaults) {
      totalMarketCap += BigInt(vault.market_cap || "0")
      totalShares += BigInt(vault.total_shares || "0")
      totalPositionCount += vault.position_count || 0
      const sp = BigInt(vault.current_share_price || "0")
      if (sp > bestSharePrice) bestSharePrice = sp

      for (const p of vault.positions || []) {
        userShares += BigInt(p.shares || "0")
        userDeposited += BigInt(p.total_deposit_assets_after_total_fees || "0")
      }
    }

    let userPnlPct: number | null = null
    if (userShares > 0n && userDeposited > 0n) {
      const currentValue = (userShares * bestSharePrice) / (10n ** 18n)
      const pnl = Number(currentValue - userDeposited) / Number(userDeposited)
      userPnlPct = Math.round(pnl * 1000) / 10
    }

    return {
      termId: atom.term_id,
      label: atom.label,
      image: atom.image,
      marketCap: String(totalMarketCap),
      totalShares: String(totalShares),
      positionCount: totalPositionCount,
      sharePrice: String(bestSharePrice),
      userShares: String(userShares),
      userDeposited: String(userDeposited),
      userPnlPct,
    }
  })
}
