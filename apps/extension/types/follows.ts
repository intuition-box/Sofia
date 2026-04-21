/**
 * Types for follow/trust functionality
 * Normalized data model for followers, following, and trust circle
 */

/**
 * View Model for displaying follow/trust accounts
 * Normalized across all three tabs (followers, following, trust-circle)
 */
export interface CommunityAccountVM {
  /** Unique identifier (triple ID or position ID) */
  id: string
  /** Display label (ENS name or wallet) */
  label: string
  /** Atom term ID */
  termId: string
  /** Triple term ID */
  tripleId: string
  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number
  /** Trust amount in TRUST tokens (decimal) */
  trustAmount: number
  /** Number of signals (positions) on this account */
  signalsCount: number
  /** Total market cap in Wei */
  marketCapWei: string
  /** Avatar image URL */
  image?: string
  /** Wallet address (checksummed) */
  walletAddress?: string
  /** Additional metadata from IPFS */
  meta?: {
    url?: string
    description?: string
  }
}

/**
 * Filter type for tabs
 */
export type CommunityFilterType = 'explorer' | 'followers' | 'following' | 'trust-circle'

/**
 * IPFS metadata structure
 */
export interface IPFSMetadata {
  url?: string
  description?: string
  image?: string
  [key: string]: any
}

/**
 * Result from follow/trust hook
 */
export interface CommunityQueryResult {
  accounts: CommunityAccountVM[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * GraphQL atom data response (used by follow/trust hooks)
 */
export interface AtomDataResponse {
  atoms: Array<{
    label: string
    data?: string
    image?: string
  }>
}

// Aliases for backward compatibility
export type FollowAccountVM = CommunityAccountVM
export type FollowQueryResult = CommunityQueryResult

/**
 * Search context for navigation
 */
export interface CommunitySearchContext {
  query: string
  showResults: boolean
}
