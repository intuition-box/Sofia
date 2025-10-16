/**
 * Global service for managing bento grid data
 * Persists across component mount/unmount cycles to prevent unnecessary reloading
 * Handles complete pipeline: recommendations → bento items → og:images → final display
 */

import { RecommendationService } from './ai/RecommendationService'
import { StorageRecommendation } from '../database/StorageRecommendation'
import type { BentoItem, BentoItemWithImage, BentoState, BentoStateListener } from '../../types/bento'
import type { Recommendation } from './ai/types'

export class GlobalResonanceService {
  private static instance: GlobalResonanceService | null = null
  private state: BentoState = {
    validItems: [],
    isLoading: false,
    error: null,
    lastProcessedHash: null
  }
  private listeners: Set<BentoStateListener> = new Set()
  private currentWallet: string | null = null

  private constructor() {}

  static getInstance(): GlobalResonanceService {
    if (!this.instance) {
      this.instance = new GlobalResonanceService()
    }
    return this.instance
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: BentoStateListener): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Update state and notify listeners
   */
  private setState(newState: Partial<BentoState>): void {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Get current state
   */
  getState(): BentoState {
    return this.state
  }

  /**
   * Transform raw recommendations into bento grid items with size distribution
   */
  private transformRecommendationsToBentoItems(recommendations: Recommendation[]): BentoItem[] {
    return recommendations.flatMap((rec, recIndex) => 
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
  }

  /**
   * Update recommendations data - self-managing method
   * Call this when recommendations change, service handles everything intelligently
   */
  async updateRecommendations(recommendations: Recommendation[], additive: boolean = false): Promise<void> {
    if (recommendations.length === 0) {
      this.setState({ validItems: [], error: null })
      return
    }

    // EARLY hash check BEFORE expensive transformations - based on recommendation content
    const quickHash = recommendations.map(r => 
      r.category + '|' + r.suggestions.map(s => s.url).sort().join(',')
    ).sort().join('||')
    
    // Check if we already processed these exact recommendations - service is intelligent
    if (this.state.lastProcessedHash === quickHash && this.state.validItems.length > 0) {
      console.log('🎯 [GlobalResonanceService] Smart cache hit - skipping reprocessing')
      return
    }

    // Transform recommendations to bento items (only if not cached)
    const bentoItems = this.transformRecommendationsToBentoItems(recommendations)

    // Deduplicate items by URL to avoid "3x DeviantArt"
    const uniqueItems = bentoItems.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    )

    this.setState({ 
      isLoading: true, 
      error: null,
      lastProcessedHash: quickHash 
    })

    try {
      console.log('🖼️ [GlobalResonanceService] Processing', recommendations.length, 'recommendations →', uniqueItems.length, 'unique bento items')
      
      // Use RecommendationService (which has IndexedDB cache for images)
      const validSuggestions = await RecommendationService.getSuggestionsWithPreviews(uniqueItems)
      
      this.setState({ 
        validItems: validSuggestions,
        isLoading: false
      })
      
      console.log('✅ [GlobalResonanceService] Final result:', validSuggestions.length, 'valid items with images')
      
    } catch (err) {
      console.error('❌ [GlobalResonanceService] Error processing recommendations:', err)
      this.setState({ 
        error: 'Failed to load preview images',
        validItems: [],
        isLoading: false
      })
    }
  }

  /**
   * Clear cached data (useful for force refresh)
   */
  clearCache(): void {
    this.setState({
      validItems: [],
      error: null,
      lastProcessedHash: null
    })
  }

  /**
   * Reset loading state
   */
  resetLoading(): void {
    this.setState({ isLoading: false })
  }
}