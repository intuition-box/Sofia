/**
 * useUserCertifications Hook
 * Singleton store pattern - fetches ALL on-chain certifications for the current user
 * No Provider needed - uses module-level cache with React subscription
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { PREDICATE_NAMES } from '../lib/config/chainConfig'
import type { IntentionPurpose } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useUserCertifications')

// Intention predicate labels - clean labels WITHOUT trailing spaces
// We search for BOTH versions (with/without space) to catch legacy data
const INTENTION_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',   // Clean version (new)
  'visits for learning ',  // Legacy version with trailing space (old on-chain data)
  'visits for fun',
  'visits for inspiration',
  'visits for buying'
]

// OAuth predicate labels (from PlatformRegistry.ts)
const OAUTH_PREDICATE_LABELS = [
  PREDICATE_NAMES.FOLLOW,      // "follow" - YouTube subs, Spotify, Twitch
  'member_of',                  // Discord guilds
  'owner_of',                   // Discord guild owner
  'created_playlist',           // YouTube playlists
  'top_track',                  // Spotify
  'top_artist',                 // Spotify
].filter(Boolean)

// All predicate labels to query
const ALL_PREDICATE_LABELS = [
  ...INTENTION_PREDICATE_LABELS,
  ...OAUTH_PREDICATE_LABELS
]

// Map predicate labels to intention types (handle both with/without trailing space)
const PREDICATE_LABEL_TO_INTENTION: Record<string, IntentionPurpose> = {
  'visits for work': 'for_work',
  'visits for learning': 'for_learning',
  'visits for learning ': 'for_learning',  // Handle trailing space variant
  'visits for fun': 'for_fun',
  'visits for inspiration': 'for_inspiration',
  'visits for buying': 'for_buying'
}

// Certification entry stored in the cache
export interface CertificationEntry {
  label: string                     // The object label (e.g., "youtube.com/watch?v=xxx")
  intentions: IntentionPurpose[]    // Intention predicates (for_work, for_learning, etc.)
  oauthPredicates: string[]         // OAuth predicates (follow, member_of, etc.)
  isRootDomain: boolean             // True if label has no path (e.g., "youtube.com")
}

export interface UserCertificationsState {
  certifications: Map<string, CertificationEntry>
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  refetch: () => Promise<void>
}

// ============================================
// Singleton Store (module-level state)
// ============================================

interface StoreState {
  certifications: Map<string, CertificationEntry>
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  walletAddress: string | null
}

let storeState: StoreState = {
  certifications: new Map(),
  loading: false,
  error: null,
  lastFetchedAt: null,
  walletAddress: null
}

let isFetching = false
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): StoreState {
  return storeState
}

async function fetchCertifications(walletAddress: string): Promise<void> {
  if (!walletAddress || ALL_PREDICATE_LABELS.length === 0) {
    storeState = { ...storeState, certifications: new Map(), loading: false }
    emitChange()
    return
  }

  if (isFetching) {
    logger.debug('Skipping fetch - already in progress')
    return
  }

  isFetching = true
  storeState = { ...storeState, loading: true, error: null }
  emitChange()

  try {
    logger.info('Fetching ALL user certifications with pagination', { predicateLabels: ALL_PREDICATE_LABELS })

    // Use predicate labels instead of IDs for testnet compatibility - PAGINATED
    const query = `
      query UserAllCertifications($predicateLabels: [String!]!, $userAddress: String!, $limit: Int!, $offset: Int!) {
        triples(
          where: {
            predicate: { label: { _in: $predicateLabels } }
            positions: {
              account_id: { _ilike: $userAddress }
              shares: { _gt: "0" }
            }
          }
          limit: $limit
          offset: $offset
        ) {
          predicate {
            label
          }
          object {
            label
          }
        }
      }
    `

    interface CertTripleResult {
      predicate: { label: string }
      object: { label: string }
    }

    const triples = await intuitionGraphqlClient.fetchAllPages<CertTripleResult>(
      query,
      { predicateLabels: ALL_PREDICATE_LABELS, userAddress: walletAddress.toLowerCase() },
      'triples',
      100,
      100
    )
    logger.info('Fetched user certifications (paginated)', { count: triples.length })

    // Debug: Log all raw triples for investigation
    logger.debug('Raw triples from GraphQL:', triples.map((t: { predicate?: { label?: string }, object?: { label?: string } }) => ({
      predicate: t.predicate?.label,
      object: t.object?.label
    })))

    const newCertifications = new Map<string, CertificationEntry>()

    for (const triple of triples) {
      const objectLabel = triple.object?.label || ''
      const predicateLabel = triple.predicate?.label || ''

      // Check if it's an intention predicate or OAuth predicate
      const intention = PREDICATE_LABEL_TO_INTENTION[predicateLabel]
      const isOAuthPredicate = OAUTH_PREDICATE_LABELS.includes(predicateLabel)

      // Debug: Log each triple processing
      logger.debug('Processing triple:', { objectLabel, predicateLabel, intention, isOAuthPredicate })

      if (!objectLabel || (!intention && !isOAuthPredicate)) continue

      // Normalize the label (remove protocol, www., trailing slash, lowercase)
      const normalizedLabel = objectLabel
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase()

      // Check if it's a root domain (no path)
      const isRootDomain = !normalizedLabel.includes('/')

      const existing = newCertifications.get(normalizedLabel)
      if (existing) {
        if (intention && !existing.intentions.includes(intention)) {
          existing.intentions.push(intention)
        }
        if (isOAuthPredicate && !existing.oauthPredicates.includes(predicateLabel)) {
          existing.oauthPredicates.push(predicateLabel)
        }
      } else {
        newCertifications.set(normalizedLabel, {
          label: normalizedLabel,
          intentions: intention ? [intention] : [],
          oauthPredicates: isOAuthPredicate ? [predicateLabel] : [],
          isRootDomain
        })
      }
    }

    storeState = {
      ...storeState,
      certifications: newCertifications,
      loading: false,
      lastFetchedAt: Date.now(),
      walletAddress
    }

    // Debug: Log full cache details
    logger.info('User certifications cache updated', {
      uniqueLabels: newCertifications.size,
      labels: Array.from(newCertifications.keys()).slice(0, 20)
    })

    // Debug: Log certifications with their intentions for investigation
    newCertifications.forEach((entry, key) => {
      if (entry.intentions.length > 0 || entry.oauthPredicates.length > 0) {
        logger.debug('Cached certification:', {
          key,
          intentions: entry.intentions,
          oauthPredicates: entry.oauthPredicates,
          isRootDomain: entry.isRootDomain
        })
      }
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch certifications'
    logger.error('Failed to fetch user certifications', err)
    storeState = { ...storeState, loading: false, error: errorMessage }
  } finally {
    isFetching = false
    emitChange()
  }
}

function clearCache(): void {
  storeState = {
    certifications: new Map(),
    loading: false,
    error: null,
    lastFetchedAt: null,
    walletAddress: null
  }
  emitChange()
}

// ============================================
// React Hook
// ============================================

/**
 * Hook to access the global certifications cache
 * Automatically fetches when wallet address changes
 */
