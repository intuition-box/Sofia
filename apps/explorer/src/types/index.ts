import type { Address, Hash } from 'viem'

// ── Blockchain Events ──

export interface TransactionForwardedEvent {
  operation: string
  user: Address
  sofiaFee: bigint
  multiVaultValue: bigint
  totalReceived: bigint
  blockNumber: bigint
  txHash: Hash
}

// ── Alpha Testers ──

export interface AlphaTester {
  address: Address
  tx: number
  intentions: number
  pioneer: number
  trustVolume: bigint
  trustVolumeFormatted: string
}

export interface AlphaTotals {
  wallets: number
  tx: number
  intentions: number
  pioneers: number
  trustVolume: bigint
}

export interface AlphaTestersData {
  leaderboard: AlphaTester[]
  totals: AlphaTotals
}

// ── Season Pool ──

export interface PoolPosition {
  address: Address
  shares: bigint
  sharesFormatted: string
  currentValue: bigint
  currentValueFormatted: string
  netDeposited: bigint
  pnl: bigint
  pnlFormatted: string
  pnlPercent: number
}

export interface VaultStats {
  totalStakers: number
  tvl: bigint
  sharePrice: bigint
}

// ── Trending ──

export type IntentCategory = 'trusted' | 'distrusted' | 'work' | 'learning' | 'fun' | 'inspiration' | 'music' | 'buying'

export interface TrendingItemLive {
  category: IntentCategory
  label: string
  url: string
  domain: string
  favicon: string
  certifiers: number
  termId?: string
  counterTermId?: string
}

export interface TrendingPlatform {
  platformDomain: string
  platformName: string
  platformSlug?: string
  favicon: string
  totalCertifiers: number
  intentions: { category: IntentCategory; count: number; color: string }[]
  /** termId of the platform atom — used for market data + invest */
  termId?: string
  /** counterTermId of "I trusts [atom]" triple — used for Sell */
  counterTermId?: string
  /** User P&L percentage on this atom (null if no position) */
  userPnlPct?: number | null
}

export interface Reward {
  icon: string
  title: string
  desc: string
  theme: string
}

// ── Component Props ──

export interface Stat {
  label: string
  value: string
}

export interface StatsRibbonProps {
  stats?: Stat[]
}

export interface LeaderboardProps {
  alphaData?: AlphaTester[]
  alphaLoading?: boolean
  alphaError?: string | null
  poolData?: PoolPosition[] | null
  poolLoading?: boolean
  poolError?: string | null
  connectedAddress?: Address | null
}

// ── User Stats ──

export interface UserStats {
  isAlphaTester: boolean
  alphaData: AlphaTester | null
  alphaRank: number | null
  poolData: PoolPosition | null
  poolRank: number | null
}

// ── Service Types ──

export interface RpcQueueConfig {
  minDelayMs?: number
  baseBackoffMs?: number
  maxBackoffMs?: number
  backoffMultiplier?: number
  maxRetries?: number
}

