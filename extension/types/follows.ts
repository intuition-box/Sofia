/**
 * Types for follow/trust functionality
 * Normalized data model for followers, following, and trust circle
 */

/**
 * View Model for displaying follow/trust accounts
 * Normalized across all three tabs (followers, following, trust-circle)
 */
export interface FollowAccountVM {
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
export type FollowFilterType = 'followers' | 'following' | 'trust-circle'

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
export interface FollowQueryResult {
  accounts: FollowAccountVM[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Search context for navigation
 */
export interface FollowSearchContext {
  query: string
  showResults: boolean
}
