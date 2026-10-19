// The leaderboard compute job.
//
// Ties the pieces together and writes ONE snapshot of per-bucket scores:
//   1. enumerate candidates (accounts holding cert positions)
//   2. per candidate: profile → reputation claims → ordered claim supporters
//      (accumulate the UNION of every follower address + the candidates
//      themselves — the addresses whose credibility we need)
//   3. fetch that credibility ONCE per unique address (the shared table — the
//      whole reason this is cheaper server-side than per-viewer)
//   4. score each candidate PER TOPIC with the exact profile formula
//      (A computeReputationProfile + B computeDerivedReputation), and fold the
//      non-topic cert points into reserved buckets (general / trusts / distrust)
//      so a client can sum buckets → the profile's total, un-derived server-side
//   5. rank within each bucket and replace the snapshot atomically
import {
  buildReputationClaims,
  collectFollowerAddresses,
  computeDerivedReputation,
  computeReputationProfile,
  POINTS_PER_CERT,
  type ClaimSupporters,
  type ReputationCert,
} from '@0xsofia/reputation'
import { prisma } from './db'
import { enumerateCandidates } from './graphql'
import { fetchCandidateProfile, type ProfileCert } from './profile'
import { fetchClaimSupporters } from './supporters'
import { fetchCredibility } from './mcp'

// Reserved bucket ids for the non-topic cert points (trust/distrust are never
// topic-scoped; general = taggable certs with no `in context of` triple yet).
// A client sums a wallet's rows across ALL buckets to get the overall total.
export const GENERAL = '__general__'
export const TRUSTS = '__trusts__'
export const DISTRUST = '__distrust__'

// Taggable predicate labels — mirrors the explorer's useUserCertCounts scope.
// Trust/distrust are excluded (their own buckets); the legacy trailing-space
// variant collapses here because we trim before matching.
const TAGGABLE_LABELS = new Set([
  'visits for work',
  'visits for learning',
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
])

interface CertCounts {
  byTopic: Map<string, number>
  general: number
  trusted: number
  distrusted: number
}

/** Split an account's certs into topic / general / trust / distrust counts —
 *  the exact buckets the explorer's useUserCertCounts produces. */
function splitCertCounts(certs: readonly ProfileCert[]): CertCounts {
  const byTopic = new Map<string, number>()
  let general = 0
  let trusted = 0
  let distrusted = 0
  for (const cert of certs) {
    const label = cert.intention.trim().toLowerCase()
    if (label === 'trusts') {
      trusted += 1
      continue
    }
    if (label === 'distrust') {
      distrusted += 1
      continue
    }
    if (cert.topicSlugs.length === 0) {
      if (TAGGABLE_LABELS.has(label)) general += 1
      continue
    }
    for (const slug of cert.topicSlugs) {
      byTopic.set(slug, (byTopic.get(slug) ?? 0) + 1)
    }
  }
  return { byTopic, general, trusted, distrusted }
}

interface CandidateWork {
  wallet: string
  accounts: Set<string>
  claims: ReputationCert[]
  supportersByClaim: Map<string, ClaimSupporters>
  counts: CertCounts
  selectedTopics: string[]
}

interface ScoreRow {
  wallet: string
  topicId: string
  score: number
}

export interface LeaderboardRunStats {
  candidates: number
  scored: number
  rows: number
  uniqueCredibilityAddresses: number
  computedAt: string
  durationMs: number
}

async function gatherCandidateWork(
  wallet: string,
  followerUnion: Set<string>,
): Promise<CandidateWork> {
  const profile = await fetchCandidateProfile(wallet)
  const claims = buildReputationClaims({
    certs: profile.certs,
    contextAdditions: profile.contextAdditions,
  })
  const supportersByClaim = await fetchClaimSupporters(claims.map((c) => c.termId))
  const accounts = new Set([wallet.toLowerCase()])
  const counts = splitCertCounts(profile.certs)

  // Every topic the account is active in — owned raw-topic stakes + the topics
  // its certs are tagged with. No MAX_INTERESTS cap: per-topic rankings need the
  // full set, and the derived overall must cover all of it.
  const selectedTopics = [
    ...new Set([...profile.ownedTopics, ...counts.byTopic.keys()]),
  ]

  for (const f of collectFollowerAddresses({
    accounts,
    certs: claims,
    supportersByClaim,
  })) {
    followerUnion.add(f)
  }
  followerUnion.add(wallet.toLowerCase())

  return { wallet: wallet.toLowerCase(), accounts, claims, supportersByClaim, counts, selectedTopics }
}

