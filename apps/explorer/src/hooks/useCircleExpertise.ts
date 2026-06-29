/**
 * useCircleexpertise — builds the Pro "Members & expertise" view-model.
 *
 * Real data:
 *   - `trustScore`  global credibility per member via `useEigentrustMap`
 *                   (MCP eigentrust, batch, ~0-100).
 *   - `marks` / `avail`  per-member signal count + Active/Quiet from the feed
 *                   (`useMemberActivity`).
 *   - `streak`      current consecutive daily-cert days (`useMemberStreaks`).
 *   - `expertiseByTopic`  per-topic activity derived from the feed's
 *                   `topicContexts`, normalised 0-100 against the circle's max
 *                   in that topic. A faithful proxy for the real per-topic
 *                   reputation score (swap in `useDerivedReputation` later).
 *
 * Placeholder (deterministic per wallet, until on-chain per-domain staking +
 * the trust-score formula exist): `stake`, `backers`, `peers`.
 */
import { useMemo } from 'react'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import type { CircleItem } from '@/services/circleService'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { useEigentrustMap } from '@/hooks/useEigentrustMap'
import { useMemberActivity } from '@/hooks/useMemberActivity'
import type { MemberStreaksResult } from '@/hooks/useMemberStreaks'
import type {
  ExpertiseRow,
  ExpertiseTopic,
  MemberDomain,
} from '@/types/circlePro'

interface TopicMeta {
  id: string
  label: string
  color: string
}

const TOPIC_MAP: ReadonlyMap<string, TopicMeta> = new Map(
  (SOFIA_TOPICS as TopicMeta[]).map((t) => [t.id, t]),
)

/** Number of "core contributors" surfaced (top-N by trust score). */
const CORE_COUNT = 4

/** Stable pseudo-random seed from a wallet — keeps mock backing deterministic. */
function seedFromWallet(wallet: string): number {
  let h = 0
  for (let i = 0; i < wallet.length; i++)
    h = (h * 31 + wallet.charCodeAt(i)) % 1_000_000
  return h
}

export interface UseCircleExpertiseArgs {
  members: TrustCircleAccount[]
  feedItems: CircleItem[]
  streaks: MemberStreaksResult
}

export interface UseCircleExpertiseResult {
  /** One row per member, carrying every metric the table/panel need. */
  rows: ExpertiseRow[]
  /** Topics the circle has activity in (desc by certs) — feeds the selector. */
  topics: ExpertiseTopic[]
  /** Resolve a topic slug → label/color (falls back to a neutral shape). */
  topicMeta: (slug: string) => TopicMeta
  /** A member's strongest domains, sorted desc, above `min`. */
  topDomains: (row: ExpertiseRow, n?: number, min?: number) => MemberDomain[]
  loading: boolean
}

export function useCircleExpertise({
  members,
  feedItems,
  streaks,
}: UseCircleExpertiseArgs): UseCircleExpertiseResult {
  const addresses = useMemo(
    () =>
      members
        .map((m) => m.walletAddress?.toLowerCase())
        .filter((w): w is string => !!w),
    [members],
  )

  const { byAddress: trustByAddress, loading: trustLoading } =
    useEigentrustMap(addresses)
  const activity = useMemberActivity(feedItems, members)

  // ── Per-topic activity: topic slug → (wallet → cert count) + circle max ──
  const { countsByTopic, maxByTopic, topicCerts } = useMemo(() => {
    const countsByTopic = new Map<string, Map<string, number>>()
    const topicCerts = new Map<string, number>()
    for (const item of feedItems) {
      const wallet = item.certifierAddress?.toLowerCase()
      if (!wallet) continue
      for (const slug of item.topicContexts ?? []) {
        let perWallet = countsByTopic.get(slug)
        if (!perWallet) {
          perWallet = new Map()
          countsByTopic.set(slug, perWallet)
        }
        perWallet.set(wallet, (perWallet.get(wallet) ?? 0) + 1)
        topicCerts.set(slug, (topicCerts.get(slug) ?? 0) + 1)
      }
    }
    const maxByTopic = new Map<string, number>()
    for (const [slug, perWallet] of countsByTopic) {
      maxByTopic.set(slug, Math.max(1, ...perWallet.values()))
    }
    return { countsByTopic, maxByTopic, topicCerts }
  }, [feedItems])

  const rows = useMemo<ExpertiseRow[]>(() => {
    const base = members.map((member): ExpertiseRow => {
      const wallet = member.walletAddress?.toLowerCase() ?? ''
      const marks = activity.signalsForMember(member)
      const active = activity.isActive(member)
      const seed = seedFromWallet(wallet || member.termId)

      // Feed-derived per-topic expertise, normalised 0-100.
      const expertiseByTopic = new Map<string, number>()
      for (const [slug, perWallet] of countsByTopic) {
        const c = wallet ? (perWallet.get(wallet) ?? 0) : 0
        if (c <= 0) continue
        const max = maxByTopic.get(slug) ?? 1
        expertiseByTopic.set(slug, Math.round((c / max) * 100))
      }

      return {
        member,
        wallet,
        trustScore: Math.round(wallet ? (trustByAddress.get(wallet) ?? 0) : 0),
        marks,
        streak: streaks.streakForMember(member) ?? 0,
        avail: active ? 'active' : marks > 0 ? 'quiet' : 'inactive',
        core: false,
        expertiseByTopic,
        // Deterministic placeholders (swap for on-chain backing later).
        stake: 200 + (seed % 4800),
        backers: 3 + (seed % 38),
        peers: 4 + (seed % 56),
      }
    })

    // Mark the top-N by trust score as core contributors.
    const byTrust = [...base].sort((a, b) => b.trustScore - a.trustScore)
    const coreWallets = new Set(
      byTrust.slice(0, CORE_COUNT).map((r) => r.member.termId),
    )
    for (const r of base) r.core = coreWallets.has(r.member.termId)
    return base
  }, [members, activity, countsByTopic, maxByTopic, trustByAddress, streaks])

  const topics = useMemo<ExpertiseTopic[]>(() => {
    return [...topicCerts.entries()]
      .map(([slug, certs]) => {
        const meta = TOPIC_MAP.get(slug)
        return {
          slug,
          label: meta?.label ?? slug,
          color: meta?.color ?? 'var(--ds-muted)',
          certs,
        }
      })
      .sort((a, b) => b.certs - a.certs)
  }, [topicCerts])

  const topicMeta = (slug: string): TopicMeta =>
    TOPIC_MAP.get(slug) ?? { id: slug, label: slug, color: 'var(--ds-muted)' }

  const topDomains = (row: ExpertiseRow, n = 3, min = 30): MemberDomain[] =>
    [...row.expertiseByTopic.entries()]
      .filter(([, level]) => level >= min)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([slug, level]) => {
        const meta = topicMeta(slug)
        return { slug, label: meta.label, color: meta.color, level }
      })

  return {
    rows,
    topics,
    topicMeta,
    topDomains,
    loading: trustLoading,
  }
}
