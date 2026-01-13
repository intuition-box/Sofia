/**
 * useQuestSystem Hook
 * Manages user quests, progression, XP, and levels based on real user data
 */

import { useState, useEffect, useMemo } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { getAddress } from 'viem'
import { useBookmarks } from './useBookmarks'
import { useClaimHumanity } from './useClaimHumanity'

// Quest definition interface
export interface Quest {
  id: string
  title: string
  description: string
  current: number
  total: number
  status: 'locked' | 'active' | 'completed' | 'claimable_xp'
  statusColor: string
  xpReward: number
  type: 'signal' | 'bookmark' | 'oauth' | 'follow' | 'trust' | 'streak' | 'pulse' | 'curator' | 'social'
  milestone?: number // For milestone-based quests
  claimable?: boolean // For quests that require on-chain claim (like Proof of Human)
  recurringType?: 'daily' | 'weekly' // For recurring quests
}

// User progress data
export interface UserProgress {
  signalsCreated: number
  bookmarkListsCreated: number
  bookmarkedSignals: number
  oauthConnections: number
  followedUsers: number
  trustedUsers: number
  // Streak and Pulse tracking
  currentStreak: number
  hasSignalToday: boolean
  pulseLaunches: number
  weeklyPulseUses: number
}

// Quest system result
export interface QuestSystemResult {
  quests: Quest[]
  activeQuests: Quest[]
  completedQuests: Quest[]
  claimableQuests: Quest[]
  userProgress: UserProgress
  level: number
  totalXP: number
  xpForNextLevel: number
  loading: boolean
  refreshQuests: () => Promise<void>
  markQuestCompleted: (questId: string) => Promise<void>
  claimQuestXP: (questId: string) => Promise<void>
}

// XP calculation: Level N requires 100 * N XP
const calculateLevelFromXP = (xp: number): number => {
  let level = 1
  let xpRequired = 100
  let totalXpUsed = 0

  while (totalXpUsed + xpRequired <= xp) {
    totalXpUsed += xpRequired
    level++
    xpRequired = 100 * level
  }

  return level
}

const calculateXPForNextLevel = (currentLevel: number): number => {
  return 100 * (currentLevel + 1)
}

