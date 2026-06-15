/**
 * quests.ts — quest catalogue + level math, ported from the extension's
 * `types/questTypes.ts` + `lib/services/QuestBadgeService.ts`.
 *
 * The explorer reads a user's *claimed* quest badges on-chain (the same
 * `[account] --has_tag--> [quest title]` triples the extension mints) and
 * derives XP → level + the achievement badge grid from them. This file is the
 * single source of truth shared by `achievementsService` and `useAchievements`.
 *
 * Keep `QUEST_DEFINITIONS` in sync with the extension; the on-chain mapping is
 * by quest `title` (lower-cased), so titles MUST match byte-for-byte.
 */

export type QuestType =
  | 'signal'
  | 'bookmark'
  | 'oauth'
  | 'follow'
  | 'trust'
  | 'streak'
  | 'pulse'
  | 'social-link'
  | 'discovery'
  | 'gold'
  | 'vote'

export interface QuestDefinition {
  id: string
  title: string
  description: string
  total: number
  xpReward: number
  type: QuestType
  milestone?: number
  recurringType?: 'daily' | 'weekly'
  platform?: 'discord' | 'youtube' | 'spotify' | 'twitch' | 'twitter'
}

// On-chain predicate id for `has_tag` (mainnet/dev) — the predicate of the
// quest-badge triples. Matches the extension's CHAIN_PREDICATE_IDS.HAS_TAG.
export const HAS_TAG_PREDICATE_ID =
  '0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5'

// Bot that signs verified social-link triples (mainnet). Social-link quests
// only count when this verifier is the triple creator.
export const BOT_VERIFIER_ADDRESS =
  '0xCd62c554bdEF0501158Bd6513e0654cd3cc8ae88'

