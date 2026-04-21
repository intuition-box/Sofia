/**
 * usePlatformMarket — React hook for platform atom vault data.
 * Fetches market cap, share price, position count, and user PnL for platform atoms.
 */

import { useQuery } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import {
  fetchPlatformVaultStats,
  type PlatformVaultData,
} from "@/services/platformMarketService"
import { PLATFORM_ATOM_IDS } from "@/config/atomIds"

// All platform term IDs
const ALL_PLATFORM_TERM_IDS = Object.values(PLATFORM_ATOM_IDS)

// Batch into chunks to avoid oversized GraphQL queries
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function fetchAllPlatformMarkets(
  walletAddress?: string,
): Promise<PlatformVaultData[]> {
  const batches = chunk(ALL_PLATFORM_TERM_IDS, 50)
  const results = await Promise.all(
    batches.map((batch) => fetchPlatformVaultStats(batch, walletAddress)),
  )
  return results.flat()
}

export function usePlatformMarket() {
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address

  const { data, isLoading, error } = useQuery<PlatformVaultData[]>({
    queryKey: ["platformMarket", walletAddress],
    queryFn: () => fetchAllPlatformMarkets(walletAddress),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })

  const markets = data || []
  const marketByTermId = new Map(markets.map((m) => [m.termId, m]))

  // Sort by market cap descending
  const ranked = [...markets].sort(
    (a, b) => Number(BigInt(b.marketCap) - BigInt(a.marketCap)),
  )

  return {
    markets,
    ranked,
    getMarket: (termId: string) => marketByTermId.get(termId),
    getMarketBySlug: (slug: string) => {
      const termId = PLATFORM_ATOM_IDS[slug]
      return termId ? marketByTermId.get(termId) : undefined
    },
    isLoading,
    error: error ? String(error) : null,
  }
}

/**
 * useSinglePlatformMarket — fetch vault data for a single platform.
 */
export function useSinglePlatformMarket(platformSlug: string) {
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const termId = PLATFORM_ATOM_IDS[platformSlug]

  const { data, isLoading, error } = useQuery<PlatformVaultData[]>({
    queryKey: ["platformMarket", termId, walletAddress],
    queryFn: () => fetchPlatformVaultStats(termId ? [termId] : [], walletAddress),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!termId,
  })

  return {
    market: data?.[0] || null,
    isLoading,
    error: error ? String(error) : null,
  }
}
