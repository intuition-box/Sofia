/**
 * useLegacyMigration — "Move to Recommend" on My positions: exit every legacy
 * page position in one transaction, then open the cart prefilled with the
 * Recommends (and tags) that put the TRUST back. Facade over
 * legacyMigrationService.
 */
import { useCallback, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import {
  buildRecommendCart,
  exitLegacyPositions,
  legacyPagePositions,
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

  const legacy = useMemo(() => legacyPagePositions(positions), [positions])
  const legacyValue = useMemo(
    () => legacy.reduce((sum, p) => sum + BigInt(p.value), 0n),
    [legacy],
  )
  const pageCount = useMemo(
    () => new Set(legacy.map((p) => p.objectTermId)).size,
    [legacy],
  )

  const move = useCallback(async () => {
    const primary = user?.wallet?.address?.toLowerCase()
    const wallet =
      wallets.find((w) => w.address.toLowerCase() === primary) ?? wallets[0]
    if (!wallet || legacy.length === 0) return
    setError(null)
    try {
      // Snapshot first: the positions list refreshes once the exit lands
      const items = await buildRecommendCart(legacy)
      setStatus('exiting')
      const exit = await exitLegacyPositions(wallet, legacy)
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
  }, [user, wallets, legacy, cart, qc])

  return { legacy, legacyValue, pageCount, status, error, move }
}
