/**
 * Predicate IDs and mapping tables.
 *
 * Ported from apps/explorer/src/config.ts + apps/explorer/src/config/intentions.ts.
 * These are the on-chain atom IDs for each predicate (immutable source of truth)
 * and the lookup tables that translate predicate IDs or human labels back to
 * the canonical IntentionType labels used by UI.
 */

import type { IntentionType } from './intentions'

// ── Predicate IDs (mainnet) ──────────────────────────────────────────────

export const PREDICATE_IDS = {
  TRUSTS: '0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9',
  DISTRUST: '0x93dd055a971886b66c5f4d9c29098ebdd9b7991890b6372a7e184c64321c9710',
  VISITS_FOR_WORK: '0x73872e1840362760d0144599493fc6f22ec5042f85ae7b8904576999a189d76b',
  VISITS_FOR_LEARNING: '0x5d6fcc892d3634b61e743d256289dd95f60604ee07f170aea9b4980b5eeda282',
  VISITS_FOR_FUN: '0xb8b8ab8d23678edad85cec5e580caeb564a88b532f8dfd884f93dcf2cab32459',
  VISITS_FOR_INSPIRATION: '0xd635b7467c9f89a9d243b82c5e4f6a97d238ad91a914b5de9949e107e5f59825',
} as const

// ── Display-label mappings ───────────────────────────────────────────────

/**
 * Map on-chain predicate ID → display intention label (Trusted, Work, …).
 * Unknown keys resolve to `undefined` at runtime — the type reflects that.
 */
export const PREDICATE_TO_INTENTION: Record<string, string | undefined> = {
  [PREDICATE_IDS.TRUSTS]: 'Trusted',
  [PREDICATE_IDS.DISTRUST]: 'Distrusted',
  [PREDICATE_IDS.VISITS_FOR_WORK]: 'Work',
  [PREDICATE_IDS.VISITS_FOR_LEARNING]: 'Learning',
  [PREDICATE_IDS.VISITS_FOR_FUN]: 'Fun',
  [PREDICATE_IDS.VISITS_FOR_INSPIRATION]: 'Inspiration',
}

/**
 * Map human-readable predicate label → display intention label.
 * Unknown keys resolve to `undefined` at runtime — the type reflects that.
 */
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

// ── Type-aware helpers ───────────────────────────────────────────────────

/**
 * Resolve a predicate label ("visits for work", "trusts") to the canonical
 * IntentionType, or null when the label is outside the canonical set.
 */
export function predicateLabelToIntentionType(label: string): IntentionType | null {
  const trimmed = label.trim().toLowerCase()
  // Local import-free lookup against the canonical predicate labels:
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
