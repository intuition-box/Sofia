/**
 * useIntuitionTriplets Hook
 * Replaces useOnChainTriplets with API-based triplets from Intuition
 * No longer stores triplets on-chain, retrieves them from Intuition API
 */

import { useState, useEffect, useCallback } from 'react'
import { useElizaData } from './useElizaData'
import type { ParsedSofiaMessage } from '~components/pages/graph-tabs/types'

export interface IntuitionTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string  
    object: string
  }
  url?: string
  description?: string
  timestamp: number
  source: 'eliza' | 'intuition_api' | 'user_created' | 'created' | 'existing'
  confidence?: number
  // Blockchain fields (for future on-chain storage)
  txHash?: string
  atomVaultId?: string
  tripleVaultId?: string
  subjectVaultId?: string
  predicateVaultId?: string
  ipfsUri?: string
  tripleStatus?: 'on-chain' | 'pending' | 'atom-only'
}

interface UseIntuitionTripletsResult {
  // Data state
  triplets: IntuitionTriplet[]
  isLoading: boolean
  error: string | null
  
  // Counts and stats
  getTripletsCount: () => number
  getTripletsByUrl: (url: string) => IntuitionTriplet[]
  
  // Actions (API-based, no more on-chain storage)
  refreshFromAPI: () => Promise<void>
  addTripletFromEliza: (parsedMessage: ParsedSofiaMessage) => Promise<void>
  
  // Legacy compatibility methods (deprecated)
  addTriplet: (triplet: any) => Promise<void>
  updateTripletToOnChain: (id: string) => Promise<void>
  
  // New API-based methods
  searchTriplets: (query: string) => IntuitionTriplet[]
  getTripletsBySubject: (subject: string) => IntuitionTriplet[]
}

/**
 * Hook for managing triplets via Intuition API instead of on-chain storage
 */
