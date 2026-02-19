/**
 * useOnChainIntentionGroups Hook
 * Fetches all intention AND OAuth certifications from on-chain where the user has a position
 * Groups them by domain for display in Echoes
 * Both intention predicates (visits for X) and OAuth predicates (follow, top_artist, etc.) count toward level
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { PREDICATE_IDS } from '../lib/config/chainConfig'
import { ALL_PREDICATE_IDS, PREDICATE_ID_TO_CERTIFICATION } from '../lib/config/predicateConstants'
import { createHookLogger } from '../lib/utils/logger'
import { calculateLevel } from '../lib/utils'
import { extractDomain } from '../lib/utils/domainUtils'
import { GetUserIntentionPositionsDocument } from '@0xsofia/graphql'

const logger = createHookLogger('useOnChainIntentionGroups')

export interface OnChainUrl {
  url: string
  label: string
  certification: string
  predicateId: string
  shares: string
  certifiedAt: string
}

export interface OnChainGroup {
  domain: string
  urls: OnChainUrl[]
  certifiedCount: number
  level: number
}

export interface UseOnChainIntentionGroupsResult {
  groups: OnChainGroup[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}


/**
 * Hook to fetch all on-chain intention certifications for the current user
 */
export const useOnChainIntentionGroups = (externalWalletAddress?: string): UseOnChainIntentionGroupsResult => {
  const { walletAddress: storedWallet } = useWalletFromStorage()
  const walletAddress = externalWalletAddress || storedWallet
  const [groups, setGroups] = useState<OnChainGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prevent concurrent fetches
  const isFetchingRef = useRef(false)
  const lastWalletRef = useRef<string | null>(null)

  const fetchGroups = useCallback(async () => {
    // Skip if no wallet or no predicate IDs configured
    if (!walletAddress || ALL_PREDICATE_IDS.length === 0) {
      setGroups([])
      setLoading(false)
      return
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      logger.debug('Skipping fetch - already in progress')
      return
    }

    isFetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      logger.debug('Fetching on-chain intention groups', { walletAddress })

      // Query for all triples where:
      // - predicate is an intention predicate
      // - user has a position (shares > 0)
      // Using document from @0xsofia/graphql
      const response = await intuitionGraphqlClient.request(GetUserIntentionPositionsDocument, {
        predicateIds: ALL_PREDICATE_IDS,
        userAddress: `%${walletAddress.toLowerCase()}%`
      })

      const triples = response?.triples || []
      logger.debug('Found intention + OAuth triples with user positions', { count: triples.length })

      // Group by domain
      const domainMap = new Map<string, OnChainUrl[]>()

      for (const triple of triples) {
        const label = triple.object?.label || ''
        // New atoms store the page title as label and the actual URL in value.thing.url
        // Old atoms store the URL directly as label
        const objectUrl = triple.object?.value?.thing?.url ?? undefined
        const urlSource = objectUrl || label
        const domain = extractDomain(objectUrl || label)

        if (!domain) {
          logger.debug('Skipping triple - could not extract domain', { label, objectUrl })
          continue
        }

        const predicateId = triple.predicate?.term_id || ''
        const certification = PREDICATE_ID_TO_CERTIFICATION[predicateId] || 'unknown'
        const position = triple.positions?.[0]

        const urlRecord: OnChainUrl = {
          url: urlSource.startsWith('http') ? urlSource : `https://${urlSource}`,
          label,
          certification,
          predicateId,
          shares: position?.shares || '0',
          certifiedAt: position?.created_at || ''
        }

        if (!domainMap.has(domain)) {
          domainMap.set(domain, [])
        }

        // Check for duplicates (same URL might have multiple certifications)
        const existingUrls = domainMap.get(domain)!
        const existing = existingUrls.find(u => u.url === urlRecord.url && u.certification === urlRecord.certification)
        if (!existing) {
          existingUrls.push(urlRecord)
        }
      }

      // Convert to groups with level calculation
      // "follow" predicate URLs should not create group cards in EchoesTab
      const FOLLOW_PREDICATE_ID = PREDICATE_IDS.FOLLOW
      const groupsList: OnChainGroup[] = Array.from(domainMap.entries()).map(([domain, urls]) => {
        const displayUrls = urls.filter(u => u.predicateId !== FOLLOW_PREDICATE_ID)
        return {
          domain,
          urls: displayUrls,
          certifiedCount: urls.length, // All certs (including follow) count toward level
          level: calculateLevel(urls.length)
        }
      }).filter(g => g.urls.length > 0) // Remove groups with only follow URLs

      // Sort by level (highest first), then by certified count
      groupsList.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level
        return b.certifiedCount - a.certifiedCount
      })

      setGroups(groupsList)
      lastWalletRef.current = walletAddress

      logger.info('On-chain intention groups loaded', {
        groupCount: groupsList.length,
        totalUrls: groupsList.reduce((sum, g) => sum + g.urls.length, 0)
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch on-chain groups'
      logger.error('Failed to fetch on-chain intention groups', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [walletAddress])

  // Fetch on mount and when wallet changes
  useEffect(() => {
    // Only refetch if wallet changed
    if (walletAddress !== lastWalletRef.current) {
      fetchGroups()
    }
  }, [walletAddress, fetchGroups])

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups
  }
}

export default useOnChainIntentionGroups
