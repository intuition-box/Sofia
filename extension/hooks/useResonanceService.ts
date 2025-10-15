import { useState, useEffect } from 'react'
import { GlobalResonanceService } from '../lib/services/GlobalResonanceService'
import type { BentoItemWithImage } from '../types/bento'

interface UseResonanceServiceReturn {
  validItems: BentoItemWithImage[]
  isLoading: boolean
  error: string | null
}

/**
 * Passive hook that only observes GlobalResonanceService state
 * Does NOT trigger any processing - that's handled by the service itself
 */
export const useResonanceService = (): UseResonanceServiceReturn => {
  const [state, setState] = useState(() => GlobalResonanceService.getInstance().getState())
  
  useEffect(() => {
    const service = GlobalResonanceService.getInstance()
    
    // ONLY subscribe to service state changes - completely passive
    const unsubscribe = service.subscribe(setState)
    
    // Cleanup subscription on unmount
    return unsubscribe
  }, []) // No dependencies - just subscribe once

  return {
    validItems: state.validItems,
    isLoading: state.isLoading,
    error: state.error
  }
}