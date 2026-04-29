/**
 * Tier/level utilities for SOFIA extension
 * Used by StatsTab, UserStatsTab, GroupManagerModal for level colors and badges
 */

// Tier colors — DS-aligned pastel palette (mirrors INTENTION_PASTEL) + gold cap.
// One color per decade of levels (1-10, 11-20, …). Lightness ramps within each
// tier so each level has a subtly different shade.
export const TIER_COLORS: { base: string; hsl: [number, number, number] }[] = [
  { base: '#8f8ca8', hsl: [245, 12, 60] },   // Tier 0: Lvl 1-10   — ds-muted (slate)
  { base: '#6dd4a0', hsl: [146, 53, 63] },   // Tier 1: Lvl 11-20  — trusted (green)
  { base: '#7bade0', hsl: [210, 60, 68] },   // Tier 2: Lvl 21-30  — work (blue)
  { base: '#a78bdb', hsl: [263, 51, 70] },   // Tier 3: Lvl 31-40  — inspiration (purple)
  { base: '#e87c7c', hsl: [0, 70, 70] },     // Tier 4: Lvl 41-50  — distrusted (red)
  { base: '#d98cb3', hsl: [330, 51, 70] },   // Tier 5: Lvl 51-60  — buying (pink)
  { base: '#5cc4d6', hsl: [188, 60, 60] },   // Tier 6: Lvl 61-70  — learning (cyan)
  { base: '#e0896a', hsl: [16, 65, 65] },    // Tier 7: Lvl 71-80  — music (orange)
  { base: '#e4b95a', hsl: [41, 73, 62] },    // Tier 8: Lvl 81-90  — fun (amber)
  { base: '#FFD700', hsl: [51, 100, 50] },   // Tier 9: Lvl 91-100 — Gold (max tier cap)
]

// Tier badge metadata — name, level range, and image import path
export interface TierBadge {
  tier: number;
  name: string;
  levelRange: string;
  minLevel: number;
}

export const TIER_BADGES: TierBadge[] = [
  { tier: 1,  name: 'Whisper',          levelRange: '1-10',   minLevel: 1 },
  { tier: 2,  name: 'Frequency Hunter', levelRange: '11-20',  minLevel: 11 },
  { tier: 3,  name: 'Signal Shaper',    levelRange: '21-30',  minLevel: 21 },
  { tier: 4,  name: 'Amplifier',        levelRange: '31-40',  minLevel: 31 },
  { tier: 5,  name: 'Specialist',       levelRange: '41-50',  minLevel: 41 },
  { tier: 6,  name: 'Virtuoso',         levelRange: '51-60',  minLevel: 51 },
  { tier: 7,  name: 'Expert',           levelRange: '61-70',  minLevel: 61 },
  { tier: 8,  name: 'Maestro',          levelRange: '71-80',  minLevel: 71 },
  { tier: 9,  name: 'Echo Generator',   levelRange: '81-90',  minLevel: 81 },
  { tier: 10, name: 'Symphony',         levelRange: '91-100', minLevel: 91 },
]

/** Get the current tier index (0-9) from a level */
export function getTierIndex(level: number): number {
  return Math.min(Math.floor((level - 1) / 10), TIER_BADGES.length - 1)
}

/**
 * Get level color with tier-based gradient.
 * Position within the tier (1-10) increases lightness slightly
 * so each level has a subtly different shade.
 */
export function getLevelColor(level: number): string {
  const tierIndex = Math.min(
    Math.floor((level - 1) / 10),
    TIER_COLORS.length - 1
  )
  const posInTier = ((level - 1) % 10) // 0-9
  const [h, s, l] = TIER_COLORS[tierIndex].hsl
  // Shift lightness from +8 (position 0) to -4 (position 9) for subtle gradient
  const adjustedL = Math.max(20, Math.min(80, l + 8 - posInTier * 1.3))
  return `hsl(${h}, ${s}%, ${adjustedL}%)`
}

/**
 * Get level color with alpha transparency.
 * Returns hsla() string for use as backgrounds.
 */
export function getLevelColorAlpha(level: number, alpha = 0.19): string {
  const tierIndex = Math.min(
    Math.floor((level - 1) / 10),
    TIER_COLORS.length - 1
  )
  const posInTier = ((level - 1) % 10)
  const [h, s, l] = TIER_COLORS[tierIndex].hsl
  const adjustedL = Math.max(20, Math.min(80, l + 8 - posInTier * 1.3))
  return `hsla(${h}, ${s}%, ${adjustedL}%, ${alpha})`
}

