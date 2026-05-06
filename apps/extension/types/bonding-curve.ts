/**
 * Types for Bonding Curve functionality in StakeModal
 */

export type TimeRange = '24h' | '1w' | '1m' | '1y' | 'all'

export type CurveType = 1 | 2

export interface ChartDataPoint {
  timestamp: number
  price: number
  tvl?: number
}

export interface PriceChange {
  percentage: string
  value: string
  isPositive: boolean
}

export interface BondingCurveData {
  chartData: ChartDataPoint[]
  currentPrice: string
  priceChange: PriceChange
  isLoading: boolean
  error: Error | null
  userShares?: string
  totalShares?: string
  marketCap?: string
  totalInvested?: string
  totalRedeemed?: string
}