// Verified-social predicate label → quest id (mirrors QuestBadgeService).
export const PREDICATE_TO_QUEST_ID: Record<string, string> = {
  'has verified discord id': 'link-discord',
  'has verified youtube id': 'link-youtube',
  'has verified spotify id': 'link-spotify',
  'has verified twitch id': 'link-twitch',
  'has verified twitter id': 'link-twitter',
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  // Daily
  { id: 'daily-certification', title: 'Daily Certification', description: 'Certify a page today', total: 1, xpReward: 25, type: 'signal', recurringType: 'daily' },
  // Firsts
  { id: 'signal-1', title: 'First Signal', description: 'Certify a page for the first time', total: 1, xpReward: 50, type: 'signal', milestone: 1 },
  { id: 'bookmark-list-1', title: 'Organizer', description: 'Create your first bookmark list', total: 1, xpReward: 30, type: 'bookmark', milestone: 1 },
  { id: 'bookmark-signal-1', title: 'Bookworm', description: 'Bookmark your first signal', total: 1, xpReward: 20, type: 'bookmark', milestone: 1 },
  // Social links
  { id: 'link-discord', title: 'Discord Linked', description: 'Link your Discord account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, platform: 'discord' },
  { id: 'link-youtube', title: 'YouTube Linked', description: 'Link your YouTube account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, platform: 'youtube' },
  { id: 'link-spotify', title: 'Spotify Linked', description: 'Link your Spotify account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, platform: 'spotify' },
  { id: 'link-twitch', title: 'Twitch Linked', description: 'Link your Twitch account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, platform: 'twitch' },
  { id: 'link-twitter', title: 'Twitter Linked', description: 'Link your Twitter account on-chain', total: 1, xpReward: 100, type: 'social-link', milestone: 1, platform: 'twitter' },
  { id: 'social-linked', title: 'Social Linked', description: 'Link all 5 social platforms on-chain', total: 5, xpReward: 500, type: 'oauth', milestone: 5 },
  // Signals
  { id: 'signal-10', title: 'Signal Rookie', description: 'Reach 10 total certifications', total: 10, xpReward: 100, type: 'signal', milestone: 10 },
  { id: 'signal-50', title: 'Signal Maker', description: 'Reach 50 total certifications', total: 50, xpReward: 200, type: 'signal', milestone: 50 },
  { id: 'signal-100', title: 'Centurion', description: 'Reach 100 total certifications', total: 100, xpReward: 400, type: 'signal', milestone: 100 },
  { id: 'signal-500', title: 'Signal Pro', description: 'Reach 500 total certifications', total: 500, xpReward: 1000, type: 'signal', milestone: 500 },
  { id: 'signal-1000', title: 'Signal Master', description: 'Reach 1,000 total certifications', total: 1000, xpReward: 2000, type: 'signal', milestone: 1000 },
  { id: 'signal-5000', title: 'Signal Legend', description: 'Reach 5,000 total certifications', total: 5000, xpReward: 5000, type: 'signal', milestone: 5000 },
  { id: 'signal-10000', title: 'Signal Titan', description: 'Reach 10,000 total certifications', total: 10000, xpReward: 10000, type: 'signal', milestone: 10000 },
  { id: 'signal-50000', title: 'Signal God', description: 'Reach 50,000 total certifications', total: 50000, xpReward: 25000, type: 'signal', milestone: 50000 },
  { id: 'signal-100000', title: 'Signal Immortal', description: 'Reach 100,000 total certifications', total: 100000, xpReward: 50000, type: 'signal', milestone: 100000 },
  // Bookmarks / curation
  { id: 'curator-10', title: 'Collector', description: 'Bookmark 10 signals', total: 10, xpReward: 150, type: 'bookmark', milestone: 10 },
  { id: 'bookmark-signal-50', title: 'Archivist', description: 'Bookmark 50 signals', total: 50, xpReward: 250, type: 'bookmark', milestone: 50 },
  // Follows
  { id: 'follow-1', title: 'First Follow', description: 'Follow your first user', total: 1, xpReward: 25, type: 'follow', milestone: 1 },
  { id: 'follow-5', title: 'Friendly', description: 'Follow 5 users', total: 5, xpReward: 50, type: 'follow', milestone: 5 },
  { id: 'follow-10', title: 'Connected', description: 'Follow 10 users', total: 10, xpReward: 100, type: 'follow', milestone: 10 },
  { id: 'follow-50', title: 'Influencer', description: 'Follow 50 users', total: 50, xpReward: 300, type: 'follow', milestone: 50 },
  { id: 'follow-100', title: 'Hub', description: 'Follow 100 users', total: 100, xpReward: 500, type: 'follow', milestone: 100 },
  // Trust
  { id: 'trust-1', title: 'First Trust', description: 'Trust your first user', total: 1, xpReward: 25, type: 'trust', milestone: 1 },
  { id: 'trust-5', title: 'Believer', description: 'Trust 5 users', total: 5, xpReward: 100, type: 'trust', milestone: 5 },
  { id: 'trust-10', title: 'Trustworthy', description: 'Trust 10 users', total: 10, xpReward: 200, type: 'trust', milestone: 10 },
  { id: 'trust-25', title: 'Guardian', description: 'Trust 25 users', total: 25, xpReward: 400, type: 'trust', milestone: 25 },
  { id: 'trust-50', title: 'Pillar', description: 'Trust 50 users', total: 50, xpReward: 800, type: 'trust', milestone: 50 },
  // Streaks
  { id: 'streak-7', title: 'Committed', description: 'Maintain a 7-day certification streak', total: 7, xpReward: 200, type: 'streak', milestone: 7 },
  { id: 'streak-30', title: 'Dedicated', description: 'Maintain a 30-day certification streak', total: 30, xpReward: 1000, type: 'streak', milestone: 30 },
  { id: 'streak-100', title: 'Relentless', description: 'Maintain a 100-day certification streak', total: 100, xpReward: 5000, type: 'streak', milestone: 100 },
  // Pulse
  { id: 'pulse-first', title: 'Explorer', description: 'Launch your first Pulse analysis', total: 1, xpReward: 30, type: 'pulse', milestone: 1 },
  { id: 'pulse-weekly-5', title: 'Pulse Master', description: 'Use Pulse 5 times this week', total: 5, xpReward: 150, type: 'pulse', recurringType: 'weekly' },
  // Networking
  { id: 'social-butterfly', title: 'Social Butterfly', description: 'Follow 10 users this week', total: 10, xpReward: 200, type: 'follow', recurringType: 'weekly' },
  { id: 'networker-25', title: 'Networker', description: 'Follow 25 users', total: 25, xpReward: 350, type: 'follow', milestone: 25 },
  // Discovery
  { id: 'discovery-first', title: 'First Step', description: 'Discover your first unique page', total: 1, xpReward: 50, type: 'discovery', milestone: 1 },
  { id: 'discovery-pioneer', title: 'Trailblazer', description: 'Be the first to certify a page (Pioneer)', total: 1, xpReward: 200, type: 'discovery', milestone: 1 },
  { id: 'discovery-10', title: 'Pathfinder', description: 'Discover 10 unique pages', total: 10, xpReward: 100, type: 'discovery', milestone: 10 },
  { id: 'discovery-50', title: 'Cartographer', description: 'Discover 50 unique pages', total: 50, xpReward: 300, type: 'discovery', milestone: 50 },
  { id: 'discovery-100', title: 'World Explorer', description: 'Discover 100 unique pages', total: 100, xpReward: 500, type: 'discovery', milestone: 100 },
  { id: 'intention-variety', title: 'Multi-Purpose', description: 'Use all 5 intention types', total: 5, xpReward: 150, type: 'discovery', milestone: 5 },
  // Votes
  { id: 'daily-vote', title: 'Daily Voter', description: 'Vote once today', total: 1, xpReward: 15, type: 'vote', recurringType: 'daily' },
  { id: 'vote-1', title: 'First Vote', description: 'Cast your first vote', total: 1, xpReward: 50, type: 'vote', milestone: 1 },
  { id: 'vote-10', title: 'Critic', description: 'Cast 10 votes', total: 10, xpReward: 100, type: 'vote', milestone: 10 },
  { id: 'vote-50', title: 'Judge', description: 'Cast 50 votes', total: 50, xpReward: 300, type: 'vote', milestone: 50 },
  { id: 'vote-100', title: 'Supreme Court', description: 'Cast 100 votes', total: 100, xpReward: 500, type: 'vote', milestone: 100 },
  { id: 'vote-streak-7', title: 'Engaged Voter', description: 'Maintain a 7-day voting streak', total: 7, xpReward: 200, type: 'vote', milestone: 7 },
  { id: 'vote-streak-30', title: 'Civic Duty', description: 'Maintain a 30-day voting streak', total: 30, xpReward: 1000, type: 'vote', milestone: 30 },
  // Gold
  { id: 'gold-10', title: 'First Coins', description: 'Accumulate 10 Gold', total: 10, xpReward: 25, type: 'gold', milestone: 10 },
  { id: 'gold-50', title: 'Saver', description: 'Accumulate 50 Gold', total: 50, xpReward: 50, type: 'gold', milestone: 50 },
  { id: 'gold-100', title: 'Gold Digger', description: 'Accumulate 100 Gold', total: 100, xpReward: 100, type: 'gold', milestone: 100 },
  { id: 'gold-500', title: 'Treasurer', description: 'Accumulate 500 Gold', total: 500, xpReward: 300, type: 'gold', milestone: 500 },
  { id: 'gold-1000', title: 'Midas Touch', description: 'Accumulate 1,000 Gold', total: 1000, xpReward: 500, type: 'gold', milestone: 1000 },
  { id: 'gold-5000', title: 'Gold Reserve', description: 'Accumulate 5,000 Gold', total: 5000, xpReward: 1000, type: 'gold', milestone: 5000 },
  { id: 'gold-10000', title: 'Fort Knox', description: 'Accumulate 10,000 Gold', total: 10000, xpReward: 2500, type: 'gold', milestone: 10000 },
  { id: 'gold-50000', title: 'El Dorado', description: 'Accumulate 50,000 Gold', total: 50000, xpReward: 5000, type: 'gold', milestone: 50000 },
]

/** quest title (lower-cased) → id, for mapping on-chain badge labels. */
export const QUEST_TITLE_TO_ID = new Map(
  QUEST_DEFINITIONS.map((q) => [q.title.toLowerCase(), q.id]),
)

/** quest id → definition, for XP lookup + badge metadata. */
export const QUEST_BY_ID = new Map(QUEST_DEFINITIONS.map((q) => [q.id, q]))

/**
 * Cumulative XP → level. Level N → N+1 costs `100 * N` XP (extension parity:
 * `calculateLevelFromXP`). Level 1 = 0 XP.
 */
export function calculateLevelFromXP(xp: number): number {
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

/**
 * XP progress within the current level: how much XP has been earned into the
 * current level and how much the current level spans. Mirrors the design's
 * `{ xpInto, xpNext }`.
 */
export function levelProgress(xp: number): {
  level: number
  xpInto: number
  xpNext: number
} {
  let level = 1
  let xpRequired = 100
  let totalXpUsed = 0
  while (totalXpUsed + xpRequired <= xp) {
    totalXpUsed += xpRequired
    level++
    xpRequired = 100 * level
  }
  return { level, xpInto: xp - totalXpUsed, xpNext: xpRequired }
}
