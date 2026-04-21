/**
 * Derivations — pure functions that convert raw subscription payloads into
 * the shapes consumed by hooks (useTopicPositions, useUserProfile, etc.).
 *
 * The SubscriptionManager pipes WatchUserPositions payloads through each
 * derivation and writes the result under a canonical query key. Hooks read
 * from those keys with staleTime:Infinity instead of fetching themselves.
 *
 * applyOptimisticPosition / clearOptimisticPosition provide the write-side
 * API used by action hooks (useDeposit, redeemTopic) to nudge the cache
 * right after a tx is confirmed, before the indexer catches up.
 */

import type { QueryClient } from '@tanstack/react-query'
import type { WatchUserPositionsSubscription } from '@0xsofia/dashboard-graphql'
import {
  TOPIC_ATOM_IDS,
  CATEGORY_ATOM_IDS,
  ATOM_ID_TO_PLATFORM,
  ATOM_ID_TO_TOPIC,
  ATOM_ID_TO_CATEGORY,
} from '@/config/atomIds'

export type Position = NonNullable<WatchUserPositionsSubscription['positions']>[number]

// ── Query key builders (single source of truth) ─────────────────────────────

export const realtimeKeys = {
  positions: (wallet: string) => ['positions', wallet] as const,
  topicPositionsMap: (wallet: string) => ['topic-positions-map', wallet] as const,
  categoryPositionsMap: (wallet: string) => ['category-positions-map', wallet] as const,
  verifiedPlatforms: (wallet: string) => ['verified-platforms', wallet] as const,
  userProfileDerived: (wallet: string) => ['user-profile-derived', wallet] as const,
  userStats: (wallet: string) => ['user-stats', wallet] as const,
}

// ── Helpers ─────────────────────────────────────────────────────────────────
//
// We store shares as decimal strings in the cache — JSON.stringify throws on
// BigInt, which would silently break the React Query persister. Consumers
// read them back via sharesToBigInt() when they need arithmetic.

function toBigInt(v: unknown): bigint {
  if (typeof v === 'bigint') return v
  if (typeof v === 'number') return BigInt(Math.trunc(v))
  if (typeof v === 'string' && v.length > 0) {
    try { return BigInt(v) } catch { return 0n }
  }
  return 0n
}

export function sharesToBigInt(v: unknown): bigint {
  return toBigInt(v)
}

function addShares(a: string | undefined, b: unknown): string {
  return (toBigInt(a) + toBigInt(b)).toString()
}

// ── Topic / category positions (atom-direct) ────────────────────────────────

/**
 * Group shares by topic slug. Positions that target a topic atom directly
 * (not a triple) contribute to their slug's total.
 */
export function derivePositionsByTopic(positions: Position[]): Record<string, string> {
  const termIdToSlug = new Map<string, string>()
  for (const [slug, termId] of Object.entries(TOPIC_ATOM_IDS)) {
    termIdToSlug.set(termId, slug)
  }
  const byTopic: Record<string, string> = {}
  for (const p of positions) {
    if (!p.vault?.term?.atom) continue
    const slug = termIdToSlug.get(p.term_id)
    if (!slug) continue
    byTopic[slug] = addShares(byTopic[slug], p.shares)
  }
  return byTopic
}

/**
 * Group shares by category slug. Same logic as topics, different atom set.
 */
export function derivePositionsByCategory(positions: Position[]): Record<string, string> {
  const termIdToSlug = new Map<string, string>()
  for (const [slug, termId] of Object.entries(CATEGORY_ATOM_IDS)) {
    termIdToSlug.set(termId, slug)
  }
  const byCategory: Record<string, string> = {}
  for (const p of positions) {
    if (!p.vault?.term?.atom) continue
    const slug = termIdToSlug.get(p.term_id)
    if (!slug) continue
    byCategory[slug] = addShares(byCategory[slug], p.shares)
  }
  return byCategory
}

// ── Platform verifications (triple-based) ───────────────────────────────────

const VERIFIED_PREDICATE_RE = /has verified (\w+) id/i

/**
 * Platforms the user has verified, derived from triples whose predicate
 * matches "has verified {platform} id".
 */
export function deriveVerifiedPlatforms(positions: Position[]): string[] {
  const set = new Set<string>()
  for (const p of positions) {
    const predLabel = p.vault?.term?.triple?.predicate?.label
    if (!predLabel) continue
    const m = predLabel.match(VERIFIED_PREDICATE_RE)
    if (m?.[1]) set.add(m[1].toLowerCase())
  }
  return [...set]
}

/**
 * Platform-atom direct positions (e.g. a deposit on the "github" atom).
 * Keyed by platform slug from ATOM_ID_TO_PLATFORM.
 */
export function derivePositionsByPlatform(positions: Position[]): Record<string, string> {
  const byPlatform: Record<string, string> = {}
  for (const p of positions) {
    if (!p.vault?.term?.atom) continue
    const slug = ATOM_ID_TO_PLATFORM.get(p.term_id)
    if (!slug) continue
    byPlatform[slug] = addShares(byPlatform[slug], p.shares)
  }
  return byPlatform
}

