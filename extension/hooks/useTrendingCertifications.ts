/**
 * useTrendingCertifications Hook
 * Fetches trending certifications across ALL users for each predicate category
 * Uses direct GraphQL client (not React Query hooks in a loop)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { GetTrendingByPredicateDocument } from '@0xsofia/graphql'
import { PREDICATE_IDS } from '../lib/config/chainConfig'
import { createHookLogger } from '../lib/utils/logger'
import { extractDomain } from '../lib/utils/domainUtils'
import type { IntentionType } from '../types/intentionCategories'

const logger = createHookLogger('useTrendingCertifications')

// Map each IntentionType to its predicate ID
const TRENDING_CATEGORIES = ([
  { type: 'trusted', predicateId: PREDICATE_IDS.TRUSTS },
  { type: 'distrusted', predicateId: PREDICATE_IDS.DISTRUST },
  { type: 'work', predicateId: PREDICATE_IDS.VISITS_FOR_WORK },
  { type: 'learning', predicateId: PREDICATE_IDS.VISITS_FOR_LEARNING },
  { type: 'fun', predicateId: PREDICATE_IDS.VISITS_FOR_FUN },
  { type: 'inspiration', predicateId: PREDICATE_IDS.VISITS_FOR_INSPIRATION },
  { type: 'buying', predicateId: PREDICATE_IDS.VISITS_FOR_BUYING },
  { type: 'music', predicateId: PREDICATE_IDS.VISITS_FOR_MUSIC },
] as { type: IntentionType; predicateId: string }[]).filter(c => !!c.predicateId)

export interface TrendingItem {
  termId: string
  objectTermId: string
  objectLabel: string
  objectUrl: string
  domain: string
  positionCount: number
  totalShares: string
  createdAt: string
}

export interface TrendingCategory {
  type: IntentionType
  items: TrendingItem[]
  totalCount: number
}

export interface UseTrendingResult {
  categories: TrendingCategory[]
  loading: boolean
  error: string | null
  refetchAll: () => Promise<void>
  available: boolean  // false on testnet when no predicate IDs
}

const FETCH_LIMIT = 50
const DISPLAY_LIMIT = 20

export function useTrendingCertifications(): UseTrendingResult {
  const [categories, setCategories] = useState<TrendingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchAll = useCallback(async (bypassCache = false) => {
    if (isFetchingRef.current) return
    if (TRENDING_CATEGORIES.length === 0) {
      setLoading(false)
      return
    }

    isFetchingRef.current = true
    setLoading(true)
    setError(null)

    // Clear cache on manual refetch to get fresh data
    if (bypassCache) {
      intuitionGraphqlClient.clearCache()
    }

    try {
      logger.info('Fetching trending certifications', {
        categories: TRENDING_CATEGORIES.length,
        bypassCache
      })

      const promises = TRENDING_CATEGORIES.map(async ({ type, predicateId }) => {
        const data = await intuitionGraphqlClient.request(
          GetTrendingByPredicateDocument,
          { predicateId, limit: FETCH_LIMIT, offset: 0 }
        )
        return { type, data }
      })

      const results = await Promise.allSettled(promises)

      const cats: TrendingCategory[] = results.map((result, i) => {
        const type = TRENDING_CATEGORIES[i].type

        if (result.status === 'fulfilled') {
          const { data } = result.value
          const triples = data?.triples || []
          const ENS_SUFFIXES = ['.eth', '.box']
          const WALLET_RE = /^0x[0-9a-f]{4,}$/i

          const items: TrendingItem[] = triples
            .filter((triple: any) => {
              const label = (triple.object?.label || '').toLowerCase()
              if (ENS_SUFFIXES.some(suffix => label.endsWith(suffix))) return false
              if (WALLET_RE.test(label.replace(/[\u2026.]+/g, ''))) return false
              const thingUrl = triple.object?.value?.thing?.url
              if (!thingUrl && !label.startsWith('http') && !/[\w-]+\.[\w.-]+/.test(label)) return false
              return true
            })
            .map((triple: any) => {
              const label = triple.object?.label || ''
              const thingUrl = triple.object?.value?.thing?.url
              const objectUrl = thingUrl || (label.startsWith('http') ? label : `https://${label}`)
              const domain = extractDomain(objectUrl) || objectUrl
              const positionCount = Number(triple.positions_aggregate?.aggregate?.count || 0)

              return {
                termId: triple.term_id,
                objectTermId: triple.object?.term_id || '',
                objectLabel: label || domain,
                objectUrl,
                domain,
                positionCount,
                totalShares: String(triple.triple_vault?.total_shares || '0'),
                createdAt: triple.created_at
              }
            })
            .sort((a, b) => b.positionCount - a.positionCount)
            .slice(0, DISPLAY_LIMIT)

          return {
            type,
            items,
            totalCount: data?.total?.aggregate?.count || 0
          }
        }

        logger.error(`Failed to fetch trending for ${type}`, result.reason)
        return { type, items: [], totalCount: 0 }
      })

      setCategories(cats)
      logger.info('Trending certifications loaded', {
        categories: cats.map(c => ({ type: c.type, count: c.items.length, total: c.totalCount }))
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch trending'
      logger.error('Failed to fetch trending certifications', err)
      setError(msg)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    categories,
    loading,
    error,
    refetchAll: () => fetchAll(true),
    available: TRENDING_CATEGORIES.length > 0
  }
}

export default useTrendingCertifications
