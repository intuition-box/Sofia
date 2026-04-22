/**
 * Intention taxonomy for the explorer — single source of truth for the 8
 * Sofia intentions + their metadata (labels, cssClass, predicate labels,
 * purpose IDs). Colors are pulled from `@0xsofia/design-system/palette` so
 * landing + extension + explorer share the same palette; the semantic
 * layer (what the colors MEAN) lives here because it's app-level business
 * logic, not visual kit.
 */

import { PREDICATE_IDS } from '../config'
import { INTENTION_HEX, type IntentionSlug } from '@0xsofia/design-system'

// ── Canonical types ─────────────────────────────────────────────────────

export type IntentionType = IntentionSlug
export type IntentionPurpose =
  | 'for_work'
  | 'for_learning'
  | 'for_fun'
  | 'for_inspiration'
  | 'for_buying'
  | 'for_music'

export interface IntentionConfigEntry {
  label: string
  color: string
  gradientEnd: string
  cssClass: IntentionType
  intentionPurpose: IntentionPurpose | null
  predicateLabel: string
}

/** The 8 canonical intentions. */
export const INTENTION_CONFIG: Record<IntentionType, IntentionConfigEntry> = {
  trusted:     { label: 'Trusted',     color: INTENTION_HEX.trusted,     gradientEnd: '#4ADE80', cssClass: 'trusted',     intentionPurpose: null,              predicateLabel: 'trusts' },
  distrusted:  { label: 'Distrusted',  color: INTENTION_HEX.distrusted,  gradientEnd: '#F87171', cssClass: 'distrusted',  intentionPurpose: null,              predicateLabel: 'distrusts' },
  work:        { label: 'Work',        color: INTENTION_HEX.work,        gradientEnd: '#60A5FA', cssClass: 'work',        intentionPurpose: 'for_work',        predicateLabel: 'visits for work' },
  learning:    { label: 'Learning',    color: INTENTION_HEX.learning,    gradientEnd: '#22D3EE', cssClass: 'learning',    intentionPurpose: 'for_learning',    predicateLabel: 'visits for learning' },
  fun:         { label: 'Fun',         color: INTENTION_HEX.fun,         gradientEnd: '#FBBF24', cssClass: 'fun',         intentionPurpose: 'for_fun',         predicateLabel: 'visits for fun' },
  inspiration: { label: 'Inspiration', color: INTENTION_HEX.inspiration, gradientEnd: '#A78BFA', cssClass: 'inspiration', intentionPurpose: 'for_inspiration', predicateLabel: 'visits for inspiration' },
  buying:      { label: 'Buying',      color: INTENTION_HEX.buying,      gradientEnd: '#F472B6', cssClass: 'buying',      intentionPurpose: 'for_buying',      predicateLabel: 'visits for buying' },
  music:       { label: 'Music',       color: INTENTION_HEX.music,       gradientEnd: '#FF8A65', cssClass: 'music',       intentionPurpose: 'for_music',       predicateLabel: 'visits for music' },
}

// ── Extra intention labels (not first-class predicates) ────────────────

export const EXTRA_INTENTION_COLORS: Record<string, string> = {
  Attending: '#6DC4A8',
  Valued: '#E0A06A',
  'is following': '#6DC4A8',
}

// ── Derived lookups ─────────────────────────────────────────────────────

export const CERTIFICATION_COLORS: Record<IntentionType, string> =
  Object.fromEntries(
    Object.entries(INTENTION_CONFIG).map(([k, v]) => [k, v.color]),
  ) as Record<IntentionType, string>

export const INTENTION_COLORS_BY_LABEL: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(INTENTION_CONFIG).map((v) => [v.label, v.color]),
  ),
  ...EXTRA_INTENTION_COLORS,
}

/** Legacy alias — existing consumers import `INTENTION_COLORS`. */
export const INTENTION_COLORS: Record<string, string> = INTENTION_COLORS_BY_LABEL

export const INTENTION_ITEMS: { key: IntentionPurpose; label: string; type: IntentionType }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .filter(([, v]) => v.intentionPurpose !== null)
    .map(([type, v]) => ({ key: v.intentionPurpose!, label: v.label.toLowerCase(), type }))

export const TRUST_ITEMS: { type: IntentionType; label: string; predicateLabel: string }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .filter(([type]) => type === 'trusted' || type === 'distrusted')
    .map(([type, v]) => ({ type, label: v.label.toLowerCase(), predicateLabel: v.predicateLabel }))

export const CERTIFICATION_LIST: { type: IntentionType; label: string; color: string }[] =
  (Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][])
    .map(([type, v]) => ({ type, label: v.label, color: v.color }))

// ── Lookup helpers ──────────────────────────────────────────────────────

export function getIntentionColor(type: string): string {
  return INTENTION_CONFIG[type as IntentionType]?.color ?? '#888888'
}

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

export function displayLabelToIntentionType(label: string): IntentionType | null {
  const needle = label.trim().toLowerCase()
  for (const [type, cfg] of Object.entries(INTENTION_CONFIG) as [IntentionType, IntentionConfigEntry][]) {
    if (cfg.label.toLowerCase() === needle) return type
  }
  return null
}

