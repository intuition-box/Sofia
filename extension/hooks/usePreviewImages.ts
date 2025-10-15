import { useState, useEffect, useRef } from 'react'
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
  const processedUrls = useRef<Set<string>>(new Set())

  useEffect(() => {
    const loadPreviewImages = async () => {
      if (bentoItems.length === 0) {
        setValidItems([])
        return
      }

      // Deduplicate items by URL to avoid "3x DeviantArt" 
      const uniqueItems = bentoItems.filter((item, index, self) => 
        index === self.findIndex(t => t.url === item.url)
      )

      // Check if we already processed these exact URLs
      const currentUrls = new Set(uniqueItems.map(item => item.url))
      const urlsString = Array.from(currentUrls).sort().join('|')
      
      if (processedUrls.current.has(urlsString)) {
        console.log('🎯 [usePreviewImages] Skipping - already processed these URLs')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('🖼️ [usePreviewImages] Loading previews for', uniqueItems.length, 'unique items')
        
        // Use RecommendationService (which has IndexedDB cache for images)
        const validSuggestions = await RecommendationService.getSuggestionsWithPreviews(uniqueItems)
        
        setValidItems(validSuggestions)
        processedUrls.current.add(urlsString)
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
  }, [bentoItems.length]) // Simple dependency

  return {
    validItems,
    isLoading,
    error
  }
}