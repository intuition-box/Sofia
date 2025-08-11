/**
 * useSearchHistory Hook
 * Manages search history with IndexedDB
 * Replaces localStorage search query management
 */

import { useState, useEffect, useCallback } from 'react'
import { searchHistoryService } from '~lib/indexedDB-methods'
import type { SearchRecord } from '~lib/indexedDB'

interface UseSearchHistoryResult {
  // Search history data
  searchHistory: SearchRecord[]
  recentSearches: SearchRecord[]
  lastSearch: string | null
  currentQuery: string
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  addSearch: (query: string, results?: any[]) => Promise<void>
  setCurrentQuery: (query: string) => void
  searchInHistory: (searchTerm: string) => Promise<SearchRecord[]>
  clearHistory: () => Promise<void>
  deleteOldSearches: (daysToKeep?: number) => Promise<number>
  refreshHistory: () => Promise<void>
  
  // Utilities
  getPopularSearches: (limit?: number) => SearchRecord[]
  getSuggestions: (partialQuery: string) => string[]
  hasSearchHistory: boolean
}

interface UseSearchHistoryOptions {
  maxRecentSearches?: number
  autoLoad?: boolean
  enableSuggestions?: boolean
  minQueryLength?: number
}

/**
 * Hook for managing search history
 */
export const useSearchHistory = (options: UseSearchHistoryOptions = {}): UseSearchHistoryResult => {
  const {
    maxRecentSearches = 20,
    autoLoad = true,
    enableSuggestions = true,
    minQueryLength = 2
  } = options

  // State
  const [searchHistory, setSearchHistory] = useState<SearchRecord[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([])
  const [lastSearch, setLastSearch] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load search history from IndexedDB
   */
  const loadSearchHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get recent searches
      const recent = await searchHistoryService.getRecentSearches(maxRecentSearches)
      setRecentSearches(recent)
      setSearchHistory(recent)

      // Get last search
      const last = await searchHistoryService.getLastSearch()
      setLastSearch(last)
      
      // Set current query to last search if available
      if (last && !currentQuery) {
        setCurrentQuery(last)
      }

      console.log(`🔍 Loaded ${recent.length} recent searches`)

    } catch (err) {
      console.error('❌ Error loading search history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load search history')
    } finally {
      setIsLoading(false)
    }
  }, [maxRecentSearches, currentQuery])

  /**
   * Add a search to history
   */
  const addSearch = useCallback(async (query: string, results?: any[]) => {
    try {
      // Skip empty or very short queries
      if (!query.trim() || query.trim().length < minQueryLength) {
        return
      }

      setIsSaving(true)
      setError(null)

      await searchHistoryService.addSearch(query.trim(), results)
      
      // Update current query
      setCurrentQuery(query.trim())
      
      // Refresh history
      await loadSearchHistory()
      
      console.log('✅ Search added to history:', query.trim())

    } catch (err) {
      console.error('❌ Error adding search to history:', err)
      setError(err instanceof Error ? err.message : 'Failed to add search to history')
    } finally {
      setIsSaving(false)
    }
  }, [minQueryLength, loadSearchHistory])

  /**
   * Search within history
   */
  const searchInHistory = useCallback(async (searchTerm: string): Promise<SearchRecord[]> => {
    try {
      setError(null)
      
      if (!searchTerm.trim()) {
        return recentSearches
      }

      const results = await searchHistoryService.searchInHistory(searchTerm.trim())
      return results

    } catch (err) {
      console.error('❌ Error searching in history:', err)
      setError(err instanceof Error ? err.message : 'Failed to search in history')
      return []
    }
  }, [recentSearches])

  /**
   * Clear all search history
   */
  const clearHistory = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      await searchHistoryService.clearHistory()
      
      // Clear local state
      setSearchHistory([])
      setRecentSearches([])
      setLastSearch(null)
      setCurrentQuery('')
      
      console.log('🗑️ Search history cleared')

    } catch (err) {
      console.error('❌ Error clearing search history:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear search history')
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Delete old searches
   */
  const deleteOldSearches = useCallback(async (daysToKeep: number = 90): Promise<number> => {
    try {
      setIsSaving(true)
      setError(null)

      const deletedCount = await searchHistoryService.deleteOldSearches(daysToKeep)
      
      // Refresh history after cleanup
      await loadSearchHistory()
      
      console.log(`🧹 Deleted ${deletedCount} old searches`)
      return deletedCount

    } catch (err) {
      console.error('❌ Error deleting old searches:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete old searches')
      return 0
    } finally {
      setIsSaving(false)
    }
  }, [loadSearchHistory])

  /**
   * Refresh search history
   */
  const refreshHistory = useCallback(async () => {
    await loadSearchHistory()
  }, [loadSearchHistory])

  /**
   * Get popular searches (most frequent)
   */
  const getPopularSearches = useCallback((limit: number = 10): SearchRecord[] => {
    // Group by query and count frequency
    const queryCount = new Map<string, { count: number, record: SearchRecord }>()
    
    searchHistory.forEach(search => {
      const existing = queryCount.get(search.query.toLowerCase())
      if (existing) {
        existing.count++
        // Keep the most recent record
        if (search.timestamp > existing.record.timestamp) {
          existing.record = search
        }
      } else {
        queryCount.set(search.query.toLowerCase(), { count: 1, record: search })
      }
    })

    // Sort by count and return top queries
    return Array.from(queryCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.record)
  }, [searchHistory])

  /**
   * Get search suggestions based on partial query
   */
  const getSuggestions = useCallback((partialQuery: string): string[] => {
    if (!enableSuggestions || !partialQuery.trim() || partialQuery.length < minQueryLength) {
      return []
    }

    const query = partialQuery.toLowerCase().trim()
    const suggestions = new Set<string>()

    // Find matching queries
    recentSearches.forEach(search => {
      if (search.query.toLowerCase().startsWith(query) && search.query.toLowerCase() !== query) {
        suggestions.add(search.query)
      }
    })

    // Limit suggestions
    return Array.from(suggestions).slice(0, 5)
  }, [recentSearches, enableSuggestions, minQueryLength])

  // Derived state
  const hasSearchHistory = searchHistory.length > 0

  /**
   * Load search history on mount
   */
  useEffect(() => {
    if (autoLoad) {
      loadSearchHistory()
    }
  }, [autoLoad, loadSearchHistory])

  return {
    // Search history data
    searchHistory,
    recentSearches,
    lastSearch,
    currentQuery,
    
    // Loading states
    isLoading,
    isSaving,
    error,
    
    // Actions
    addSearch,
    setCurrentQuery,
    searchInHistory,
    clearHistory,
    deleteOldSearches,
    refreshHistory,
    
    // Utilities
    getPopularSearches,
    getSuggestions,
    hasSearchHistory
  }
}

