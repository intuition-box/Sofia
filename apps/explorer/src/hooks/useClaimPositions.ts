import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useGetStreakVaultPositionsQuery } from '@0xsofia/dashboard-graphql'
import { useEffect } from 'react'
import { fetchVaultStats } from '@/services/vaultTooltipService'

export interface ClaimPosition {
  accountId: string
  label: string
  shares: string
  curveId: number
}

async function fetchCurvePositions(termId: string, curveId: number, limit: number): Promise<ClaimPosition[]> {
  const data = await useGetStreakVaultPositionsQuery.fetcher({
    termId,
    curveId,
    limit,
  })()

  return (data.positions ?? []).map((p) => ({
    accountId: p.account?.id ?? '',
    label: p.account?.label ?? p.account?.id?.slice(0, 10) ?? '',
    shares: p.shares ?? '0',
    curveId,
  }))
}

export async function fetchPositions(termId: string, limit: number): Promise<ClaimPosition[]> {
  const [linear, exponential] = await Promise.all([
    fetchCurvePositions(termId, 1, limit),
    fetchCurvePositions(termId, 2, limit),
  ])

  return [...linear, ...exponential]
    .sort((a, b) => {
      const sa = BigInt(a.shares || '0')
      const sb = BigInt(b.shares || '0')
      return sb > sa ? 1 : sb < sa ? -1 : 0
    })
    .slice(0, limit)
}

export function useClaimPositions(termId: string | undefined, limit = 100) {
  const { data, isLoading } = useQuery<ClaimPosition[]>({
    queryKey: ['claimPositions', termId, limit],
    queryFn: () => fetchPositions(termId!, limit),
    enabled: !!termId,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { positions: data ?? [], loading: isLoading && !data }
}

/** Prefetch positions + stats for a list of claims so dialogs open instantly */
export function usePrefetchClaimDialogs(
  claims: { termId: string; counterTermId: string }[],
  walletAddress?: string,
) {
  const qc = useQueryClient()

  useEffect(() => {
    if (claims.length === 0) return

    for (const c of claims) {
      // Prefetch support positions
      if (c.termId) {
        qc.prefetchQuery({
          queryKey: ['claimPositions', c.termId, 100],
          queryFn: () => fetchPositions(c.termId, 100),
          staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
        })
        // Prefetch vault stats
        fetchVaultStats(c.termId, walletAddress || '').catch(() => {})
      }
      // Prefetch oppose positions
      if (c.counterTermId) {
        qc.prefetchQuery({
          queryKey: ['claimPositions', c.counterTermId, 100],
          queryFn: () => fetchPositions(c.counterTermId, 100),
          staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
        })
      }
    }
  }, [claims, walletAddress, qc])
}
