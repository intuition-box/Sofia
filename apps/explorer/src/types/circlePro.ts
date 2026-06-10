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

// ── Decisions (expertise-weighted voting) ──────────────────────────────────
// Mock until the on-chain decision lifecycle exists. Weight derives from a
// member's per-topic expertise — expertise-weighted, NOT token-weighted.

export type VoteChoice = 'yes' | 'no' | 'abstain'

export interface DecisionVoter {
  handle: string
  image?: string
  /** Expertise multiplier on the decision's topic (≥ 0.3). */
  weight: number
  vote: 'yes' | 'no'
}

export interface CircleDecision {
  id: string
  question: string
  topicSlug: string
  topicLabel: string
  topicColor: string
  author: string
  /** Days since posed. */
  ago: number
  /** Days until close. */
  closes: number
  /** Expertise-weighted split (percentages, sum 100). */
  weighted: { yes: number; no: number }
  /** Raw headcount split. */
  headcount: { yes: number; no: number }
  totalVoters: number
  /** Top voters by weight (preview). */
  voters: DecisionVoter[]
}

export interface QueueDecision {
  id: string
  question: string
  topicSlug: string
  topicLabel: string
  topicColor: string
  status: 'open' | 'closed'
  closes?: number
  voters: number
  result?: 'passed' | 'rejected'
  weighted?: { yes: number; no: number }
}

export interface CircleDecisionsData {
  decisions: CircleDecision[]
  queue: QueueDecision[]
  meta: { open: number; closed: number }
  /** Connected viewer's per-topic expertise level 0-100 (mock for now). */
  viewerExpertise: ReadonlyMap<string, number>
}
