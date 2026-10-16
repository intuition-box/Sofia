/**
 * Feature flags — single source of truth for surfaces hidden during the
 * market refocus (docs/plans/MARKET_REFOCUS_PLAN.md, decision D3).
 *
 * A disabled feature is unreachable: removed from navigation, its routes
 * redirect to `/explore`, and the always-mounted components that would
 * otherwise fetch its data skip the request. The code itself is kept for
 * future reuse — flip a flag to bring a surface back.
 *
 * Each flag can be forced on at build time with `VITE_FEATURE_<NAME>=true`
 * (e.g. `VITE_FEATURE_CIRCLES=true`, `VITE_FEATURE_CIRCLE_PRO=true`).
 */

function envFlag(value: unknown, fallback: boolean): boolean {
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return fallback
}

const env = import.meta.env

export const FEATURES = {
  /** Circles (trust circle + on-chain groups), `/circles/*`. */
  circles: envFlag(env.VITE_FEATURE_CIRCLES, false),
  /** Compose + Perspective, `/compose`, `/perspective/*`. */
  compose: envFlag(env.VITE_FEATURE_COMPOSE, false),
  /** group-api notifications, `/notifications`. */
  notifications: envFlag(env.VITE_FEATURE_NOTIFICATIONS, false),
  /** Debate vote page, `/vote`. */
  vote: envFlag(env.VITE_FEATURE_VOTE, false),
  /** Subscription billing, `/settings/billing`. */
  billing: envFlag(env.VITE_FEATURE_BILLING, false),
  /** Circle Pro (B2B / DAO) surfaces. */
  circlePro: envFlag(env.VITE_FEATURE_CIRCLE_PRO, false),
} as const

export type FeatureName = keyof typeof FEATURES
