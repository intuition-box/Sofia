/**
 * usePageIntentionStats Hook
 * Fetches intention statistics for a specific page from Intuition
 * Shows breakdown of intentions (work, learning, fun, inspiration, buying)
 */

import { useState, useCallback, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import type { IntentionPurpose } from '../types/discovery'
import {
  INTENTION_PREDICATE_IDS,
  PREDICATE_ID_TO_INTENTION
} from '../lib/config/predicateConstants'
import { createHookLogger } from '../lib/utils/logger'
import { IntentionStatsDocument } from '@0xsofia/graphql'

const logger = createHookLogger('usePageIntentionStats')

export interface PageIntentionStats {
  intentions: Record<IntentionPurpose, number>
  totalCertifications: number
  maxIntentionCount: number // For progress bar scaling
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const usePageIntentionStats = (pageUrl: string | null): PageIntentionStats => {
  const [intentions, setIntentions] = useState<Record<IntentionPurpose, number>>({
    for_work: 0,
    for_learning: 0,
    for_fun: 0,
    for_inspiration: 0,
    for_buying: 0,
    for_music: 0
  })
  const [totalCertifications, setTotalCertifications] = useState(0)
  const [maxIntentionCount, setMaxIntentionCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIntentionStats = useCallback(async () => {
    if (!pageUrl || INTENTION_PREDICATE_IDS.length === 0) {
      setIntentions({
        for_work: 0,
        for_learning: 0,
        for_fun: 0,
        for_inspiration: 0,
        for_buying: 0,
        for_music: 0
      })
      setTotalCertifications(0)
      setMaxIntentionCount(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Extract hostname for matching
      const hostname = new URL(pageUrl).hostname

      logger.debug('Fetching intention stats', { pageUrl, hostname })

      // Query to find all intention triples for this page
      // Using document from @0xsofia/graphql
      const response = await intuitionGraphqlClient.request(IntentionStatsDocument, {
        predicateIds: INTENTION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`
      })

      const triples = response?.triples || []

      logger.debug('Found intention triples for stats', { count: triples.length })

      // Count intentions by type (unique position holders per intention)
      const intentionCounts: Record<IntentionPurpose, Set<string>> = {
        for_work: new Set(),
        for_learning: new Set(),
        for_fun: new Set(),
        for_inspiration: new Set(),
        for_buying: new Set(),
        for_music: new Set()
      }

      for (const triple of triples) {
        const predicateId = triple.predicate_id
        const intentionPurpose = PREDICATE_ID_TO_INTENTION[predicateId]

        if (intentionPurpose && triple.positions) {
          // Count unique position holders
          for (const position of triple.positions) {
            const accountId = position.account_id?.toLowerCase()
            if (accountId) {
              intentionCounts[intentionPurpose].add(accountId)
            }
          }
        }
      }

      // Convert sets to counts
      const counts: Record<IntentionPurpose, number> = {
        for_work: intentionCounts.for_work.size,
        for_learning: intentionCounts.for_learning.size,
        for_fun: intentionCounts.for_fun.size,
        for_inspiration: intentionCounts.for_inspiration.size,
        for_buying: intentionCounts.for_buying.size,
        for_music: intentionCounts.for_music.size
      }

      // Calculate totals
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
      const max = Math.max(...Object.values(counts), 1) // At least 1 for progress bar scaling

      setIntentions(counts)
      setTotalCertifications(total)
      setMaxIntentionCount(max)

      logger.info('Intention stats calculated', { counts, total })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch intention stats'
      logger.error('Failed to fetch intention stats', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [pageUrl])

  // Fetch on mount and when URL changes
  useEffect(() => {
    fetchIntentionStats()
  }, [fetchIntentionStats])

  return {
    intentions,
    totalCertifications,
    maxIntentionCount,
    loading,
    error,
    refetch: fetchIntentionStats
  }
}
