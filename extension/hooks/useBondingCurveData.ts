import { useMemo } from 'react'
import { useGetTripleBondingCurveDataQuery } from '@0xsofia/graphql'
import type { BondingCurveData, ChartDataPoint, CurveType, TimeRange } from '../types/bonding-curve'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useBondingCurveData')

function formatBalance(value: bigint, decimals: number = 18, precision: number = 6): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, precision)
  return `${integerPart}.${fractionalStr}`
}

function getTimeRangeBoundaries(timeRange: TimeRange) {
  const now = Math.floor(Date.now() / 1000)
  let startTime: number

  switch (timeRange) {
    case '24h':
      startTime = now - 24 * 60 * 60
      break
    case '1w':
      startTime = now - 7 * 24 * 60 * 60
      break
    case '1m':
      startTime = now - 30 * 24 * 60 * 60
      break
    case '1y':
      startTime = now - 365 * 24 * 60 * 60
      break
    case 'all':
    default:
      startTime = 0
      break
  }

  return { startTime, endTime: now }
}

export function useBondingCurveData(
  tripleId: string,
  curveId: CurveType,
  walletAddress: string = '',
  timeRange: TimeRange = 'all'
): BondingCurveData {
  // Use generated hook from @0xsofia/graphql
  const { data, isLoading, error } = useGetTripleBondingCurveDataQuery(
    {
      tripleId,
      curveId,
      walletAddress: walletAddress || ''
    },
    {
      enabled: !!tripleId && !!curveId,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000 // Refetch every minute
    }
  )

  // Transform raw data into BondingCurveData format
  const transformedData = useMemo(() => {
    if (!data) {
      return {
        chartData: [],
        currentPrice: '0',
        priceChange: { percentage: '+0%', value: '0', isPositive: true },
        userShares: '0',
        totalShares: '0',
        marketCap: '0',
        totalInvested: '0',
        totalRedeemed: '0'
      }
    }

    try {
      const priceChanges = data.share_price_changes || []
      const vaults = data.vaults || []

      // Extract vault data
      const vault = vaults[0]

      const currentSharePrice = vault?.current_share_price || '0'
      const totalShares = vault?.total_shares || '0'
      const userShares = vault?.positions?.[0]?.shares || '0'
      const marketCap = vault?.term?.total_market_cap || totalShares
      const totalInvested = vault?.positions?.[0]?.total_deposit_assets_after_total_fees || '0'
      const totalRedeemed = vault?.positions?.[0]?.total_redeem_assets_for_receiver || '0'

      if (priceChanges.length === 0) {
        // No price history available yet, but return vault data
        return {
          chartData: [],
          currentPrice: formatBalance(BigInt(currentSharePrice), 18, 4),
          priceChange: { percentage: '+0%', value: '0', isPositive: true },
          userShares: formatBalance(BigInt(userShares), 18, 4),
          totalShares: formatBalance(BigInt(totalShares), 18, 4),
          marketCap,
          totalInvested: formatBalance(BigInt(totalInvested), 18, 4),
          totalRedeemed: formatBalance(BigInt(totalRedeemed), 18, 4)
        }
      }

      // Get current price from the latest price change
      const latestPriceChange = priceChanges[priceChanges.length - 1]
      const currentPriceBigInt = BigInt(latestPriceChange.share_price || '0')

      // Filter by time range
      const { startTime } = getTimeRangeBoundaries(timeRange)
      const filteredChanges = priceChanges.filter(
        (change) => Number(change.block_timestamp) >= startTime
      )

      // Convert to chart data points
      const chartData: ChartDataPoint[] = filteredChanges.map((change) => ({
        timestamp: Number(change.block_timestamp),
        price: Number(formatBalance(BigInt(change.share_price), 18, 6)),
        tvl: Number(formatBalance(BigInt(change.total_assets), 18, 6))
      }))

      // Calculate price change
      const currentPrice = Number(formatBalance(currentPriceBigInt, 18, 6))
      const firstPrice = chartData.length > 0 ? chartData[0].price : currentPrice
      const priceChangeValue = currentPrice - firstPrice
      const priceChangePercentage = firstPrice > 0 ? (priceChangeValue / firstPrice) * 100 : 0

      return {
        chartData,
        currentPrice: formatBalance(currentPriceBigInt, 18, 4),
        priceChange: {
          percentage: `${priceChangePercentage >= 0 ? '+' : ''}${priceChangePercentage.toFixed(2)}%`,
          value: `${priceChangeValue >= 0 ? '+' : ''}${priceChangeValue.toFixed(4)}`,
          isPositive: priceChangeValue >= 0
        },
        userShares: formatBalance(BigInt(userShares), 18, 4),
        totalShares: formatBalance(BigInt(totalShares), 18, 4),
        marketCap,
        totalInvested: formatBalance(BigInt(totalInvested), 18, 4),
        totalRedeemed: formatBalance(BigInt(totalRedeemed), 18, 4)
      }
    } catch (err) {
      logger.error('Error transforming data', err)
      return {
        chartData: [],
        currentPrice: '0',
        priceChange: { percentage: '+0%', value: '0', isPositive: true },
        userShares: '0',
        totalShares: '0',
        marketCap: '0',
        totalInvested: '0',
        totalRedeemed: '0'
      }
    }
  }, [data, timeRange])

  return {
    ...transformedData,
    isLoading,
    error: error as Error | null
  }
}
