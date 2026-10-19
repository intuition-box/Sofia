/**
 * Derivations — pure functions that convert raw WS subscription payloads
 * into the shapes consumed by hooks (useTrustCircle, etc.).
 *
 * SubscriptionManager.onPositionsUpdate pipes WatchUserPositions payloads
 * through each derivation and writes the result under a canonical query
 * key. Hook consumers (Phase 3.B) read from those keys with
 * staleTime:Infinity instead of firing HTTP queries.
 *
 * All derivations are pure — given the same positions array they always
 * return the same output. Makes them trivially testable and cacheable.
 */

import type { WatchUserPositionsSubscription } from "@0xsofia/graphql"
import {
  PREDICATE_IDS
} from "~/lib/config/chainConfig"
import { INTENTION_PREDICATE_IDS as INTENTION_PREDICATE_IDS_ARRAY } from "~/lib/config/predicateConstants"

export type Position = NonNullable<
  WatchUserPositionsSubscription["positions"]
>[number]

// ── Query key builders (single source of truth) ─────────────────────────────
//
// Canonical keys written by SubscriptionManager.onPositionsUpdate (top-500
// user positions) and onTrackedPositionsUpdate (targeted atom subscriptions).
// Hook consumers (Phase 3.B) read from these keys with staleTime:Infinity
// instead of firing HTTP queries.