/**
 * Simple hook for just adding searches (write-only)
 */
export const useSearchTracker = () => {
  const { addSearch, isSaving, error } = useSearchHistory({ autoLoad: false })

  return {
    trackSearch: addSearch,
    isSaving,
    error
  }
}

/**
 * Hook for search suggestions only
 */
export const useSearchSuggestions = (partialQuery: string) => {
  const { getSuggestions, recentSearches, isLoading } = useSearchHistory()
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (partialQuery.trim()) {
      const newSuggestions = getSuggestions(partialQuery)
      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }, [partialQuery, getSuggestions])

  return {
    suggestions,
    recentSearches: recentSearches.slice(0, 5), // Show top 5 recent
    isLoading
  }
}

/**
 * Hook for current search state (replaces localStorage usage)
 */
export const useCurrentSearch = () => {
  const {
    currentQuery,
    setCurrentQuery,
    lastSearch,
    addSearch,
    isSaving
  } = useSearchHistory()

  const submitSearch = useCallback(async (query?: string) => {
    const searchQuery = query || currentQuery
    if (searchQuery.trim()) {
      await addSearch(searchQuery.trim())
    }
  }, [currentQuery, addSearch])

  return {
    currentQuery,
    setCurrentQuery,
    lastSearch,
    submitSearch,
    isSaving
  }
}

export default useSearchHistory