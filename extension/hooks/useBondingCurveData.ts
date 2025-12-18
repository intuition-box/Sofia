import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import type { BondingCurveData, ChartDataPoint, CurveType, TimeRange } from '../types/bonding-curve'
import { API_CONFIG } from '../lib/config/chainConfig'

interface SharePriceChange {
  block_timestamp: string
  share_price: string
  total_assets: string
}

interface GraphQLResponse {
  share_price_changes: SharePriceChange[]
  vaults: Array<{
    term: {
      total_market_cap: string
    }
    current_share_price: string
    total_shares: string
    positions: Array<{
      shares: string
    }>
  }>
}

const GET_BONDING_CURVE_DATA = `
  query GetTripleBondingCurveData($tripleId: String!, $curveId: numeric!, $walletAddress: String!) {
    share_price_changes(
      order_by: {block_timestamp: asc}
      where: {term_id: {_eq: $tripleId}, curve_id: {_eq: $curveId}}
    ) {
      block_timestamp
      share_price
      total_assets
    }
    vaults(where: {term_id: {_eq: $tripleId}, curve_id: {_eq: $curveId}}) {
      term {
        total_market_cap
      }
      current_share_price
      total_shares
      positions(where: {account_id: {_eq: $walletAddress}}) {
        shares
      }
    }
  }
`

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
  const { data, isLoading, error } = useQuery({
    queryKey: ['bondingCurveData', tripleId, curveId, walletAddress, timeRange],
    queryFn: async () => {
      try {
        console.log('🔵 [useBondingCurveData] Starting query with params:', {
          tripleId,
          curveId,
          walletAddress
        })

        const response = await request<GraphQLResponse>(
          API_CONFIG.GRAPHQL_ENDPOINT,
          GET_BONDING_CURVE_DATA,
          {
            tripleId,
            curveId: curveId,
            walletAddress: walletAddress || ''
          }
        )

        console.log('🔵 [useBondingCurveData] Raw GraphQL response:', JSON.stringify(response, null, 2))

        const priceChanges = response.share_price_changes || []
        const vaults = response.vaults || []

        console.log('🔵 [useBondingCurveData] Price changes count:', priceChanges.length)
        console.log('🔵 [useBondingCurveData] Vaults count:', vaults.length)

        if (vaults.length > 0) {
          console.log('🔵 [useBondingCurveData] First vault:', JSON.stringify(vaults[0], null, 2))
        }

        // Extract vault data
        const vault = vaults[0]
        console.log('🔵 [useBondingCurveData] Vault data:', JSON.stringify(vault, null, 2))

        const currentSharePrice = vault?.current_share_price || '0'
        const totalShares = vault?.total_shares || '0'
        const userShares = vault?.positions?.[0]?.shares || '0'
        const marketCap = vault?.term?.total_market_cap || totalShares // Use total_market_cap from term

        console.log('🔵 [useBondingCurveData] Extracted values:', {
          currentSharePrice,
          totalShares,
          userShares,
          marketCap,
          positionsCount: vault?.positions?.length || 0
        })

        if (priceChanges.length === 0) {
          console.log('🔵 [useBondingCurveData] No price history, returning vault data only')
          // No price history available yet, but return vault data
          return {
            chartData: [],
            currentPrice: formatBalance(BigInt(currentSharePrice), 18, 4),
            priceChange: { percentage: '+0%', value: '0', isPositive: true },
            userShares: formatBalance(BigInt(userShares), 18, 4),
            totalShares: formatBalance(BigInt(totalShares), 18, 4),
            marketCap
          }
        }

        // Get current price from the latest price change
        const latestPriceChange = priceChanges[priceChanges.length - 1]
        const currentPriceBigInt = BigInt(latestPriceChange.share_price || '0')

        console.log('🔵 [useBondingCurveData] Latest price change:', latestPriceChange)
        console.log('🔵 [useBondingCurveData] Current price BigInt:', currentPriceBigInt.toString())

        // Filter by time range
        const { startTime } = getTimeRangeBoundaries(timeRange)
        const filteredChanges = priceChanges.filter(
          (change: SharePriceChange) => Number(change.block_timestamp) >= startTime
        )

        console.log('🔵 [useBondingCurveData] Filtered changes count:', filteredChanges.length)

        // Convert to chart data points
        const chartData: ChartDataPoint[] = filteredChanges.map((change: SharePriceChange) => ({
          timestamp: Number(change.block_timestamp),
          price: Number(formatBalance(BigInt(change.share_price), 18, 6)),
          tvl: Number(formatBalance(BigInt(change.total_assets), 18, 6))
        }))

        console.log('🔵 [useBondingCurveData] Chart data points:', chartData.length)
        if (chartData.length > 0) {
          console.log('🔵 [useBondingCurveData] First chart point:', chartData[0])
          console.log('🔵 [useBondingCurveData] Last chart point:', chartData[chartData.length - 1])
        }

        // Calculate price change
        const currentPrice = Number(formatBalance(currentPriceBigInt, 18, 6))
        const firstPrice = chartData.length > 0 ? chartData[0].price : currentPrice
        const priceChangeValue = currentPrice - firstPrice
        const priceChangePercentage = firstPrice > 0 ? (priceChangeValue / firstPrice) * 100 : 0

        const result = {
          chartData,
          currentPrice: formatBalance(currentPriceBigInt, 18, 4),
          priceChange: {
            percentage: `${priceChangePercentage >= 0 ? '+' : ''}${priceChangePercentage.toFixed(2)}%`,
            value: `${priceChangeValue >= 0 ? '+' : ''}${priceChangeValue.toFixed(4)}`,
            isPositive: priceChangeValue >= 0
          },
          userShares: formatBalance(BigInt(userShares), 18, 4),
          totalShares: formatBalance(BigInt(totalShares), 18, 4),
          marketCap
        }

        console.log('🔵 [useBondingCurveData] Final result:', result)
        return result
      } catch (err) {
        // Log GraphQL errors but return empty data
        console.error('🔴 [useBondingCurveData] Error:', err)
        console.error('🔴 [useBondingCurveData] Error stack:', err instanceof Error ? err.stack : 'No stack')
        return {
          chartData: [],
          currentPrice: '0',
          priceChange: { percentage: '+0%', value: '0', isPositive: true },
          userShares: '0',
          totalShares: '0',
          marketCap: '0'
        }
      }
    },
    enabled: !!tripleId && !!curveId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
  })

  return {
    chartData: data?.chartData || [],
    currentPrice: data?.currentPrice || '0',
    priceChange: data?.priceChange || { percentage: '+0%', value: '0', isPositive: true },
    isLoading,
    error: error as Error | null,
    userShares: data?.userShares || '0',
    totalShares: data?.totalShares || '0',
    marketCap: data?.marketCap || '0'
  }
}