export function useUserCertifications(walletAddress: string | null): UserCertificationsState {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  // Fetch when wallet changes
  useEffect(() => {
    if (walletAddress && walletAddress !== state.walletAddress) {
      fetchCertifications(walletAddress)
    } else if (!walletAddress && state.walletAddress) {
      clearCache()
    }
  }, [walletAddress, state.walletAddress])

  const refetch = useCallback(async () => {
    if (walletAddress) {
      await fetchCertifications(walletAddress)
    }
  }, [walletAddress])

  return {
    certifications: state.certifications,
    loading: state.loading,
    error: state.error,
    lastFetchedAt: state.lastFetchedAt,
    refetch
  }
}

/**
 * Helper to check if a URL is certified
 * Returns the intentions if certified, null otherwise
 */
export function getCertificationForUrl(
  certifications: Map<string, CertificationEntry>,
  url: string
): CertificationEntry | null {
  try {
    const urlObj = new URL(url)
    let hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname
    const search = urlObj.search

    // Remove www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }

    // Build normalized label with path and query
    const fullPath = pathname + search
    const normalizedLabel = fullPath && fullPath !== '/'
      ? `${hostname}${fullPath.replace(/\/$/, '')}`
      : hostname

    // First try exact match
    const exactMatch = certifications.get(normalizedLabel)
    if (exactMatch) {
      return exactMatch
    }

    // If URL is a root domain, don't fall back to anything
    // If URL has a path, DON'T match with root domain certification
    // This prevents "youtube.com" certification from matching "youtube.com/watch?v=xxx"

    return null
  } catch {
    return null
  }
}

export default useUserCertifications
