/**
 * useQuestSystem Hook
 * Manages user quests, progression, XP, and levels based on real user data
 *
 * Orchestrates:
 * - QuestBadgeService: on-chain badge checking, claiming, social link verification
 * - QuestProgressService: data fetching, caching, persistence
 * - questStatusHelpers: pure functions for quest status computation
 * - questTypes: shared types and QUEST_DEFINITIONS
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { useBookmarks } from './useBookmarks'
import { useDiscoveryScore } from './useDiscoveryScore'
import { useCreateAtom } from './useCreateAtom'
import { QuestBadgeService } from '../lib/services/QuestBadgeService'
import { QuestProgressService } from '../lib/services/QuestProgressService'
import { computeQuestStatuses, calculateLevelFromXP, calculateXPForNextLevel, getClaimId } from '../lib/utils/questStatusHelpers'
import { QUEST_DEFINITIONS } from '../types/questTypes'
import type { Quest, UserProgress, QuestSystemResult } from '../types/questTypes'

// Re-export types for backward compatibility
export type { Quest, UserProgress, QuestSystemResult }

// Helper to generate wallet-scoped storage keys
const getWalletKey = (baseKey: string, wallet: string) => `${baseKey}_${wallet}`

/**
 * useQuestSystem Hook
 * @param targetWalletAddress - Optional wallet address to fetch quests for (read-only mode)
 *                              If not provided, uses the connected wallet (full interactive mode)
 */
