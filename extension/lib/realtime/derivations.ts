/**
 * Derivations — pure functions that convert raw WS subscription payloads
 * into the shapes consumed by hooks (useTopicPositions, useUserProfile...).
 *
 * Phase 1.B stub: only the query key builders (realtimeKeys) and the
 * Position type are live. The actual derivation functions return empty
 * placeholders so SubscriptionManager can call them without crashing.
 *
 * Phase 3 will fill in the real logic once we've decided which Sofia-
 * specific atom IDs to map (predicates, quest atoms, topics if any).
 * The Explorer version hardcodes TOPIC_ATOM_IDS/CATEGORY_ATOM_IDS/
 * PLATFORM_ATOM_IDS — Sofia's equivalent still needs to be defined.
 */

import type { QueryClient } from "@tanstack/react-query"
import type { WatchUserPositionsSubscription } from "@0xsofia/graphql"

export type Position = NonNullable<
  WatchUserPositionsSubscription["positions"]
>[number]

// ── Query key builders (single source of truth) ─────────────────────────────

export const realtimeKeys = {
  positions: (wallet: string) => ["positions", wallet] as const,
  topicPositionsMap: (wallet: string) =>
    ["topic-positions-map", wallet] as const,
  categoryPositionsMap: (wallet: string) =>
    ["category-positions-map", wallet] as const,
  platformPositionsMap: (wallet: string) =>
    ["platform-positions-map", wallet] as const,
  verifiedPlatforms: (wallet: string) =>
    ["verified-platforms", wallet] as const,
  userProfileDerived: (wallet: string) =>
    ["user-profile-derived", wallet] as const,
  userStats: (wallet: string) => ["user-stats", wallet] as const
}

// ── BigInt helpers (stable cache shape) ─────────────────────────────────────
//
// Shares stored as decimal strings in the cache — JSON.stringify throws on
// BigInt, which would break the React Query persister (Phase 2).

function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v
  if (typeof v === "number") return BigInt(Math.trunc(v))
  if (typeof v === "string" && v.length > 0) {
    try {
      return BigInt(v)
    } catch {
      return 0n
    }
  }
  return 0n
}

export function sharesToBigInt(v: unknown): bigint {
  return toBigInt(v)
}

// ── Derivation stubs (Phase 3 implements these) ─────────────────────────────

export function derivePositionsByTopic(
  _positions: Position[]
): Record<string, string> {
  return {}
}

export function derivePositionsByCategory(
  _positions: Position[]
): Record<string, string> {
  return {}
}

export function derivePositionsByPlatform(
  _positions: Position[]
): Record<string, string> {
  return {}
}

export function deriveVerifiedPlatforms(_positions: Position[]): string[] {
  return []
}

export interface UserPositionView {
  termId: string
  shares: string
  currentSharePrice: string
  isTriple: boolean
  predicateLabel?: string
  objectLabel?: string
  objectUrl?: string
  tripleSubjectId?: string
  tripleObjectId?: string
  atomLabel?: string
  atomUrl?: string
}

export interface UserStats {
  totalPositions: number
  totalAtomPositions: number
  totalTriplePositions: number
  totalStaked: number
  verifiedPlatforms: string[]
}

export interface UserProfileDerived {
  positions: UserPositionView[]
  totalPositions: number
  totalAtomPositions: number
  totalStaked: number
  verifiedPlatforms: string[]
}

export function deriveUserProfile(
  _positions: Position[]
): UserProfileDerived {
  return {
    positions: [],
    totalPositions: 0,
    totalAtomPositions: 0,
    totalStaked: 0,
    verifiedPlatforms: []
  }
}

export function deriveUserStats(_positions: Position[]): UserStats {
  return {
    totalPositions: 0,
    totalAtomPositions: 0,
    totalTriplePositions: 0,
    totalStaked: 0,
    verifiedPlatforms: []
  }
}

// ── Optimistic updates (Phase 4 wires these to deposit/redeem flows) ─────────

export function applyOptimisticPosition(
  _qc: QueryClient,
  _walletAddress: string,
  _termId: string,
  _delta: bigint
): void {
  // Phase 4 implementation. Stub keeps the SubscriptionManager and future
  // deposit hooks compiling without needing this yet.
}

export function clearOptimisticPosition(
  _qc: QueryClient,
  _walletAddress: string,
  _termId: string
): void {
  // Phase 4 implementation.
}
