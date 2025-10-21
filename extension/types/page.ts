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

export interface UsePageBlockchainDataResult {
  triplets: PageBlockchainTriplet[]
  loading: boolean
  error: string | null
  currentUrl: string | null
  fetchDataForCurrentPage: () => Promise<void>
}