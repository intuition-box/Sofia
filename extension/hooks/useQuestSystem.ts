/**
 * useQuestSystem Hook
 *
 * Manages user quests, progression, XP (quest-only), and levels.
 * XP is derived exclusively from claimed quest badges (on-chain).
 * Gold (discovery + certification) is managed separately by useGoldSystem.
 *
 * Orchestrates:
 * - QuestBadgeService: on-chain badge checking, claiming, social link verification
 * - QuestProgressService: data fetching, caching, persistence
 * - questStatusHelpers: pure functions for quest status computation
 * - questTypes: shared types and QUEST_DEFINITIONS
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletFromStorage } from './useWalletFromStorage'
import { useBookmarks } from './useBookmarks'
import { useDiscoveryScore } from './useDiscoveryScore'
import { useCreateAtom } from './useCreateAtom'
import { useOnChainStreak } from './useOnChainStreak'
import { QuestBadgeService, QuestProgressService } from '../lib/services'
import { DAILY_CERTIFICATION_ATOM_ID, DAILY_VOTE_ATOM_ID } from '../lib/config/chainConfig'
import { computeQuestStatuses, calculateLevelFromXP, calculateXPForNextLevel, getClaimId, getWalletKey } from '../lib/utils'
import { createHookLogger } from '../lib/utils/logger'
import {
  applyOptimisticDailyStreak,
  realtimeKeys
} from '../lib/realtime/derivations'
import type { DailyStreakStatus } from '../lib/realtime/derivations'
import { QUEST_DEFINITIONS } from '../types/questTypes'
import type { Quest, UserProgress, QuestSystemResult } from '../types/questTypes'

const logger = createHookLogger('useQuestSystem')

// Re-export types for backward compatibility
export type { Quest, UserProgress, QuestSystemResult }

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
  const { stats: discoveryStats } = isReadOnlyMode
    ? { stats: undefined }
    : discoveryData

  const queryClient = useQueryClient()

  // On-chain streak data (same source as LeaderboardTab)
  const certStreak = useOnChainStreak(DAILY_CERTIFICATION_ATOM_ID, walletAddress)
  const voteStreak = useOnChainStreak(DAILY_VOTE_ATOM_ID, walletAddress)

  // Live WS trigger: when the SubscriptionManager pushes a new position on
  // the daily-cert or daily-vote atoms (user just certified / voted), the
  // ['daily-streak', wallet] cache key updates. The streak *count* itself
  // comes from deposits history (GetProxyDepositDays) — not positions — so
  // we can't derive it from the WS payload. Instead we use the WS update
  // as a signal to re-fetch the HTTP streak without polling.
  const walletLowerForStreak = walletAddress?.toLowerCase()
  const { data: dailyStreakStatus } = useQuery<DailyStreakStatus | undefined>({
    queryKey: walletLowerForStreak
      ? realtimeKeys.dailyStreak(walletLowerForStreak)
      : ['daily-streak', 'none'],
    queryFn: () => Promise.resolve(undefined),
    enabled: !!walletLowerForStreak,
    staleTime: Infinity,
    gcTime: Infinity
  })

  const lastStreakFingerprintRef = useRef<string | null>(null)
  useEffect(() => {
    if (!dailyStreakStatus || !walletAddress) return
    // Fingerprint the WS payload — only refetch when it actually changed.
    // certifiedToday/votedToday are the fields that flip when user acts.
    const fingerprint = `${dailyStreakStatus.certifiedToday}|${dailyStreakStatus.votedToday}|${dailyStreakStatus.certificationShares}|${dailyStreakStatus.voteShares}`
    if (lastStreakFingerprintRef.current === fingerprint) return
    // Skip the very first observation — the streaks already fetched on mount.
    if (lastStreakFingerprintRef.current !== null) {
      logger.debug('WS daily-streak changed → refetching streak counts')
      certStreak.refetch().catch(() => {})
      voteStreak.refetch().catch(() => {})
    }
    lastStreakFingerprintRef.current = fingerprint
  }, [dailyStreakStatus, walletAddress, certStreak, voteStreak])

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
    goldAccumulated: 0,
    totalVotes: 0, hasVotedToday: false, currentVoteStreak: 0,
    certActivityDates: [], voteActivityDates: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cacheLoaded, setCacheLoaded] = useState(false)
  const [lastCacheWallet, setLastCacheWallet] = useState<string | null>(null)
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())
  const [claimedQuestIds, setClaimedQuestIds] = useState<Set<string>>(new Set())
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)
  const [onChainSyncDone, setOnChainSyncDone] = useState(false)

  // Get atom creation functions
  const { pinAtomToIPFS, createAtomsFromPinned, ensureProxyApproval } = useCreateAtom()

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
        logger.error('Error loading quest states', err)
        setError(err instanceof Error ? err.message : 'Failed to load quest states')
      }
    }
    loadAndSync()
  }, [walletAddress, onChainSyncDone, isReadOnlyMode])

  // ─── Sync quest state across hook instances via storage changes ───
  useEffect(() => {
    if (isReadOnlyMode || !walletAddress) return

    const claimedKey = getWalletKey('claimed_quests', walletAddress.toLowerCase())
    const completedKey = getWalletKey('completed_quests', walletAddress.toLowerCase())
    const progressKey = getWalletKey('quest_progress_cache', walletAddress.toLowerCase())

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area !== 'local') return
      if (changes[claimedKey]?.newValue) {
        setClaimedQuestIds(new Set(changes[claimedKey].newValue))
      }
      if (changes[completedKey]?.newValue) {
        setCompletedQuestIds(new Set(changes[completedKey].newValue))
      }
      if (changes[progressKey]?.newValue) {
        setUserProgress(changes[progressKey].newValue)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [walletAddress, isReadOnlyMode])

  // ─── Refresh progress data + on-chain sync ───
  const refreshQuests = async () => {
    if (!walletAddress) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const newProgress = await QuestProgressService.fetchProgress(walletAddress, {
        bookmarkListsCount: lists.length,
        bookmarkedSignalsCount: triplets.length,
        discoveryStats,
        onChainCertStreak: certStreak.streak,
        onChainVoteStreak: voteStreak.streak,
        certActivityDates: certStreak.activityDates,
        voteActivityDates: voteStreak.activityDates,
      })

      setUserProgress(newProgress)

      // Re-sync on-chain badges (triggers useEffect via onChainSyncDone)
      setOnChainSyncDone(false)
    } catch (err) {
      logger.error('Error fetching quest data', err)
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
        logger.info('Read-only mode, fetching fresh data')
        refreshQuests()
        return
      }

      const isStale = await QuestProgressService.isCacheStale(walletAddress)
      if (isStale || lastCacheWallet !== walletAddress) {
        logger.info('Cache stale or wallet changed, refreshing')
        refreshQuests()
        setLastCacheWallet(walletAddress)
      }
    }

    checkAndRefresh()
  }, [walletAddress, cacheLoaded, lists.length, triplets.length, discoveryStats, isReadOnlyMode, certStreak.streak, voteStreak.streak])

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
      logger.info('Batch-saved newly completed quests', { newlyCompleted })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyCompleted, walletAddress])

  // ─── Filtered quest lists ───
  const activeQuests = useMemo(() => quests.filter(q => q.status === 'active'), [quests])
  const claimableQuests = useMemo(() => {
    if (!onChainSyncDone) return []
    return quests.filter(q => q.status === 'claimable_xp')
  }, [quests, onChainSyncDone])
  const completedQuests = useMemo(() => quests.filter(q => q.status === 'completed'), [quests])

  // ─── XP and level calculation (quest-only, no Gold) ───
  const totalXP = useMemo(() => {
    return quests
      .filter(quest => claimedQuestIds.has(quest.id))
      .reduce((sum, quest) => sum + quest.xpReward, 0)
  }, [quests, claimedQuestIds])

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

    // Optimistic daily-streak flip: quest icon + streak panel reflect the
    // new activity in 0ms, well before the on-chain TX confirms (3-5s).
    // The WS SubscriptionManager will overwrite with the authoritative
    // value as soon as the deposit lands, so the optimistic is effectively
    // a no-op refresh on success.
    const optimisticRollback =
      questId === 'daily-certification'
        ? applyOptimisticDailyStreak(queryClient, walletAddress, 'cert')
        : questId === 'daily-vote'
          ? applyOptimisticDailyStreak(queryClient, walletAddress, 'vote')
          : null

    try {
      logger.info('Creating on-chain badge for quest', { title: quest.title })

      let result: { success: boolean; txHash?: string; error?: string }

      if (quest.type === 'social-link' && quest.platform) {
        result = await QuestBadgeService.claimSocialLinkBadge(walletAddress, quest.platform)
      } else {
        result = await QuestBadgeService.claimStandardBadge(
          walletAddress, quest.title, quest.description,
          !!quest.recurringType,
          { ensureProxyApproval, pinAtomToIPFS, createAtomsFromPinned },
          questId
        )
      }

      if (result.success) {
        const newClaimed = new Set(claimedQuestIds)
        newClaimed.add(claimId)
        setClaimedQuestIds(newClaimed)
        await QuestBadgeService.saveClaimedQuestIds(walletAddress, newClaimed)
        logger.info('Claimed XP for quest', { claimId })
      } else if (optimisticRollback) {
        // Non-throwing failure (service returned success:false) — undo the flip.
        optimisticRollback()
      }

      return result
    } catch (err) {
      logger.error('Claim failed', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const isTripleExistsError =
        errorMessage.includes('TripleExists') ||
        errorMessage.includes('MultiVault_TripleExists') ||
        errorMessage.includes('Triple creation failed')

      if (isTripleExistsError) {
        // Badge already claimed on-chain — the optimistic state matches
        // reality, leave it in place.
        logger.info('Badge already exists on-chain, marking as claimed')
        const newClaimed = new Set(claimedQuestIds)
        newClaimed.add(claimId)
        setClaimedQuestIds(newClaimed)
        await QuestBadgeService.saveClaimedQuestIds(walletAddress, newClaimed)
        return { success: true, error: 'Badge already claimed on-chain' }
      }

      if (optimisticRollback) {
        optimisticRollback()
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