export const useIntuitionTriplets = (): UseIntuitionTripletsResult => {
  const [triplets, setTriplets] = useState<IntuitionTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get Eliza data to convert parsed messages to triplets
  const { parsedMessages } = useElizaData({ autoRefresh: false })

  /**
   * Convert Eliza parsed messages to IntuitionTriplets format
   */
  const convertElizaToTriplets = useCallback((parsedMessages: any[]): IntuitionTriplet[] => {
    const triplets: IntuitionTriplet[] = []
    
    parsedMessages.forEach((record, index) => {
      if (record.type === 'parsed_message' && record.content.triplets) {
        const parsed = record.content as ParsedSofiaMessage
        
        parsed.triplets.forEach((triplet, tripletIndex) => {
          triplets.push({
            id: `eliza_${record.id || index}_${tripletIndex}`,
            triplet: {
              subject: triplet.subject,
              predicate: triplet.predicate,
              object: triplet.object
            },
            url: parsed.rawObjectUrl,
            description: parsed.rawObjectDescription || parsed.intention,
            timestamp: record.timestamp,
            source: 'eliza',
            confidence: 0.9,
            // Placeholder blockchain data
            ipfsUri: `ipfs://placeholder_${Date.now()}`,
            tripleStatus: 'pending'
          })
        })
      }
    })
    
    return triplets
  }, [])

  /**
   * Load triplets from Eliza data (replacing on-chain storage)
   */
  const loadTriplets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Convert Eliza parsed messages to triplets
      const elizaTriplets = convertElizaToTriplets(parsedMessages)
      
      // TODO: In the future, also fetch from Intuition API
      // const apiTriplets = await fetchFromIntuitionAPI()
      // const allTriplets = [...elizaTriplets, ...apiTriplets]
      
      setTriplets(elizaTriplets)
      
      console.log(`🔗 Loaded ${elizaTriplets.length} triplets from Eliza data`)
      
    } catch (err) {
      console.error('❌ Error loading triplets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load triplets')
    } finally {
      setIsLoading(false)
    }
  }, [parsedMessages, convertElizaToTriplets])

  /**
   * Refresh triplets from API (future implementation)
   */
  const refreshFromAPI = useCallback(async () => {
    console.log('🔄 Refreshing triplets from Intuition API...')
    
    // TODO: Implement actual API call
    // For now, reload from Eliza data
    await loadTriplets()
  }, [loadTriplets])

  /**
   * Add triplet from Eliza parsed message (store in IndexedDB via useElizaData)
   */
  const addTripletFromEliza = useCallback(async (parsedMessage: ParsedSofiaMessage) => {
    try {
      // This is now handled by useElizaData hook
      console.log('✅ Triplet from Eliza will be stored in IndexedDB via useElizaData')
      
      // Refresh local state
      await loadTriplets()
      
    } catch (err) {
      console.error('❌ Error adding triplet from Eliza:', err)
      setError(err instanceof Error ? err.message : 'Failed to add triplet')
    }
  }, [loadTriplets])

  /**
   * Get total triplets count
   */
  const getTripletsCount = useCallback((): number => {
    return triplets.length
  }, [triplets])

  /**
   * Get triplets by URL
   */
  const getTripletsByUrl = useCallback((url: string): IntuitionTriplet[] => {
    return triplets.filter(triplet => triplet.url === url)
  }, [triplets])

  /**
   * Search triplets by query
   */
  const searchTriplets = useCallback((query: string): IntuitionTriplet[] => {
    if (!query.trim()) return triplets
    
    const lowerQuery = query.toLowerCase()
    return triplets.filter(triplet =>
      triplet.triplet.subject.toLowerCase().includes(lowerQuery) ||
      triplet.triplet.predicate.toLowerCase().includes(lowerQuery) ||
      triplet.triplet.object.toLowerCase().includes(lowerQuery) ||
      (triplet.description && triplet.description.toLowerCase().includes(lowerQuery))
    )
  }, [triplets])

  /**
   * Get triplets by subject
   */
  const getTripletsBySubject = useCallback((subject: string): IntuitionTriplet[] => {
    return triplets.filter(triplet => 
      triplet.triplet.subject.toLowerCase() === subject.toLowerCase()
    )
  }, [triplets])

  // Legacy compatibility methods (deprecated but maintained for backward compatibility)
  
  /**
   * @deprecated Use addTripletFromEliza instead
   * Legacy method for compatibility - no longer stores on-chain
   */
  const addTriplet = useCallback(async (triplet: any) => {
    console.warn('⚠️ addTriplet is deprecated. Triplets are now managed via Intuition API and Eliza data.')
    
    // Convert to new format and add to local state for compatibility
    const newTriplet: IntuitionTriplet = {
      id: `legacy_${Date.now()}`,
      triplet: {
        subject: triplet.triplet?.subject || triplet.subject || 'Unknown',
        predicate: triplet.triplet?.predicate || triplet.predicate || 'relates to',
        object: triplet.triplet?.object || triplet.object || 'Unknown'
      },
      url: triplet.url || '',
      description: triplet.originalMessage?.rawObjectDescription || '',
      timestamp: triplet.timestamp || Date.now(),
      source: 'user_created',
      confidence: 0.7,
      ipfsUri: triplet.ipfsUri || `ipfs://legacy_${Date.now()}`,
      tripleStatus: 'pending'
    }
    
    setTriplets(prev => [...prev, newTriplet])
    console.log('✅ Legacy triplet added to local state (not stored on-chain)')
  }, [])

  /**
   * @deprecated On-chain storage is no longer used
   * Legacy method for compatibility - does nothing
   */
  const updateTripletToOnChain = useCallback(async (id: string) => {
    console.warn('⚠️ updateTripletToOnChain is deprecated. On-chain storage is no longer used.')
    console.log(`ℹ️ Triplet ${id} is already available via Intuition API`)
  }, [])

  /**
   * Load triplets when parsed messages change
   */
  useEffect(() => {
    if (parsedMessages.length > 0) {
      loadTriplets()
    }
  }, [parsedMessages, loadTriplets])

  return {
    // Data state
    triplets,
    isLoading,
    error,
    
    // Counts and stats  
    getTripletsCount,
    getTripletsByUrl,
    
    // Actions
    refreshFromAPI,
    addTripletFromEliza,
    
    // Legacy compatibility (deprecated)
    addTriplet,
    updateTripletToOnChain,
    
    // New API-based methods
    searchTriplets,
    getTripletsBySubject
  }
}

/**
 * Simplified hook for read-only triplet access
 */
export const useIntuitionTripletsData = () => {
  const { triplets, isLoading, error, getTripletsCount } = useIntuitionTriplets()
  
  return {
    triplets,
    isLoading,
    error,
    count: getTripletsCount()
  }
}

export default useIntuitionTriplets