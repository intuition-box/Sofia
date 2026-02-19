/**
 * Predicate Constants — Single source of truth
 *
 * Consolidates predicate ID groups, label groups, and mappings
 * previously duplicated across 6+ files:
 * - hooks/useOnChainIntentionGroups.ts
 * - hooks/useUserCertifications.ts
 * - hooks/useDiscoveryScore.ts
 * - hooks/usePageIntentionStats.ts
 * - hooks/useInterestAnalysis.ts
 * - lib/utils/circleInterestUtils.ts
 */

import type { IntentionPurpose } from "~/types/discovery"
import { PREDICATE_IDS, PREDICATE_NAMES } from "~/lib/config/chainConfig"

// ── ID Groups ──

export const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING,
  PREDICATE_IDS.VISITS_FOR_MUSIC
].filter(Boolean)

export const OAUTH_PREDICATE_IDS = [
  PREDICATE_IDS.FOLLOW,
  PREDICATE_IDS.MEMBER_OF,
  PREDICATE_IDS.OWNER_OF,
  PREDICATE_IDS.TOP_ARTIST,
  PREDICATE_IDS.TOP_TRACK
].filter(Boolean)

export const TRUST_PREDICATE_IDS = [
  PREDICATE_IDS.TRUSTS,
  PREDICATE_IDS.DISTRUST
].filter(Boolean)

export const ALL_PREDICATE_IDS = [
  ...INTENTION_PREDICATE_IDS,
  ...OAUTH_PREDICATE_IDS,
  ...TRUST_PREDICATE_IDS
]

// ── Label Groups ──

export const INTENTION_PREDICATE_LABELS = [
  "visits for work",
  "visits for learning",
  "visits for fun",
  "visits for inspiration",
  "visits for buying",
  "visits for music"
]

// Includes legacy trailing-space variant for "visits for learning "
export const INTENTION_PREDICATE_LABELS_WITH_LEGACY = [
  "visits for work",
  "visits for learning",
  "visits for learning ", // legacy trailing space (old on-chain data)
  "visits for fun",
  "visits for inspiration",
  "visits for buying",
  "visits for music"
]

export const OAUTH_PREDICATE_LABELS: string[] = [
  PREDICATE_NAMES.FOLLOW,
  PREDICATE_NAMES.MEMBER_OF,
  PREDICATE_NAMES.OWNER_OF,
  PREDICATE_NAMES.CREATED_PLAYLIST,
  PREDICATE_NAMES.TOP_TRACK,
  PREDICATE_NAMES.TOP_ARTIST,
  PREDICATE_NAMES.AM
].filter(Boolean)

export const TRUST_PREDICATE_LABELS = [
  PREDICATE_NAMES.TRUSTS,
  PREDICATE_NAMES.DISTRUST
].filter(Boolean)

export const ALL_PREDICATE_LABELS = [
  ...INTENTION_PREDICATE_LABELS_WITH_LEGACY,
  ...OAUTH_PREDICATE_LABELS,
  ...TRUST_PREDICATE_LABELS
]

// Certification labels = intentions (with legacy) + trust
export const CERTIFICATION_PREDICATE_LABELS = [
  ...INTENTION_PREDICATE_LABELS_WITH_LEGACY,
  "trusts",
  "distrust"
]

// Web activity predicates (for MCP/interest analysis)
export const WEB_ACTIVITY_PREDICATES = [
  "visits for work",
  "visits for learning",
  "visits for learning ", // legacy with trailing space
  "visits for fun",
  "visits for inspiration",
  "visits for buying"
]

// ── Mappings: Label → Type ──

export const PREDICATE_LABEL_TO_INTENTION: Record<string, IntentionPurpose> = {
  "visits for work": "for_work",
  "visits for learning": "for_learning",
  "visits for learning ": "for_learning", // legacy trailing space
  "visits for fun": "for_fun",
  "visits for inspiration": "for_inspiration",
  "visits for buying": "for_buying",
  "visits for music": "for_music"
}

export const PREDICATE_LABEL_TO_TRUST: Record<string, "trusted" | "distrusted"> = {
  trusts: "trusted",
  distrust: "distrusted"
}

export const TRUST_LABEL_TO_TYPE: Record<string, string> = {
  [PREDICATE_NAMES.TRUSTS]: "trusted",
  [PREDICATE_NAMES.DISTRUST]: "distrusted"
}

