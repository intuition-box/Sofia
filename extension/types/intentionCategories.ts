/**
 * Intention Categories — Single Source of Truth
 * All 8 certification values (trust/distrust + 6 intentions) are defined here.
 * Components and hooks should import from this file instead of defining local copies.
 */

// ── Types ──

/** All 8 certification/intention types */
export type IntentionType = 'trusted' | 'distrusted' | 'work' | 'learning' | 'fun' | 'inspiration' | 'buying' | 'music'

/** On-chain intention purposes (6 intentions, no trust/distrust) */
export type IntentionPurpose = 'for_work' | 'for_learning' | 'for_fun' | 'for_inspiration' | 'for_buying' | 'for_music'

/** Full config entry for each certification type */
export interface IntentionConfigEntry {
  label: string
  color: string
  gradientEnd: string
  cssClass: string
  intentionPurpose: IntentionPurpose | null
  predicateLabel: string | null
}

// ── Central Config ──

export const INTENTION_CONFIG: Record<IntentionType, IntentionConfigEntry> = {
  trusted:     { label: "Trusted",     color: "#22C55E", gradientEnd: "#4ADE80", cssClass: "trusted",     intentionPurpose: null,               predicateLabel: "trusts" },
  distrusted:  { label: "Distrusted",  color: "#EF4444", gradientEnd: "#F87171", cssClass: "distrusted",  intentionPurpose: null,               predicateLabel: "distrust" },
  work:        { label: "Work",        color: "#3B82F6", gradientEnd: "#60A5FA", cssClass: "work",        intentionPurpose: "for_work",         predicateLabel: "visits for work" },
  learning:    { label: "Learning",    color: "#06B6D4", gradientEnd: "#22D3EE", cssClass: "learning",    intentionPurpose: "for_learning",     predicateLabel: "visits for learning" },
  fun:         { label: "Fun",         color: "#F59E0B", gradientEnd: "#FBBF24", cssClass: "fun",         intentionPurpose: "for_fun",          predicateLabel: "visits for fun" },
  inspiration: { label: "Inspiration", color: "#8B5CF6", gradientEnd: "#A78BFA", cssClass: "inspiration", intentionPurpose: "for_inspiration",  predicateLabel: "visits for inspiration" },
  buying:      { label: "Buying",      color: "#EC4899", gradientEnd: "#F472B6", cssClass: "buying",      intentionPurpose: "for_buying",       predicateLabel: "visits for buying" },
  music:       { label: "Music",       color: "#FF5722", gradientEnd: "#FF8A65", cssClass: "music",       intentionPurpose: "for_music",        predicateLabel: "visits for music" }
}

// ── Derived Helpers (computed from INTENTION_CONFIG) ──

/** Color lookup record — replaces local CERTIFICATION_COLORS, CERT_COLORS */
export const CERTIFICATION_COLORS: Record<IntentionType, string> =
  Object.fromEntries(
    Object.entries(INTENTION_CONFIG).map(([k, v]) => [k, v.color])
  ) as Record<IntentionType, string>

/** 6 intention items (excludes trusted/distrusted) — replaces local INTENTIONS, INTENTION_ITEMS */
export const INTENTION_ITEMS: { key: IntentionPurpose; label: string; type: IntentionType }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .filter(([, v]) => v.intentionPurpose !== null)
    .map(([type, v]) => ({ key: v.intentionPurpose!, label: v.label.toLowerCase(), type }))

/** 2 trust/distrust items — replaces local TRUST_PILLS */
export const TRUST_ITEMS: { type: IntentionType; label: string; predicateLabel: string }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .filter(([type]) => type === "trusted" || type === "distrusted")
    .map(([type, v]) => ({ type, label: v.label.toLowerCase(), predicateLabel: v.predicateLabel! }))

/** All 8 certifications with type+label+color — replaces local CERTIFICATIONS arrays */
export const CERTIFICATION_LIST: { type: IntentionType; label: string; color: string }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .map(([type, v]) => ({ type, label: v.label, color: v.color }))

/** Get color for a certification type, with fallback */
export function getIntentionColor(type: string): string {
  return INTENTION_CONFIG[type as IntentionType]?.color ?? "#888888"
}

/** Resolve an intention string (IntentionType or IntentionPurpose) to badge info */
export function getIntentionBadge(intention?: string): { label: string; color: string } | null {
  if (!intention) return null
  if (intention in INTENTION_CONFIG) {
    const entry = INTENTION_CONFIG[intention as IntentionType]
    return { label: entry.label, color: entry.color }
  }
  const stripped = intention.replace(/^for_/, "")
  if (stripped in INTENTION_CONFIG) {
    const entry = INTENTION_CONFIG[stripped as IntentionType]
    return { label: entry.label, color: entry.color }
  }
  return null
}

/** Map a predicate label ("visits for work", "trusts") to IntentionType ("work", "trusted") */
export function predicateLabelToIntentionType(label: string): IntentionType | null {
  const trimmed = label.trim().toLowerCase()
  for (const [type, config] of Object.entries(INTENTION_CONFIG)) {
    if (config.predicateLabel && trimmed === config.predicateLabel.toLowerCase()) {
      return type as IntentionType
    }
  }
  return null
}

// ── Legacy types (kept for existing consumers) ──

export interface CategoryUrl {
  url: string
  label: string
  domain: string
  favicon: string
  certifiedAt: string
  shares: string
}

export interface IntentionCategory {
  id: IntentionType
  label: string
  color: string
  urls: CategoryUrl[]
  urlCount: number
}
