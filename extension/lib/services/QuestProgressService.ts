/**
 * QuestProgressService
 * Handles quest progress data fetching, caching, and persistence
 * Extracted from useQuestSystem to separate data concerns from React state
 */

import { getAddress } from 'viem'
import { intuitionGraphqlClient } from '../clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../config/constants'
import { questTrackingService } from './QuestTrackingService'
import { createServiceLogger, getWalletKey } from '../utils'
import type { UserProgress } from '../../types/questTypes'
import {
  GetUserSignalsDocument,
  GetFollowCountDocument
} from '@0xsofia/graphql'

const logger = createServiceLogger('QuestProgressService')

// Cache duration in milliseconds (2 minutes)
const QUEST_CACHE_DURATION = 120000


// Data from React hooks that can't be fetched in the service
export interface LocalProgressData {
  bookmarkListsCount: number
  bookmarkedSignalsCount: number
  discoveryStats: {
    pioneerCount?: number
    explorerCount?: number
    contributorCount?: number
    totalCertifications?: number
    intentionBreakdown?: Record<string, number>
  } | null
  // On-chain streak data (from useOnChainStreak hook)
  onChainCertStreak?: number
  onChainVoteStreak?: number
  certActivityDates?: string[]
  voteActivityDates?: string[]
}

export class QuestProgressService {
  /**
   * Load Gold data from storage.
   * Gold = discovery + certification - spent (private, used for level-ups).
   */
  static async loadGoldData(walletAddress: string): Promise<{
    discoveryGold: number
    certificationGold: number
    spentGold: number
  }> {
    try {
      const normalized = walletAddress.toLowerCase()
      const discoveryKey = getWalletKey('discovery_gold', normalized)
      const certKey = getWalletKey('certification_gold', normalized)
      const spentKey = getWalletKey('spent_gold', normalized)

      const result = await chrome.storage.local.get([discoveryKey, certKey, spentKey])
      return {
        discoveryGold: result[discoveryKey] || 0,
        certificationGold: result[certKey] || 0,
        spentGold: result[spentKey] || 0
      }
    } catch (err) {
      logger.error('Failed to load Gold data', err)
      return { discoveryGold: 0, certificationGold: 0, spentGold: 0 }
    }
  }

  /**
   * Load cached progress from storage
   * Returns null if cache is stale or doesn't exist
   */
  static async loadCachedProgress(walletAddress: string): Promise<UserProgress | null> {
    try {
      const cacheKey = getWalletKey('quest_progress_cache', walletAddress)
      const timestampKey = getWalletKey('quest_progress_timestamp', walletAddress)

      const result = await chrome.storage.local.get([cacheKey, timestampKey])

      if (result[cacheKey]) {
        const cacheAge = Date.now() - (result[timestampKey] || 0)
        if (cacheAge < QUEST_CACHE_DURATION) {
          logger.debug('Using cached progress', { ageSeconds: Math.round(cacheAge / 1000) })
          return result[cacheKey]
        }
      }

      return null
    } catch (err) {
      logger.error('Failed to load cache', err)
      return null
    }
  }

  /**
   * Check if cached progress is stale for a given wallet
   */
  static async isCacheStale(walletAddress: string): Promise<boolean> {
    const timestampKey = getWalletKey('quest_progress_timestamp', walletAddress)
    const result = await chrome.storage.local.get(timestampKey)
    const cacheAge = Date.now() - (result[timestampKey] || 0)
    return cacheAge >= QUEST_CACHE_DURATION
  }

