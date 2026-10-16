/**
 * Feature flags — market refocus (docs/plans/MARKET_REFOCUS_PLAN.md, D3).
 *
 * Hidden features keep their code; they are only removed from navigation,
 * routes and background work. Flip a flag back to `true` to restore it.
 */

export const FEATURES = {
  /** Circles page (trust circle, circle feed, votes from the feed). */
  circles: false,
  /** Echoes tab (domain groups, levels) + browsing session tracking feeding it. */
  echoes: false,
  /** Score page (quests, XP, Gold, achievements) — moved to the Explorer. */
  score: false,
  /** Socials tab (OAuth-linked accounts + social verification). */
  socials: false,
  /** AI features (Mastra / GaiaNet — decommissioned). */
  ai: false
} as const

export type FeatureName = keyof typeof FEATURES

export const isFeatureEnabled = (name: FeatureName): boolean => FEATURES[name]
