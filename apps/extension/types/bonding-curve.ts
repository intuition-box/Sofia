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

export interface DepositPreview {
  sharesOut: string // Nombre de shares qu'il recevra
  effectivePrice: string // Prix par share
  fees: string // Frais Sofia (0.1 + 5%)
  totalCost: string // trustAmount + fees
  isLoading: boolean
  error: Error | null
}

export interface VaultMetrics {
  currentPrice: string
  totalShares: string
  userShares: string
  userValue: string
  marketCap: string
}
