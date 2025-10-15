import { useState, useEffect } from 'react'
import { GlobalResonanceService } from '../lib/services/GlobalResonanceService'
import type { BentoItem, BentoItemWithImage } from '../types/bento'

interface UsePreviewImagesReturn {
  validItems: BentoItemWithImage[]
  isLoading: boolean
  error: string | null
}

/**
 * Hook to manage preview images for bento grid
 * Uses GlobalResonanceService for persistent caching across component lifecycles
 */
export const usePreviewImages = (bentoItems: BentoItem[]): UsePreviewImagesReturn => {
  const [state, setState] = useState(() => GlobalResonanceService.getInstance().getState())
  
  useEffect(() => {
    const service = GlobalResonanceService.getInstance()
    
    // Subscribe to service state changes
    const unsubscribe = service.subscribe(setState)
    
    // Process items if we have them
    if (bentoItems.length > 0) {
      service.processItems(bentoItems)
    } else {
      // Clear if no items
      service.processItems([])
    }
    
    // Cleanup subscription on unmount
    return unsubscribe
  }, [bentoItems.length]) // Simple dependency - only trigger when count changes

  return {
    validItems: state.validItems,
    isLoading: state.isLoading,
    error: state.error
  }
}