/**
 * Page-related types for blockchain data and analysis
 */

export interface PageBlockchainTriplet {
  term_id: string
  subject: { label: string }
  predicate: { label: string }
  object: { label: string }
  created_at: string
  positions?: Array<{
    shares: string
    position_count?: number
    created_at?: string
    account?: { id: string }
  }>
}

/**
 * Metadata counts for page blockchain data
 */
export interface PageBlockchainCounts {
  atomsCount: number
  triplesCount: number
  displayedAtomsCount: number
  displayedTriplesCount: number
  totalShares: number
  totalPositions: number
  attestationsCount: number
  trustCount: number
  distrustCount: number
  totalSupport: number
  trustRatio: number
}

/**
 * Atom info for display in the UI
 */
export interface PageAtomInfo {
  id: string
  label: string
  type: string
  vaults: Array<{
    total_shares?: string
    position_count?: number
  }>
}

export type PageDataStatus = "loading" | "refreshing" | "ready" | "error"

export interface UsePageBlockchainDataResult {
  triplets: PageBlockchainTriplet[]
  counts: PageBlockchainCounts
  atomsList: PageAtomInfo[]
  loading: boolean
  status: PageDataStatus
  error: string | null
  currentUrl: string | null
  pageTitle: string | null
  isRestricted: boolean
  restrictionMessage: string | null
  fetchDataForCurrentPage: () => Promise<void>
  pauseRefresh: () => void
  resumeRefresh: () => void
}