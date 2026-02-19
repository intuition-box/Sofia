/**
 * Predicate Constants — Single source of truth
 *
 * Consolidates predicate ID groups, label groups, and mappings
 * previously duplicated across 6+ files.
 */

import type { IntentionPurpose } from "~/types/discovery"
import { PREDICATE_IDS, PREDICATE_NAMES } from "~/lib/config/chainConfig"

// ── Helper: build a Record from entries, filtering out empty keys (testnet) ──

const buildMap = <T>(entries: [string, T][]): Record<string, T> =>
  Object.fromEntries(entries.filter(([k]) => k)) as Record<string, T>

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
  ...INTENTION_PREDICATE_LABELS.slice(0, 2),
  "visits for learning ", // legacy trailing space (old on-chain data)
  ...INTENTION_PREDICATE_LABELS.slice(2)
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
  ...TRUST_PREDICATE_LABELS
]

// Web activity predicates (for MCP/interest analysis) — intentions sans "music"
export const WEB_ACTIVITY_PREDICATES =
  INTENTION_PREDICATE_LABELS_WITH_LEGACY.filter(
    (l) => !l.startsWith("visits for music")
  )

// ── Mappings: Label → Type ──

export const PREDICATE_LABEL_TO_INTENTION: Record<string, IntentionPurpose> =
  buildMap([
    ["visits for work", "for_work"],
    ["visits for learning", "for_learning"],
    ["visits for learning ", "for_learning"], // legacy trailing space
    ["visits for fun", "for_fun"],
    ["visits for inspiration", "for_inspiration"],
    ["visits for buying", "for_buying"],
    ["visits for music", "for_music"]
  ])

export const PREDICATE_LABEL_TO_TRUST: Record<
  string,
  "trusted" | "distrusted"
> = {
  trusts: "trusted",
  distrust: "distrusted"
}

export const TRUST_LABEL_TO_TYPE: Record<string, string> = {
  [PREDICATE_NAMES.TRUSTS]: "trusted",
  [PREDICATE_NAMES.DISTRUST]: "distrusted"
}

// ── Mappings: ID → Type ──

export const PREDICATE_ID_TO_CERTIFICATION: Record<string, string> = buildMap([
  // Intention predicates
  [PREDICATE_IDS.VISITS_FOR_WORK, "work"],
  [PREDICATE_IDS.VISITS_FOR_LEARNING, "learning"],
  [PREDICATE_IDS.VISITS_FOR_FUN, "fun"],
  [PREDICATE_IDS.VISITS_FOR_INSPIRATION, "inspiration"],
  [PREDICATE_IDS.VISITS_FOR_BUYING, "buying"],
  [PREDICATE_IDS.VISITS_FOR_MUSIC, "music"],
  // OAuth predicates
  [PREDICATE_IDS.FOLLOW, PREDICATE_NAMES.FOLLOW],
  [PREDICATE_IDS.MEMBER_OF, PREDICATE_NAMES.MEMBER_OF],
  [PREDICATE_IDS.OWNER_OF, PREDICATE_NAMES.OWNER_OF],
  [PREDICATE_IDS.TOP_ARTIST, PREDICATE_NAMES.TOP_ARTIST],
  [PREDICATE_IDS.TOP_TRACK, PREDICATE_NAMES.TOP_TRACK],
  // Trust/distrust predicates
  [PREDICATE_IDS.TRUSTS, "trusted"],
  [PREDICATE_IDS.DISTRUST, "distrusted"]
])

export const PREDICATE_ID_TO_INTENTION: Record<string, IntentionPurpose> =
  buildMap([
    [PREDICATE_IDS.VISITS_FOR_WORK, "for_work"],
    [PREDICATE_IDS.VISITS_FOR_LEARNING, "for_learning"],
    [PREDICATE_IDS.VISITS_FOR_FUN, "for_fun"],
    [PREDICATE_IDS.VISITS_FOR_INSPIRATION, "for_inspiration"],
    [PREDICATE_IDS.VISITS_FOR_BUYING, "for_buying"],
    [PREDICATE_IDS.VISITS_FOR_MUSIC, "for_music"]
  ])

export const PREDICATE_ID_TO_LABEL: Record<string, string> = buildMap([
  [PREDICATE_IDS.VISITS_FOR_WORK, PREDICATE_NAMES.VISITS_FOR_WORK],
  [PREDICATE_IDS.VISITS_FOR_LEARNING, PREDICATE_NAMES.VISITS_FOR_LEARNING],
  [PREDICATE_IDS.VISITS_FOR_FUN, PREDICATE_NAMES.VISITS_FOR_FUN],
  [PREDICATE_IDS.VISITS_FOR_INSPIRATION, PREDICATE_NAMES.VISITS_FOR_INSPIRATION],
  [PREDICATE_IDS.VISITS_FOR_BUYING, PREDICATE_NAMES.VISITS_FOR_BUYING],
  [PREDICATE_IDS.VISITS_FOR_MUSIC, PREDICATE_NAMES.VISITS_FOR_MUSIC]
])
