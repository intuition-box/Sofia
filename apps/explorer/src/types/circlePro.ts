/**
 * circlePro — view-model types for the Pro (paid) DAO circle surface:
 * the "Members & expertise" table and the weighted "Decisions" room.
 *
 * Most fields are sourced from REAL data (eigentrust trust score, feed-derived
 * per-topic activity, streaks). The backing/peer fields are deterministic
 * placeholders until on-chain per-domain staking + the trust-score formula
 * land — see `useCircleExpertise`. The shapes are intentionally generic so the
 * real values can swap in without touching the components.
 */
import type { Availability } from '@0xsofia/design-system'
import type { TrustCircleAccount } from '@/services/trustCircleService'

/** A topic the circle has activity in (for the treemap selector + chips). */
export interface ExpertiseTopic {
  slug: string
  label: string
  color: string
  /** Total certifications in this topic across the circle (feed-derived). */
  certs: number
}

/** One of a member's strongest domains (label/color resolved, level 0-100). */
export interface MemberDomain {
  slug: string
  label: string
  color: string
  level: number
}

/** A single row of the Members & expertise table. */
export interface ExpertiseRow {
  member: TrustCircleAccount
  /** Lowercased wallet (empty string when the member has none). */
  wallet: string
  /** Global credibility 0-100 (real eigentrust; 0 when unknown). */
  trustScore: number
  /** Total signals certified across the loaded feed (real). */
  marks: number
  /** Current consecutive daily-certification streak (real; 0 when none). */
  streak: number
  /** Activity state derived from recent feed activity. */
  avail: Availability
  /** Top contributor of the circle (top-N by trust score). */
  core: boolean
  /** Per-topic expertise level 0-100 (feed-derived proxy). */
  expertiseByTopic: ReadonlyMap<string, number>
  // ── Domain-mode backing (deterministic placeholder until on-chain) ──
  /** TRUST backing this member has received (domain-scoped staking). */
  stake: number
  /** Distinct backers behind this member. */
  backers: number
  /** Peer confirmations. */
  peers: number
}
