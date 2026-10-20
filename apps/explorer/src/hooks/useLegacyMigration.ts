/**
 * useLegacyMigration — "Move to Recommend" on My positions: exit the legacy
 * page positions above a threshold, then open the cart prefilled with the
 * Recommends (and tags) that put the TRUST back. Facade over
 * legacyMigrationService.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import {
  buildRecommendCart,
  DEFAULT_MIGRATION_THRESHOLD,
  estimateMigration,
  exitLegacyPages,
  legacyPages,
  pagesAbove,
  type MigrationEstimate,
} from '@/services/legacyMigrationService'
import type { MarketPosition } from '@/services/userPositionsService'

export type MigrationStatus = 'idle' | 'exiting' | 'queuing' | 'done' | 'error'

export function useLegacyMigration(positions: readonly MarketPosition[]) {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const cart = useCart()
  const qc = useQueryClient()
  const [status, setStatus] = useState<MigrationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState<number>(
    DEFAULT_MIGRATION_THRESHOLD,
  )
  const [progress, setProgress] = useState<{ done: number; total: number }>()
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

  const move = useCallback(async () => {
    const primary = user?.wallet?.address?.toLowerCase()
    const wallet =
      wallets.find((w) => w.address.toLowerCase() === primary) ?? wallets[0]
    if (!wallet || selected.length === 0) return
    setError(null)
    try {
      // Snapshot first: the positions list refreshes once the exit lands
      const items = await buildRecommendCart(selected)
      setStatus('exiting')
      const exit = await exitLegacyPages(wallet, selected, (done, total) =>
        setProgress({ done, total }),
      )
      if (!exit.success) throw new Error(exit.error ?? 'Exit failed')
      setStatus('queuing')
      cart.addItems(items)
      cart.open()
      setStatus('done')
      void qc.invalidateQueries({ queryKey: ['user-market-positions'] })
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [user, wallets, selected, cart, qc])

  return {
    pageCount: pages.length,
    legacyValue,
    selectedCount: selected.length,
    threshold,
    setThreshold,
    estimate,
    progress,
    status,
    error,
    move,
  }
}