  /**
   * Fetch fresh progress data from GraphQL + local sources
   */
  static async fetchProgress(
    walletAddress: string,
    localData: LocalProgressData
  ): Promise<UserProgress> {
    const checksumAddress = getAddress(walletAddress)

    // Query 1: Get signals created (paginated)
    const allSignals = await intuitionGraphqlClient.fetchAllPages<{ id: string }>(
      GetUserSignalsDocument,
      { accountId: checksumAddress, subjectId: SUBJECT_IDS.I },
      'triples',
      100,
      1000
    )
    const signalsCreated = allSignals.length

    // Query 2: Get followed users count
    const followResponse = await intuitionGraphqlClient.request(GetFollowCountDocument, {
      accountId: checksumAddress,
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.FOLLOW
    }) as { triples: Array<{ term_id: string }> }
    const followedUsers = followResponse?.triples?.length || 0

    // Query 3: Get trusted users count
    const trustResponse = await intuitionGraphqlClient.request(GetFollowCountDocument, {
      accountId: checksumAddress,
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.TRUSTS
    }) as { triples: Array<{ term_id: string }> }
    const trustedUsers = trustResponse?.triples?.length || 0

    // Query 4: Check OAuth connections (per-wallet)
    const youtubeKey = getWalletKey('oauth_token_youtube', checksumAddress)
    const spotifyKey = getWalletKey('oauth_token_spotify', checksumAddress)
    const twitchKey = getWalletKey('oauth_token_twitch', checksumAddress)
    const discordKey = getWalletKey('oauth_token_discord', checksumAddress)
    const twitterKey = getWalletKey('oauth_token_twitter', checksumAddress)

    const oauthResult = await chrome.storage.local.get([
      youtubeKey, spotifyKey, twitchKey, discordKey, twitterKey
    ])

    const discordConnected = !!oauthResult[discordKey]?.accessToken
    const youtubeConnected = !!oauthResult[youtubeKey]?.accessToken
    const spotifyConnected = !!oauthResult[spotifyKey]?.accessToken
    const twitchConnected = !!oauthResult[twitchKey]?.accessToken
    const twitterConnected = !!oauthResult[twitterKey]?.accessToken

    const oauthConnections = [
      discordConnected, youtubeConnected, spotifyConnected, twitchConnected, twitterConnected
    ].filter(Boolean).length

    // Discovery data from local hooks
    const uniqueIntentionTypes = localData.discoveryStats?.intentionBreakdown
      ? Object.values(localData.discoveryStats.intentionBreakdown).filter(count => count > 0).length
      : 0

    // Streak data from on-chain (passed from useOnChainStreak hook)
    const currentStreak = localData.onChainCertStreak ?? 0
    const currentVoteStreak = localData.onChainVoteStreak ?? 0

    // Daily flags + pulse from QuestTrackingService (still local)
    const hasSignalToday = await questTrackingService.hasSignalToday()
    const hasCertificationToday = await questTrackingService.hasCertificationToday()
    const pulseStats = await questTrackingService.getPulseStats()

    // Vote counts from QuestTrackingService (still local)
    const totalVotes = await questTrackingService.getTotalVotes()
    const hasVotedToday = await questTrackingService.hasVotedToday()

    // Load Gold accumulation data for Gold quests (lifetime earned, not current balance)
    const goldData = await this.loadGoldData(walletAddress)
    const goldAccumulated = goldData.discoveryGold + goldData.certificationGold

    const progress: UserProgress = {
      signalsCreated,
      bookmarkListsCreated: localData.bookmarkListsCount,
      bookmarkedSignals: localData.bookmarkedSignalsCount,
      oauthConnections,
      followedUsers,
      trustedUsers,
      currentStreak,
      hasSignalToday,
      hasCertificationToday,
      pulseLaunches: pulseStats.total,
      weeklyPulseUses: pulseStats.weekly,
      discordConnected,
      youtubeConnected,
      spotifyConnected,
      twitchConnected,
      twitterConnected,
      pioneerCount: localData.discoveryStats?.pioneerCount || 0,
      explorerCount: localData.discoveryStats?.explorerCount || 0,
      contributorCount: localData.discoveryStats?.contributorCount || 0,
      totalDiscoveries: localData.discoveryStats?.totalCertifications || 0,
      uniqueIntentionTypes,
      goldAccumulated,
      totalVotes,
      hasVotedToday,
      currentVoteStreak,
      certActivityDates: localData.certActivityDates || [],
      voteActivityDates: localData.voteActivityDates || [],
    }

    // Save to cache
    await this.saveCachedProgress(walletAddress, progress)

    return progress
  }

  /**
   * Save progress to cache
   */
  static async saveCachedProgress(walletAddress: string, progress: UserProgress): Promise<void> {
    const cacheKey = getWalletKey('quest_progress_cache', walletAddress)
    const timestampKey = getWalletKey('quest_progress_timestamp', walletAddress)
    await chrome.storage.local.set({
      [cacheKey]: progress,
      [timestampKey]: Date.now()
    })
    logger.debug('Progress cached')
  }

  /**
   * Save completed quest to storage
   */
  static async saveCompletedQuest(
    walletAddress: string,
    questId: string,
    currentCompleted: Set<string>
  ): Promise<Set<string>> {
    const newCompleted = new Set(currentCompleted)
    newCompleted.add(questId)

    try {
      const completedKey = getWalletKey('completed_quests', walletAddress)
      await chrome.storage.local.set({
        [completedKey]: Array.from(newCompleted)
      })
      logger.info('Saved completed quest', { questId })
    } catch (error) {
      logger.error('Failed to save completed quest', error)
    }

    return newCompleted
  }
}
