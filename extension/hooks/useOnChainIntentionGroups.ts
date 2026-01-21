/**
 * useOnChainIntentionGroups Hook
 * Fetches all intention certifications from on-chain where the user has a position
 * Groups them by domain for display in Echoes
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { PREDICATE_IDS } from '../lib/config/chainConfig'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useOnChainIntentionGroups')

// Intention predicate IDs
const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING
].filter(Boolean)

// Map predicate IDs to certification labels
const PREDICATE_TO_CERTIFICATION: Record<string, string> = {}
if (PREDICATE_IDS.VISITS_FOR_WORK) PREDICATE_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_WORK] = 'work'
if (PREDICATE_IDS.VISITS_FOR_LEARNING) PREDICATE_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_LEARNING] = 'learning'
if (PREDICATE_IDS.VISITS_FOR_FUN) PREDICATE_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_FUN] = 'fun'
if (PREDICATE_IDS.VISITS_FOR_INSPIRATION) PREDICATE_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_INSPIRATION] = 'inspiration'
if (PREDICATE_IDS.VISITS_FOR_BUYING) PREDICATE_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_BUYING] = 'buying'

// Level thresholds (certifications needed per level)
const LEVEL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]

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
 * Extract domain from a label (format: "domain.com" or "domain.com/path")
 */
function extractDomain(label: string): string | null {
  if (!label) return null
  try {
    // Remove protocol if present
    let cleaned = label.replace(/^https?:\/\//, '')
    // Get the domain part (before first /)
    const parts = cleaned.split('/')
    const domain = parts[0]
    // Basic validation
    if (domain && domain.includes('.')) {
      return domain.toLowerCase()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Calculate level from certification count
 */
function calculateLevel(certCount: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (certCount >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Hook to fetch all on-chain intention certifications for the current user
 */
export const useOnChainIntentionGroups = (): UseOnChainIntentionGroupsResult => {
  const { walletAddress } = useWalletFromStorage()
  const [groups, setGroups] = useState<OnChainGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prevent concurrent fetches
  const isFetchingRef = useRef(false)
  const lastWalletRef = useRef<string | null>(null)

  const fetchGroups = useCallback(async () => {
    // Skip if no wallet or no predicate IDs configured
    if (!walletAddress || INTENTION_PREDICATE_IDS.length === 0) {
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
      const query = `
        query GetUserIntentionPositions($predicateIds: [String!]!, $userAddress: String!) {
          triples(
            where: {
              predicate_id: { _in: $predicateIds }
              positions: {
                account_id: { _ilike: $userAddress }
                shares: { _gt: "0" }
              }
            }
          ) {
            term_id
            predicate_id
            object {
              label
            }
            positions(
              where: {
                account_id: { _ilike: $userAddress }
                shares: { _gt: "0" }
              }
            ) {
              shares
              created_at
            }
          }
        }
      `

      const response = await intuitionGraphqlClient.request(query, {
        predicateIds: INTENTION_PREDICATE_IDS,
        userAddress: `%${walletAddress.toLowerCase()}%`
      })

      const triples = response?.triples || []
      logger.debug('Found intention triples with user positions', { count: triples.length })

      // Group by domain
      const domainMap = new Map<string, OnChainUrl[]>()

      for (const triple of triples) {
        const label = triple.object?.label || ''
        const domain = extractDomain(label)

        if (!domain) {
          logger.debug('Skipping triple - could not extract domain', { label })
          continue
        }

        const certification = PREDICATE_TO_CERTIFICATION[triple.predicate_id] || 'unknown'
        const position = triple.positions?.[0]

        const urlRecord: OnChainUrl = {
          url: label.startsWith('http') ? label : `https://${label}`,
          label,
          certification,
          predicateId: triple.predicate_id,
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
      const groupsList: OnChainGroup[] = Array.from(domainMap.entries()).map(([domain, urls]) => ({
        domain,
        urls,
        certifiedCount: urls.length,
        level: calculateLevel(urls.length)
      }))

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
