/**
 * Global Stake Types
 *
 * Types for the global stake system where a portion of each deposit
 * is automatically staked into a shared seasonal pool.
 */

export interface GlobalStakeConfig {
  enabled: boolean
  percentage: number
  curveId: bigint
  termId: string
  seasonName: string
  minGlobalDeposit: bigint
}

export interface GlobalStakePosition {
  shares: bigint
  currentValue: bigint
  totalDeposited: bigint
  totalRedeemed: bigint
  profitLoss: bigint
  profitPercent: number
}

export interface GlobalVaultStats {
  totalStakers: number
  tvl: bigint
  sharePrice: bigint
}

export interface SeasonPosition {
  name: string
  termId: string
  position: GlobalStakePosition | null
}

export interface GlobalStakeState {
  loading: boolean
  error: string | null
  config: GlobalStakeConfig
  position: GlobalStakePosition | null
  vaultStats: GlobalVaultStats | null
  historicalSeasons: SeasonPosition[]
}
