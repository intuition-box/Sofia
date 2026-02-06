/**
 * useDiscoveryScore Hook
 * Calculates user's discovery XP based on their Pioneer/Explorer/Contributor certifications
 *
 * Uses a singleton store — all consumers share one GraphQL fetch
 * instead of duplicating per-instance (was 4x before)
 *
 * XP Rewards:
 * - Pioneer (1st): +50 XP
 * - Explorer (2-10th): +20 XP
 * - Contributor (11+): +5 XP
 */

import { useSyncExternalStore } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import type { IntentionPurpose, UserDiscoveryStats } from '../types/discovery'
import { DISCOVERY_XP_REWARDS } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'
import {
  UserIntentionTriplesDocument,
  AllIntentionTriplesDocument,
  type UserIntentionTriplesQuery,
  type AllIntentionTriplesQuery
} from '@0xsofia/graphql'

const logger = createHookLogger('useDiscoveryScore')

// Types extracted from generated query results
type UserTripleResult = UserIntentionTriplesQuery['triples'][number]
type AllTripleResult = AllIntentionTriplesQuery['triples'][number]

// Predicate labels for all certification types (intentions + trust/distrust)
// NOTE: 'visits for learning ' has a trailing space due to a bug in atom creation
const CERTIFICATION_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning ',  // trailing space (official atom)
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'trusts',
  'distrust'
]

// Only intention predicates (for intention breakdown stats)
const INTENTION_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning ',
  'visits for fun',
  'visits for inspiration',
  'visits for buying'
]

// Map predicate labels to intention purposes
const PREDICATE_LABEL_TO_INTENTION: Record<string, IntentionPurpose> = {
  'visits for work': 'for_work',
  'visits for learning ': 'for_learning',  // trailing space (official atom)
  'visits for fun': 'for_fun',
  'visits for inspiration': 'for_inspiration',
  'visits for buying': 'for_buying'
}

export interface DiscoveryScoreResult {
  stats: UserDiscoveryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  claimedDiscoveryXP: number
  claimDiscoveryXP: (xpAmount: number) => Promise<number>
}

// ─── Singleton external store ───

interface DiscoveryState {
  stats: UserDiscoveryStats | null
  loading: boolean
  error: string | null
  claimedDiscoveryXP: number
}

let sharedState: DiscoveryState = {
  stats: null,
  loading: false,
  error: null,
  claimedDiscoveryXP: 0,
}

let initialized = false
let currentWallet: string | null = null
let fetchInFlight = false
const listeners = new Set<() => void>()

function notifyListeners() {
  for (const listener of listeners) listener()
}

function getSnapshot(): DiscoveryState {
  return sharedState
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!initialized) initializeStore()
  return () => listeners.delete(listener)
}

function updateState(partial: Partial<DiscoveryState>) {
  sharedState = { ...sharedState, ...partial }
  notifyListeners()
}

// ─── Core fetch logic (runs once per wallet change) ───

