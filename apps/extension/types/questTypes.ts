/**
 * Quest System Types & Definitions
 * Shared across useQuestSystem hook, services, and UI components.
 *
 * The quest catalogue (`QUEST_DEFINITIONS`, `QUEST_XP_REWARDS`) and its
 * static types now live in the shared `@0xsofia/quests` package — single
 * source of truth with the explorer, which reads back the quest-badge
 * triples this app mints. The runtime-facing types below (per-user state,
 * hook result, atom operations) stay extension-local.
 */
import type { QuestDefinition } from '@0xsofia/quests'

export {
  QUEST_DEFINITIONS,
  QUEST_XP_REWARDS,
  type QuestDefinition,
  type QuestType,
  type SocialPlatform,
} from '@0xsofia/quests'

// A quest with its per-user runtime state layered on the static definition.
export interface Quest extends QuestDefinition {
  current: number
  status: 'locked' | 'active' | 'completed' | 'claimable_xp'
  statusColor: string
}

// User progress data
export interface UserProgress {
  signalsCreated: number
  bookmarkListsCreated: number
  bookmarkedSignals: number
  oauthConnections: number
  followedUsers: number
  trustedUsers: number
  currentStreak: number
  hasSignalToday: boolean
  hasCertificationToday: boolean
  pulseLaunches: number
  weeklyPulseUses: number
  discordConnected: boolean
  youtubeConnected: boolean
  spotifyConnected: boolean
  twitchConnected: boolean
  twitterConnected: boolean
  pioneerCount: number
  explorerCount: number
  contributorCount: number
  totalDiscoveries: number
  uniqueIntentionTypes: number
  goldAccumulated: number
  totalVotes: number
  hasVotedToday: boolean
  currentVoteStreak: number
  certActivityDates: string[]   // YYYY-MM-DD from on-chain deposits
  voteActivityDates: string[]   // YYYY-MM-DD from on-chain deposits
}

// Quest system result (hook return type)
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
  error: string | null
  claimingQuestId: string | null
  refreshQuests: () => Promise<void>
  markQuestCompleted: (questId: string) => Promise<void>
  claimQuestXP: (questId: string) => Promise<{ success: boolean; txHash?: string; error?: string }>
}

// Atom operations passed from React hooks to services
// Uses `any` for pinned atom data since it's an opaque passthrough between pin → create
export interface AtomOperations {
  ensureProxyApproval: () => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pinAtomToIPFS: (data: { name: string; description: string; url: string }) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAtomsFromPinned: (pinnedAtoms: any[]) => Promise<Record<string, { vaultId: string }>>
}
