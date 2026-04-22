/**
 * Intention Categories — Single Source of Truth
 *
 * Consolidates the two previous copies:
 *   - apps/extension/types/intentionCategories.ts (8 canonical types + helpers)
 *   - apps/explorer/src/config/intentions.ts (extra display labels + helpers)
 *
 * Every component and hook — in explorer, extension, or a new package — must
 * import from this file instead of defining local copies.
 */

// ── Canonical types ──────────────────────────────────────────────────────

/** All 8 certification / intention types backed by on-chain predicates. */
export type IntentionType =
  | 'trusted'
  | 'distrusted'
  | 'work'
  | 'learning'
  | 'fun'
  | 'inspiration'
  | 'buying'
  | 'music'

/** On-chain intention purposes (6 intentions, excludes trust/distrust). */
export type IntentionPurpose =
  | 'for_work'
  | 'for_learning'
  | 'for_fun'
  | 'for_inspiration'
  | 'for_buying'
  | 'for_music'

/** Full config entry for each canonical certification type. */
export interface IntentionConfigEntry {
  label: string
  color: string
  gradientEnd: string
  cssClass: string
  intentionPurpose: IntentionPurpose | null
  predicateLabel: string | null
}

// ── Central config ──────────────────────────────────────────────────────

/**
 * Canonical 8 types. Colors match the proto (vivid palette) which is the
 * single agreed direction — see INTEGRATION.md §2 and §8.
 */
export const INTENTION_CONFIG: Record<IntentionType, IntentionConfigEntry> = {
  trusted:     { label: 'Trusted',     color: '#22C55E', gradientEnd: '#4ADE80', cssClass: 'trusted',     intentionPurpose: null,              predicateLabel: 'trusts' },
  distrusted:  { label: 'Distrusted',  color: '#EF4444', gradientEnd: '#F87171', cssClass: 'distrusted',  intentionPurpose: null,              predicateLabel: 'distrust' },
  work:        { label: 'Work',        color: '#3B82F6', gradientEnd: '#60A5FA', cssClass: 'work',        intentionPurpose: 'for_work',        predicateLabel: 'visits for work' },
  learning:    { label: 'Learning',    color: '#06B6D4', gradientEnd: '#22D3EE', cssClass: 'learning',    intentionPurpose: 'for_learning',    predicateLabel: 'visits for learning' },
  fun:         { label: 'Fun',         color: '#F59E0B', gradientEnd: '#FBBF24', cssClass: 'fun',         intentionPurpose: 'for_fun',         predicateLabel: 'visits for fun' },
  inspiration: { label: 'Inspiration', color: '#8B5CF6', gradientEnd: '#A78BFA', cssClass: 'inspiration', intentionPurpose: 'for_inspiration', predicateLabel: 'visits for inspiration' },
  buying:      { label: 'Buying',      color: '#EC4899', gradientEnd: '#F472B6', cssClass: 'buying',      intentionPurpose: 'for_buying',      predicateLabel: 'visits for buying' },
  music:       { label: 'Music',       color: '#FF5722', gradientEnd: '#FF8A65', cssClass: 'music',       intentionPurpose: 'for_music',       predicateLabel: 'visits for music' },
}

// ── Extra display labels (not predicates) ────────────────────────────────

/**
 * Auxiliary labels surfaced by the explorer (Attending / Valued / is following).
 * These are NOT backed by first-class predicates in the current INTENTION_CONFIG,
 * they are derived from predicate metadata elsewhere. Kept here for color
 * reference so UI code doesn't hardcode hex values.
 */
export const EXTRA_INTENTION_COLORS: Record<string, string> = {
  Attending: '#6DC4A8',
  Valued: '#E0A06A',
  'is following': '#6DC4A8',
}

// ── Derived helpers (computed from INTENTION_CONFIG) ─────────────────────

/** Color lookup by IntentionType. Replaces the old local `CERTIFICATION_COLORS`. */
export const CERTIFICATION_COLORS: Record<IntentionType, string> =
  Object.fromEntries(
    Object.entries(INTENTION_CONFIG).map(([k, v]) => [k, v.color]),
  ) as Record<IntentionType, string>

/**
 * Display-label-keyed color map. Merges INTENTION_CONFIG canonical labels with
 * the EXTRA_INTENTION_COLORS so explorer-style lookups (`INTENTION_COLORS[label]`)
 * stay supported.
 */
export const INTENTION_COLORS_BY_LABEL: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(INTENTION_CONFIG).map((v) => [v.label, v.color]),
  ),
  ...EXTRA_INTENTION_COLORS,
}

/** 6 intention items (excludes trusted/distrusted). */
export const INTENTION_ITEMS: { key: IntentionPurpose; label: string; type: IntentionType }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .filter(([, v]) => v.intentionPurpose !== null)
    .map(([type, v]) => ({ key: v.intentionPurpose!, label: v.label.toLowerCase(), type }))

/** 2 trust/distrust items. */
export const TRUST_ITEMS: { type: IntentionType; label: string; predicateLabel: string }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .filter(([type]) => type === 'trusted' || type === 'distrusted')
    .map(([type, v]) => ({ type, label: v.label.toLowerCase(), predicateLabel: v.predicateLabel! }))

/** All 8 certifications with type+label+color. */
export const CERTIFICATION_LIST: { type: IntentionType; label: string; color: string }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .map(([type, v]) => ({ type, label: v.label, color: v.color }))

// ── Lookup functions ─────────────────────────────────────────────────────

/** Get color for a certification type, with fallback. */
export function getIntentionColor(type: string): string {
  return INTENTION_CONFIG[type as IntentionType]?.color ?? '#888888'
}

/** Resolve an intention string (IntentionType or IntentionPurpose) to badge info. */
export function getIntentionBadge(intention?: string): { label: string; color: string } | null {
  if (!intention) return null
  if (intention in INTENTION_CONFIG) {
    const entry = INTENTION_CONFIG[intention as IntentionType]
    return { label: entry.label, color: entry.color }
  }
  const stripped = intention.replace(/^for_/, '')
  if (stripped in INTENTION_CONFIG) {
    const entry = INTENTION_CONFIG[stripped as IntentionType]
    return { label: entry.label, color: entry.color }
  }
  return null
}

/** Accent color for support / oppose UI. */
export function getSideColor(side: 'support' | 'oppose'): string {
  return side === 'support' ? INTENTION_CONFIG.trusted.color : INTENTION_CONFIG.distrusted.color
}

/** Inline style object for intention badge pills (light tint + border). */
export function intentionBadgeStyle(color: string): { backgroundColor: string; border: string } {
  return { backgroundColor: `${color}20`, border: `1px solid ${color}40` }
}

/**
 * Reverse lookup from the display label (`"Work"`, `"Learning"`, …) back to
 * the canonical IntentionType. Use this when consuming pre-computed display
 * labels surfaced by `CircleItem.intentions` or similar feed-processing
 * output. Returns `null` for labels outside the canonical set (quest badges,
 * legacy free-text predicates).
 */
export function displayLabelToIntentionType(label: string): IntentionType | null {
  const needle = label.trim().toLowerCase()
  for (const [type, cfg] of Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][]) {
    if (cfg.label.toLowerCase() === needle) return type
  }
  return null
}

// ── Legacy types (kept for existing consumers) ───────────────────────────

export interface CategoryUrl {
  url: string
  label: string
  domain: string
  favicon: string
  certifiedAt: string
  shares: string
  termId: string
}

export interface IntentionCategory {
  id: IntentionType
  label: string
  color: string
  urls: CategoryUrl[]
  urlCount: number
}
