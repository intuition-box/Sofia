/**
 * Feature flags — market refocus (docs/plans/MARKET_REFOCUS_PLAN.md, D3).
 *
 * Hidden features keep their code; they are only removed from navigation,
 * routes and background work. Flip a flag back to `true` to restore it.
 */

export const FEATURES = {
  /** Circles page (trust circle, circle feed, votes from the feed). */
  circles: false,
  /** Echoes tab (shown as "Bookmark": domain groups, levels). Kept ON: it is
   *  the bookmark view users know — hiding it would lose functionality. */
  echoes: true,
  /** Socials tab (OAuth-linked accounts + social verification). */
  socials: false
} as const

export type FeatureName = keyof typeof FEATURES

export const isFeatureEnabled = (name: FeatureName): boolean => FEATURES[name]
