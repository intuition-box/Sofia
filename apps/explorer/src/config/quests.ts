/**
 * quests.ts — explorer-side quest helpers.
 *
 * The quest catalogue itself now lives in the shared `@0xsofia/quests`
 * package (single source of truth with the extension, which mints the
 * `[account] --has_tag--> [quest title]` triples this app reads back). This
 * module re-exports the catalogue and adds the explorer-only glue: the
 * on-chain predicate/verifier ids, the title/id lookup maps, and the XP →
 * level math used by `achievementsService` + `useAchievements`.
 */
import { QUEST_DEFINITIONS } from '@0xsofia/quests'

export {
  QUEST_DEFINITIONS,
  type QuestDefinition,
  type QuestType,
  type SocialPlatform,
} from '@0xsofia/quests'

// On-chain predicate id for `has_tag` (mainnet/dev) — the predicate of the
// quest-badge triples. Matches the extension's CHAIN_PREDICATE_IDS.HAS_TAG.
export const HAS_TAG_PREDICATE_ID =
  '0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5'

// Bot that signs verified social-link triples (mainnet). Social-link quests
// only count when this verifier is the triple creator.
export const BOT_VERIFIER_ADDRESS = '0xCd62c554bdEF0501158Bd6513e0654cd3cc8ae88'

// Verified-social predicate label → quest id (mirrors QuestBadgeService).
export const PREDICATE_TO_QUEST_ID: Record<string, string> = {
  'has verified discord id': 'link-discord',
  'has verified youtube id': 'link-youtube',
  'has verified spotify id': 'link-spotify',
  'has verified twitch id': 'link-twitch',
  'has verified twitter id': 'link-twitter',
}

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