// Define all available quests with their milestones and XP rewards
const QUEST_DEFINITIONS: Omit<Quest, 'current' | 'status' | 'statusColor'>[] = [
  // First-time quests (easy, low XP)
  { id: 'signal-1', title: 'First Signal', description: 'Create your very first signal', total: 1, xpReward: 50, type: 'signal', milestone: 1 },
  { id: 'bookmark-list-1', title: 'Organizer', description: 'Create your first bookmark list', total: 1, xpReward: 30, type: 'bookmark', milestone: 1 },
  { id: 'bookmark-signal-1', title: 'Bookworm', description: 'Bookmark your first signal', total: 1, xpReward: 20, type: 'bookmark', milestone: 1 },
  { id: 'oauth-all', title: 'Connected', description: 'Connect YouTube, Spotify, and Twitch', total: 3, xpReward: 100, type: 'oauth', milestone: 3 },
  { id: 'proof-of-human', title: 'Verified Human', description: 'Connect all 5 platforms and claim on-chain', total: 5, xpReward: 500, type: 'oauth', milestone: 5, claimable: true },

  // Progressive signal milestones (increasing difficulty and XP)
  { id: 'signal-10', title: 'Signal Rookie', description: 'Create 10 signals', total: 10, xpReward: 100, type: 'signal', milestone: 10 },
  { id: 'signal-50', title: 'Signal Maker', description: 'Create 50 signals', total: 50, xpReward: 200, type: 'signal', milestone: 50 },
  { id: 'signal-100', title: 'Centurion', description: 'Create 100 signals', total: 100, xpReward: 400, type: 'signal', milestone: 100 },
  { id: 'signal-500', title: 'Signal Pro', description: 'Create 500 signals', total: 500, xpReward: 1000, type: 'signal', milestone: 500 },
  { id: 'signal-1000', title: 'Signal Master', description: 'Create 1,000 signals', total: 1000, xpReward: 2000, type: 'signal', milestone: 1000 },
  { id: 'signal-5000', title: 'Signal Legend', description: 'Create 5,000 signals', total: 5000, xpReward: 5000, type: 'signal', milestone: 5000 },
  { id: 'signal-10000', title: 'Signal Titan', description: 'Create 10,000 signals', total: 10000, xpReward: 10000, type: 'signal', milestone: 10000 },
  { id: 'signal-50000', title: 'Signal God', description: 'Create 50,000 signals', total: 50000, xpReward: 25000, type: 'signal', milestone: 50000 },
  { id: 'signal-100000', title: 'Signal Immortal', description: 'Create 100,000 signals', total: 100000, xpReward: 50000, type: 'signal', milestone: 100000 },

  // Bookmark milestones
  { id: 'bookmark-signal-50', title: 'Archivist', description: 'Bookmark 50 signals', total: 50, xpReward: 250, type: 'bookmark', milestone: 50 },

  // Follow milestones
  { id: 'follow-50', title: 'Influencer', description: 'Follow 50 users', total: 50, xpReward: 300, type: 'follow', milestone: 50 },

  // Trust milestones
  { id: 'trust-10', title: 'Trustworthy', description: 'Trust 10 users', total: 10, xpReward: 200, type: 'trust', milestone: 10 },

  // Streak quests
  { id: 'streak-7', title: 'Committed', description: 'Maintain a 7-day signal streak', total: 7, xpReward: 200, type: 'streak', milestone: 7 },
  { id: 'streak-30', title: 'Dedicated', description: 'Maintain a 30-day signal streak', total: 30, xpReward: 1000, type: 'streak', milestone: 30 },
  { id: 'streak-100', title: 'Relentless', description: 'Maintain a 100-day signal streak', total: 100, xpReward: 5000, type: 'streak', milestone: 100 },

  // Pulse quests
  { id: 'pulse-first', title: 'Explorer', description: 'Launch your first Pulse analysis', total: 1, xpReward: 30, type: 'pulse', milestone: 1 },
  { id: 'pulse-weekly-5', title: 'Pulse Master', description: 'Use Pulse 5 times this week', total: 5, xpReward: 150, type: 'pulse', recurringType: 'weekly' },

  // Curator quests
  { id: 'curator-10', title: 'Collector', description: 'Bookmark 10 signals', total: 10, xpReward: 150, type: 'curator', milestone: 10 },
  { id: 'curator-50', title: 'Curator', description: 'Bookmark 50 signals', total: 50, xpReward: 400, type: 'curator', milestone: 50 },

  // Social quests
  { id: 'social-butterfly', title: 'Social Butterfly', description: 'Follow 10 users this week', total: 10, xpReward: 200, type: 'social', recurringType: 'weekly' },
  { id: 'networker-25', title: 'Networker', description: 'Follow 25 users', total: 25, xpReward: 350, type: 'social', milestone: 25 },
]

