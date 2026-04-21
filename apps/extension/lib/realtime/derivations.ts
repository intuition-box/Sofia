/**
 * Derivations — pure functions that convert raw WS subscription payloads
 * into the shapes consumed by hooks (useTrustCircle, useFollowing, etc.).
 *
 * SubscriptionManager.onPositionsUpdate pipes WatchUserPositions payloads
 * through each derivation and writes the result under a canonical query
 * key. Hook consumers (Phase 3.B) read from those keys with
 * staleTime:Infinity instead of firing HTTP queries.
 *
 * All derivations are pure — given the same positions array they always
 * return the same output. Makes them trivially testable and cacheable.
 */

import type { QueryClient } from "@tanstack/react-query"
import type { WatchUserPositionsSubscription } from "@0xsofia/graphql"
import {
  DAILY_CERTIFICATION_ATOM_ID,
  DAILY_STREAK_STAKE,
  DAILY_VOTE_ATOM_ID,
  DAILY_VOTE_STAKE,
  GLOBAL_STAKE,
  PREDICATE_IDS
} from "~/lib/config/chainConfig"

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
  dailyStreak: (wallet: string) => ["daily-streak", wallet] as const,
  verifiedOAuthPlatforms: (wallet: string) =>
    ["verified-oauth-platforms", wallet] as const,
  intentionGroups: (wallet: string) => ["intention-groups", wallet] as const,
  globalStakePosition: (wallet: string) =>
    ["global-stake-position", wallet] as const,

  // Legacy Explorer keys — kept for SubscriptionManager compat. Sofia doesn't
  // map topics/categories/platforms the same way; may be removed in cleanup
  // once we're sure no consumer references them.
  topicPositionsMap: (wallet: string) =>
    ["topic-positions-map", wallet] as const,
  categoryPositionsMap: (wallet: string) =>
    ["category-positions-map", wallet] as const,
  platformPositionsMap: (wallet: string) =>
    ["platform-positions-map", wallet] as const,
  verifiedPlatforms: (wallet: string) =>
    ["verified-platforms", wallet] as const
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

const INTENTION_PREDICATE_IDS = new Set<string>([
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING,
  PREDICATE_IDS.VISITS_FOR_MUSIC
])

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

// ── Daily streak status ─────────────────────────────────────────────────────

export interface DailyStreakStatus {
  /** True if the user currently has shares > 0 on the daily-certification atom. */
  certifiedToday: boolean
  /** True if the user currently has shares > 0 on the daily-vote atom. */
  votedToday: boolean
  certificationShares: string
  voteShares: string
}

/**
 * Phase 3.A scope: live quest completion status (boolean "did I do it today?").
 * The full streak count (consecutive days) stays HTTP for now — it's computed
 * from deposits history, which isn't part of the positions subscription.
 *
 * Requires DAILY_CERTIFICATION_ATOM_ID and DAILY_VOTE_ATOM_ID to be in
 * TRACKED_TERM_IDS so low-share positions (1 TRUST minimum) aren't dropped
 * by Hasura's top-500 cap.
 */
