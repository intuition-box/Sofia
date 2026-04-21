import { useQuery } from '@tanstack/react-query'
import { useGetSeasonPoolPositionsQuery } from '@0xsofia/dashboard-graphql'
import { SEASON_POOL_TERM_ID, SEASON_POOL_CURVE_ID } from '@/config'
import { processPositions } from '@/services/seasonPoolService'
import type { PoolPosition, VaultStats } from '@/types'

interface SeasonPoolResult {
  positions: PoolPosition[]
  vaultStats: VaultStats | null
}

async function loadSeasonPool(): Promise<SeasonPoolResult> {
  const result = await useGetSeasonPoolPositionsQuery.fetcher({
    termId: SEASON_POOL_TERM_ID,
    curveId: SEASON_POOL_CURVE_ID,
  })()
  const vault = result?.vaults?.[0]
  if (!vault) return { positions: [], vaultStats: null }
  const processed = processPositions(vault)
  return { positions: processed.positions, vaultStats: processed.vaultStats }
}

export function useSeasonPool(enabled: boolean) {
  const { data, isLoading, error } = useQuery<SeasonPoolResult>({
    queryKey: ['seasonPool', SEASON_POOL_TERM_ID, SEASON_POOL_CURVE_ID],
    queryFn: loadSeasonPool,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    data: data?.positions ?? null,
    vaultStats: data?.vaultStats ?? null,
    loading: isLoading && !data,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
  }
}