export const useQuestSystem = (targetWalletAddress?: string): QuestSystemResult => {
  const { walletAddress: viewerWalletAddress } = useWalletFromStorage()

  // If targetWalletAddress is provided, use it for queries (read-only mode)
  // Otherwise use the viewer's wallet (full interactive mode with claims/saves)
  const walletAddress = targetWalletAddress || viewerWalletAddress
  const isReadOnlyMode = !!targetWalletAddress

  // Only use these hooks in interactive mode (they're viewer-specific)
  const bookmarksData = useBookmarks()
  const discoveryData = useDiscoveryScore()

  const { lists, triplets } = isReadOnlyMode ? { lists: [], triplets: [] } : bookmarksData
  const { stats: discoveryStats, claimDiscoveryXP } = isReadOnlyMode
    ? { stats: undefined, claimDiscoveryXP: async () => 0 }
    : discoveryData

  // React state
  const [userProgress, setUserProgress] = useState<UserProgress>({
    signalsCreated: 0, bookmarkListsCreated: 0, bookmarkedSignals: 0,
    oauthConnections: 0, followedUsers: 0, trustedUsers: 0,
    currentStreak: 0, hasSignalToday: false, hasCertificationToday: false,
    pulseLaunches: 0, weeklyPulseUses: 0,
    discordConnected: false, youtubeConnected: false, spotifyConnected: false,
    twitchConnected: false, twitterConnected: false,
    pioneerCount: 0, explorerCount: 0, contributorCount: 0,
    totalDiscoveries: 0, uniqueIntentionTypes: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cacheLoaded, setCacheLoaded] = useState(false)
  const [lastCacheWallet, setLastCacheWallet] = useState<string | null>(null)
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())
  const [claimedQuestIds, setClaimedQuestIds] = useState<Set<string>>(new Set())
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)
  const [onChainSyncDone, setOnChainSyncDone] = useState(false)
  const [claimedDiscoveryXP, setClaimedDiscoveryXP] = useState(0)
  const [groupCertificationXP, setGroupCertificationXP] = useState(0)
  const [spentXP, setSpentXP] = useState(0)

  // Get atom creation functions
  const { pinAtomToIPFS, createAtomsFromPinned, ensureProxyApproval } = useCreateAtom()

  // ─── XP loading + storage listener ───
  useEffect(() => {
    if (isReadOnlyMode) return

    if (!walletAddress) {
      setClaimedDiscoveryXP(0)
      setGroupCertificationXP(0)
      setSpentXP(0)
      return
    }

    QuestProgressService.loadXPData(walletAddress).then(data => {
      setClaimedDiscoveryXP(data.claimedDiscoveryXP)
      setGroupCertificationXP(data.groupCertificationXP)
      setSpentXP(data.spentXP)
    })

    // Listen for storage changes to XP values (lowercase for consistency)
    const normalized = walletAddress.toLowerCase()
    const claimedKey = getWalletKey('claimed_discovery_xp', normalized)
    const groupKey = getWalletKey('group_certification_xp', normalized)
    const spentKey = getWalletKey('spent_xp', normalized)

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[claimedKey]) setClaimedDiscoveryXP(changes[claimedKey].newValue || 0)
      if (changes[groupKey]) setGroupCertificationXP(changes[groupKey].newValue || 0)
      if (changes[spentKey]) setSpentXP(changes[spentKey].newValue || 0)
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [walletAddress, isReadOnlyMode])

  // ─── Reset on-chain sync on wallet change ───
  useEffect(() => {
    if (isReadOnlyMode) return
    setOnChainSyncDone(false)
  }, [walletAddress, isReadOnlyMode])

  // ─── Load cached progress ───
  useEffect(() => {
    if (isReadOnlyMode) {
      setCacheLoaded(true)
      return
    }
    if (!walletAddress) return

    QuestProgressService.loadCachedProgress(walletAddress).then(cached => {
      if (cached) {
        setUserProgress(cached)
        setLastCacheWallet(walletAddress)
        setLoading(false)
      }
      setCacheLoaded(true)
    }).catch(() => {
      setCacheLoaded(true)
    })
  }, [walletAddress, isReadOnlyMode])

  // ─── Load quest states + on-chain sync ───
  useEffect(() => {
    if (isReadOnlyMode) return
    const loadAndSync = async () => {
      if (!walletAddress) {
        setCompletedQuestIds(new Set())
        setClaimedQuestIds(new Set())
        return
      }

      try {
        const { completedIds, claimedIds } = await QuestBadgeService.loadQuestStates(walletAddress)

        if (!onChainSyncDone) {
          const synced = await QuestBadgeService.syncWithOnChain(
            walletAddress, QUEST_DEFINITIONS, completedIds, claimedIds
          )
          setCompletedQuestIds(synced.completedIds)
          setClaimedQuestIds(synced.claimedIds)
          setOnChainSyncDone(true)
        } else {
          setCompletedQuestIds(completedIds)
          setClaimedQuestIds(claimedIds)
        }
      } catch (err) {
        console.error('Error loading quest states:', err)
        setError(err instanceof Error ? err.message : 'Failed to load quest states')
      }
    }
    loadAndSync()
  }, [walletAddress, onChainSyncDone, isReadOnlyMode])

  // ─── Refresh progress data + on-chain sync + XP data ───
  const refreshQuests = async () => {
    if (!walletAddress) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch progress and XP data in parallel
      const [newProgress, xpData] = await Promise.all([
        QuestProgressService.fetchProgress(walletAddress, {
          bookmarkListsCount: lists.length,
          bookmarkedSignalsCount: triplets.length,
          discoveryStats,
        }),
        QuestProgressService.loadXPData(walletAddress),
      ])

      setUserProgress(newProgress)
      setGroupCertificationXP(xpData.groupCertificationXP)
      setSpentXP(xpData.spentXP)

      // Auto-recovery: if storage has 0 discovery XP but we have discoveries, recalculate
      if (xpData.claimedDiscoveryXP === 0 && discoveryStats?.discoveryXP?.total && discoveryStats.discoveryXP.total > 0) {
        console.log(`🔄 [QuestSystem] Auto-recovering discovery XP: ${discoveryStats.discoveryXP.total}`)
        const recovered = await claimDiscoveryXP(discoveryStats.discoveryXP.total)
        setClaimedDiscoveryXP(recovered)
      } else {
        setClaimedDiscoveryXP(xpData.claimedDiscoveryXP)
      }

      // Re-sync on-chain badges (triggers useEffect via onChainSyncDone)
      setOnChainSyncDone(false)
    } catch (err) {
      console.error('Error fetching quest data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quest data')
    } finally {
      setLoading(false)
    }
  }

  // ─── Auto-refresh when cache is stale ───
  useEffect(() => {
    const checkAndRefresh = async () => {
      if (!cacheLoaded || !walletAddress) return

      // In read-only mode, always refresh (no cache)
      if (isReadOnlyMode) {
        console.log('🔄 [QuestSystem] Read-only mode, fetching fresh data...')
        refreshQuests()
        return
      }

      const isStale = await QuestProgressService.isCacheStale(walletAddress)
      if (isStale || lastCacheWallet !== walletAddress) {
        console.log('🔄 [QuestSystem] Cache stale or wallet changed, refreshing...')
        refreshQuests()
        setLastCacheWallet(walletAddress)
      }
    }

    checkAndRefresh()
  }, [walletAddress, cacheLoaded, lists.length, triplets.length, discoveryStats, isReadOnlyMode])

  // ─── Compute quest statuses (pure function, no side effects) ───
  const { quests, newlyCompleted } = useMemo(() => {
    return computeQuestStatuses(QUEST_DEFINITIONS, userProgress, completedQuestIds, claimedQuestIds)
  }, [userProgress, completedQuestIds, claimedQuestIds])

  // ─── Persist newly completed quests (batch save, single state update) ───
  const prevNewlyCompletedRef = useRef<string[]>([])
  useEffect(() => {
    if (!walletAddress || newlyCompleted.length === 0) return
    // Only persist if newlyCompleted actually changed (avoids infinite loop)
    const key = newlyCompleted.join(',')
    if (key === prevNewlyCompletedRef.current.join(',')) return
    prevNewlyCompletedRef.current = newlyCompleted

    // Batch: add all newly completed at once, single storage write + single state update
    const merged = new Set(completedQuestIds)
    for (const id of newlyCompleted) merged.add(id)

    const storageKey = getWalletKey('completed_quests', walletAddress.toLowerCase())
    chrome.storage.local.set({ [storageKey]: Array.from(merged) }).then(() => {
      setCompletedQuestIds(merged)
      console.log('✅ [QuestSystem] Batch-saved newly completed quests:', newlyCompleted)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyCompleted, walletAddress])

  // ─── Filtered quest lists ───
  const activeQuests = useMemo(() => quests.filter(q => q.status === 'active'), [quests])
  const claimableQuests = useMemo(() => quests.filter(q => q.status === 'claimable_xp'), [quests])
  const completedQuests = useMemo(() => quests.filter(q => q.status === 'completed'), [quests])

  // ─── XP and level calculation ───
  const totalXP = useMemo(() => {
    const questXP = quests
      .filter(quest => claimedQuestIds.has(quest.id))
      .reduce((sum, quest) => sum + quest.xpReward, 0)
    return questXP + claimedDiscoveryXP + groupCertificationXP - spentXP
  }, [quests, claimedQuestIds, claimedDiscoveryXP, groupCertificationXP, spentXP])

  const level = useMemo(() => calculateLevelFromXP(totalXP), [totalXP])
  const xpForNextLevel = useMemo(() => calculateXPForNextLevel(level), [level])

  // ─── Claim XP for a quest ───
  const claimQuestXP = async (questId: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (isReadOnlyMode) {
      return { success: false, error: 'Claims not available in read-only mode' }
    }

    if (!walletAddress) {
      return { success: false, error: 'No wallet connected' }
    }

    const quest = QUEST_DEFINITIONS.find(q => q.id === questId)
    if (!quest) {
      return { success: false, error: 'Quest not found' }
    }

    const claimId = getClaimId(questId, quest)
    setClaimingQuestId(questId)
    setError(null)

    try {
      console.log('🏆 [QuestSystem] Creating on-chain badge for quest:', quest.title)

      let result: { success: boolean; txHash?: string; error?: string }

      if (quest.type === 'social-link' && quest.platform) {
        result = await QuestBadgeService.claimSocialLinkBadge(walletAddress, quest.platform)
      } else {
        result = await QuestBadgeService.claimStandardBadge(
          walletAddress, quest.title, quest.description,
          !!quest.recurringType,
          { ensureProxyApproval, pinAtomToIPFS, createAtomsFromPinned }
        )
      }

      if (result.success) {
        const newClaimed = new Set(claimedQuestIds)
        newClaimed.add(claimId)
        setClaimedQuestIds(newClaimed)
        await QuestBadgeService.saveClaimedQuestIds(walletAddress, newClaimed)
        console.log('✅ [QuestSystem] Claimed XP for quest:', claimId)
      }

      return result
    } catch (err) {
      console.error('❌ [QuestSystem] Claim failed:', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const isTripleExistsError =
        errorMessage.includes('TripleExists') ||
        errorMessage.includes('MultiVault_TripleExists') ||
        errorMessage.includes('Triple creation failed')

      if (isTripleExistsError) {
        console.log('✅ [QuestSystem] Badge already exists on-chain, marking as claimed')
        const newClaimed = new Set(claimedQuestIds)
        newClaimed.add(claimId)
        setClaimedQuestIds(newClaimed)
        await QuestBadgeService.saveClaimedQuestIds(walletAddress, newClaimed)
        return { success: true, error: 'Badge already claimed on-chain' }
      }

      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setClaimingQuestId(null)
    }
  }

  // ─── Mark quest completed ───
  const markQuestCompleted = async (questId: string) => {
    if (isReadOnlyMode || !walletAddress) return
    const updated = await QuestProgressService.saveCompletedQuest(walletAddress, questId, completedQuestIds)
    setCompletedQuestIds(updated)
  }

  return {
    quests,
    activeQuests,
    completedQuests,
    claimableQuests,
    userProgress,
    level,
    totalXP,
    xpForNextLevel,
    loading,
    error,
    claimingQuestId,
    refreshQuests,
    markQuestCompleted,
    claimQuestXP,
  }
}