export const realtimeKeys = {
  // Core
  positions: (wallet: string) => ["positions", wallet] as const,
  userProfileDerived: (wallet: string) =>
    ["user-profile-derived", wallet] as const,
  userStats: (wallet: string) => ["user-stats", wallet] as const,

  // Sofia-specific derivations (Phase 3.A)
  trustCircle: (wallet: string) => ["trust-circle", wallet] as const,
  following: (wallet: string) => ["following", wallet] as const,
  followers: (wallet: string) => ["followers", wallet] as const,
  verifiedOAuthPlatforms: (wallet: string) =>
    ["verified-oauth-platforms", wallet] as const,
  intentionGroups: (wallet: string) => ["intention-groups", wallet] as const
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

function sharesToBigInt(v: unknown): bigint {
  return toBigInt(v)
}

function addShares(a: string | undefined, b: unknown): string {
  return (toBigInt(a) + toBigInt(b)).toString()
}

// ── Predicate filter helpers ────────────────────────────────────────────────

function getTriplePredicateId(p: Position): string | undefined {
  return p.vault?.term?.triple?.predicate?.term_id ?? undefined
}

function getTriplePredicateLabel(p: Position): string | undefined {
  return p.vault?.term?.triple?.predicate?.label ?? undefined
}

function hasPredicate(p: Position, predicateTermId: string): boolean {
  return getTriplePredicateId(p) === predicateTermId
}

const OAUTH_PREDICATE_IDS = new Set<string>([
  PREDICATE_IDS.MEMBER_OF,
  PREDICATE_IDS.OWNER_OF,
  PREDICATE_IDS.TOP_ARTIST,
  PREDICATE_IDS.TOP_TRACK,
  PREDICATE_IDS.AM
])

const INTENTION_PREDICATE_IDS = new Set<string>(INTENTION_PREDICATE_IDS_ARRAY)

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

// ── Trust circle ────────────────────────────────────────────────────────────

export interface TrustCircleEntry {
  tripleTermId: string
  accountTermId: string
  accountLabel: string
  shares: string
}

/**
 * Accounts the user trusts (has shares > 0 on a `trusts` triple). Multiple
 * positions per triple (one per curve) are aggregated into a single entry.
 */
export function deriveTrustCircle(positions: Position[]): TrustCircleEntry[] {
  const byTriple = new Map<string, TrustCircleEntry>()
  for (const p of positions) {
    if (!hasPredicate(p, PREDICATE_IDS.TRUSTS)) continue
    const triple = p.vault?.term?.triple
    if (!triple?.term_id || !triple.object?.term_id) continue
    const existing = byTriple.get(triple.term_id)
    if (existing) {
      existing.shares = addShares(existing.shares, p.shares)
    } else {
      byTriple.set(triple.term_id, {
        tripleTermId: triple.term_id,
        accountTermId: triple.object.term_id,
        accountLabel: triple.object.label ?? "",
        shares: String(p.shares ?? "0")
      })
    }
  }
  return Array.from(byTriple.values())
}

// ── Following ───────────────────────────────────────────────────────────────

export interface FollowingEntry {
  tripleTermId: string
  accountTermId: string
  accountLabel: string
  shares: string
}

/**
 * Accounts the user follows. Follow positions are scoped to curve_id=1
 * (linear curve) to match the convention used elsewhere in the app.
 */
export function deriveFollowing(positions: Position[]): FollowingEntry[] {
  const byTriple = new Map<string, FollowingEntry>()
  for (const p of positions) {
    if (!hasPredicate(p, PREDICATE_IDS.FOLLOW)) continue
    if (String(p.curve_id) !== "1") continue
    const triple = p.vault?.term?.triple
    if (!triple?.term_id || !triple.object?.term_id) continue
    const existing = byTriple.get(triple.term_id)
    if (existing) {
      existing.shares = addShares(existing.shares, p.shares)
    } else {
      byTriple.set(triple.term_id, {
        tripleTermId: triple.term_id,
        accountTermId: triple.object.term_id,
        accountLabel: triple.object.label ?? "",
        shares: String(p.shares ?? "0")
      })
    }
  }
  return Array.from(byTriple.values())
}

// ── Verified OAuth platforms ────────────────────────────────────────────────

/**
 * OAuth platforms the user has verified, derived from triples whose predicate
 * is one of MEMBER_OF / OWNER_OF / TOP_ARTIST / TOP_TRACK / AM.
 * Returns lowercased predicate labels ("member_of", "top_artist", ...).
 */
export function deriveVerifiedOAuthPlatforms(positions: Position[]): string[] {
  const set = new Set<string>()
  for (const p of positions) {
    const predicateId = getTriplePredicateId(p)
    if (!predicateId || !OAUTH_PREDICATE_IDS.has(predicateId)) continue
    const label = getTriplePredicateLabel(p)
    if (label) set.add(label.toLowerCase())
  }
  return [...set]
}

// ── Intention groups (by URL) ───────────────────────────────────────────────

export interface IntentionGroupEntry {
  url: string
  domain: string
  intentions: string[]
  totalShares: string
}

/**
 * Groups user's intention certifications by the target URL. Each entry
 * lists the intention predicates that apply ("visits for work", etc.)
 * plus the total shares across all those positions. What
 * useOnChainIntentionGroups consumes to render the Echoes list.
 */
export function deriveIntentionGroups(
  positions: Position[]
): IntentionGroupEntry[] {
  const byUrl = new Map<string, IntentionGroupEntry>()
  for (const p of positions) {
    const predicateId = getTriplePredicateId(p)
    if (!predicateId || !INTENTION_PREDICATE_IDS.has(predicateId)) continue
    const object = p.vault?.term?.triple?.object
    const url = object?.value?.thing?.url ?? object?.label
    if (!url) continue
    const domain = extractDomain(url)
    const predicateLabel = getTriplePredicateLabel(p) ?? "unknown"
    const existing = byUrl.get(url)
    if (existing) {
      if (!existing.intentions.includes(predicateLabel)) {
        existing.intentions.push(predicateLabel)
      }
      existing.totalShares = addShares(existing.totalShares, p.shares)
    } else {
      byUrl.set(url, {
        url,
        domain,
        intentions: [predicateLabel],
        totalShares: String(p.shares ?? "0")
      })
    }
  }
  return Array.from(byUrl.values())
}

// ── User profile / stats (real implementations) ─────────────────────────────

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

export function deriveUserStats(positions: Position[]): UserStats {
  const tripleCount = positions.filter((p) => p.vault?.term?.triple).length
  const atomCount = positions.length - tripleCount
  const totalStaked =
    Math.round(
      positions.reduce((sum, p) => {
        const shares = parseFloat(String(p.shares ?? "0")) || 0
        const price =
          parseFloat(String(p.vault?.current_share_price ?? "0")) || 0
        return sum + (shares * price) / 1e18
      }, 0) * 100
    ) / 100
  return {
    totalPositions: positions.length,
    totalAtomPositions: atomCount,
    totalTriplePositions: tripleCount,
    totalStaked,
    verifiedPlatforms: deriveVerifiedOAuthPlatforms(positions)
  }
}

export function deriveUserProfile(
  positions: Position[]
): UserProfileDerived {
  const views: UserPositionView[] = positions.map((p) => {
    const atom = p.vault?.term?.atom
    const triple = p.vault?.term?.triple
    return {
      termId: atom?.term_id ?? triple?.term_id ?? p.term_id,
      shares: String(p.shares ?? "0"),
      currentSharePrice: String(p.vault?.current_share_price ?? "0"),
      isTriple: !!triple,
      predicateLabel: triple?.predicate?.label ?? undefined,
      objectLabel: triple?.object?.label ?? atom?.label ?? undefined,
      objectUrl:
        triple?.object?.value?.thing?.url ??
        atom?.value?.thing?.url ??
        undefined,
      tripleSubjectId: triple?.subject?.term_id,
      tripleObjectId: triple?.object?.term_id,
      atomLabel: atom?.label ?? undefined,
      atomUrl: atom?.value?.thing?.url ?? undefined
    }
  })

  const stats = deriveUserStats(positions)
  return {
    positions: views,
    totalPositions: stats.totalPositions,
    totalAtomPositions: stats.totalAtomPositions,
    totalStaked: stats.totalStaked,
    verifiedPlatforms: stats.verifiedPlatforms
  }
}

