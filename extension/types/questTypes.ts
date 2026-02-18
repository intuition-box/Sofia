/**
 * Quest System Types & Definitions
 * Shared across useQuestSystem hook, services, and UI components
 */

// Social platform type
export type SocialPlatform = 'discord' | 'youtube' | 'spotify' | 'twitch' | 'twitter'

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
  type: 'signal' | 'bookmark' | 'oauth' | 'follow' | 'trust' | 'streak' | 'pulse' | 'curator' | 'social' | 'social-link' | 'discovery' | 'gold' | 'vote'
  milestone?: number
  claimable?: boolean
  recurringType?: 'daily' | 'weekly'
  platform?: SocialPlatform
}

// Quest definition without runtime state (current, status, statusColor)
export type QuestDefinition = Omit<Quest, 'current' | 'status' | 'statusColor'>

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

// Define all available quests with their milestones and XP rewards
export const QUEST_DEFINITIONS: QuestDefinition[] = [
  // Daily quests (reset every day)
  { id: 'daily-certification', title: 'Daily Certification', description: 'Certify a page today', total: 1, xpReward: 25, type: 'discovery', recurringType: 'daily' },

  // First-time quests (easy, low XP)
  { id: 'signal-1', title: 'First Signal', description: 'Certify a page for the first time', total: 1, xpReward: 50, type: 'signal', milestone: 1 },
  { id: 'bookmark-list-1', title: 'Organizer', description: 'Create your first bookmark list', total: 1, xpReward: 30, type: 'bookmark', milestone: 1 },
  { id: 'bookmark-signal-1', title: 'Bookworm', description: 'Bookmark your first signal', total: 1, xpReward: 20, type: 'bookmark', milestone: 1 },

  // Social Link quests - one per platform
  { id: 'link-discord', title: 'Discord Linked', description: 'Link your Discord account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'discord' },
  { id: 'link-youtube', title: 'YouTube Linked', description: 'Link your YouTube account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'youtube' },
  { id: 'link-spotify', title: 'Spotify Linked', description: 'Link your Spotify account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'spotify' },
  { id: 'link-twitch', title: 'Twitch Linked', description: 'Link your Twitch account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'twitch' },
  { id: 'link-twitter', title: 'Twitter Linked', description: 'Link your Twitter account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, claimable: true, platform: 'twitter' },

  // Social Linked - bonus quest when all 5 platforms are linked
  { id: 'social-linked', title: 'Social Linked', description: 'Link all 5 social platforms on-chain', total: 5, xpReward: 500, type: 'oauth', milestone: 5, claimable: true },

  // Progressive signal milestones (total certifications count, same page can count multiple times)
  { id: 'signal-10', title: 'Signal Rookie', description: 'Reach 10 total certifications', total: 10, xpReward: 100, type: 'signal', milestone: 10 },
  { id: 'signal-50', title: 'Signal Maker', description: 'Reach 50 total certifications', total: 50, xpReward: 200, type: 'signal', milestone: 50 },
  { id: 'signal-100', title: 'Centurion', description: 'Reach 100 total certifications', total: 100, xpReward: 400, type: 'signal', milestone: 100 },
  { id: 'signal-500', title: 'Signal Pro', description: 'Reach 500 total certifications', total: 500, xpReward: 1000, type: 'signal', milestone: 500 },
  { id: 'signal-1000', title: 'Signal Master', description: 'Reach 1,000 total certifications', total: 1000, xpReward: 2000, type: 'signal', milestone: 1000 },
  { id: 'signal-5000', title: 'Signal Legend', description: 'Reach 5,000 total certifications', total: 5000, xpReward: 5000, type: 'signal', milestone: 5000 },
  { id: 'signal-10000', title: 'Signal Titan', description: 'Reach 10,000 total certifications', total: 10000, xpReward: 10000, type: 'signal', milestone: 10000 },
  { id: 'signal-50000', title: 'Signal God', description: 'Reach 50,000 total certifications', total: 50000, xpReward: 25000, type: 'signal', milestone: 50000 },
  { id: 'signal-100000', title: 'Signal Immortal', description: 'Reach 100,000 total certifications', total: 100000, xpReward: 50000, type: 'signal', milestone: 100000 },

  // Bookmark milestones
  { id: 'curator-10', title: 'Collector', description: 'Bookmark 10 signals', total: 10, xpReward: 150, type: 'bookmark', milestone: 10 },
  { id: 'bookmark-signal-50', title: 'Archivist', description: 'Bookmark 50 signals', total: 50, xpReward: 250, type: 'bookmark', milestone: 50 },

  // Follow milestones
  { id: 'follow-1', title: 'First Follow', description: 'Follow your first user', total: 1, xpReward: 25, type: 'follow', milestone: 1 },
  { id: 'follow-5', title: 'Friendly', description: 'Follow 5 users', total: 5, xpReward: 50, type: 'follow', milestone: 5 },
  { id: 'follow-10', title: 'Connected', description: 'Follow 10 users', total: 10, xpReward: 100, type: 'follow', milestone: 10 },
  { id: 'follow-50', title: 'Influencer', description: 'Follow 50 users', total: 50, xpReward: 300, type: 'follow', milestone: 50 },
  { id: 'follow-100', title: 'Hub', description: 'Follow 100 users', total: 100, xpReward: 500, type: 'follow', milestone: 100 },

  // Trust milestones
  { id: 'trust-1', title: 'First Trust', description: 'Trust your first user', total: 1, xpReward: 25, type: 'trust', milestone: 1 },
  { id: 'trust-5', title: 'Believer', description: 'Trust 5 users', total: 5, xpReward: 100, type: 'trust', milestone: 5 },
  { id: 'trust-10', title: 'Trustworthy', description: 'Trust 10 users', total: 10, xpReward: 200, type: 'trust', milestone: 10 },
  { id: 'trust-25', title: 'Guardian', description: 'Trust 25 users', total: 25, xpReward: 400, type: 'trust', milestone: 25 },
  { id: 'trust-50', title: 'Pillar', description: 'Trust 50 users', total: 50, xpReward: 800, type: 'trust', milestone: 50 },

  // Streak quests
  { id: 'streak-7', title: 'Committed', description: 'Maintain a 7-day certification streak', total: 7, xpReward: 200, type: 'streak', milestone: 7 },
  { id: 'streak-30', title: 'Dedicated', description: 'Maintain a 30-day certification streak', total: 30, xpReward: 1000, type: 'streak', milestone: 30 },
  { id: 'streak-100', title: 'Relentless', description: 'Maintain a 100-day certification streak', total: 100, xpReward: 5000, type: 'streak', milestone: 100 },

  // Pulse quests
  { id: 'pulse-first', title: 'Explorer', description: 'Launch your first Pulse analysis', total: 1, xpReward: 30, type: 'pulse', milestone: 1 },
  { id: 'pulse-weekly-5', title: 'Pulse Master', description: 'Use Pulse 5 times this week', total: 5, xpReward: 150, type: 'pulse', recurringType: 'weekly' },

  // Follow quests (social)
  { id: 'social-butterfly', title: 'Social Butterfly', description: 'Follow 10 users this week', total: 10, xpReward: 200, type: 'follow', recurringType: 'weekly' },
  { id: 'networker-25', title: 'Networker', description: 'Follow 25 users', total: 25, xpReward: 350, type: 'follow', milestone: 25 },

  // Discovery quests (unique pages discovered — each URL counts only once)
  { id: 'discovery-first', title: 'First Step', description: 'Discover your first unique page', total: 1, xpReward: 50, type: 'discovery', milestone: 1 },
  { id: 'discovery-pioneer', title: 'Trailblazer', description: 'Be the first to certify a page (Pioneer)', total: 1, xpReward: 200, type: 'discovery', milestone: 1 },
  { id: 'discovery-10', title: 'Pathfinder', description: 'Discover 10 unique pages', total: 10, xpReward: 100, type: 'discovery', milestone: 10 },
  { id: 'discovery-50', title: 'Cartographer', description: 'Discover 50 unique pages', total: 50, xpReward: 300, type: 'discovery', milestone: 50 },
  { id: 'discovery-100', title: 'World Explorer', description: 'Discover 100 unique pages', total: 100, xpReward: 500, type: 'discovery', milestone: 100 },
  { id: 'intention-variety', title: 'Multi-Purpose', description: 'Use all 5 intention types', total: 5, xpReward: 150, type: 'discovery', milestone: 5 },

  // Vote quests
  { id: 'daily-vote', title: 'Daily Voter', description: 'Vote once today', total: 1, xpReward: 15, type: 'vote', recurringType: 'daily' },
  { id: 'vote-1', title: 'First Vote', description: 'Cast your first vote', total: 1, xpReward: 50, type: 'vote', milestone: 1 },
  { id: 'vote-10', title: 'Critic', description: 'Cast 10 votes', total: 10, xpReward: 100, type: 'vote', milestone: 10 },
  { id: 'vote-50', title: 'Judge', description: 'Cast 50 votes', total: 50, xpReward: 300, type: 'vote', milestone: 50 },
  { id: 'vote-100', title: 'Supreme Court', description: 'Cast 100 votes', total: 100, xpReward: 500, type: 'vote', milestone: 100 },
  { id: 'vote-streak-7', title: 'Engaged Voter', description: 'Maintain a 7-day voting streak', total: 7, xpReward: 200, type: 'vote', milestone: 7 },
  { id: 'vote-streak-30', title: 'Civic Duty', description: 'Maintain a 30-day voting streak', total: 30, xpReward: 1000, type: 'vote', milestone: 30 },

  // Gold accumulation quests
  { id: 'gold-10', title: 'First Coins', description: 'Accumulate 10 Gold', total: 10, xpReward: 25, type: 'gold', milestone: 10 },
  { id: 'gold-50', title: 'Saver', description: 'Accumulate 50 Gold', total: 50, xpReward: 50, type: 'gold', milestone: 50 },
  { id: 'gold-100', title: 'Gold Digger', description: 'Accumulate 100 Gold', total: 100, xpReward: 100, type: 'gold', milestone: 100 },
  { id: 'gold-500', title: 'Treasurer', description: 'Accumulate 500 Gold', total: 500, xpReward: 300, type: 'gold', milestone: 500 },
  { id: 'gold-1000', title: 'Midas Touch', description: 'Accumulate 1,000 Gold', total: 1000, xpReward: 500, type: 'gold', milestone: 1000 },
  { id: 'gold-5000', title: 'Gold Reserve', description: 'Accumulate 5,000 Gold', total: 5000, xpReward: 1000, type: 'gold', milestone: 5000 },
  { id: 'gold-10000', title: 'Fort Knox', description: 'Accumulate 10,000 Gold', total: 10000, xpReward: 2500, type: 'gold', milestone: 10000 },
  { id: 'gold-50000', title: 'El Dorado', description: 'Accumulate 50,000 Gold', total: 50000, xpReward: 5000, type: 'gold', milestone: 50000 },
]

// Build QUEST_XP_REWARDS map from definitions (single source of truth)
export const QUEST_XP_REWARDS: Record<string, number> = Object.fromEntries(
  QUEST_DEFINITIONS.map(q => [q.id, q.xpReward])
)
