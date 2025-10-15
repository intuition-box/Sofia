import { useState, useEffect, useRef } from 'react'
import { RecommendationService } from '../lib/services/ai/RecommendationService'
import { StorageOgImage } from '../lib/database/StorageOgImage'
import type { Recommendation } from '../lib/services/ai/types'

interface BentoItem {
  name: string
  url: string
  category: string
  size: 'small' | 'tall' | 'mega'
}

interface BentoItemWithImage extends BentoItem {
  ogImage: string
}

interface UsePreviewImagesReturn {
  validItems: BentoItemWithImage[]
  isLoading: boolean
  error: string | null
}

/**
 * Simple hook that transforms recommendations to bento items with og:images
 * Uses intelligent caching to prevent unnecessary refetches
 */
export const usePreviewImages = (recommendations: Recommendation[]): UsePreviewImagesReturn => {
  const [validItems, setValidItems] = useState<BentoItemWithImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastProcessedHash = useRef<string>('')
  const cachedResults = useRef<Map<string, BentoItemWithImage[]>>(new Map())

  useEffect(() => {
    const processRecommendations = async () => {
      if (recommendations.length === 0) {
        setValidItems([])
        return
      }

      // Create content-based hash to detect real changes
      const contentHash = recommendations.map(r => 
        r.category + '|' + r.suggestions.map(s => s.url).sort().join(',')
      ).sort().join('||')
      
      // If we already processed these exact recommendations, return cached result
      if (lastProcessedHash.current === contentHash && cachedResults.current.has(contentHash)) {
        console.log('🎯 [usePreviewImages] Smart cache hit - instant display')
        setValidItems(cachedResults.current.get(contentHash)!)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('🖼️ [usePreviewImages] Processing', recommendations.length, 'recommendation categories')
        
        // Transform recommendations to bento items with size distribution
        const bentoItems = recommendations.flatMap((rec, recIndex) => 
          rec.suggestions.map((suggestion, sugIndex) => {
            const totalIndex = recIndex * 10 + sugIndex
            
            // Bento distribution pour 2 colonnes: 60% tall, 30% mega, 10% small
            let size: 'small' | 'tall' | 'mega'
            const rand = totalIndex % 10
            if (rand < 1) size = 'small'          // 10%
            else if (rand < 7) size = 'tall'      // 60%
            else size = 'mega'                    // 30%
            
            return {
              name: suggestion.name,
              url: suggestion.url,
              category: rec.category,
              size
            }
          })
        )

        // Deduplicate items by URL to avoid "3x DeviantArt"
        const uniqueItems = bentoItems.filter((item, index, self) => 
          index === self.findIndex(t => t.url === item.url)
        )

        console.log('📦 [usePreviewImages] Created', uniqueItems.length, 'unique bento items')
        
        // Get og:images for items - uses RecommendationService's caching system
        const validSuggestions = await RecommendationService.getSuggestionsWithPreviews(uniqueItems)
        
        // Cache the result in memory for instant future access
        cachedResults.current.set(contentHash, validSuggestions)
        lastProcessedHash.current = contentHash
        
        setValidItems(validSuggestions)
        console.log('✅ [usePreviewImages] Final result:', validSuggestions.length, 'valid items with images')
        
      } catch (err) {
        console.error('❌ [usePreviewImages] Error processing recommendations:', err)
        setError('Failed to load preview images')
        setValidItems([])
      } finally {
        setIsLoading(false)
      }
    }

    processRecommendations()
  }, [recommendations.length]) // Only trigger when count changes, not when objects change

  return {
    validItems,
    isLoading,
    error
  }
}