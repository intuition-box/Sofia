/**
 * derivedReputationService — the core reputation calc.
 *
 * Reputation in a topic = the credibility of the accounts that took a position
 * AFTER you on claims you hold, in that topic. Pure functions over the two
 * data layers (claimSupportersService + eigentrustService).
 * See docs/reputation-curation.md.
 *
 *   repFromClaim(you, C) = Σ_{stakers after you on C}  credibility(staker)
 *   score(you, topic)    = Σ_{your claims C in topic}  repFromClaim(you, C)
 *
 * No Pioneer bonus, stake amount ignored, raw (no normalization). The support
 * side feeds positive reputation; the oppose side mirrors it (early credible
 * opposers of a debunked claim).
 */
import type { ClaimSupporters } from './claimSupportersService'

/**
 * Tolerate a rehydrated plain object as well as a Map. React Query persists to
 * localStorage via JSON, so a cached Map can come back as `{}`/an object across
 * reloads; normalizing here keeps the calc from ever throwing `.get is not a
 * function` and white-screening the page. See docs/reputation-curation.md.
 */
function asClaimMap(
  supportersByClaim:
    | ReadonlyMap<string, ClaimSupporters>
    | Record<string, ClaimSupporters>
    | null
    | undefined,
): ReadonlyMap<string, ClaimSupporters> {
  if (supportersByClaim instanceof Map) return supportersByClaim
  return new Map(Object.entries(supportersByClaim ?? {}))
}

/**
 * The minimal shape of one of the user's claims this calc needs.
 *
 * A "claim" is an `in context of` triple (one per topic) the user staked —
 * i.e. the vault a "like" deposits on (likes-only reputation). It is NOT the
 * cert triple: co-certifying the cert does not lift reputation, only liking
 * its topic does. See docs/reputation-likes-gap.md.
 */
export interface ReputationCert {
  /** Claim (context triple) term_id — the key into supportersByClaim. */
  termId: string
  /** The user's own position timestamp on the claim (ISO; earliest of their wallets). */
  certifiedAt: string
  /** Topic slug(s) this claim feeds — normally a single rolled-up topic. */
  topicSlugs: string[]
}

export type ReputationSide = 'support' | 'oppose'

interface ComputeParams {
  /** The user's wallet addresses, lowercased — excluded from "followers". */
  accounts: ReadonlySet<string>
  certs: readonly ReputationCert[]
  supportersByClaim: ReadonlyMap<string, ClaimSupporters>
  /** address → credibility weight (eigentrust/composite). */
  credibility: ReadonlyMap<string, number>
  side?: ReputationSide
}

/** Stakers who positioned strictly after the user, excluding the user's wallets. */
function followersAfter(
  list: ClaimSupporters['support'],
  accounts: ReadonlySet<string>,
  userTs: string,
) {
  return list.filter(
    (s) => !accounts.has(s.account.toLowerCase()) && s.createdAt > userTs,
  )
}

/**
 * Topic → reputation score. `side` picks support (default, positive rep) or
 * oppose (mirror). ISO timestamps compare lexicographically = chronologically.
 */
export function computeDerivedReputation({
  accounts,
  certs,
  supportersByClaim,
  credibility,
  side = 'support',
}: ComputeParams): Map<string, number> {
  const scoreByTopic = new Map<string, number>()
  const claims = asClaimMap(supportersByClaim)

  for (const cert of certs) {
    const claim = claims.get(cert.termId)
    if (!claim) continue
    const list = side === 'oppose' ? claim.oppose : claim.support
    if (list.length === 0) continue

    let rep = 0
    for (const f of followersAfter(list, accounts, cert.certifiedAt)) {
      rep += credibility.get(f.account) ?? 0
    }
    if (rep === 0) continue

    for (const topic of cert.topicSlugs) {
      scoreByTopic.set(topic, (scoreByTopic.get(topic) ?? 0) + rep)
    }
  }

  return scoreByTopic
}

/**
 * All follower addresses across the user's claims (both sides) — the set we
 * must fetch credibility for before computing. Cheap, runs client-side.
 */
export function collectFollowerAddresses({
  accounts,
  certs,
  supportersByClaim,
}: Pick<ComputeParams, 'accounts' | 'certs' | 'supportersByClaim'>): string[] {
  const out = new Set<string>()
  const claims = asClaimMap(supportersByClaim)
  for (const cert of certs) {
    const claim = claims.get(cert.termId)
    if (!claim) continue
    for (const side of [claim.support, claim.oppose]) {
      for (const f of followersAfter(side, accounts, cert.certifiedAt)) {
        out.add(f.account)
      }
    }
  }
  return [...out]
}
