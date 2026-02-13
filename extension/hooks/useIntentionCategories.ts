/**
 * useIntentionCategories Hook
 * Transforms on-chain intention groups (by domain) into categories (by intention type)
 * Used for the Collections section in BookmarkTab
 */

import { useState, useMemo, useCallback } from 'react'
import { useOnChainIntentionGroups } from './useOnChainIntentionGroups'
import type { IntentionType, IntentionCategory, CategoryUrl } from '../types/intentionCategories'
import { INTENTION_CONFIG } from '../types/intentionCategories'

export interface UseIntentionCategoriesResult {
  categories: IntentionCategory[]
  selectedCategory: IntentionCategory | null
  loading: boolean
  error: string | null
  selectCategory: (categoryId: IntentionType | null) => void
  refetch: () => Promise<void>
}

/**
 * Hook to get intention categories with on-chain URLs grouped by intention type
 */
export function useIntentionCategories(walletAddress?: string): UseIntentionCategoriesResult {
  const { groups, loading, error, refetch } = useOnChainIntentionGroups(walletAddress)
  const [selectedCategoryId, setSelectedCategoryId] = useState<IntentionType | null>(null)

  // Transform domain-grouped data into intention-grouped categories
  const categories = useMemo(() => {
    const categoryMap: Record<IntentionType, CategoryUrl[]> = {
      trusted: [],
      distrusted: [],
      work: [],
      learning: [],
      fun: [],
      inspiration: [],
      buying: []
    }

    // Iterate through all domain groups and their URLs
    for (const group of groups) {
      for (const url of group.urls) {
        const certification = url.certification as IntentionType
        if (certification && categoryMap[certification]) {
          categoryMap[certification].push({
            url: url.url,
            label: url.label,
            domain: group.domain,
            favicon: `https://www.google.com/s2/favicons?domain=${group.domain}&sz=32`,
            certifiedAt: url.certifiedAt,
            shares: url.shares
          })
        }
      }
    }

    // Sort URLs in each category by certifiedAt (newest first)
    for (const key of Object.keys(categoryMap) as IntentionType[]) {
      categoryMap[key].sort((a, b) => {
        const dateA = new Date(a.certifiedAt).getTime() || 0
        const dateB = new Date(b.certifiedAt).getTime() || 0
        return dateB - dateA
      })
    }

    // Build category objects with metadata from config
    return Object.entries(INTENTION_CONFIG).map(([id, config]) => ({
      id: id as IntentionType,
      label: config.label,
      color: config.color,
      urls: categoryMap[id as IntentionType],
      urlCount: categoryMap[id as IntentionType].length
    }))
  }, [groups])

  // Get the selected category object
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null
    return categories.find(c => c.id === selectedCategoryId) || null
  }, [categories, selectedCategoryId])

  // Select a category by ID
  const selectCategory = useCallback((categoryId: IntentionType | null) => {
    setSelectedCategoryId(categoryId)
  }, [])

  return {
    categories,
    selectedCategory,
    loading,
    error,
    selectCategory,
    refetch
  }
}

export default useIntentionCategories
