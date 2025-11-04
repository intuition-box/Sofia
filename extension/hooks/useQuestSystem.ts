/**
 * useQuestSystem Hook
 * Manages user quests, progression, XP, and levels based on real user data
 */

import { useState, useEffect, useMemo } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { getAddress } from 'viem'
import { useBookmarks } from './useBookmarks'

// Quest definition interface
export interface Quest {
  id: string
  title: string
  description: string
  current: number
  total: number
  status: 'locked' | 'active' | 'completed'
  statusColor: string
  xpReward: number
  type: 'signal' | 'bookmark' | 'oauth' | 'follow' | 'trust'
  milestone?: number // For milestone-based quests
}

// User progress data
export interface UserProgress {
  signalsCreated: number
  bookmarkListsCreated: number
  bookmarkedSignals: number
  oauthConnections: number
  followedUsers: number
  trustedUsers: number
}

// Quest system result
export interface QuestSystemResult {
  quests: Quest[]
  activeQuests: Quest[]
  completedQuests: Quest[]
  userProgress: UserProgress
  level: number
  totalXP: number
  xpForNextLevel: number
  loading: boolean
  refreshQuests: () => Promise<void>
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
  { id: 'signal-1', title: 'Create your first signal', description: 'Create your very first signal on Intuition', total: 1, xpReward: 50, type: 'signal', milestone: 1 },
  { id: 'bookmark-list-1', title: 'Create a bookmark list', description: 'Create your first bookmark list', total: 1, xpReward: 30, type: 'bookmark', milestone: 1 },
  { id: 'bookmark-signal-1', title: 'Add a signal to a bookmark', description: 'Bookmark your first signal', total: 1, xpReward: 20, type: 'bookmark', milestone: 1 },
  { id: 'oauth-all', title: 'Connect all social accounts', description: 'Connect YouTube, Spotify, and Twitch', total: 3, xpReward: 100, type: 'oauth', milestone: 3 },

  // Progressive signal milestones (increasing difficulty and XP)
  { id: 'signal-10', title: 'Create 10 signals', description: 'Reach 10 signals created', total: 10, xpReward: 100, type: 'signal', milestone: 10 },
  { id: 'signal-50', title: 'Create 50 signals', description: 'Reach 50 signals created', total: 50, xpReward: 200, type: 'signal', milestone: 50 },
  { id: 'signal-100', title: 'Create 100 signals', description: 'Reach 100 signals created', total: 100, xpReward: 400, type: 'signal', milestone: 100 },
  { id: 'signal-500', title: 'Create 500 signals', description: 'Reach 500 signals created', total: 500, xpReward: 1000, type: 'signal', milestone: 500 },
  { id: 'signal-1000', title: 'Create 1,000 signals', description: 'Reach 1,000 signals created', total: 1000, xpReward: 2000, type: 'signal', milestone: 1000 },
  { id: 'signal-5000', title: 'Create 5,000 signals', description: 'Reach 5,000 signals created', total: 5000, xpReward: 5000, type: 'signal', milestone: 5000 },
  { id: 'signal-10000', title: 'Create 10,000 signals', description: 'Reach 10,000 signals created', total: 10000, xpReward: 10000, type: 'signal', milestone: 10000 },
  { id: 'signal-50000', title: 'Create 50,000 signals', description: 'Reach 50,000 signals created', total: 50000, xpReward: 25000, type: 'signal', milestone: 50000 },
  { id: 'signal-100000', title: 'Create 100,000 signals', description: 'Reach 100,000 signals created', total: 100000, xpReward: 50000, type: 'signal', milestone: 100000 },

  // Bookmark milestones
  { id: 'bookmark-signal-50', title: 'Add 50 signals to bookmarks', description: 'Bookmark 50 different signals', total: 50, xpReward: 250, type: 'bookmark', milestone: 50 },

  // Follow milestones
  { id: 'follow-50', title: 'Follow 50 users', description: 'Follow 50 different users', total: 50, xpReward: 300, type: 'follow', milestone: 50 },

  // Trust milestones
  { id: 'trust-10', title: 'Trust 10 users', description: 'Trust 10 different users', total: 10, xpReward: 200, type: 'trust', milestone: 10 },
]

export const useQuestSystem = (): QuestSystemResult => {
  const [walletAddress] = useStorage<string>("metamask-account")
  const { lists, triplets } = useBookmarks()

  const [userProgress, setUserProgress] = useState<UserProgress>({
    signalsCreated: 0,
    bookmarkListsCreated: 0,
    bookmarkedSignals: 0,
    oauthConnections: 0,
    followedUsers: 0,
    trustedUsers: 0,
  })

  const [loading, setLoading] = useState(true)
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())

  // Load completed quests from storage
  useEffect(() => {
    const loadCompletedQuests = async () => {
      try {
        const result = await chrome.storage.local.get('completed_quests')
        if (result.completed_quests) {
          setCompletedQuestIds(new Set(result.completed_quests))
        }
      } catch (error) {
        console.error('Error loading completed quests:', error)
      }
    }
    loadCompletedQuests()
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
    } catch (error) {
      console.error('Error saving completed quest:', error)
    }
  }

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
        predicateId: PREDICATE_IDS.TRUST
      }) as { triples: Array<{ term_id: string }> }

      const trustedUsers = trustResponse?.triples?.length || 0

      // Query 4: Check OAuth connections
      const oauthResult = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_twitch',
      ])

      const oauthConnections = [
        oauthResult.oauth_token_youtube,
        oauthResult.oauth_token_spotify,
        oauthResult.oauth_token_twitch,
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
      }

      // Determine quest status
      let status: Quest['status'] = 'locked'
      let statusColor = '#6ACC93' // gray for locked

      const isCompleted = completedQuestIds.has(questDef.id)

      if (current >= questDef.total) {
        status = 'completed'
        statusColor = '#48bb78' // green

        // Auto-save newly completed quests
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
      }
    }).sort((a, b) => {
      // Sort by: active first, then by milestone (lower milestones first), then completed last
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return (a.milestone || 0) - (b.milestone || 0)
    })
  }, [userProgress, completedQuestIds])

  // Filter active and completed quests
  const activeQuests = useMemo(() =>
    quests.filter(q => q.status === 'active').slice(0, 4), // Show max 4 active quests
    [quests]
  )

  const completedQuests = useMemo(() =>
    quests.filter(q => q.status === 'completed'),
    [quests]
  )

  // Calculate total XP and level
  const totalXP = useMemo(() => {
    return completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0)
  }, [completedQuests])

  const level = useMemo(() => calculateLevelFromXP(totalXP), [totalXP])
  const xpForNextLevel = useMemo(() => calculateXPForNextLevel(level), [level])

  return {
    quests,
    activeQuests,
    completedQuests,
    userProgress,
    level,
    totalXP,
    xpForNextLevel,
    loading,
    refreshQuests,
  }
}
