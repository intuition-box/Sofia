// The leaderboard compute job.
//
// Ties the pieces together and writes one snapshot:
//   1. enumerate candidates (accounts holding cert positions)
//   2. per candidate: profile → reputation claims → ordered claim supporters
//      (accumulate the UNION of every follower address + the candidates
//      themselves — the addresses whose credibility we need)
//   3. fetch that credibility ONCE per unique address (the shared table — the
//      whole reason this is cheaper server-side than per-viewer)
//   4. score each candidate with the exact profile formula (A + B, summed over
//      all their active topics — no MAX_INTERESTS preview cap)
//   5. rank by overall score and replace the `__overall__` snapshot atomically
import {
  buildReputationClaims,
  collectFollowerAddresses,
  computeDerivedReputation,
  computeReputationProfile,
  type ClaimSupporters,
  type ReputationCert,
} from '@0xsofia/reputation'
import { prisma } from './db'
import { enumerateCandidates } from './graphql'
import { fetchCandidateProfile } from './profile'
import { fetchClaimSupporters } from './supporters'
import { fetchCredibility } from './mcp'

const OVERALL = '__overall__'

interface CandidateWork {
  wallet: string
  accounts: Set<string>
  claims: ReputationCert[]
  supportersByClaim: Map<string, ClaimSupporters>
  certCountsByTopic: Map<string, number>
  selectedTopics: string[]
}

export interface LeaderboardRunStats {
  candidates: number
  scored: number
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

  const certCountsByTopic = new Map<string, number>()
  for (const cert of profile.certs) {
    for (const slug of cert.topicSlugs) {
      certCountsByTopic.set(slug, (certCountsByTopic.get(slug) ?? 0) + 1)
    }
  }

  // Every topic the account is active in — owned raw-topic stakes + the topics
  // its certs are tagged with. No MAX_INTERESTS cap: the leaderboard reflects
  // the FULL reputation, not the profile's 3-slot preview.
  const selectedTopics = [
    ...new Set([...profile.ownedTopics, ...certCountsByTopic.keys()]),
  ]

  // Accumulate the addresses whose credibility we'll need: the followers who
  // staked after this account, plus the account itself (its own composite feeds
  // the trust bonus).
  for (const f of collectFollowerAddresses({
    accounts,
    certs: claims,
    supportersByClaim,
  })) {
    followerUnion.add(f)
  }
  followerUnion.add(wallet.toLowerCase())

  return {
    wallet: wallet.toLowerCase(),
    accounts,
    claims,
    supportersByClaim,
    certCountsByTopic,
    selectedTopics,
  }
}

function scoreCandidate(
  w: CandidateWork,
  credibility: Map<string, number>,
): number {
  const ownComposite = credibility.get(w.wallet) ?? 0
  // A — platform/trust/cert score. No OAuth in this phase (getStatus always
  // 'disconnected', signals {}), exactly like a public profile.
  const profile = computeReputationProfile(
    () => 'disconnected',
    w.selectedTopics,
    [],
    ownComposite,
    {},
    w.certCountsByTopic,
  )
  // B — credibility of followers who staked after this account, per topic.
  const derived = computeDerivedReputation({
    accounts: w.accounts,
    certs: w.claims,
    supportersByClaim: w.supportersByClaim,
    credibility,
  })

  let overall = 0
  for (const topic of profile?.topics ?? []) {
    overall += topic.score + (derived.get(topic.topicId) ?? 0)
  }
  return overall
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

  // Phase 4 — score.
  const scored = work.map((w) => ({
    wallet: w.wallet,
    score: scoreCandidate(w, credibility),
  }))

  // Phase 5 — rank + atomically replace the overall snapshot.
  scored.sort((a, b) => b.score - a.score)
  const computedAt = new Date()
  const rows = scored.map((s, i) => ({
    wallet: s.wallet,
    topicId: OVERALL,
    score: s.score,
    rank: i + 1,
    computedAt,
  }))

  await prisma.$transaction([
    prisma.reputationSnapshot.deleteMany({ where: { topicId: OVERALL } }),
    ...(rows.length > 0
      ? [prisma.reputationSnapshot.createMany({ data: rows })]
      : []),
  ])

  const stats: LeaderboardRunStats = {
    candidates: candidates.length,
    scored: scored.length,
    uniqueCredibilityAddresses: followerUnion.size,
    computedAt: computedAt.toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
  }
  console.log('[leaderboard] compute done', stats)
  return stats
}
