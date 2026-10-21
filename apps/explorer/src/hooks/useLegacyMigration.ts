/**
 * useLegacyMigration — "Move to Recommend" on My positions: exit the legacy
 * page positions above a threshold, then open the cart prefilled with the
 * Recommends (and tags) that put the TRUST back. Pages already exited but not
 * back on the market (a migration stopped half-way) can be queued again.
 * Facade over legacyMigrationService.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { useCart } from '@/hooks/useCart'
import {
  buildMigrationCart,
  buildRecommendCart,
  DEFAULT_MIGRATION_THRESHOLD,
  estimateMigration,
  fetchExitedPages,
  legacyPages,
  pagesAbove,
  type MigrationEstimate,
} from '@/services/legacyMigrationService'
import type { MarketPosition } from '@/services/userPositionsService'

export type MigrationStatus = 'idle' | 'done' | 'error'

export function useLegacyMigration(
  walletAddress: string | undefined,
  positions: readonly MarketPosition[],
) {
  const cart = useCart()
  const [status, setStatus] = useState<MigrationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState<number>(
    DEFAULT_MIGRATION_THRESHOLD,
  )
  const [estimate, setEstimate] = useState<MigrationEstimate | null>(null)

  const pages = useMemo(() => legacyPages(positions), [positions])
  const selected = useMemo(
    () => pagesAbove(pages, threshold),
    [pages, threshold],
  )
  const legacyValue = useMemo(
    () => pages.reduce((sum, p) => sum + p.value, 0n),
    [pages],
  )

  // Exited pages not back on the market yet (resume)
  const addresses = useMemo(() => {
    if (!walletAddress) return []
    try {
      return [walletAddress.toLowerCase(), getAddress(walletAddress)]
    } catch {
      return [walletAddress.toLowerCase()]
    }
  }, [walletAddress])
  const exitedQuery = useQuery({
    queryKey: [
      'legacy-exited-pages',
      walletAddress?.toLowerCase(),
      positions.length,
    ],
    queryFn: () => fetchExitedPages(addresses, positions),
    enabled: addresses.length > 0,
    staleTime: 60_000,
  })
  // Pages back on the market since the fetch (a just-mined Recommend in the
  // optimistic overlay) are settled too
  const exitedPages = useMemo(() => {
    const held = new Set(
      positions.flatMap((p) =>
        p.kind === 'claim' && p.objectTermId ? [p.objectTermId] : [],
      ),
    )
    return (exitedQuery.data ?? []).filter((p) => !held.has(p.objectTermId))
  }, [exitedQuery.data, positions])
  const exitedValue = useMemo(
    () => exitedPages.reduce((sum, p) => sum + p.value, 0n),
    [exitedPages],
  )

  useEffect(() => {
    let cancelled = false
    if (selected.length === 0) {
      setEstimate(null)
      return
    }
    void estimateMigration(selected)
      .then((e) => {
        if (!cancelled) setEstimate(e)
      })
      .catch(() => {
        if (!cancelled) setEstimate(null)
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  /** Preview the move in the cart: the exit row first, then the
   *  Recommends — nothing is signed until the cart is confirmed */
  const move = useCallback(() => {
    if (selected.length === 0) return
    setError(null)
    cart.addItems(buildMigrationCart(selected))
    cart.open()
    setStatus('done')
  }, [selected, cart])

  /** Queue the Recommends of pages exited earlier */
  const requeueExited = useCallback(() => {
    if (exitedPages.length === 0) return
    cart.addItems(buildRecommendCart(exitedPages))
    cart.open()
  }, [exitedPages, cart])

  return {
    pageCount: pages.length,
    legacyValue,
    selectedCount: selected.length,
    threshold,
    setThreshold,
    estimate,
    status,
    error,
    move,
    exitedPages,
    exitedValue,
    requeueExited,
  }
}
