/**
 * useUserQuests Hook
 * Simple hook to fetch quest data for any user (read-only)
 * Used for displaying badges and XP on user profiles
 */

import { useState, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { getAddress } from 'viem'
import type { Quest } from './useQuestSystem'

// Simplified quest definitions for display only
const DISPLAY_QUEST_DEFINITIONS: Array<{
  id: string
  title: string
  description: string
  total: number
  xpReward: number
  type: 'signal' | 'follow' | 'trust' | 'discovery' | 'social-link'
  milestone: number
}> = [
  // Signal milestones
  { id: 'signal-1', title: 'First Signal', description: 'Create your very first signal', total: 1, xpReward: 50, type: 'signal', milestone: 1 },
  { id: 'signal-10', title: 'Signal Rookie', description: 'Create 10 signals', total: 10, xpReward: 100, type: 'signal', milestone: 10 },
  { id: 'signal-50', title: 'Signal Maker', description: 'Create 50 signals', total: 50, xpReward: 200, type: 'signal', milestone: 50 },
  { id: 'signal-100', title: 'Centurion', description: 'Create 100 signals', total: 100, xpReward: 400, type: 'signal', milestone: 100 },
  { id: 'signal-500', title: 'Signal Pro', description: 'Create 500 signals', total: 500, xpReward: 1000, type: 'signal', milestone: 500 },
  { id: 'signal-1000', title: 'Signal Master', description: 'Create 1,000 signals', total: 1000, xpReward: 2000, type: 'signal', milestone: 1000 },
  { id: 'signal-5000', title: 'Signal Legend', description: 'Create 5,000 signals', total: 5000, xpReward: 5000, type: 'signal', milestone: 5000 },
  { id: 'signal-10000', title: 'Signal Titan', description: 'Create 10,000 signals', total: 10000, xpReward: 10000, type: 'signal', milestone: 10000 },
  { id: 'signal-50000', title: 'Signal God', description: 'Create 50,000 signals', total: 50000, xpReward: 25000, type: 'signal', milestone: 50000 },
  { id: 'signal-100000', title: 'Signal Immortal', description: 'Create 100,000 signals', total: 100000, xpReward: 50000, type: 'signal', milestone: 100000 },
  
  // Follow milestones
  { id: 'follow-50', title: 'Influencer', description: 'Follow 50 users', total: 50, xpReward: 300, type: 'follow', milestone: 50 },
  
  // Trust milestones
  { id: 'trust-10', title: 'Trustworthy', description: 'Trust 10 users', total: 10, xpReward: 200, type: 'trust', milestone: 10 },
  
  // Social Link quests
  { id: 'link-discord', title: 'Discord Linked', description: 'Link your Discord account', total: 1, xpReward: 100, type: 'social-link', milestone: 1 },
  
  // Discovery milestones
  { id: 'discovery-first', title: 'First Step', description: 'Certify your first page', total: 1, xpReward: 50, type: 'discovery', milestone: 1 },
  { id: 'discovery-pioneer', title: 'Trailblazer', description: 'Be the first to certify a page (Pioneer)', total: 1, xpReward: 200, type: 'discovery', milestone: 1 },
  { id: 'discovery-10', title: 'Pathfinder', description: 'Certify 10 pages', total: 10, xpReward: 100, type: 'discovery', milestone: 10 },
  { id: 'discovery-50', title: 'Cartographer', description: 'Certify 50 pages', total: 50, xpReward: 300, type: 'discovery', milestone: 50 },
  { id: 'discovery-100', title: 'World Explorer', description: 'Certify 100 pages', total: 100, xpReward: 500, type: 'discovery', milestone: 100 },
]

interface UserQuestsResult {
  completedQuests: Array<{ id: string; title: string; description: string }>
  totalXP: number
  level: number
  loading: boolean
  error?: string
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

export const useUserQuests = (walletAddress?: string): UserQuestsResult => {
  const [completedQuests, setCompletedQuests] = useState<Array<{ id: string; title: string; description: string }>>([])
  const [totalXP, setTotalXP] = useState(0)
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchUserQuests = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        const checksumAddress = getAddress(walletAddress)

        // Try to load from cache first (2min TTL)
        const cacheKey = `user_quests_${checksumAddress}`
        const cacheTimestampKey = `user_quests_timestamp_${checksumAddress}`
        
        try {
          const cacheResult = await chrome.storage.local.get([cacheKey, cacheTimestampKey])
          const cachedData = cacheResult[cacheKey]
          const cachedTimestamp = cacheResult[cacheTimestampKey]
          
          if (cachedData && cachedTimestamp && Date.now() - cachedTimestamp < 2 * 60 * 1000) {
            console.log('[useUserQuests] Using cached data')
            setCompletedQuests(cachedData.completedQuests)
            setTotalXP(cachedData.totalXP)
            setLevel(cachedData.level)
            setLoading(false)
            return
          }
        } catch {
          // Cache read failed, continue with fresh fetch
        }

        setLoading(true)
        setError(undefined)

        setLoading(true)
        setError(undefined)

        // Prepare all queries
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

        const followQuery = `
          query GetUserFollows($accountId: String!, $subjectId: String!, $predicateId: String!) {
            triples(
              where: {
                _and: [
                  { subject_id: { _eq: $subjectId } },
                  { predicate_id: { _eq: $predicateId } },
                  { positions: { account: { id: { _eq: $accountId } } } }
                ]
              }
            ) {
              term_id
            }
          }
        `

        const INTENTION_PREDICATE_LABELS = [
          'visits for work',
          'visits for learning ',  // trailing space (official atom)
          'visits for fun',
          'visits for inspiration',
          'visits for buying'
        ]

        const discoveryQuery = `
          query UserDiscovery($predicateLabels: [String!]!, $userAddress: String!) {
            triples(
              where: {
                predicate: { label: { _in: $predicateLabels } }
                positions: {
                  account_id: { _ilike: $userAddress }
                  shares: { _gt: "0" }
                }
              }
            ) {
              term_id
              positions(
                order_by: { created_at: asc }
                limit: 1
              ) {
                account_id
              }
            }
          }
        `

        // Execute all queries in parallel + OAuth check
        const [allSignals, followResponse, trustResponse, discoveryResponse, discordConnected] = await Promise.all([
          // Query 1: Signals (paginated)
          intuitionGraphqlClient.fetchAllPages<{ id: string }>(
            signalsQuery,
            { accountId: checksumAddress, subjectId: SUBJECT_IDS.I },
            'triples',
            100,
            1000  // max 1000 signals
          ),
          // Query 2: Follows
          intuitionGraphqlClient.request(followQuery, {
            accountId: checksumAddress,
            subjectId: SUBJECT_IDS.I,
            predicateId: PREDICATE_IDS.FOLLOW
          }) as Promise<{ triples: Array<{ term_id: string }> }>,
          // Query 3: Trusts
          intuitionGraphqlClient.request(followQuery, {
            accountId: checksumAddress,
            subjectId: SUBJECT_IDS.I,
            predicateId: PREDICATE_IDS.TRUSTS
          }) as Promise<{ triples: Array<{ term_id: string }> }>,
          // Query 4: Discovery
          intuitionGraphqlClient.request(discoveryQuery, {
            predicateLabels: INTENTION_PREDICATE_LABELS,
            userAddress: checksumAddress.toLowerCase()
          }) as Promise<{ triples: Array<{ term_id: string; positions: Array<{ account_id: string }> }> }>,
          // Query 5: OAuth check (Discord)
          (async () => {
            try {
              const discordKey = `oauth_token_discord_${checksumAddress}`
              const oauthResult = await chrome.storage.local.get([discordKey])
              return !!oauthResult[discordKey]
            } catch {
              return false
            }
          })()
        ])

        // Process results
        const signalsCreated = allSignals.length
        const followedUsers = followResponse?.triples?.length || 0
        const trustedUsers = trustResponse?.triples?.length || 0
        const userDiscoveries = discoveryResponse?.triples || []
        const totalDiscoveries = userDiscoveries.length

        // Count Pioneer badges (user was the first to certify)
        const pioneerCount = userDiscoveries.filter(triple => {
          const firstAccount = triple.positions[0]?.account_id
          return firstAccount && firstAccount.toLowerCase() === checksumAddress.toLowerCase()
        }).length

        console.log('[useUserQuests] Stats:', { signalsCreated, followedUsers, trustedUsers, totalDiscoveries, pioneerCount, discordConnected })

        // Calculate completed quests based on milestones
        const completed: Array<{ id: string; title: string; description: string }> = []
        let xp = 0

        DISPLAY_QUEST_DEFINITIONS.forEach(quest => {
          let current = 0

          switch (quest.type) {
            case 'signal':
              current = signalsCreated
              break
            case 'follow':
              current = followedUsers
              break
            case 'trust':
              current = trustedUsers
              break
            case 'social-link':
              // Check for specific social platform (Discord)
              if (quest.id === 'link-discord') {
                current = discordConnected ? 1 : 0
              }
              break
            case 'discovery':
              if (quest.id === 'discovery-pioneer') {
                // Trailblazer: be the first to certify a page (Pioneer)
                current = pioneerCount
              } else {
                // Other discovery quests use total discoveries
                current = totalDiscoveries
              }
              break
          }

          // Check if milestone reached
          if (current >= quest.milestone) {
            completed.push({
              id: quest.id,
              title: quest.title,
              description: quest.description
            })
            xp += quest.xpReward
          }
        })

        setCompletedQuests(completed)
        setTotalXP(xp)
        setLevel(calculateLevelFromXP(xp))

        // Save to cache (2min TTL)
        try {
          await chrome.storage.local.set({
            [cacheKey]: { completedQuests: completed, totalXP: xp, level: calculateLevelFromXP(xp) },
            [cacheTimestampKey]: Date.now()
          })
          console.log('[useUserQuests] Data cached')
        } catch {
          // Cache write failed, continue anyway
        }

        console.log('[useUserQuests] Completed quests:', completed.length, 'Total XP:', xp, 'Level:', calculateLevelFromXP(xp))

      } catch (err) {
        console.error('[useUserQuests] Error fetching user quests:', err)
        setError('Failed to load quest data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserQuests()
  }, [walletAddress])

  return {
    completedQuests,
    totalXP,
    level,
    loading,
    error
  }
}