export const useQuestSystem = (): QuestSystemResult => {
  const { walletAddress } = useWalletFromStorage()
  const { lists, triplets } = useBookmarks()
  const { isHuman } = useClaimHumanity()

  const [userProgress, setUserProgress] = useState<UserProgress>({
    signalsCreated: 0,
    bookmarkListsCreated: 0,
    bookmarkedSignals: 0,
    oauthConnections: 0,
    followedUsers: 0,
    trustedUsers: 0,
    currentStreak: 0,
    hasSignalToday: false,
    pulseLaunches: 0,
    weeklyPulseUses: 0,
  })

  const [loading, setLoading] = useState(true)
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())
  const [claimedQuestIds, setClaimedQuestIds] = useState<Set<string>>(new Set())

  // Load completed and claimed quests from storage
  useEffect(() => {
    const loadQuestStates = async () => {
      try {
        const result = await chrome.storage.local.get(['completed_quests', 'claimed_quests'])
        if (result.completed_quests) {
          setCompletedQuestIds(new Set(result.completed_quests))
        }
        if (result.claimed_quests) {
          setClaimedQuestIds(new Set(result.claimed_quests))
        }
      } catch (error) {
        console.error('Error loading quest states:', error)
      }
    }
    loadQuestStates()
  }, [])

  // Save completed quests to storage
  const saveCompletedQuest = async (questId: string) => {
    const newCompleted = new Set(completedQuestIds)
    newCompleted.add(questId)
    setCompletedQuestIds(newCompleted)

    try {
      await chrome.storage.local.set({
        completed_quests: Array.from(newCompleted)
      })
      console.log('✅ [QuestSystem] Saved completed quest:', questId)
    } catch (error) {
      console.error('Error saving completed quest:', error)
    }
  }

  // Claim XP for a quest
  const claimQuestXP = async (questId: string) => {
    const newClaimed = new Set(claimedQuestIds)
    newClaimed.add(questId)
    setClaimedQuestIds(newClaimed)

    try {
      await chrome.storage.local.set({
        claimed_quests: Array.from(newClaimed)
      })
      console.log('✅ [QuestSystem] Claimed XP for quest:', questId)
    } catch (error) {
      console.error('Error claiming quest XP:', error)
    }
  }

  // Auto-save proof-of-human quest when isHuman becomes true
  useEffect(() => {
    if (isHuman && !completedQuestIds.has('proof-of-human')) {
      console.log('🎉 [QuestSystem] Auto-completing proof-of-human quest (isHuman=true)')
      saveCompletedQuest('proof-of-human')
    }
  }, [isHuman, completedQuestIds])

  // Fetch user progress data
  const refreshQuests = async () => {
    if (!walletAddress) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const checksumAddress = getAddress(walletAddress)

      // Query 1: Get signals created (triples with subject = "I")
      const signalsQuery = `
        query GetUserSignals($accountId: String!, $subjectId: String!) {
          triples: terms(
            where: {
              _and: [
                { type: { _eq: Triple } },
                { triple: { subject: { term_id: { _eq: $subjectId } } } },
                { positions: { account: { id: { _eq: $accountId } } } }
              ]
            }
          ) {
            id
          }
        }
      `

      const signalsResponse = await intuitionGraphqlClient.request(signalsQuery, {
        accountId: checksumAddress,
        subjectId: SUBJECT_IDS.I
      }) as { triples: Array<{ id: string }> }

      const signalsCreated = signalsResponse?.triples?.length || 0

      // Query 2: Get followed users count
      const followQuery = `
        query GetFollowCount($accountId: String!, $subjectId: String!, $predicateId: String!) {
          triples(
            where: {
              _and: [
                { positions: { account: { id: { _eq: $accountId } } } },
                { subject_id: { _eq: $subjectId } },
                { predicate_id: { _eq: $predicateId } },
                { object: { type: { _eq: "Account" } } }
              ]
            }
          ) {
            term_id
          }
        }
      `

      const followResponse = await intuitionGraphqlClient.request(followQuery, {
        accountId: checksumAddress,
        subjectId: SUBJECT_IDS.I,
        predicateId: PREDICATE_IDS.FOLLOW
      }) as { triples: Array<{ term_id: string }> }

      const followedUsers = followResponse?.triples?.length || 0

      // Query 3: Get trusted users count
      const trustResponse = await intuitionGraphqlClient.request(followQuery, {
        accountId: checksumAddress,
        subjectId: SUBJECT_IDS.I,
        predicateId: PREDICATE_IDS.TRUSTS
      }) as { triples: Array<{ term_id: string }> }

      const trustedUsers = trustResponse?.triples?.length || 0

      // Query 4: Check OAuth connections (all 5 platforms)
      const oauthResult = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_twitch',
        'oauth_token_discord',
        'oauth_token_twitter',
      ])

      const oauthConnections = [
        oauthResult.oauth_token_youtube,
        oauthResult.oauth_token_spotify,
        oauthResult.oauth_token_twitch,
        oauthResult.oauth_token_discord,
        oauthResult.oauth_token_twitter,
      ].filter(Boolean).length

      // Local bookmark data
      const bookmarkListsCreated = lists.length
      const bookmarkedSignals = triplets.length

      setUserProgress({
        signalsCreated,
        bookmarkListsCreated,
        bookmarkedSignals,
        oauthConnections,
        followedUsers,
        trustedUsers,
        currentStreak: 0,
        hasSignalToday: false,
        pulseLaunches: 0,
        weeklyPulseUses: 0,
      })

    } catch (error) {
      console.error('Error fetching quest data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when wallet changes
  useEffect(() => {
    refreshQuests()
  }, [walletAddress, lists.length, triplets.length])

  // Generate quests based on user progress
  const quests = useMemo<Quest[]>(() => {
    return QUEST_DEFINITIONS.map(questDef => {
      let current = 0

      // Determine current progress based on quest type
      switch (questDef.type) {
        case 'signal':
          current = userProgress.signalsCreated
          break
        case 'bookmark':
          if (questDef.id === 'bookmark-list-1') {
            current = userProgress.bookmarkListsCreated
          } else if (questDef.id.startsWith('bookmark-signal')) {
            current = userProgress.bookmarkedSignals
          }
          break
        case 'oauth':
          current = userProgress.oauthConnections
          break
        case 'follow':
          current = userProgress.followedUsers
          break
        case 'trust':
          current = userProgress.trustedUsers
          break
        case 'streak':
          current = userProgress.currentStreak
          break
        case 'pulse':
          if (questDef.id === 'pulse-first') {
            current = userProgress.pulseLaunches
          } else if (questDef.id === 'pulse-weekly-5') {
            current = userProgress.weeklyPulseUses
          }
          break
        case 'curator':
          current = userProgress.bookmarkedSignals
          break
        case 'social':
          if (questDef.id === 'networker-25') {
            current = userProgress.followedUsers
          }
          // social-butterfly uses weekly follows - not yet tracked separately
          break
      }

      // Determine quest status
      let status: Quest['status'] = 'locked'
      let statusColor = '#6ACC93' // gray for locked
      let claimable = false

      const isCompleted = completedQuestIds.has(questDef.id)
      const isClaimed = claimedQuestIds.has(questDef.id)

      // Special handling for proof-of-human quest - use isHuman state directly
      if (questDef.id === 'proof-of-human' && isHuman) {
        if (isClaimed) {
          status = 'completed'
          statusColor = '#48bb78' // green - XP claimed
        } else {
          status = 'claimable_xp'
          statusColor = '#FFD700' // gold - ready to claim XP
        }
        // Save to completed if not already
        if (!isCompleted) {
          saveCompletedQuest(questDef.id)
        }
      } else if (current >= questDef.total) {
        // Quest objective is met
        if (isClaimed) {
          status = 'completed'
          statusColor = '#48bb78' // green - XP claimed
        } else {
          status = 'claimable_xp'
          statusColor = '#FFD700' // gold - ready to claim XP
        }
        // Save to completed if not already
        if (!isCompleted) {
          saveCompletedQuest(questDef.id)
        }
      } else if (current > 0 || questDef.milestone === 1) {
        // Quest is active if user has started progress or it's a first-time quest
        status = 'active'
        statusColor = '#EAB67A' // purple
      }

      return {
        ...questDef,
        current: Math.min(current, questDef.total),
        status,
        statusColor,
        claimable,
      }
    }).sort((a, b) => {
      // Sort by: claimable_xp first, then active, then by milestone, then completed last
      if (a.status === 'claimable_xp' && b.status !== 'claimable_xp') return -1
      if (a.status !== 'claimable_xp' && b.status === 'claimable_xp') return 1
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return (a.milestone || 0) - (b.milestone || 0)
    })
  }, [userProgress, completedQuestIds, claimedQuestIds, isHuman])

  // Filter active, claimable, and completed quests
  const activeQuests = useMemo(() =>
    quests.filter(q => q.status === 'active'),
    [quests]
  )

  const claimableQuests = useMemo(() =>
    quests.filter(q => q.status === 'claimable_xp'),
    [quests]
  )

  const completedQuests = useMemo(() =>
    quests.filter(q => q.status === 'completed'),
    [quests]
  )

  // Calculate total XP and level - only from CLAIMED quests
  const totalXP = useMemo(() => {
    return quests
      .filter(quest => claimedQuestIds.has(quest.id))
      .reduce((sum, quest) => sum + quest.xpReward, 0)
  }, [quests, claimedQuestIds])

  const level = useMemo(() => calculateLevelFromXP(totalXP), [totalXP])
  const xpForNextLevel = useMemo(() => calculateXPForNextLevel(level), [level])

  // Mark a claimable quest as completed (called after on-chain claim)
  const markQuestCompleted = async (questId: string) => {
    await saveCompletedQuest(questId)
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
    refreshQuests,
    markQuestCompleted,
    claimQuestXP,
  }
}
