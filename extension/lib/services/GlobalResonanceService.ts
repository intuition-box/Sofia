/**
 * Global service for managing bento grid data
 * Persists across component mount/unmount cycles to prevent unnecessary reloading
 */

import { RecommendationService } from './ai/RecommendationService'
import type { BentoItem, BentoItemWithImage, BentoState, BentoStateListener } from '../../types/bento'

export class GlobalResonanceService {
  private static instance: GlobalResonanceService | null = null
  private state: BentoState = {
    validItems: [],
    isLoading: false,
    error: null,
    lastProcessedHash: null
  }
  private listeners: Set<BentoStateListener> = new Set()

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
   * Process bento items and load previews
   */
  async processItems(bentoItems: BentoItem[]): Promise<void> {
    if (bentoItems.length === 0) {
      this.setState({ validItems: [], error: null })
      return
    }

    // Deduplicate items by URL to avoid "3x DeviantArt"
    const uniqueItems = bentoItems.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    )

    // Create hash of current items to detect changes
    const currentUrls = new Set(uniqueItems.map(item => item.url))
    const urlsHash = Array.from(currentUrls).sort().join('|')
    
    // Check if we already processed these exact URLs
    if (this.state.lastProcessedHash === urlsHash && this.state.validItems.length > 0) {
      console.log('🎯 [GlobalResonanceService] Skipping - already processed these URLs')
      return
    }

    this.setState({ 
      isLoading: true, 
      error: null,
      lastProcessedHash: urlsHash 
    })

    try {
      console.log('🖼️ [GlobalResonanceService] Loading previews for', uniqueItems.length, 'unique items')
      
      // Use RecommendationService (which has IndexedDB cache for images)
      const validSuggestions = await RecommendationService.getSuggestionsWithPreviews(uniqueItems)
      
      this.setState({ 
        validItems: validSuggestions,
        isLoading: false
      })
      
      console.log('✅ [GlobalResonanceService] Loaded', validSuggestions.length, 'valid items with images')
      
    } catch (err) {
      console.error('❌ [GlobalResonanceService] Error loading previews:', err)
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