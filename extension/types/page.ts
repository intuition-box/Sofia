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
  // Domain-level trust (all atoms on the hostname)
  domainTrustCount: number
  domainDistrustCount: number
  domainTotalSupport: number
  domainTrustRatio: number
}

/**
 * Atom info for display in the UI
 */
export interface PageAtomInfo {
  id: string
  label: string
  type: string
  created_at?: string
  vaults: Array<{
    total_shares?: string
    position_count?: number
  }>
}

export type PageDataStatus = "loading" | "refreshing" | "ready" | "error"

/**
 * Reducer state for usePageBlockchainData
 */
export interface PageBlockchainState {
  currentUrl: string | null
  pageTitle: string | null
  isRestricted: boolean
  restrictionMessage: string | null
  triplets: PageBlockchainTriplet[]
  counts: PageBlockchainCounts
  atomsList: PageAtomInfo[]
  pageAtomIds: string[]
  totalCertifications: number
  discoveryStatus: import("./discovery").DiscoveryStatus
  certificationRank: number | null
  userHasCertified: boolean
  intentionStats: Record<import("./intentionCategories").IntentionPurpose, number>
  pageIntentionStats: Record<import("./intentionCategories").IntentionPurpose, number>
  intentionTotal: number
  pageIntentionTotal: number
  maxIntentionCount: number
  pageMaxIntentionCount: number
  status: PageDataStatus
  error: string | null
}

/**
 * Reducer action types for usePageBlockchainData
 */
export type PageBlockchainAction =
  | { type: "SET_PAGE_META"; url: string; title: string | null }
  | { type: "SET_RESTRICTION"; restricted: boolean; message: string | null }
  | {
      type: "SET_DATA"
      triplets: PageBlockchainTriplet[]
      counts: PageBlockchainCounts
      atomsList: PageAtomInfo[]
      pageAtomIds: string[]
      totalCertifications: number
      discoveryStatus: import("./discovery").DiscoveryStatus
      certificationRank: number | null
      userHasCertified: boolean
      intentionStats: Record<import("./intentionCategories").IntentionPurpose, number>
      pageIntentionStats: Record<import("./intentionCategories").IntentionPurpose, number>
      intentionTotal: number
      pageIntentionTotal: number
      maxIntentionCount: number
      pageMaxIntentionCount: number
    }
  | { type: "SET_STATUS"; status: PageDataStatus }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_NO_ACCOUNT" }
  | { type: "SET_RESTRICTED_READY" }
  | { type: "RESET" }

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
  pageAtomIds: string[]
  // Discovery data (from unified PageCertificationData query)
  totalCertifications: number
  discoveryStatus: import("./discovery").DiscoveryStatus
  certificationRank: number | null
  userHasCertified: boolean
  // Intention stats (domain + page)
  intentionStats: Record<import("./intentionCategories").IntentionPurpose, number>
  pageIntentionStats: Record<import("./intentionCategories").IntentionPurpose, number>
  intentionTotal: number
  pageIntentionTotal: number
  maxIntentionCount: number
  pageMaxIntentionCount: number
  // Methods
  fetchDataForCurrentPage: () => Promise<void>
  pauseRefresh: () => void
  resumeRefresh: () => void
}