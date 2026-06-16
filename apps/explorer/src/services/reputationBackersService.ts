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
  /** How many of YOUR distinct claims (URLs) in this topic this account has
   *  staked behind. The "backs you the most" signal — a repeat backer who
   *  stands behind several of your calls weighs more than a one-off. */
  backCount: number
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
 * Per-topic backers: EVERY account that positioned strictly after the user on
 * the user's claims in that topic, deduped per topic and sorted by credibility
 * strongest-first. The count is pure indexer data (MCP-independent) so it's
 * stable across reloads; credibility is the displayed trust score (0 when the
 * engine doesn't know them) and weights the boost, not the count. ISO
 * timestamps compare lexicographically.
 */
export function computeBackersByTopic({
  accounts,
  certs,
  supportersByClaim,
  credibility,
  side = 'support',
}: ComputeBackersParams): BackersResult {
  const claims = asClaimMap(supportersByClaim)
  // topic → (address → { the backer + the set of YOUR claims they backed })
  const perTopic = new Map<
    string,
    Map<string, { backer: TopicBacker; claims: Set<string> }>
  >()
  // global distinct backers
  const all = new Map<string, number>()

  for (const cert of certs) {
    const claim = claims.get(cert.termId)
    if (!claim) continue
    const list = side === 'oppose' ? claim.oppose : claim.support
    if (list.length === 0) continue

    const followers = list.filter(
      (s) =>
        !accounts.has(s.account.toLowerCase()) &&
        s.createdAt > cert.certifiedAt,
    )
    if (followers.length === 0) continue

    for (const topic of cert.topicSlugs) {
      let m = perTopic.get(topic)
      if (!m) {
        m = new Map()
        perTopic.set(topic, m)
      }
      for (const f of followers) {
        // Every account that positioned after you is a backer — the COUNT is
        // pure indexer data, so it stays stable across reloads regardless of
        // the MCP. Credibility is just their displayed trust score (0 when the
        // engine doesn't know them yet); it weights the boost, not the count.
        const cred = credibility.get(f.account) ?? 0
        let entry = m.get(f.account)
        if (!entry) {
          entry = {
            backer: { address: f.account, credibility: cred, backCount: 0 },
            claims: new Set(),
          }
          m.set(f.account, entry)
        }
        // Tally distinct claims (URLs) of yours this account backs in this
        // topic — a backer standing behind several of your calls counts more.
        entry.claims.add(cert.termId)
        if (!all.has(f.account)) all.set(f.account, cred)
      }
    }
  }

  const byTopic = new Map<string, TopicBacker[]>()
  for (const [topic, m] of perTopic) {
    const list = [...m.values()].map(({ backer, claims: c }) => ({
      ...backer,
      backCount: c.size,
    }))
    // Ordered by who backs you the MOST (distinct claims), then by credibility
    // (the Trust-score tiebreak / "who lifts you most"). Repeat backers rise.
    list.sort(
      (a, b) => b.backCount - a.backCount || b.credibility - a.credibility,
    )
    byTopic.set(topic, list)
  }

  const creds = [...all.values()]
  const avgCredibility =
    creds.length > 0 ? creds.reduce((a, b) => a + b, 0) / creds.length : 0

  return { byTopic, backerCount: all.size, avgCredibility }
}
