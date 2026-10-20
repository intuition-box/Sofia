/**
 * useLegacyMigration — "Move to Recommend" on My positions: exit the legacy
 * page positions above a threshold, then open the cart prefilled with the
 * Recommends (and tags) that put the TRUST back. Pages already exited but not
 * back on the market (a migration stopped half-way) can be queued again.
 * Facade over legacyMigrationService.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { useCart } from '@/hooks/useCart'
import {
  buildRecommendCart,
  DEFAULT_MIGRATION_THRESHOLD,
  estimateMigration,
  exitLegacyPages,
  fetchExitedPages,
  legacyPages,
  pagesAbove,
  type MigrationEstimate,
} from '@/services/legacyMigrationService'
import type { MarketPosition } from '@/services/userPositionsService'

export type MigrationStatus = 'idle' | 'exiting' | 'done' | 'error'

export function useLegacyMigration(
  walletAddress: string | undefined,
  positions: readonly MarketPosition[],
) {
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
  const exitedPages = useMemo(() => exitedQuery.data ?? [], [exitedQuery.data])
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

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['user-market-positions'] })
    void qc.invalidateQueries({ queryKey: ['legacy-exited-pages'] })
  }, [qc])

  const move = useCallback(async () => {
    const primary = user?.wallet?.address?.toLowerCase()
    const wallet =
      wallets.find((w) => w.address.toLowerCase() === primary) ?? wallets[0]
    if (!wallet || selected.length === 0) return
    setError(null)
    setStatus('exiting')
    try {
      const { exited, result } = await exitLegacyPages(
        wallet,
        selected,
        (done, total) => setProgress({ done, total }),
      )
      // Whatever got out goes to the cart, even if a later chunk failed
      if (exited.length > 0) {
        cart.addItems(buildRecommendCart(exited))
        cart.open()
      }
      if (!result.success) {
        setStatus('error')
        setError(
          `${exited.length} of ${selected.length} pages exited${exited.length ? ' and queued in your cart' : ''}. The rest stopped (${result.error ?? 'network error'}) — try again in a few minutes.`,
        )
      } else {
        setStatus('done')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      refresh()
    }
  }, [user, wallets, selected, cart, refresh])

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
    progress,
    status,
    error,
    move,
    exitedPages,
    exitedValue,
    requeueExited,
  }
}
