/**
 * Level-tier color ramp used by the level badge + progress UI.
 *
 * Indices correspond to `level` values: index 0 = level 1 (neutral grey),
 * 1 = level 2 (green), up to 6 = level 7+ (red). Level caps at the last
 * index so `level ≥ 6` all reuse `'#EF4444'`.
 */

/** Ordered palette from low → high level. */
export const LEVEL_TIER_COLORS: readonly string[] = [
  '#94A3B8', // 1  — neutral / fresh
  '#22C55E', // 2  — green
  '#06B6D4', // 3  — cyan
  '#8B5CF6', // 4  — violet
  '#F59E0B', // 5  — amber
  '#EC4899', // 6  — pink
  '#EF4444', // 7+ — red
]

/** Solid color for the given level (clamped to the ramp). */
export function getLevelColor(level: number): string {
  const idx = Math.min(Math.max(level - 1, 0), LEVEL_TIER_COLORS.length - 1)
  return LEVEL_TIER_COLORS[idx]
}

/** Transparent tint derived from `getLevelColor`. Uses `color-mix`. */
export function getLevelColorAlpha(level: number, alpha = 18): string {
  return `color-mix(in srgb, ${getLevelColor(level)} ${alpha}%, transparent)`
}
