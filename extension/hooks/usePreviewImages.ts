import { useState, useEffect } from 'react'
import { RecommendationService } from '../lib/services/ai/RecommendationService'

interface BentoItem {
  name: string
  url: string
  category: string
  size: 'small' | 'medium' | 'large'
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
 * Hook to manage preview images for bento grid
 * Uses RecommendationService for caching and business logic
 */
export const usePreviewImages = (bentoItems: BentoItem[]): UsePreviewImagesReturn => {
  const [validItems, setValidItems] = useState<BentoItemWithImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPreviewImages = async () => {
      if (bentoItems.length === 0) {
        setValidItems([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('🖼️ [usePreviewImages] Loading previews for', bentoItems.length, 'items')
        
        // Use RecommendationService to get filtered suggestions with og:images
        const validSuggestions = await RecommendationService.getSuggestionsWithPreviews(bentoItems)
        
        setValidItems(validSuggestions)
        console.log('✅ [usePreviewImages] Loaded', validSuggestions.length, 'valid items with images')
        
      } catch (err) {
        console.error('❌ [usePreviewImages] Error loading previews:', err)
        setError('Failed to load preview images')
        setValidItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPreviewImages()
  }, [bentoItems.length]) // Only depend on length to avoid infinite re-renders

  return {
    validItems,
    isLoading,
    error
  }
}