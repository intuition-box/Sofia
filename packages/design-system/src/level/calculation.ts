/**
 * Level calculation utilities.
 *
 * Single source of truth for group level thresholds and calculations. Ported
 * from apps/extension/lib/utils/levelCalculation.ts and expected to be used
 * by Echoes components (GroupBentoCard), on-chain certification hooks, and
 * any future surfaces that present user level.
 */

/** Certification count required to reach each level (index = level - 1). */
export const LEVEL_THRESHOLDS: readonly number[] = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]

/**
 * Calculate level from on-chain certification count.
 * Returns a level in the 1..LEVEL_THRESHOLDS.length range.
 */
export function calculateLevel(certifiedCount: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = LEVEL_THRESHOLDS[i]
    if (t !== undefined && certifiedCount >= t) return i + 1
  }
  return 1
}

/** Shape returned by {@link calculateLevelProgress}. */
export interface LevelProgress {
  level: number
  currentThreshold: number
  nextThreshold: number
  progressPercent: number
  xpToNextLevel: number
}

/**
 * Calculate level progress toward the next threshold.
 *
 * @param certifiedCount Total on-chain certifications
 * @param baseLevel Optional override for the base level (e.g. a locked
 *   `confirmedLevel` on a bento card — prevents the bar from jumping backwards
 *   while new on-chain data is reconciling).
 */
export function calculateLevelProgress(
  certifiedCount: number,
  baseLevel?: number,
): LevelProgress {
  const level = baseLevel ?? calculateLevel(certifiedCount)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 10
  const xpToNext = nextThreshold - certifiedCount
  const progress = ((certifiedCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  return {
    level,
    currentThreshold,
    nextThreshold,
    progressPercent: Math.min(100, Math.max(0, progress)),
    xpToNextLevel: Math.max(0, xpToNext),
  }
}
