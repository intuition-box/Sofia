/**
 * achievementsService — reads a user's on-chain quest badges and derives the
 * Achievements module data (level, XP, badge grid), ported from the extension's
 * `useUserQuests` + `QuestBadgeService.checkOnChainBadges`.
 *
 * Source of truth is on-chain: `[account atom] --has_tag--> [quest title]`
 * triples (minted by the extension when a quest is claimed), plus bot-verified
 * social-link triples. XP = Σ xpReward of claimed quests; level is derived from
 * cumulative XP. Gold is NOT here — it lives in the extension's local storage
 * (see useExtensionGold).
 */
import { GRAPHQL_URL } from '@/config'
import {
  QUEST_DEFINITIONS,
  QUEST_TITLE_TO_ID,
  QUEST_BY_ID,
  PREDICATE_TO_QUEST_ID,
  HAS_TAG_PREDICATE_ID,
  BOT_VERIFIER_ADDRESS,
  levelProgress,
} from '@/config/quests'

export interface AchievementBadge {
  /** Quest id (e.g. "signal-10"). */
  id: string
  /** Display name = quest title (e.g. "Signal Rookie"). */
  name: string
  /** True when the user has claimed this quest badge on-chain. */
  on: boolean
}

export interface Achievements {
  level: number
  totalXP: number
  /** XP earned into the current level. */
  xpInto: number
  /** XP span of the current level. */
  xpNext: number
  /** Number of badges claimed. */
  claimedCount: number
  /** Every quest, claimed first, with on/off state. */
  badges: AchievementBadge[]
}

// Same shape as @0xsofia/graphql's GetQuestBadgesAndSocialLinks, run as a raw
// fetch so the service stays React-free (mirrors userAttributesService).
const GET_QUEST_BADGES = `
  query AchievementBadges(
    $subjectId: String!
    $hasTagPredicateId: String!
    $botVerifierId: String!
  ) {
    badges: triples(
      where: {
        subject_id: { _eq: $subjectId }
        predicate_id: { _eq: $hasTagPredicateId }
      }
      limit: 1000
    ) {
      object { label }
    }
    socialLinks: triples(
      where: {
        subject_id: { _eq: $subjectId }
        creator_id: { _ilike: $botVerifierId }
        predicate: {
          label: {
            _in: [
              "has verified discord id"
              "has verified youtube id"
              "has verified spotify id"
              "has verified twitch id"
              "has verified twitter id"
            ]
          }
        }
      }
      limit: 100
    ) {
      predicate { label }
      object { label }
    }
  }
`

interface RawTriple {
  predicate?: { label?: string | null } | null
  object?: { label?: string | null } | null
}

/**
 * Fetch + derive achievements for a user's Account atom term_id (the same
 * `subjectId` the extension tags quests against). Pass the atom term_id, not
 * the wallet address — resolve it with `useUserAccountAtom`.
 */
export async function fetchAchievements(
  subjectAtomId: string,
): Promise<Achievements> {
  const claimed = new Set<string>()

  if (subjectAtomId) {
    try {
      const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_QUEST_BADGES,
          variables: {
            subjectId: subjectAtomId,
            hasTagPredicateId: HAS_TAG_PREDICATE_ID,
            botVerifierId: BOT_VERIFIER_ADDRESS.toLowerCase(),
          },
        }),
      })
      const json = await res.json()
      const badges: RawTriple[] = json?.data?.badges ?? []
      const socialLinks: RawTriple[] = json?.data?.socialLinks ?? []

      // has_tag badges → quest id by title
      for (const t of badges) {
        const label = t?.object?.label?.toLowerCase()
        if (!label) continue
        const id = QUEST_TITLE_TO_ID.get(label)
        if (id) claimed.add(id)
      }
      // verified social links → quest id by predicate label
      for (const t of socialLinks) {
        const objLabel = t?.object?.label
        if (
          !objLabel ||
          objLabel.includes('[object') ||
          objLabel.includes('{')
        ) {
          continue
        }
        const predLabel = t?.predicate?.label?.toLowerCase()
        const id = predLabel ? PREDICATE_TO_QUEST_ID[predLabel] : undefined
        if (id) claimed.add(id)
      }
    } catch {
      // network/query failure → treat as no badges (graceful empty state)
    }
  }

  let totalXP = 0
  for (const id of claimed) {
    totalXP += QUEST_BY_ID.get(id)?.xpReward ?? 0
  }
  const { level, xpInto, xpNext } = levelProgress(totalXP)

  // Claimed badges first (keeping catalogue order within each group).
  const badges: AchievementBadge[] = QUEST_DEFINITIONS.map((q) => ({
    id: q.id,
    name: q.title,
    on: claimed.has(q.id),
  })).sort((a, b) => Number(b.on) - Number(a.on))

  return {
    level,
    totalXP,
    xpInto,
    xpNext,
    claimedCount: claimed.size,
    badges,
  }
}
