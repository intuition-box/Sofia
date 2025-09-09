/**
 * useLocalPublishedTriplets Hook
 * Manages triplets published from EchoesTab stored locally in IndexedDB
 */

import { useState, useEffect } from 'react'
import { loadPublishedTriplets } from '../lib/indexedDB-methods'
import { PublishedTripletDetails, UseLocalPublishedTripletsResult } from '../types/published-triplets'

/**
 * Hook for managing locally stored published triplets
 * Shows triplets that were published from EchoesTab with complete blockchain details
 */
export const useLocalPublishedTriplets = (): UseLocalPublishedTripletsResult => {
  const [triplets, setTriplets] = useState<PublishedTripletDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshFromLocal = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 [useLocalPublishedTriplets] Loading triplets from IndexedDB...')
      
      const storedTriplets = await loadPublishedTriplets()
      console.log(`📊 [useLocalPublishedTriplets] Found ${storedTriplets.length} locally stored triplets`)
      
      // Sort by timestamp (newest first)
      const sortedTriplets = storedTriplets.sort((a, b) => b.timestamp - a.timestamp)
      setTriplets(sortedTriplets)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ [useLocalPublishedTriplets] Error loading local triplets:', err)
      setError(`Failed to load local triplets: ${errorMessage}`)
      setTriplets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    refreshFromLocal()
  }, [])

  const searchTriplets = (query: string): PublishedTripletDetails[] => {
    if (!query.trim()) return triplets
    
    const lowercaseQuery = query.toLowerCase()
    return triplets.filter(triplet => 
      triplet.triplet.subject.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.predicate.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.object.toLowerCase().includes(lowercaseQuery) ||
      triplet.description.toLowerCase().includes(lowercaseQuery) ||
      triplet.url.toLowerCase().includes(lowercaseQuery)
    )
  }

  return {
    triplets,
    isLoading, 
    error,
    refreshFromLocal,
    searchTriplets
  }
}