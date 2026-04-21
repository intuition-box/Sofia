/**
 * useUserQuests Hook
 * Fetches on-chain claimed quest badges for any user (read-only)
 * Used for displaying badges and XP on user profiles
 */

import { useState, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../lib/config/constants'
import { getAddress, createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { QuestBadgeService } from '../lib/services'
import { QUEST_DEFINITIONS, type Quest } from '../types/questTypes'
import { calculateLevelFromXP } from '../lib/utils'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useUserQuests')

interface UserQuestsResult {
  completedQuests: Quest[]
  totalXP: number
  level: number
  signalsCreated: number
  loading: boolean
  error?: string
}

export const useUserQuests = (walletAddress?: string): UserQuestsResult => {
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([])
  const [totalXP, setTotalXP] = useState(0)
  const [level, setLevel] = useState(1)
  const [signalsCreated, setSignalsCreated] = useState(0)
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

        if (walletAddress.includes('.') && !walletAddress.startsWith('0x')) {
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
            } else {
              setError('Failed to resolve ENS name')
              setLoading(false)
              return
            }
          } catch {
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
            setCompletedQuests(cachedData.completedQuests)
            setTotalXP(cachedData.totalXP)
            setLevel(cachedData.level)
            setSignalsCreated(cachedData.signalsCreated || 0)
            setLoading(false)
            return
          }
        } catch {
          // Cache read failed, continue with fresh fetch
        }

        setLoading(true)
        setError(undefined)

        // Signals count query (kept for stats display)
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

        // Fetch signals count + on-chain badges in parallel
        const [allSignals, claimedIds] = await Promise.all([
          intuitionGraphqlClient.fetchAllPages<{ id: string }>(
            signalsQuery,
            { accountId: checksumAddress, subjectId: SUBJECT_IDS.I },
            'triples',
            100,
            1000
          ),
          QuestBadgeService.checkOnChainBadges(checksumAddress, QUEST_DEFINITIONS)
        ])

        const signalCount = allSignals.length
        setSignalsCreated(signalCount)

        // Build Quest[] from on-chain claimed IDs
        const questDefMap = new Map(QUEST_DEFINITIONS.map(q => [q.id, q]))
        const completed: Quest[] = []
        let xp = 0

        for (const questId of claimedIds) {
          const def = questDefMap.get(questId)
          if (def) {
            completed.push({
              id: def.id,
              title: def.title,
              description: def.description,
              type: def.type,
              xpReward: def.xpReward,
              current: def.total,
              total: def.total,
              status: 'completed',
              statusColor: '#48bb78'
            })
            xp += def.xpReward
          }
        }

        setCompletedQuests(completed)
        setTotalXP(xp)
        setLevel(calculateLevelFromXP(xp))

        // Save to cache (2min TTL)
        try {
          await chrome.storage.local.set({
            [cacheKey]: { completedQuests: completed, totalXP: xp, level: calculateLevelFromXP(xp), signalsCreated: signalCount },
            [cacheTimestampKey]: Date.now()
          })
        } catch {
          // Cache write failed
        }

        logger.debug('On-chain badges loaded', { claimedCount: claimedIds.size, totalXP: xp, level: calculateLevelFromXP(xp) })

      } catch (err) {
        logger.error('Error fetching user quests', err)
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
    signalsCreated,
    loading,
    error
  }
}
