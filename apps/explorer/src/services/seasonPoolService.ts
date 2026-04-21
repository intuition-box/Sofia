import { formatEther } from 'viem'
import type { Address } from 'viem'
import type { GetSeasonPoolPositionsQuery } from '@0xsofia/dashboard-graphql'
import type { PoolPosition, VaultStats } from '@/types'

type VaultRaw = GetSeasonPoolPositionsQuery['vaults'][number]

export function processPositions(vault: VaultRaw): { positions: PoolPosition[]; vaultStats: VaultStats } {
  const sharePrice = BigInt(vault.current_share_price || '0')

  const positions: PoolPosition[] = (vault.positions || [])
    .filter((p) => BigInt(p.shares || '0') > 0n)
    .map((p) => {
      const shares = BigInt(p.shares || '0')
      const totalDeposited = BigInt(p.total_deposit_assets_after_total_fees || '0')
      const totalRedeemed = BigInt(p.total_redeem_assets_for_receiver || '0')
      const currentValue = (shares * sharePrice) / 10n ** 18n
      const netDeposited = totalDeposited - totalRedeemed
      const pnl = currentValue - netDeposited
      const pnlPercent =
        netDeposited > 0n ? Number((pnl * 10000n) / netDeposited) / 100 : 0

      return {
        address: p.account_id as Address,
        shares,
        sharesFormatted: formatEther(shares),
        currentValue,
        currentValueFormatted: formatEther(currentValue),
        netDeposited,
        pnl,
        pnlFormatted: formatEther(pnl),
        pnlPercent,
      }
    })

  positions.sort((a, b) => b.currentValue > a.currentValue ? -1 : b.currentValue < a.currentValue ? 1 : 0)

  return {
    positions,
    vaultStats: {
      totalStakers: vault.position_count || 0,
      tvl: BigInt(vault.total_assets || '0'),
      sharePrice,
    },
  }
}