// ── User profile / stats ────────────────────────────────────────────────────

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

/**
 * Shape consumed by useUserProfile — the same as profileService.UserProfileData
 * minus totalCertifications, which comes from a separate signals aggregate query
 * that still follows a pull pattern.
 */
export interface UserProfileDerived {
  positions: UserPositionView[]
  totalPositions: number
  totalAtomPositions: number
  totalStaked: number
  verifiedPlatforms: string[]
}

export function deriveUserProfile(positions: Position[]): UserProfileDerived {
  const views: UserPositionView[] = positions.map((p) => {
    const atom = p.vault?.term?.atom
    const triple = p.vault?.term?.triple
    return {
      termId: atom?.term_id ?? triple?.term_id ?? p.term_id,
      shares: String(p.shares ?? '0'),
      currentSharePrice: String(p.vault?.current_share_price ?? '0'),
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
      atomUrl: atom?.value?.thing?.url ?? undefined,
    }
  })

  const totalStaked =
    Math.round(
      positions.reduce((sum, p) => {
        const shares = parseFloat(String(p.shares ?? '0')) || 0
        const price = parseFloat(String(p.vault?.current_share_price ?? '0')) || 0
        return sum + (shares * price) / 1e18
      }, 0) * 100,
    ) / 100

  const atomCount = positions.filter(
    (p) => p.vault?.term?.atom && !p.vault?.term?.triple,
  ).length

  return {
    positions: views,
    totalPositions: positions.length,
    totalAtomPositions: atomCount,
    totalStaked,
    verifiedPlatforms: deriveVerifiedPlatforms(positions),
  }
}

// ── Optimistic updates ──────────────────────────────────────────────────────
//
// Applied client-side right after a tx is confirmed on-chain, so the UI
// reflects the change immediately instead of waiting the 1-3s indexer lag
// before the WS pushes the real state. When the WS eventually arrives, it
// overwrites the same query keys with authoritative values.

function bumpMap(
  qc: QueryClient,
  key: readonly unknown[],
  slug: string,
  delta: bigint,
): void {
  const current = (qc.getQueryData(key as unknown[]) as Record<string, string> | undefined) ?? {}
  const next = { ...current }
  const updated = toBigInt(next[slug]) + delta
  if (updated > 0n) next[slug] = updated.toString()
  else delete next[slug]
  qc.setQueryData(key as unknown[], next)
}

/**
 * Increment the appropriate per-slug share map after a successful deposit
 * (or decrement after a redeem). Delta is in whatever unit shares are
 * denominated in — the exact value doesn't matter for UI gating since
 * callers only check `> 0n`, and the WS will correct it within seconds.
 */
export function applyOptimisticPosition(
  qc: QueryClient,
  walletAddress: string,
  termId: string,
  delta: bigint,
): void {
  const wallet = walletAddress.toLowerCase()

  const topicSlug = ATOM_ID_TO_TOPIC.get(termId)
  if (topicSlug) {
    bumpMap(qc, realtimeKeys.topicPositionsMap(wallet), topicSlug, delta)
    return
  }
  const categorySlug = ATOM_ID_TO_CATEGORY.get(termId)
  if (categorySlug) {
    bumpMap(qc, realtimeKeys.categoryPositionsMap(wallet), categorySlug, delta)
    return
  }
  const platformSlug = ATOM_ID_TO_PLATFORM.get(termId)
  if (platformSlug) {
    bumpMap(qc, ['platform-positions-map', wallet], platformSlug, delta)
  }
  // Triples: we can't fabricate the vault/term shape from a termId alone,
  // so we fall through and let the WS push the real state.
}

/**
 * Clear the optimistic position for a termId (used after redeem).
 * bumpMap drops the key when the resulting value is <= 0n, so sending a
 * large negative delta achieves removal regardless of the current amount.
 */
export function clearOptimisticPosition(
  qc: QueryClient,
  walletAddress: string,
  termId: string,
): void {
  applyOptimisticPosition(qc, walletAddress, termId, -(1n << 255n))
}

export function deriveUserStats(positions: Position[]): UserStats {
  const tripleCount = positions.filter((p) => p.vault?.term?.triple).length
  const atomCount = positions.length - tripleCount
  const totalStaked =
    Math.round(
      positions.reduce((sum, p) => {
        const shares = parseFloat(String(p.shares ?? '0')) || 0
        const price = parseFloat(String(p.vault?.current_share_price ?? '0')) || 0
        return sum + (shares * price) / 1e18
      }, 0) * 100,
    ) / 100

  return {
    totalPositions: positions.length,
    totalAtomPositions: atomCount,
    totalTriplePositions: tripleCount,
    totalStaked,
    verifiedPlatforms: deriveVerifiedPlatforms(positions),
  }
}
