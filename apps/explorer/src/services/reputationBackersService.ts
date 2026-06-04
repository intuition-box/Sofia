/**
 * reputationBackersService — WHO lifted your reputation, per topic.
 *
 * The boost in a topic (see `derivedReputationService`) is the summed
 * credibility of the accounts that staked AFTER you on your claims in that
 * topic. This service exposes the underlying list — the actual backers + their
 * credibility — so the /scores page can show the "lifted by" story, not just
 * the aggregate number. Pure functions over the same two data layers
 * (claimSupportersService + eigentrustService); no new fetches.
 */
import type { ClaimSupporters } from './claimSupportersService'
import type { ReputationCert, ReputationSide } from './derivedReputationService'

export interface TopicBacker {
  /** Backer wallet address (lowercased). */
  address: string
  /** Global credibility weight (eigentrust/composite), 0..1-ish. */
  credibility: number
}

interface ComputeBackersParams {
  accounts: ReadonlySet<string>
  certs: readonly ReputationCert[]
  supportersByClaim:
    | ReadonlyMap<string, ClaimSupporters>
    | Record<string, ClaimSupporters>
    | null
    | undefined
  credibility: ReadonlyMap<string, number>
  side?: ReputationSide
}

/** React Query persists Maps to localStorage as plain objects — normalize. */
function asClaimMap(
  supportersByClaim: ComputeBackersParams['supportersByClaim'],
): ReadonlyMap<string, ClaimSupporters> {
  if (supportersByClaim instanceof Map) return supportersByClaim
  return new Map(Object.entries(supportersByClaim ?? {}))
}

export interface BackersResult {
  /** topic slug → backers (deduped, credibility desc). */
  byTopic: Map<string, TopicBacker[]>
  /** Distinct backers across every topic. */
  backerCount: number
  /** Mean credibility of those distinct backers (0 when none). */
  avgCredibility: number
}

/**
 * Per-topic backers: the accounts that positioned strictly after the user on
 * the user's claims in that topic, with credibility > 0, deduped per topic and
 * sorted strongest-first. ISO timestamps compare lexicographically.
 */
export function computeBackersByTopic({
  accounts,
  certs,
  supportersByClaim,
  credibility,
  side = 'support',
}: ComputeBackersParams): BackersResult {
  const claims = asClaimMap(supportersByClaim)
  // topic → (address → credibility)
  const perTopic = new Map<string, Map<string, number>>()
  // global distinct backers
  const all = new Map<string, number>()

  for (const cert of certs) {
    const claim = claims.get(cert.termId)
    if (!claim) continue
    const list = side === 'oppose' ? claim.oppose : claim.support
    if (list.length === 0) continue

    const followers = list.filter(
      (s) =>
        !accounts.has(s.account.toLowerCase()) && s.createdAt > cert.certifiedAt,
    )
    if (followers.length === 0) continue

    for (const topic of cert.topicSlugs) {
      let m = perTopic.get(topic)
      if (!m) {
        m = new Map()
        perTopic.set(topic, m)
      }
      for (const f of followers) {
        const cred = credibility.get(f.account) ?? 0
        if (cred <= 0) continue
        if (!m.has(f.account)) m.set(f.account, cred)
        if (!all.has(f.account)) all.set(f.account, cred)
      }
    }
  }

  const byTopic = new Map<string, TopicBacker[]>()
  for (const [topic, m] of perTopic) {
    byTopic.set(
      topic,
      [...m]
        .map(([address, c]) => ({ address, credibility: c }))
        .sort((a, b) => b.credibility - a.credibility),
    )
  }

  const creds = [...all.values()]
  const avgCredibility =
    creds.length > 0 ? creds.reduce((a, b) => a + b, 0) / creds.length : 0

  return { byTopic, backerCount: all.size, avgCredibility }
}
