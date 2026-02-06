/**
 * useUserQuests Hook
 * Simple hook to fetch quest data for any user (read-only)
 * Used for displaying badges and XP on user profiles
 */

import { useState, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { getAddress, createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import type { Quest } from './useQuestSystem'

// Simplified quest definitions for display only (based on useQuestSystem)
const DISPLAY_QUEST_DEFINITIONS: Array<{
  id: string
  title: string
  description: string
  total: number
  xpReward: number
  type: 'signal' | 'bookmark' | 'follow' | 'trust' | 'discovery' | 'social-link' | 'oauth'
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
  
  // Bookmark milestones
  { id: 'bookmark-list-1', title: 'Organizer', description: 'Create your first bookmark list', total: 1, xpReward: 30, type: 'bookmark', milestone: 1 },
  { id: 'bookmark-signal-1', title: 'Bookworm', description: 'Bookmark your first signal', total: 1, xpReward: 20, type: 'bookmark', milestone: 1 },
  { id: 'bookmark-signal-50', title: 'Archivist', description: 'Bookmark 50 signals', total: 50, xpReward: 250, type: 'bookmark', milestone: 50 },
  
  // Follow milestones
  { id: 'follow-50', title: 'Influencer', description: 'Follow 50 users', total: 50, xpReward: 300, type: 'follow', milestone: 50 },
  { id: 'networker-25', title: 'Networker', description: 'Follow 25 users', total: 25, xpReward: 350, type: 'follow', milestone: 25 },
  
  // Trust milestones
  { id: 'trust-10', title: 'Trustworthy', description: 'Trust 10 users', total: 10, xpReward: 200, type: 'trust', milestone: 10 },
  
  // Social Link quests - one per platform
  { id: 'link-discord', title: 'Discord Linked', description: 'Link your Discord account', total: 1, xpReward: 100, type: 'social-link', milestone: 1 },
  { id: 'link-youtube', title: 'YouTube Linked', description: 'Link your YouTube account', total: 1, xpReward: 100, type: 'social-link', milestone: 1 },
  { id: 'link-spotify', title: 'Spotify Linked', description: 'Link your Spotify account', total: 1, xpReward: 100, type: 'social-link', milestone: 1 },
  { id: 'link-twitch', title: 'Twitch Linked', description: 'Link your Twitch account', total: 1, xpReward: 100, type: 'social-link', milestone: 1 },
  { id: 'link-twitter', title: 'Twitter Linked', description: 'Link your Twitter account', total: 1, xpReward: 100, type: 'social-link', milestone: 1 },
  
  // Social Linked - bonus quest when all 5 platforms are linked
  { id: 'social-linked', title: 'Social Linked', description: 'Link all 5 social platforms', total: 5, xpReward: 500, type: 'oauth', milestone: 5 },
  
  // Discovery milestones
  { id: 'discovery-first', title: 'First Step', description: 'Certify your first page', total: 1, xpReward: 50, type: 'discovery', milestone: 1 },
  { id: 'discovery-pioneer', title: 'Trailblazer', description: 'Be the first to certify a page (Pioneer)', total: 1, xpReward: 200, type: 'discovery', milestone: 1 },
  { id: 'discovery-10', title: 'Pathfinder', description: 'Certify 10 pages', total: 10, xpReward: 100, type: 'discovery', milestone: 10 },
  { id: 'discovery-50', title: 'Cartographer', description: 'Certify 50 pages', total: 50, xpReward: 300, type: 'discovery', milestone: 50 },
  { id: 'discovery-100', title: 'World Explorer', description: 'Certify 100 pages', total: 100, xpReward: 500, type: 'discovery', milestone: 100 },
  { id: 'intention-variety', title: 'Multi-Purpose', description: 'Use all 5 intention types', total: 5, xpReward: 150, type: 'discovery', milestone: 5 },
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
        // Resolve ENS to address if needed
        let resolvedAddress = walletAddress
        
        // Check if walletAddress looks like an ENS name (contains . and doesn't start with 0x)
        if (walletAddress.includes('.') && !walletAddress.startsWith('0x')) {
          console.log('[useUserQuests] Detected ENS name, resolving:', walletAddress)
          try {
            const publicClient = createPublicClient({
              chain: mainnet,
              transport: http()
            })
            
            const address = await publicClient.getEnsAddress({
              name: normalize(walletAddress)
            })
            
            if (address) {
              resolvedAddress = address
              console.log('[useUserQuests] ✅ ENS resolved to:', resolvedAddress)
            } else {
              console.warn('[useUserQuests] ⚠️ ENS resolution returned null for:', walletAddress)
              setError('Failed to resolve ENS name')
              setLoading(false)
              return
            }
          } catch (ensError) {
            console.error('[useUserQuests] ❌ ENS resolution failed:', ensError)
            setError('Failed to resolve ENS name')
            setLoading(false)
            return
          }
        }
        
        const checksumAddress = getAddress(resolvedAddress)

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
              predicate {
                label
              }
              positions(
                order_by: { created_at: asc }
                limit: 1
              ) {
                account_id
              }
            }
          }
        `

        const bookmarkQuery = `
          query GetUserBookmarks($accountId: String!, $limit: Int!, $offset: Int!) {
            triples: terms(
              where: {
                _and: [
                  { type: { _eq: Triple } },
                  { positions: { account: { id: { _eq: $accountId } } } }
                ]
              }
              limit: $limit
              offset: $offset
            ) {
              id
              triple {
                predicate_id
                object_id
              }
            }
          }
        `

        // Execute all queries in parallel + OAuth checks
        const [allSignals, followResponse, trustResponse, discoveryResponse, allBookmarks, oauthConnections] = await Promise.all([
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
          }) as Promise<{ triples: Array<{ term_id: string; predicate: { label: string }; positions: Array<{ account_id: string }> }> }>,
          // Query 5: Bookmarks (paginated)
          intuitionGraphqlClient.fetchAllPages<{ id: string; triple: { predicate_id: string; object_id: string } }>(
            bookmarkQuery,
            { accountId: checksumAddress },
            'triples',
            100,
            1000  // max 1000 bookmarks
          ),
          // Query 6: OAuth checks (all platforms)
          (async () => {
            try {
              const youtubeKey = `oauth_token_youtube_${checksumAddress}`
              const spotifyKey = `oauth_token_spotify_${checksumAddress}`
              const twitchKey = `oauth_token_twitch_${checksumAddress}`
              const discordKey = `oauth_token_discord_${checksumAddress}`
              const twitterKey = `oauth_token_twitter_${checksumAddress}`
              
              const oauthResult = await chrome.storage.local.get([
                youtubeKey, spotifyKey, twitchKey, discordKey, twitterKey
              ])
              
              return {
                youtube: !!oauthResult[youtubeKey],
                spotify: !!oauthResult[spotifyKey],
                twitch: !!oauthResult[twitchKey],
                discord: !!oauthResult[discordKey],
                twitter: !!oauthResult[twitterKey]
              }
            } catch {
              return {
                youtube: false,
                spotify: false,
                twitch: false,
                discord: false,
                twitter: false
              }
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

        // Calculate unique intention types used
        const uniqueIntentionTypes = new Set(
          userDiscoveries
            .filter(triple => triple.predicate?.label)
            .map(triple => triple.predicate.label)
        ).size

        // Process bookmarks: count lists and bookmarked signals
        const objectIds = new Set<string>()
        
        // Filter out invalid bookmarks (where triple is null)
        const validBookmarks = allBookmarks.filter(bookmark => bookmark.triple?.object_id)
        
        validBookmarks.forEach(bookmark => {
          objectIds.add(bookmark.triple.object_id)
        })
        
        const bookmarkListsCreated = objectIds.size
        const bookmarkedSignalsCount = validBookmarks.length

        // Count OAuth connections
        const oauthCount = Object.values(oauthConnections).filter(Boolean).length

        console.log('[useUserQuests] Stats:', { 
          signalsCreated, 
          followedUsers, 
          trustedUsers, 
          totalDiscoveries, 
          pioneerCount, 
          uniqueIntentionTypes,
          bookmarkListsCreated,
          bookmarkedSignalsCount,
          oauthConnections,
          oauthCount
        })

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
            case 'bookmark':
              if (quest.id === 'bookmark-list-1') {
                current = bookmarkListsCreated
              } else {
                // bookmark-signal-1, bookmark-signal-50, curator quests
                current = bookmarkedSignalsCount
              }
              break
            case 'social-link':
              // Check for specific social platform
              if (quest.id === 'link-discord') {
                current = oauthConnections.discord ? 1 : 0
              } else if (quest.id === 'link-youtube') {
                current = oauthConnections.youtube ? 1 : 0
              } else if (quest.id === 'link-spotify') {
                current = oauthConnections.spotify ? 1 : 0
              } else if (quest.id === 'link-twitch') {
                current = oauthConnections.twitch ? 1 : 0
              } else if (quest.id === 'link-twitter') {
                current = oauthConnections.twitter ? 1 : 0
              }
              break
            case 'oauth':
              // social-linked quest: all 5 platforms
              if (quest.id === 'social-linked') {
                current = oauthCount
              }
              break
            case 'discovery':
              if (quest.id === 'discovery-pioneer') {
                // Trailblazer: be the first to certify a page (Pioneer)
                current = pioneerCount
              } else if (quest.id === 'intention-variety') {
                // Use all 5 intention types
                current = uniqueIntentionTypes
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