// ── Mappings: ID → Type (built with guards for testnet where IDs may be empty) ──

export const PREDICATE_ID_TO_CERTIFICATION: Record<string, string> = {}
// Intention predicates
if (PREDICATE_IDS.VISITS_FOR_WORK) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_WORK] = "work"
if (PREDICATE_IDS.VISITS_FOR_LEARNING) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_LEARNING] = "learning"
if (PREDICATE_IDS.VISITS_FOR_FUN) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_FUN] = "fun"
if (PREDICATE_IDS.VISITS_FOR_INSPIRATION) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_INSPIRATION] = "inspiration"
if (PREDICATE_IDS.VISITS_FOR_BUYING) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_BUYING] = "buying"
if (PREDICATE_IDS.VISITS_FOR_MUSIC) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.VISITS_FOR_MUSIC] = "music"
// OAuth predicates
if (PREDICATE_IDS.FOLLOW) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.FOLLOW] = PREDICATE_NAMES.FOLLOW
if (PREDICATE_IDS.MEMBER_OF) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.MEMBER_OF] = PREDICATE_NAMES.MEMBER_OF
if (PREDICATE_IDS.OWNER_OF) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.OWNER_OF] = PREDICATE_NAMES.OWNER_OF
if (PREDICATE_IDS.TOP_ARTIST) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.TOP_ARTIST] = PREDICATE_NAMES.TOP_ARTIST
if (PREDICATE_IDS.TOP_TRACK) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.TOP_TRACK] = PREDICATE_NAMES.TOP_TRACK
// Trust/distrust predicates
if (PREDICATE_IDS.TRUSTS) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.TRUSTS] = "trusted"
if (PREDICATE_IDS.DISTRUST) PREDICATE_ID_TO_CERTIFICATION[PREDICATE_IDS.DISTRUST] = "distrusted"

export const PREDICATE_ID_TO_INTENTION: Record<string, IntentionPurpose> = {}
if (PREDICATE_IDS.VISITS_FOR_WORK) PREDICATE_ID_TO_INTENTION[PREDICATE_IDS.VISITS_FOR_WORK] = "for_work"
if (PREDICATE_IDS.VISITS_FOR_LEARNING) PREDICATE_ID_TO_INTENTION[PREDICATE_IDS.VISITS_FOR_LEARNING] = "for_learning"
if (PREDICATE_IDS.VISITS_FOR_FUN) PREDICATE_ID_TO_INTENTION[PREDICATE_IDS.VISITS_FOR_FUN] = "for_fun"
if (PREDICATE_IDS.VISITS_FOR_INSPIRATION) PREDICATE_ID_TO_INTENTION[PREDICATE_IDS.VISITS_FOR_INSPIRATION] = "for_inspiration"
if (PREDICATE_IDS.VISITS_FOR_BUYING) PREDICATE_ID_TO_INTENTION[PREDICATE_IDS.VISITS_FOR_BUYING] = "for_buying"
if (PREDICATE_IDS.VISITS_FOR_MUSIC) PREDICATE_ID_TO_INTENTION[PREDICATE_IDS.VISITS_FOR_MUSIC] = "for_music"

export const PREDICATE_ID_TO_LABEL: Record<string, string> = {}
if (PREDICATE_IDS.VISITS_FOR_WORK) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_WORK] = PREDICATE_NAMES.VISITS_FOR_WORK
if (PREDICATE_IDS.VISITS_FOR_LEARNING) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_LEARNING] = PREDICATE_NAMES.VISITS_FOR_LEARNING
if (PREDICATE_IDS.VISITS_FOR_FUN) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_FUN] = PREDICATE_NAMES.VISITS_FOR_FUN
if (PREDICATE_IDS.VISITS_FOR_INSPIRATION) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_INSPIRATION] = PREDICATE_NAMES.VISITS_FOR_INSPIRATION
if (PREDICATE_IDS.VISITS_FOR_BUYING) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_BUYING] = PREDICATE_NAMES.VISITS_FOR_BUYING
if (PREDICATE_IDS.VISITS_FOR_MUSIC) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_MUSIC] = PREDICATE_NAMES.VISITS_FOR_MUSIC
