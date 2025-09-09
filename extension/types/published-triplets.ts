/**
 * Types for published triplets stored locally
 */

export interface PublishedTripletDetails {
  // Original identifiers
  originalId: string // The tripletId from EchoesTab (e.g., "msg_123_0")
  
  // Triplet content
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  
  // Metadata from original
  url: string
  description: string
  sourceMessageId: string
  
  // Blockchain data
  tripleVaultId: string
  txHash: string
  subjectVaultId: string
  predicateVaultId: string
  objectVaultId: string
  
  // Publication info
  timestamp: number // When it was published
  source: 'created' | 'existing'
  blockNumber?: number
  
  // Display info
  id: string // For React keys, can be same as tripleVaultId
}

export interface UseLocalPublishedTripletsResult {
  triplets: PublishedTripletDetails[]
  isLoading: boolean
  error: string | null
  refreshFromLocal: () => Promise<void>
  searchTriplets: (query: string) => PublishedTripletDetails[]
}