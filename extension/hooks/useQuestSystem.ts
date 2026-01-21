/**
 * useQuestSystem Hook
 * Manages user quests, progression, XP, and levels based on real user data
 */

import { useState, useEffect, useMemo } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { getAddress, stringToHex } from 'viem'
import { useBookmarks } from './useBookmarks'
import { useDiscoveryScore } from './useDiscoveryScore'
import { useCreateAtom } from './useCreateAtom'
import { getClients } from '../lib/clients/viemClients'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { BlockchainService } from '../lib/services/blockchainService'
import { MULTIVAULT_CONTRACT_ADDRESS, SELECTED_CHAIN, BLOCKCHAIN_CONFIG, PREDICATE_IDS as CHAIN_PREDICATE_IDS, BOT_VERIFIER_ADDRESS } from '../lib/config/chainConfig'
import { MASTRA_API_URL } from '../config'
import type { Address } from '../types/viem'

// Constants for on-chain operations
const MIN_DEPOSIT = 10000000000000000n // 0.01 TRUST
const CURVE_ID = 1n

// Social platform type
type SocialPlatform = 'discord' | 'youtube' | 'spotify' | 'twitch' | 'twitter'

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
  type: 'signal' | 'bookmark' | 'oauth' | 'follow' | 'trust' | 'streak' | 'pulse' | 'curator' | 'social' | 'social-link' | 'discovery'
  milestone?: number // For milestone-based quests
  claimable?: boolean // For quests that require on-chain claim (like Proof of Human)
  recurringType?: 'daily' | 'weekly' // For recurring quests
  platform?: SocialPlatform // For social-link quests
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
  // Individual social platform connections
  discordConnected: boolean
  youtubeConnected: boolean
  spotifyConnected: boolean
  twitchConnected: boolean
  twitterConnected: boolean
  // Discovery progress
  pioneerCount: number
  explorerCount: number
  contributorCount: number
  totalDiscoveries: number
  uniqueIntentionTypes: number
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
  claimingQuestId: string | null
  refreshQuests: () => Promise<void>
  markQuestCompleted: (questId: string) => Promise<void>
  claimQuestXP: (questId: string) => Promise<{ success: boolean; txHash?: string; error?: string }>
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

  // Social Link quests - one per platform (replaces oauth-all)
  { id: 'link-discord', title: 'Discord Linked', description: 'Link your Discord account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'discord' },
  { id: 'link-youtube', title: 'YouTube Linked', description: 'Link your YouTube account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'youtube' },
  { id: 'link-spotify', title: 'Spotify Linked', description: 'Link your Spotify account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'spotify' },
  { id: 'link-twitch', title: 'Twitch Linked', description: 'Link your Twitch account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'twitch' },
  { id: 'link-twitter', title: 'Twitter Linked', description: 'Link your Twitter account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'twitter' },

  // Social Linked - bonus quest when all 5 platforms are linked
  { id: 'social-linked', title: 'Social Linked', description: 'Link all 5 social platforms on-chain', total: 5, xpReward: 500, type: 'oauth', milestone: 5, claimable: true },

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

  // Discovery quests
  { id: 'discovery-first', title: 'First Step', description: 'Certify your first page', total: 1, xpReward: 50, type: 'discovery', milestone: 1 },
  { id: 'discovery-pioneer', title: 'Trailblazer', description: 'Be the first to certify a page (Pioneer)', total: 1, xpReward: 200, type: 'discovery', milestone: 1 },
  { id: 'discovery-10', title: 'Pathfinder', description: 'Certify 10 pages', total: 10, xpReward: 100, type: 'discovery', milestone: 10 },
  { id: 'discovery-50', title: 'Cartographer', description: 'Certify 50 pages', total: 50, xpReward: 300, type: 'discovery', milestone: 50 },
  { id: 'discovery-100', title: 'World Explorer', description: 'Certify 100 pages', total: 100, xpReward: 500, type: 'discovery', milestone: 100 },
  { id: 'intention-variety', title: 'Multi-Purpose', description: 'Use all 5 intention types', total: 5, xpReward: 150, type: 'discovery', milestone: 5 },
]

export const useQuestSystem = (): QuestSystemResult => {
  const { walletAddress } = useWalletFromStorage()
  const { lists, triplets } = useBookmarks()
  const { stats: discoveryStats } = useDiscoveryScore()

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
    discordConnected: false,
    youtubeConnected: false,
    spotifyConnected: false,
    twitchConnected: false,
    twitterConnected: false,
    pioneerCount: 0,
    explorerCount: 0,
    contributorCount: 0,
    totalDiscoveries: 0,
    uniqueIntentionTypes: 0,
  })

  const [loading, setLoading] = useState(true)
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())
  const [claimedQuestIds, setClaimedQuestIds] = useState<Set<string>>(new Set())
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)
  const [onChainSyncDone, setOnChainSyncDone] = useState(false)
  const [claimedDiscoveryXP, setClaimedDiscoveryXP] = useState(0)
  const [groupCertificationXP, setGroupCertificationXP] = useState(0)
  const [spentXP, setSpentXP] = useState(0)

  // Load XP from storage and listen for changes
  useEffect(() => {
    const loadXPData = async () => {
      try {
        const result = await chrome.storage.local.get([
          'claimed_discovery_xp',
          'group_certification_xp',
          'spent_xp'
        ])
        setClaimedDiscoveryXP(result.claimed_discovery_xp || 0)
        setGroupCertificationXP(result.group_certification_xp || 0)
        setSpentXP(result.spent_xp || 0)
      } catch (err) {
        console.error('❌ [QuestSystem] Failed to load XP data:', err)
      }
    }
    loadXPData()

    // Listen for changes to XP values
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.claimed_discovery_xp) {
        setClaimedDiscoveryXP(changes.claimed_discovery_xp.newValue || 0)
      }
      if (changes.group_certification_xp) {
        setGroupCertificationXP(changes.group_certification_xp.newValue || 0)
      }
      if (changes.spent_xp) {
        setSpentXP(changes.spent_xp.newValue || 0)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // Get atom creation functions
  const { pinAtomToIPFS, createAtomsFromPinned, ensureProxyApproval } = useCreateAtom()

  // Check on-chain for existing quest badges (triples: [wallet] [has_tag] [quest_title])
  // AND check for social links (triples: [wallet] [verified] [platform:userId])
  const checkOnChainQuestBadges = async (): Promise<Set<string>> => {
    if (!walletAddress) return new Set()

    try {
      console.log('🔍 [QuestSystem] Checking on-chain quest badges for:', walletAddress)

      const { publicClient } = await getClients()

      // Calculate user's atom ID from wallet address
      const userAtomData = stringToHex(walletAddress)
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as string

      console.log('🔍 [QuestSystem] User atom ID:', userAtomId)

      // Query for all triples where subject = user wallet
      // Check both has_tag badges AND social links by predicate label
      // For social links, filter by creator = bot verifier address
      const botVerifierLower = BOT_VERIFIER_ADDRESS.toLowerCase()
      const query = `
        query GetQuestBadgesAndSocialLinks($subjectId: String!, $hasTagPredicateId: String!, $botVerifierId: String!) {
          badges: triples(
            where: {
              subject_id: { _eq: $subjectId },
              predicate_id: { _eq: $hasTagPredicateId }
            }
            limit: 1000
          ) {
            term_id
            object {
              label
            }
          }
          socialLinks: triples(
            where: {
              subject_id: { _eq: $subjectId },
              creator_id: { _eq: $botVerifierId },
              predicate: {
                label: { _in: [
                  "has verified discord id",
                  "has verified youtube id",
                  "has verified spotify id",
                  "has verified twitch id",
                  "has verified twitter id"
                ]}
              }
            }
            limit: 100
          ) {
            term_id
            creator_id
            predicate {
              label
            }
            object {
              label
            }
          }
        }
      `

      const data = await intuitionGraphqlClient.request(query, {
        subjectId: userAtomId,
        hasTagPredicateId: CHAIN_PREDICATE_IDS.HAS_TAG,
        botVerifierId: botVerifierLower
      }) as {
        badges: Array<{ term_id: string; object: { label: string } }>
        socialLinks: Array<{ term_id: string; creator_id: string; predicate: { label: string }; object: { label: string } }>
      }

      const claimedFromChain = new Set<string>()
      const questTitleToId = new Map<string, string>()

      // Build a map of quest titles to quest IDs
      QUEST_DEFINITIONS.forEach(quest => {
        questTitleToId.set(quest.title.toLowerCase(), quest.id)
      })

      // Check quest badges (has_tag triples)
      if (data.badges && data.badges.length > 0) {
        for (const triple of data.badges) {
          const objectLabel = triple.object?.label?.toLowerCase()
          if (objectLabel) {
            const questId = questTitleToId.get(objectLabel)
            if (questId) {
              console.log(`✅ [QuestSystem] Found on-chain badge for quest: ${questId} (${triple.object.label})`)
              claimedFromChain.add(questId)
            }
          }
        }
      }

      // Check social links by predicate label (filtered by bot verifier creator)
      // The query already filters by creator_id = BOT_VERIFIER_ADDRESS
      console.log(`🤖 [QuestSystem] Checking social links verified by bot: ${botVerifierLower}`)
      if (data.socialLinks && data.socialLinks.length > 0) {
        const predicateToQuestId: Record<string, string> = {
          'has verified discord id': 'link-discord',
          'has verified youtube id': 'link-youtube',
          'has verified spotify id': 'link-spotify',
          'has verified twitch id': 'link-twitch',
          'has verified twitter id': 'link-twitter',
        }

        for (const triple of data.socialLinks) {
          const predicateLabel = triple.predicate?.label?.toLowerCase()
          const objectLabel = triple.object?.label

          // Skip invalid labels (old buggy triples with [object Object] or similar)
          if (!objectLabel || objectLabel.includes('[object') || objectLabel.includes('{')) {
            console.log(`⚠️ [QuestSystem] Skipping invalid social link: predicate=${predicateLabel}, object=${objectLabel}`)
            continue
          }

          if (predicateLabel && predicateToQuestId[predicateLabel]) {
            const questId = predicateToQuestId[predicateLabel]
            console.log(`✅ [QuestSystem] Found verified social link: ${questId} (userId: ${objectLabel}, verifier: ${triple.creator_id})`)
            claimedFromChain.add(questId)
          }
        }
      }

      console.log(`🔍 [QuestSystem] Found ${claimedFromChain.size} on-chain quest badges/social links`)
      return claimedFromChain
    } catch (error) {
      console.error('❌ [QuestSystem] Error checking on-chain badges:', error)
      return new Set()
    }
  }

  // Load completed and claimed quests from storage, then sync with on-chain
  useEffect(() => {
    const loadQuestStates = async () => {
      try {
        const result = await chrome.storage.local.get(['completed_quests', 'claimed_quests'])

        let localClaimed = new Set<string>()
        if (result.completed_quests) {
          setCompletedQuestIds(new Set(result.completed_quests))
        }
        if (result.claimed_quests) {
          localClaimed = new Set(result.claimed_quests)
        }

        // Sync with on-chain badges
        if (walletAddress && !onChainSyncDone) {
          const onChainClaimed = await checkOnChainQuestBadges()

          // Merge local and on-chain claimed quests
          const mergedClaimed = new Set([...localClaimed, ...onChainClaimed])

          // If on-chain has badges not in local storage, update storage
          if (mergedClaimed.size > localClaimed.size) {
            console.log('📝 [QuestSystem] Syncing on-chain badges to local storage')
            await chrome.storage.local.set({
              claimed_quests: Array.from(mergedClaimed),
              completed_quests: Array.from(new Set([...completedQuestIds, ...onChainClaimed]))
            })
          }

          setClaimedQuestIds(mergedClaimed)
          setCompletedQuestIds(prev => new Set([...prev, ...onChainClaimed]))
          setOnChainSyncDone(true)
        } else {
          setClaimedQuestIds(localClaimed)
        }
      } catch (error) {
        console.error('Error loading quest states:', error)
      }
    }
    loadQuestStates()
  }, [walletAddress, onChainSyncDone])

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

  // Check if a social link triple already exists on-chain for this platform
  const checkSocialLinkExists = async (platform: SocialPlatform): Promise<boolean> => {
    if (!walletAddress) return false

    try {
      const { publicClient } = await getClients()

      // Calculate user's atom ID from wallet address
      const userAtomData = stringToHex(walletAddress)
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as string

      const botVerifierLower = BOT_VERIFIER_ADDRESS.toLowerCase()
      const predicateLabel = `has verified ${platform} id`

      const query = `
        query CheckSocialLink($subjectId: String!, $botVerifierId: String!, $predicateLabel: String!) {
          triples(
            where: {
              subject_id: { _eq: $subjectId }
              creator_id: { _eq: $botVerifierId }
              predicate: { label: { _eq: $predicateLabel } }
            }
            limit: 1
          ) {
            term_id
          }
        }
      `

      const data = await intuitionGraphqlClient.request(query, {
        subjectId: userAtomId,
        botVerifierId: botVerifierLower,
        predicateLabel
      }) as { triples: Array<{ term_id: string }> }

      const exists = data.triples && data.triples.length > 0
      console.log(`🔍 [QuestSystem] Social link check for ${platform}: ${exists ? 'EXISTS' : 'NOT FOUND'}`)
      return exists
    } catch (error) {
      console.error(`❌ [QuestSystem] Error checking social link for ${platform}:`, error)
      return false
    }
  }

  // Call Mastra API to link social account on-chain
  const callLinkSocialWorkflow = async (platform: SocialPlatform, oauthToken: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    console.log(`🔗 [QuestSystem] Calling link-social-workflow for ${platform}...`)

    const response = await fetch(`${MASTRA_API_URL}/api/workflows/linkSocialWorkflow/start-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: {
          walletAddress,
          platform,
          oauthToken
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Mastra API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.result?.success) {
      console.log(`✅ [QuestSystem] Social link created on-chain: ${result.result.txHash}`)
      return { success: true, txHash: result.result.txHash }
    } else {
      throw new Error(result.result?.error || 'Link social workflow failed')
    }
  }

  // Claim XP for a quest - creates on-chain badge triple
  const claimQuestXP = async (questId: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'No wallet connected' }
    }

    // Find the quest to get its title
    const quest = QUEST_DEFINITIONS.find(q => q.id === questId)
    if (!quest) {
      return { success: false, error: 'Quest not found' }
    }

    setClaimingQuestId(questId)

    try {
      console.log('🏆 [QuestSystem] Creating on-chain badge for quest:', quest.title)

      // Special handling for social-link quests
      if (quest.type === 'social-link' && quest.platform) {
        // Get the OAuth token for this platform
        const tokenKey = `oauth_token_${quest.platform}`
        const oauthResult = await chrome.storage.local.get([tokenKey])
        const tokenData = oauthResult[tokenKey]

        if (!tokenData?.accessToken) {
          return { success: false, error: `No ${quest.platform} token found. Please connect your ${quest.platform} account first.` }
        }

        // Check if social link already exists on-chain BEFORE calling Mastra API
        const alreadyLinked = await checkSocialLinkExists(quest.platform)
        let txHash: string | undefined

        if (alreadyLinked) {
          console.log(`✅ [QuestSystem] Social link already exists on-chain for ${quest.platform}, skipping TX`)
          // No TX needed, just mark as claimed
        } else {
          // Call Mastra API to create the social link triple on-chain (bot pays)
          const linkResult = await callLinkSocialWorkflow(quest.platform, tokenData.accessToken)

          if (!linkResult.success) {
            return linkResult
          }
          txHash = linkResult.txHash
        }

        // Mark quest as claimed after successful link (or if already linked)
        const newClaimed = new Set(claimedQuestIds)
        newClaimed.add(questId)
        setClaimedQuestIds(newClaimed)

        await chrome.storage.local.set({
          claimed_quests: Array.from(newClaimed)
        })

        console.log(`✅ [QuestSystem] Claimed XP for social-link quest: ${questId}`)
        return { success: true, txHash }
      }

      // Standard quest badge creation (user pays)
      // Ensure proxy is approved
      await ensureProxyApproval()

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      // 1. Get/Create user wallet atom as SUBJECT
      const userAtomData = stringToHex(walletAddress)
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as Address

      // Check if user atom exists, create if not
      const userAtomExists = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [userAtomId],
        authorizationList: undefined,
      }) as boolean

      if (!userAtomExists) {
        console.log('📝 [QuestSystem] Creating user atom...')
        const atomCost = await BlockchainService.getAtomCost()
        const atomMultiVaultCost = atomCost + MIN_DEPOSIT
        const atomTotalCost = await BlockchainService.getTotalCreationCost(1, MIN_DEPOSIT, atomMultiVaultCost)

        const atomTxHash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createAtoms',
          args: [walletAddress as Address, [userAtomData], [MIN_DEPOSIT], CURVE_ID],
          value: atomTotalCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: walletAddress as Address,
        })

        const atomReceipt = await publicClient.waitForTransactionReceipt({ hash: atomTxHash })
        if (atomReceipt.status !== 'success') {
          throw new Error('User atom creation failed')
        }
        console.log('✅ [QuestSystem] User atom created')
      }

      // 2. PREDICATE = "has tag" (pre-existing)
      const predicateId = CHAIN_PREDICATE_IDS.HAS_TAG as Address

      // 3. Create OBJECT = quest title atom
      console.log('📝 [QuestSystem] Creating quest badge atom...')
      const pinnedAtom = await pinAtomToIPFS({
        name: quest.title,
        description: `Sofia Quest Badge: ${quest.description}`,
        url: ''
      })

      const createdAtoms = await createAtomsFromPinned([pinnedAtom])
      const objectId = createdAtoms[quest.title].vaultId as Address

      // 4. Create triple: [wallet_atom] [has_tag] [quest_title]
      console.log('📝 [QuestSystem] Creating badge triple...')

      const tripleCost = await BlockchainService.getTripleCost()
      const multiVaultCost = tripleCost + MIN_DEPOSIT
      const totalCost = await BlockchainService.getTotalCreationCost(1, MIN_DEPOSIT, multiVaultCost)

      // Simulate first
      await publicClient.simulateContract({
        address: contractAddress as Address,
        abi: SofiaFeeProxyAbi,
        functionName: 'createTriples',
        args: [walletAddress as Address, [userAtomId], [predicateId], [objectId], [MIN_DEPOSIT], CURVE_ID],
        value: totalCost,
        account: walletClient.account
      })

      const txHash = await walletClient.writeContract({
        address: contractAddress as Address,
        abi: SofiaFeeProxyAbi,
        functionName: 'createTriples',
        args: [walletAddress as Address, [userAtomId], [predicateId], [objectId], [MIN_DEPOSIT], CURVE_ID],
        value: totalCost,
        chain: SELECTED_CHAIN,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: walletAddress as Address,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      if (receipt.status !== 'success') {
        throw new Error('Triple creation failed on-chain')
      }

      console.log('✅ [QuestSystem] Badge created on-chain:', txHash)

      // Only mark as claimed after successful TX
      const newClaimed = new Set(claimedQuestIds)
      newClaimed.add(questId)
      setClaimedQuestIds(newClaimed)

      await chrome.storage.local.set({
        claimed_quests: Array.from(newClaimed)
      })

      console.log('✅ [QuestSystem] Claimed XP for quest:', questId)

      return { success: true, txHash }
    } catch (error) {
      console.error('❌ [QuestSystem] Claim failed:', error)

      // Check if error is "TripleExists" or "Triple creation failed" - means badge/link already exists on-chain
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isTripleExistsError =
        errorMessage.includes('TripleExists') ||
        errorMessage.includes('MultiVault_TripleExists') ||
        errorMessage.includes('Triple creation failed')

      if (isTripleExistsError) {
        console.log('✅ [QuestSystem] Badge/link already exists on-chain, marking as claimed')

        // Mark as claimed since it already exists on-chain
        const newClaimed = new Set(claimedQuestIds)
        newClaimed.add(questId)
        setClaimedQuestIds(newClaimed)

        await chrome.storage.local.set({
          claimed_quests: Array.from(newClaimed)
        })

        return { success: true, error: 'Badge already claimed on-chain' }
      }

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setClaimingQuestId(null)
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

      // Query 1: Get signals created (triples with subject = "I") - PAGINATED
      const signalsQuery = `
        query GetUserSignals($accountId: String!, $subjectId: String!, $limit: Int!, $offset: Int!) {
          triples: terms(
            where: {
              _and: [
                { type: { _eq: Triple } },
                { triple: { subject: { term_id: { _eq: $subjectId } } } },
                { positions: { account: { id: { _eq: $accountId } } } }
              ]
            }
            limit: $limit
            offset: $offset
          ) {
            id
          }
        }
      `

      const allSignals = await intuitionGraphqlClient.fetchAllPages<{ id: string }>(
        signalsQuery,
        { accountId: checksumAddress, subjectId: SUBJECT_IDS.I },
        'triples',
        100,  // page size
        1000  // max pages (100k signals max)
      )

      const signalsCreated = allSignals.length

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
            limit: 10000
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

      const discordConnected = !!oauthResult.oauth_token_discord?.accessToken
      const youtubeConnected = !!oauthResult.oauth_token_youtube?.accessToken
      const spotifyConnected = !!oauthResult.oauth_token_spotify?.accessToken
      const twitchConnected = !!oauthResult.oauth_token_twitch?.accessToken
      const twitterConnected = !!oauthResult.oauth_token_twitter?.accessToken

      const oauthConnections = [
        discordConnected,
        youtubeConnected,
        spotifyConnected,
        twitchConnected,
        twitterConnected,
      ].filter(Boolean).length

      // Local bookmark data
      const bookmarkListsCreated = lists.length
      const bookmarkedSignals = triplets.length

      // Calculate unique intention types used
      const uniqueIntentionTypes = discoveryStats?.intentionBreakdown
        ? Object.values(discoveryStats.intentionBreakdown).filter(count => count > 0).length
        : 0

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
        discordConnected,
        youtubeConnected,
        spotifyConnected,
        twitchConnected,
        twitterConnected,
        pioneerCount: discoveryStats?.pioneerCount || 0,
        explorerCount: discoveryStats?.explorerCount || 0,
        contributorCount: discoveryStats?.contributorCount || 0,
        totalDiscoveries: discoveryStats?.totalCertifications || 0,
        uniqueIntentionTypes,
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
  }, [walletAddress, lists.length, triplets.length, discoveryStats])

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
          // For social-linked, count claimed social-link quests
          if (questDef.id === 'social-linked') {
            const linkedCount = ['link-discord', 'link-youtube', 'link-spotify', 'link-twitch', 'link-twitter']
              .filter(id => claimedQuestIds.has(id)).length
            current = linkedCount
          } else {
            current = userProgress.oauthConnections
          }
          break
        case 'social-link':
          // If already claimed on-chain, mark as complete
          if (claimedQuestIds.has(questDef.id)) {
            current = questDef.total
          } else if (questDef.platform) {
            // Check if this specific platform is connected locally
            const platformConnected = {
              discord: userProgress.discordConnected,
              youtube: userProgress.youtubeConnected,
              spotify: userProgress.spotifyConnected,
              twitch: userProgress.twitchConnected,
              twitter: userProgress.twitterConnected,
            }[questDef.platform]
            current = platformConnected ? 1 : 0
          }
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
        case 'discovery':
          if (questDef.id === 'discovery-first') {
            current = userProgress.totalDiscoveries
          } else if (questDef.id === 'discovery-pioneer') {
            current = userProgress.pioneerCount
          } else if (questDef.id === 'discovery-10' || questDef.id === 'discovery-50' || questDef.id === 'discovery-100') {
            current = userProgress.totalDiscoveries
          } else if (questDef.id === 'intention-variety') {
            current = userProgress.uniqueIntentionTypes
          }
          break
      }

      // Determine quest status
      let status: Quest['status'] = 'locked'
      let statusColor = '#6ACC93' // gray for locked
      let claimable = false

      const isCompleted = completedQuestIds.has(questDef.id)
      const isClaimed = claimedQuestIds.has(questDef.id)

      if (current >= questDef.total) {
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
  }, [userProgress, completedQuestIds, claimedQuestIds])

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

  // Calculate total XP and level - from ALL sources: quests + discovery + group certifications - spent
  const totalXP = useMemo(() => {
    const questXP = quests
      .filter(quest => claimedQuestIds.has(quest.id))
      .reduce((sum, quest) => sum + quest.xpReward, 0)
    // Total = quests + discovery + group certifications - spent on level ups
    return questXP + claimedDiscoveryXP + groupCertificationXP - spentXP
  }, [quests, claimedQuestIds, claimedDiscoveryXP, groupCertificationXP, spentXP])

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
    claimingQuestId,
    refreshQuests,
    markQuestCompleted,
    claimQuestXP,
  }
}
