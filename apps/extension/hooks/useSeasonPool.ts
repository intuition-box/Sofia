/**
 * useSeasonPool — fetches the Beta Season Pool vault and the connected
 * wallet's position. Mirrors apps/explorer/src/hooks/useSeasonPool.ts but
 * goes through the extension's rate-limited graphql client + cache.
 */

import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import {
  GetSeasonPoolPositionsDocument,
  type GetSeasonPoolPositionsQuery,
} from '@0xsofia/graphql'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useSeasonPool')

// Beta Season Pool vault — mainnet
const SEASON_POOL_TERM_ID =
  '0xd1315af387fa4148375918e4917466d2ba36c49d07c547c9e04c881b76437d10'
const SEASON_POOL_CURVE_ID = 1

export interface PoolPosition {
  address: string
  shares: bigint
  currentValue: bigint
  netDeposited: bigint
  pnl: bigint
  pnlPercent: number
}

export interface VaultStats {
  totalStakers: number
  tvl: bigint
  sharePrice: bigint
}

export interface UserPoolStanding {
  position: PoolPosition
  rank: number
  total: number
}

export interface UseSeasonPoolResult {
  vaultStats: VaultStats | null
  userStanding: UserPoolStanding | null
  loading: boolean
  error: string | null
}

export function useSeasonPool(
  walletAddress: string | null | undefined,
  enabled: boolean,
): UseSeasonPoolResult {
  const [vaultStats, setVaultStats] = useState<VaultStats | null>(null)
  const [userStanding, setUserStanding] = useState<UserPoolStanding | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = (await intuitionGraphqlClient.request(
          GetSeasonPoolPositionsDocument,
          { termId: SEASON_POOL_TERM_ID, curveId: SEASON_POOL_CURVE_ID },
        )) as GetSeasonPoolPositionsQuery

        if (cancelled) return

        const vault = result?.vaults?.[0]
        if (!vault) {
          setVaultStats(null)
          setUserStanding(null)
          return
        }

        const sharePrice = BigInt(vault.current_share_price || '0')
        setVaultStats({
          totalStakers: vault.position_count || 0,
          tvl: BigInt(vault.total_assets || '0'),
          sharePrice,
        })

        const positions: PoolPosition[] = (vault.positions || [])
          .filter((p) => BigInt(p.shares || '0') > 0n)
          .map((p) => {
            const shares = BigInt(p.shares || '0')
            const totalDeposited = BigInt(
              p.total_deposit_assets_after_total_fees || '0',
            )
            const totalRedeemed = BigInt(
              p.total_redeem_assets_for_receiver || '0',
            )
            const currentValue = (shares * sharePrice) / 10n ** 18n
            const netDeposited = totalDeposited - totalRedeemed
            const pnl = currentValue - netDeposited
            const pnlPercent =
              netDeposited > 0n
                ? Number((pnl * 10000n) / netDeposited) / 100
                : 0

            return {
              address: p.account_id,
              shares,
              currentValue,
              netDeposited,
              pnl,
              pnlPercent,
            }
          })

        if (!walletAddress) {
          setUserStanding(null)
          return
        }

        const sorted = [...positions].sort(
          (a, b) => b.pnlPercent - a.pnlPercent,
        )
        const idx = sorted.findIndex(
          (p) => p.address.toLowerCase() === walletAddress.toLowerCase(),
        )
        if (idx < 0) {
          setUserStanding(null)
        } else {
          setUserStanding({
            position: sorted[idx],
            rank: idx + 1,
            total: sorted.length,
          })
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        logger.warn('Failed to fetch season pool', message)
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [enabled, walletAddress])

  return { vaultStats, userStanding, loading, error }
}

export function formatPoolEther(wei: bigint, decimals = 4): string {
  const value = parseFloat(formatEther(wei))
  return value.toFixed(decimals)
}