/** Per-bucket score rows for one candidate (topic rows + the reserved
 *  general/trusts/distrust buckets). Zero-score buckets are omitted. */
function candidateRows(
  w: CandidateWork,
  credibility: Map<string, number>,
): ScoreRow[] {
  const ownComposite = credibility.get(w.wallet) ?? 0
  const profile = computeReputationProfile(
    () => 'disconnected',
    w.selectedTopics,
    [],
    ownComposite,
    {},
    w.counts.byTopic,
  )
  const derived = computeDerivedReputation({
    accounts: w.accounts,
    certs: w.claims,
    supportersByClaim: w.supportersByClaim,
    credibility,
  })

  const rows: ScoreRow[] = []
  for (const topic of profile?.topics ?? []) {
    const score = topic.score + (derived.get(topic.topicId) ?? 0)
    if (score > 0) rows.push({ wallet: w.wallet, topicId: topic.topicId, score })
  }
  // Non-topic cert points → reserved buckets (mirrors the profile total's
  // generalScore + trustDistrustScore terms).
  const general = w.counts.general * POINTS_PER_CERT
  const trusts = w.counts.trusted * POINTS_PER_CERT
  const distrust = w.counts.distrusted * POINTS_PER_CERT
  if (general > 0) rows.push({ wallet: w.wallet, topicId: GENERAL, score: general })
  if (trusts > 0) rows.push({ wallet: w.wallet, topicId: TRUSTS, score: trusts })
  if (distrust > 0) rows.push({ wallet: w.wallet, topicId: DISTRUST, score: distrust })
  return rows
}

export async function computeLeaderboard(): Promise<LeaderboardRunStats> {
  const startedAt = performance.now()
  const candidates = await enumerateCandidates()

  // Phase 1+2 — gather per-candidate work and the credibility address union.
  const followerUnion = new Set<string>()
  const work: CandidateWork[] = []
  for (const wallet of candidates) {
    try {
      work.push(await gatherCandidateWork(wallet, followerUnion))
    } catch (err) {
      console.error(`[leaderboard] candidate ${wallet} failed`, err)
    }
  }

  // Phase 3 — shared credibility table: one MCP call per unique address.
  const credibility = await fetchCredibility([...followerUnion])

  // Phase 4 — per-bucket rows for every candidate.
  const allRows = work.flatMap((w) => candidateRows(w, credibility))

  // Phase 5 — rank within each bucket, then replace the snapshot atomically.
  const byBucket = new Map<string, ScoreRow[]>()
  for (const r of allRows) {
    const arr = byBucket.get(r.topicId) ?? []
    arr.push(r)
    byBucket.set(r.topicId, arr)
  }
  const computedAt = new Date()
  const data: {
    wallet: string
    topicId: string
    score: number
    rank: number
    computedAt: Date
  }[] = []
  for (const [, arr] of byBucket) {
    arr.sort((a, b) => b.score - a.score)
    arr.forEach((r, i) =>
      data.push({ wallet: r.wallet, topicId: r.topicId, score: r.score, rank: i + 1, computedAt }),
    )
  }

  await prisma.$transaction([
    prisma.reputationSnapshot.deleteMany({}),
    ...(data.length > 0 ? [prisma.reputationSnapshot.createMany({ data })] : []),
  ])

  const stats: LeaderboardRunStats = {
    candidates: candidates.length,
    scored: work.length,
    rows: data.length,
    uniqueCredibilityAddresses: followerUnion.size,
    computedAt: computedAt.toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
  }
  console.log('[leaderboard] compute done', stats)
  return stats
}
