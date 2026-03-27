/**
 * Level Calculation Utilities
 * Single source of truth for group level thresholds and calculations.
 * Used by Echoes components and on-chain certification hooks.
 *
 * Related files:
 * - components/ui/GroupBentoCard.tsx
 * - components/ui/GroupDetailView.tsx
 * - hooks/useGroupOnChainCertifications.ts
 * - hooks/useOnChainIntentionGroups.ts
 */

/** Certification count required per level (index = level - 1) */
export const LEVEL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]

/**
 * Calculate level from on-chain certification count.
 * Returns level 1-11.
 */
export function calculateLevel(certifiedCount: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (certifiedCount >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

/**
 * Calculate level progress toward next threshold.
 * @param certifiedCount - Total on-chain certifications
 * @param baseLevel - Optional override for the base level (e.g. confirmedLevel in BentoCard)
 */
export function calculateLevelProgress(
  certifiedCount: number,
  baseLevel?: number
): {
  level: number
  currentThreshold: number
  nextThreshold: number
  progressPercent: number
  xpToNextLevel: number
} {
  const level = baseLevel ?? calculateLevel(certifiedCount)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 10
  const xpToNext = nextThreshold - certifiedCount
  const progress =
    ((certifiedCount - currentThreshold) /
      (nextThreshold - currentThreshold)) *
    100

  return {
    level,
    currentThreshold,
    nextThreshold,
    progressPercent: Math.min(100, Math.max(0, progress)),
    xpToNextLevel: Math.max(0, xpToNext)
  }
}
