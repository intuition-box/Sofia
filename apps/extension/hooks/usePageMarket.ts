/**
 * usePageMarket — the current page's market (Recommend / Oppose stake,
 * momentum, the viewer's rank, position and P&L, tags, legacy positions).
 * Thin facade over PageMarketService; refetches after any transaction.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"

import { pageMarketService, txEventBus } from "~/lib/services"
import type { PageMarket } from "~/lib/services"

export interface UsePageMarketResult {
  market: PageMarket | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePageMarket(
  pageAtomIds: string[],
  wallet: string | null
): UsePageMarketResult {
  const queryClient = useQueryClient()
  const ids = useMemo(() => [...pageAtomIds].sort(), [pageAtomIds])
  const queryKey = useMemo(
    () => ["page-market", ids.join(","), wallet?.toLowerCase() ?? ""],
    [ids, wallet]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => pageMarketService.fetch(ids, wallet),
    enabled: ids.length > 0,
    staleTime: 30_000
  })

  // A publish / exit changes the market: refetch
  useEffect(
    () =>
      txEventBus.on("*", () => {
        void queryClient.invalidateQueries({ queryKey: ["page-market"] })
      }),
    [queryClient]
  )

  return {
    market: data ?? null,
    loading: isLoading && ids.length > 0,
    error: error ? String(error) : null,
    refetch: () => void refetch()
  }
}
