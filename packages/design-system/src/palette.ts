/**
 * Sofia intention palette — the 8 canonical hex values shared across
 * explorer / landing / extension.
 *
 * This module is deliberately tiny and carries NO business logic:
 *
 *   - no predicate mapping
 *   - no intention-purpose / IntentionPurpose
 *   - no label lookups
 *   - no getColor(…) helpers that fall back to a default
 *
 * Any app-level semantics (what `trusted` MEANS, how to resolve a predicate
 * label, which slug a display label maps to, …) live in the consuming app's
 * config (`apps/explorer/src/config/intentions.ts`).
 *
 * The DS also exposes the same colors as CSS variables (`--trusted`,
 * `--work`, …) in `theme.css` — those are PASTEL versions, used for ambient
 * accents. The values below are the VIVID versions used for pills and
 * badges that need contrast.
 */

export const INTENTION_HEX = {
  trusted: '#22C55E',
  distrusted: '#EF4444',
  work: '#3B82F6',
  learning: '#06B6D4',
  fun: '#F59E0B',
  inspiration: '#8B5CF6',
  buying: '#EC4899',
  music: '#FF5722',
} as const

export type IntentionSlug = keyof typeof INTENTION_HEX

/** Pastel CSS-token counterparts — same keys, ambient values. */
export const INTENTION_PASTEL = {
  trusted: '#6dd4a0',
  distrusted: '#e87c7c',
  work: '#7bade0',
  learning: '#5cc4d6',
  fun: '#e4b95a',
  inspiration: '#a78bdb',
  buying: '#d98cb3',
  music: '#e0896a',
} as const