export function getSideColor(side: 'support' | 'oppose'): string {
  return side === 'support' ? INTENTION_CONFIG.trusted.color : INTENTION_CONFIG.distrusted.color
}

export function intentionBadgeStyle(color: string): { backgroundColor: string; border: string } {
  return { backgroundColor: `${color}20`, border: `1px solid ${color}40` }
}

// ── Predicate mappings ──────────────────────────────────────────────────

/** Map on-chain predicate ID → display intention label (e.g. `'Trusted'`).
 *  NOTE: returns the label (not the slug) for back-compat with
 *  `feedProcessing.ts` which concatenates it into `CircleItem.intentions`. */
export const PREDICATE_TO_INTENTION: Record<string, string> = {
  [PREDICATE_IDS.TRUSTS]: 'Trusted',
  [PREDICATE_IDS.DISTRUST]: 'Distrusted',
  [PREDICATE_IDS.VISITS_FOR_WORK]: 'Work',
  [PREDICATE_IDS.VISITS_FOR_LEARNING]: 'Learning',
  [PREDICATE_IDS.VISITS_FOR_FUN]: 'Fun',
  [PREDICATE_IDS.VISITS_FOR_INSPIRATION]: 'Inspiration',
}

export const LABEL_TO_INTENTION: Record<string, string | undefined> = {
  trusts: 'Trusted',
  distrust: 'Distrusted',
  'visits for work': 'Work',
  'visits for learning': 'Learning',
  'visits for fun': 'Fun',
  'visits for inspiration': 'Inspiration',
  'visits for buying': 'Buying',
  'visits for music': 'Music',
  attending: 'Attending',
  'has value': 'Valued',
  follow: 'is following',
}

export function predicateLabelToIntentionType(label: string): IntentionType | null {
  const trimmed = label.trim().toLowerCase()
  switch (trimmed) {
    case 'trusts': return 'trusted'
    case 'distrust': return 'distrusted'
    case 'visits for work': return 'work'
    case 'visits for learning': return 'learning'
    case 'visits for fun': return 'fun'
    case 'visits for inspiration': return 'inspiration'
    case 'visits for buying': return 'buying'
    case 'visits for music': return 'music'
    default: return null
  }
}

// ── Quest badges ────────────────────────────────────────────────────────

export type QuestCategory =
  | 'daily'
  | 'milestone'
  | 'discovery'
  | 'gold'
  | 'vote'
  | 'social'
  | 'streak'

export interface QuestBadge {
  name: string
  category: QuestCategory
}

export const QUEST_BADGES: Record<string, QuestBadge> = {
  'daily certification': { name: 'Daily Certification', category: 'daily' },
  'daily voter': { name: 'Daily Voter', category: 'daily' },
  'first signal': { name: 'First Signal', category: 'milestone' },
  'first step': { name: 'First Step', category: 'discovery' },
  'first coins': { name: 'First Coins', category: 'gold' },
  'first vote': { name: 'First Vote', category: 'vote' },
  'first follow': { name: 'First Follow', category: 'social' },
  'first trust': { name: 'First Trust', category: 'social' },
  trailblazer: { name: 'Trailblazer', category: 'discovery' },
  saver: { name: 'Saver', category: 'gold' },
  committed: { name: 'Committed', category: 'streak' },
  dedicated: { name: 'Dedicated', category: 'streak' },
  relentless: { name: 'Relentless', category: 'streak' },
  critic: { name: 'Critic', category: 'vote' },
  judge: { name: 'Judge', category: 'vote' },
  'engaged voter': { name: 'Engaged Voter', category: 'vote' },
  'civic duty': { name: 'Civic Duty', category: 'vote' },
  'signal rookie': { name: 'Signal Rookie', category: 'milestone' },
  'signal maker': { name: 'Signal Maker', category: 'milestone' },
  centurion: { name: 'Centurion', category: 'milestone' },
  'signal pro': { name: 'Signal Pro', category: 'milestone' },
  'social butterfly': { name: 'Social Butterfly', category: 'social' },
  networker: { name: 'Networker', category: 'social' },
  explorer: { name: 'Explorer', category: 'discovery' },
  pathfinder: { name: 'Pathfinder', category: 'discovery' },
  collector: { name: 'Collector', category: 'milestone' },
  'gold digger': { name: 'Gold Digger', category: 'gold' },
  treasurer: { name: 'Treasurer', category: 'gold' },
  'midas touch': { name: 'Midas Touch', category: 'gold' },
  'discord linked': { name: 'Discord Linked', category: 'social' },
  'youtube linked': { name: 'YouTube Linked', category: 'social' },
  'spotify linked': { name: 'Spotify Linked', category: 'social' },
  'twitch linked': { name: 'Twitch Linked', category: 'social' },
  'twitter linked': { name: 'Twitter Linked', category: 'social' },
  'social linked': { name: 'Social Linked', category: 'social' },
}