export function deriveDailyStreak(positions: Position[]): DailyStreakStatus {
  const cert = positions.find((p) => p.term_id === DAILY_CERTIFICATION_ATOM_ID)
  const vote = positions.find((p) => p.term_id === DAILY_VOTE_ATOM_ID)
  return {
    certifiedToday: !!cert && sharesToBigInt(cert.shares) > 0n,
    votedToday: !!vote && sharesToBigInt(vote.shares) > 0n,
    certificationShares: String(cert?.shares ?? "0"),
    voteShares: String(vote?.shares ?? "0")
  }
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

// ── Global stake position ───────────────────────────────────────────────────

export interface GlobalStakePositionView {
  shares: string
  hasPosition: boolean
}

/**
 * User's position on the Beta season global stake atom. The GLOBAL_STAKE.TERM_ID
 * must be in TRACKED_TERM_IDS so we receive updates regardless of whether
 * this position is in the user's top-500 by shares.
 */
export function deriveGlobalStakePosition(
  positions: Position[]
): GlobalStakePositionView {
  const p = positions.find((pos) => pos.term_id === GLOBAL_STAKE.TERM_ID)
  return {
    shares: String(p?.shares ?? "0"),
    hasPosition: !!p && sharesToBigInt(p.shares) > 0n
  }
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

// ── Explorer-legacy stubs (kept for SubscriptionManager compat) ─────────────
// Sofia doesn't model topics/categories/platforms the same way. These stubs
// let the manager's onTrackedPositionsUpdate still write to these keys
// without breaking anything — returns are empty, consumers would see nothing.
// Candidate for removal once we're confident no consumer references them.

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

export function deriveVerifiedPlatforms(positions: Position[]): string[] {
  // Alias to the OAuth version — Sofia's "verified platforms" concept IS OAuth.
  return deriveVerifiedOAuthPlatforms(positions)
}

// ── Optimistic updates ──────────────────────────────────────────────────────
//
// Applied client-side right after the user clicks an action, so the UI
// reflects the change in 0ms instead of waiting the 3-5s indexer lag
// before the WS pushes the real state. When the WS eventually arrives,
// it overwrites the same query key with the authoritative value (in
// practice identical to the optimistic one for daily streak, so it's
// effectively a no-op refresh).

export type DailyStreakKind = "cert" | "vote"

/**
 * Flip the daily-streak cache key to reflect a fresh cert/vote deposit.
 * Returns a rollback function that restores the previous snapshot — call
 * it from the transaction's catch block if the TX fails or the user
 * cancels.
 *
 * Usage:
 *   const rollback = applyOptimisticDailyStreak(qc, wallet, "cert")
 *   try { await claimTx() } catch (err) { rollback(); throw err }
 */
export function applyOptimisticDailyStreak(
  qc: QueryClient,
  walletAddress: string,
  kind: DailyStreakKind
): () => void {
  const wallet = walletAddress.toLowerCase()
  const key = realtimeKeys.dailyStreak(wallet)
  const previous = qc.getQueryData<DailyStreakStatus>(key)

  // Use the chainConfig stake constants as the optimistic share amount.
  // When the WS overwrites this shortly after, the real value will be
  // equivalent (same stake, same atom) — effectively a no-op refresh.
  const baseline: DailyStreakStatus = previous ?? {
    certifiedToday: false,
    votedToday: false,
    certificationShares: "0",
    voteShares: "0"
  }

  const next: DailyStreakStatus = {
    ...baseline,
    ...(kind === "cert"
      ? {
          certifiedToday: true,
          certificationShares: DAILY_STREAK_STAKE.toString()
        }
      : {
          votedToday: true,
          voteShares: DAILY_VOTE_STAKE.toString()
        })
  }

  qc.setQueryData<DailyStreakStatus>(key, next)

  return () => {
    // Restore the exact snapshot we had before the optimistic apply.
    // If previous was undefined (first action of the session), remove
    // the entry so consumers fall back to their own defaults.
    if (previous === undefined) {
      qc.removeQueries({ queryKey: key, exact: true })
    } else {
      qc.setQueryData<DailyStreakStatus>(key, previous)
    }
  }
}

/**
 * Explicit clear without the rollback-closure dance. Prefer the rollback
 * returned by applyOptimisticDailyStreak — it restores the previous
 * snapshot instead of forcing certifiedToday/votedToday back to false
 * (which would be wrong if the user had already acted earlier today).
 */
export function clearOptimisticDailyStreak(
  qc: QueryClient,
  walletAddress: string
): void {
  const wallet = walletAddress.toLowerCase()
  qc.removeQueries({ queryKey: realtimeKeys.dailyStreak(wallet), exact: true })
}

// ── Legacy placeholders (Phase 3.B v2 can fill these in) ────────────────────

export function applyOptimisticPosition(
  _qc: QueryClient,
  _walletAddress: string,
  _termId: string,
  _delta: bigint
): void {
  // Generic variant deferred — requires per-termId routing (topic /
  // category / platform / triple) that Sofia's atom model doesn't neatly
  // cover. Phase 3.B v2 should implement alongside the hook migrations.
}

export function clearOptimisticPosition(
  _qc: QueryClient,
  _walletAddress: string,
  _termId: string
): void {
  // Same as above.
}
