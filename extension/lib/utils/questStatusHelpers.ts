/**
 * Quest Status Helpers
 * Pure functions for computing quest statuses, levels, and XP
 * Extracted from useQuestSystem to be testable and reusable
 */

import type { Quest, QuestDefinition, UserProgress } from '../../types/questTypes'

// XP calculation: Level N requires 100 * N XP
export const calculateLevelFromXP = (xp: number): number => {
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

export const calculateXPForNextLevel = (currentLevel: number): number => {
  return 100 * (currentLevel + 1)
}

// Get claim ID for a quest (includes date for daily quests)
export const getClaimId = (questId: string, questDef?: QuestDefinition) => {
  if (questDef?.recurringType === 'daily') {
    return `${questId}-${new Date().toISOString().split('T')[0]}`
  }
  return questId
}

// Compute current progress for a single quest definition
function computeQuestProgress(
  questDef: QuestDefinition,
  userProgress: UserProgress,
  claimedQuestIds: Set<string>
): number {
  // Handle daily quests specially
  if (questDef.recurringType === 'daily') {
    if (questDef.id === 'daily-signal') {
      return userProgress.hasSignalToday ? 1 : 0
    } else if (questDef.id === 'daily-certification') {
      return userProgress.hasCertificationToday ? 1 : 0
    } else if (questDef.id === 'daily-vote') {
      return userProgress.hasVotedToday ? 1 : 0
    }
    return 0
  }

  switch (questDef.type) {
    case 'signal':
      return userProgress.signalsCreated
    case 'bookmark':
      if (questDef.id === 'bookmark-list-1') return userProgress.bookmarkListsCreated
      if (questDef.id.startsWith('bookmark-signal')) return userProgress.bookmarkedSignals
      return 0
    case 'oauth':
      if (questDef.id === 'social-linked') {
        return ['link-discord', 'link-youtube', 'link-spotify', 'link-twitch', 'link-twitter']
          .filter(id => claimedQuestIds.has(id)).length
      }
      return userProgress.oauthConnections
    case 'social-link':
      if (claimedQuestIds.has(questDef.id)) return questDef.total
      if (questDef.platform) {
        const connected: Record<string, boolean> = {
          discord: userProgress.discordConnected,
          youtube: userProgress.youtubeConnected,
          spotify: userProgress.spotifyConnected,
          twitch: userProgress.twitchConnected,
          twitter: userProgress.twitterConnected,
        }
        return connected[questDef.platform] ? 1 : 0
      }
      return 0
    case 'follow':
      return userProgress.followedUsers
    case 'trust':
      return userProgress.trustedUsers
    case 'streak':
      return userProgress.currentStreak
    case 'pulse':
      if (questDef.id === 'pulse-first') return userProgress.pulseLaunches
      if (questDef.id === 'pulse-weekly-5') return userProgress.weeklyPulseUses
      return 0
    case 'curator':
      return userProgress.bookmarkedSignals
    case 'social':
      if (questDef.id === 'networker-25') return userProgress.followedUsers
      return 0
    case 'discovery':
      if (questDef.id === 'discovery-first') return userProgress.totalDiscoveries
      if (questDef.id === 'discovery-pioneer') return userProgress.pioneerCount
      if (questDef.id === 'discovery-10' || questDef.id === 'discovery-50' || questDef.id === 'discovery-100') {
        return userProgress.totalDiscoveries
      }
      if (questDef.id === 'intention-variety') return userProgress.uniqueIntentionTypes
      return 0
    case 'vote':
      if (questDef.id === 'vote-streak-7' || questDef.id === 'vote-streak-30') {
        return userProgress.currentVoteStreak
      }
      return userProgress.totalVotes
    case 'gold':
      return userProgress.goldAccumulated
    default:
      return 0
  }
}

/**
 * Compute quest statuses from definitions, progress, and claimed state
 * Returns the sorted quest list + IDs of newly completed quests (for persistence)
 */
export function computeQuestStatuses(
  definitions: QuestDefinition[],
  userProgress: UserProgress,
  completedQuestIds: Set<string>,
  claimedQuestIds: Set<string>
): { quests: Quest[]; newlyCompleted: string[] } {
  const newlyCompleted: string[] = []

  const quests = definitions.map(questDef => {
    const current = computeQuestProgress(questDef, userProgress, claimedQuestIds)

    let status: Quest['status'] = 'locked'
    let statusColor = '#6ACC93'

    const isCompleted = completedQuestIds.has(questDef.id)
    const isClaimed = claimedQuestIds.has(questDef.id)

    // For daily quests, check if already claimed TODAY
    const isClaimedToday = questDef.recurringType === 'daily'
      ? claimedQuestIds.has(`${questDef.id}-${new Date().toISOString().split('T')[0]}`)
      : isClaimed

    if (isClaimedToday) {
      status = 'completed'
      statusColor = '#48bb78'
    } else if (current >= questDef.total) {
      status = 'claimable_xp'
      statusColor = '#FFD700'
      // Track newly completed (non-recurring) for persistence outside memo
      if (!isCompleted && !questDef.recurringType) {
        newlyCompleted.push(questDef.id)
      }
    } else if (current > 0 || questDef.milestone === 1 || questDef.recurringType) {
      status = 'active'
      statusColor = '#EAB67A'
    }

    return {
      ...questDef,
      current: Math.min(current, questDef.total),
      status,
      statusColor,
      claimable: false,
    }
  }).sort((a, b) => {
    if (a.status === 'claimable_xp' && b.status !== 'claimable_xp') return -1
    if (a.status !== 'claimable_xp' && b.status === 'claimable_xp') return 1
    if (a.recurringType === 'daily' && b.recurringType !== 'daily') return -1
    if (a.recurringType !== 'daily' && b.recurringType === 'daily') return 1
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    return (a.milestone || 0) - (b.milestone || 0)
  })

  return { quests, newlyCompleted }
}