async function fetchDiscoveryScore(walletAddress: string) {
  if (fetchInFlight) return
  fetchInFlight = true

  console.log('🔍 [useDiscoveryScore] Starting fetch with:', {
    walletAddress,
    predicateLabels: CERTIFICATION_PREDICATE_LABELS
  })

  updateState({ loading: true, error: null })

  try {
    const userAddress = walletAddress.toLowerCase()

    logger.debug('Fetching discovery score', { userAddress })

    const [userTriples, allTriples] = await Promise.all([
      intuitionGraphqlClient.fetchAllPages<UserTripleResult>(
        UserIntentionTriplesDocument,
        { predicateLabels: CERTIFICATION_PREDICATE_LABELS, userAddress },
        'triples',
        100,
        100
      ),
      intuitionGraphqlClient.fetchAllPages<AllTripleResult>(
        AllIntentionTriplesDocument,
        { predicateLabels: CERTIFICATION_PREDICATE_LABELS },
        'triples',
        100,
        100
      )
    ])

    console.log('🔍 [useDiscoveryScore] Paginated results:', { userTriples: userTriples.length, allTriples: allTriples.length })

    // Debug: show all predicate labels found vs what we're looking for
    const foundPredicateLabels = new Set<string>()
    for (const triple of allTriples) {
      if (triple.predicate?.label) foundPredicateLabels.add(triple.predicate.label)
    }
    console.log('🔍 [useDiscoveryScore] Predicate labels we search for:', INTENTION_PREDICATE_LABELS)
    console.log('🔍 [useDiscoveryScore] Predicate labels found in results:', Array.from(foundPredicateLabels))

    // Debug: show all account_ids in positions to compare with userAddress
    const allAccountIds = new Set<string>()
    for (const triple of allTriples) {
      for (const pos of triple.positions || []) {
        if (pos.account_id) allAccountIds.add(pos.account_id)
      }
    }
    console.log('🔍 [useDiscoveryScore] All position account_ids:', Array.from(allAccountIds))
    console.log('🔍 [useDiscoveryScore] Looking for userAddress:', userAddress)

    console.log('🔍 [useDiscoveryScore] Found triples:', {
      userTriples: userTriples.length,
      allTriples: allTriples.length,
      userTriplesData: userTriples
    })

    logger.debug('Found triples', {
      userTriples: userTriples.length,
      allTriples: allTriples.length
    })

    // Build a map of pages -> ordered list of unique position holders (by created_at)
    const pagePositionMap = new Map<string, { accountId: string; createdAt: string }[]>()

    for (const triple of allTriples) {
      const objectId = triple.object?.term_id
      const positions = triple.positions || []

      if (!objectId) continue

      if (!pagePositionMap.has(objectId)) {
        pagePositionMap.set(objectId, [])
      }

      const pagePositions = pagePositionMap.get(objectId)!

      for (const pos of positions) {
        const accountId = pos.account_id?.toLowerCase()
        const createdAt = pos.created_at
        if (accountId && createdAt && !pagePositions.some(p => p.accountId === accountId)) {
          pagePositions.push({ accountId, createdAt })
        }
      }
    }

    // Positions are already sorted by created_at from GraphQL, but ensure sort
    for (const [, positions] of pagePositionMap) {
      positions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    // Calculate user's status on each page they certified
    let pioneerCount = 0
    let explorerCount = 0
    let contributorCount = 0
    const intentionBreakdown: Record<IntentionPurpose, number> = {
      for_work: 0,
      for_learning: 0,
      for_fun: 0,
      for_inspiration: 0,
      for_buying: 0
    }

    const processedPages = new Set<string>()

    for (const triple of userTriples) {
      const objectId = triple.object?.term_id
      const predicateLabel = triple.predicate?.label?.toLowerCase()

      if (!objectId) continue

      const intentionPurpose = predicateLabel ? PREDICATE_LABEL_TO_INTENTION[predicateLabel] : null
      if (intentionPurpose) {
        intentionBreakdown[intentionPurpose]++
      }

      if (processedPages.has(objectId)) continue
      processedPages.add(objectId)

      const pagePositions = pagePositionMap.get(objectId) || []
      const userRank = pagePositions.findIndex(p => p.accountId === userAddress) + 1

      if (userRank === 1) {
        pioneerCount++
      } else if (userRank <= 10) {
        explorerCount++
      } else if (userRank > 0) {
        contributorCount++
      }
    }

    const xpFromPioneer = pioneerCount * DISCOVERY_XP_REWARDS.PIONEER
    const xpFromExplorer = explorerCount * DISCOVERY_XP_REWARDS.EXPLORER
    const xpFromContributor = contributorCount * DISCOVERY_XP_REWARDS.CONTRIBUTOR

    const discoveryStats: UserDiscoveryStats = {
      pioneerCount,
      explorerCount,
      contributorCount,
      totalCertifications: processedPages.size,
      intentionBreakdown,
      discoveryXP: {
        fromPioneer: xpFromPioneer,
        fromExplorer: xpFromExplorer,
        fromContributor: xpFromContributor,
        total: xpFromPioneer + xpFromExplorer + xpFromContributor
      }
    }

    updateState({ stats: discoveryStats, loading: false })

    logger.info('Discovery score calculated', {
      pioneerCount,
      explorerCount,
      contributorCount,
      totalXP: discoveryStats.discoveryXP.total
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch discovery score'
    logger.error('Failed to fetch discovery score', err)
    updateState({ error: errorMessage, loading: false })
  } finally {
    fetchInFlight = false
  }
}

// ─── Claimed XP management ───

async function loadClaimedXP(walletAddress: string) {
  try {
    const key = `claimed_discovery_xp_${walletAddress}`
    const result = await chrome.storage.local.get([key])
    const xp = result[key] || 0
    updateState({ claimedDiscoveryXP: xp })
    logger.debug('Loaded claimed discovery XP from storage', { xp, walletAddress })
  } catch (err) {
    logger.error('Failed to load claimed discovery XP', err)
  }
}

async function claimXP(xpAmount: number): Promise<number> {
  if (!currentWallet) return sharedState.claimedDiscoveryXP
  const key = `claimed_discovery_xp_${currentWallet}`
  const newTotal = sharedState.claimedDiscoveryXP + xpAmount
  await chrome.storage.local.set({ [key]: newTotal })
  updateState({ claimedDiscoveryXP: newTotal })
  logger.info('Claimed discovery XP', { xpAmount, newTotal, walletAddress: currentWallet })
  return newTotal
}

// ─── Store initialization ───

function initializeStore() {
  if (initialized) return
  initialized = true

  // Read wallet from session storage and fetch
  chrome.storage.session.get(['walletAddress']).then(result => {
    const wallet = result.walletAddress || null
    handleWalletChange(wallet)
  }).catch(err => {
    console.error('[useDiscoveryScore] Failed to read wallet:', err)
  })

  // Listen for wallet changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session' && changes.walletAddress) {
      const wallet = changes.walletAddress.newValue || null
      handleWalletChange(wallet)
    }
  })
}

function handleWalletChange(wallet: string | null) {
  const normalized = wallet ? wallet.toLowerCase() : null
  if (normalized === currentWallet) return
  currentWallet = normalized

  if (!wallet) {
    updateState({ stats: null, loading: false, error: null, claimedDiscoveryXP: 0 })
    return
  }

  loadClaimedXP(wallet)
  fetchDiscoveryScore(wallet)
}

// ─── Refetch (shared, prevents duplicate in-flight) ───

async function refetch(): Promise<void> {
  if (!currentWallet) return
  await fetchDiscoveryScore(currentWallet)
}

// ─── React hook ───

export const useDiscoveryScore = (): DiscoveryScoreResult => {
  const state = useSyncExternalStore(subscribe, getSnapshot)
  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    claimedDiscoveryXP: state.claimedDiscoveryXP,
    refetch,
    claimDiscoveryXP: claimXP,
  }
}
