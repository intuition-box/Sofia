import { describe, it, expect } from 'vitest'

import { computeBackersByTopic } from '@/services/reputationBackersService'
import type { ReputationCert } from '@/services/derivedReputationService'
import type {
  ClaimSupporters,
  ClaimStaker,
} from '@/services/claimSupportersService'

// ── Fixtures (mirrors derivedReputationService.test.ts) ──
// computeBackersByTopic keys credibility by the RAW account string and only
// lowercases for the own-wallet exclusion, so credibility addresses below are
// already lowercase to match the staker `account` values.
const ALICE = '0xaaa'
const BOB = '0xbbb'
const CAROL = '0xccc'
const DAVE = '0xddd'
const SYBIL = '0xs1b11'

// Credibility (eigentrust) map. SYBIL absent → contributes 0 → excluded.
const cred = new Map<string, number>([
  [BOB, 0.5],
  [CAROL, 0.2],
  [DAVE, 0.9],
])

const staker = (account: string, createdAt: string): ClaimStaker => ({
  account,
  createdAt,
  shares: '1',
})

const claim = (
  support: ClaimStaker[],
  oppose: ClaimStaker[] = [],
): ClaimSupporters => ({ support, oppose })

const accounts = (...addrs: string[]) =>
  new Set(addrs.map((a) => a.toLowerCase()))

const cert = (
  termId: string,
  certifiedAt: string,
  topicSlugs: string[],
): ReputationCert => ({ termId, certifiedAt, topicSlugs })

describe('computeBackersByTopic', () => {
  it('lists the credible accounts that backed after the user, per topic', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(BOB, 't2'), staker(CAROL, 't3')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
      { address: CAROL, credibility: 0.2 },
    ])
  })

  it('sorts backers within a topic by credibility descending', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        // CAROL (0.2) positions before DAVE (0.9), but DAVE must sort first.
        claim([staker(ALICE, 't1'), staker(CAROL, 't2'), staker(DAVE, 't3')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.get('tech')?.map((b) => b.address)).toEqual([
      DAVE,
      CAROL,
    ])
  })

  it('excludes pre-user and equal-timestamp stakers (strict after-user)', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        // DAVE before user, BOB exactly at user time, CAROL strictly after.
        claim([staker(DAVE, 't1'), staker(BOB, 't2'), staker(CAROL, 't3')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(BOB),
      certs: [cert('c1', 't2', ['tech'])], // user = BOB at t2
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: CAROL, credibility: 0.2 },
    ])
  })

  it("excludes the user's own wallets (multi-wallet)", () => {
    const supportersByClaim = new Map([
      [
        'c1',
        // ALICE + DAVE are the same user; DAVE staked after but must NOT count.
        claim([staker(ALICE, 't1'), staker(DAVE, 't2'), staker(BOB, 't3')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE, DAVE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
    ])
  })

  it('includes zero / unknown-credibility backers (count is MCP-independent)', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(SYBIL, 't2'), staker(BOB, 't3')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred, // SYBIL absent → 0, but still listed (sorted last)
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
      { address: SYBIL, credibility: 0 },
    ])
    expect(result.backerCount).toBe(2)
  })

  it('dedupes a backer who appears across multiple claims of one topic', () => {
    const supportersByClaim = new Map([
      ['c1', claim([staker(ALICE, 't1'), staker(BOB, 't2')])],
      ['c2', claim([staker(ALICE, 't1'), staker(BOB, 't2')])],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech']), cert('c2', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    // BOB backs two claims in 'tech' but appears once.
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
    ])
    expect(result.backerCount).toBe(1)
  })

  it('counts a backer once globally even across different topics', () => {
    const supportersByClaim = new Map([
      ['c1', claim([staker(ALICE, 't1'), staker(BOB, 't2')])],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech', 'web3'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
    ])
    expect(result.byTopic.get('web3')).toEqual([
      { address: BOB, credibility: 0.5 },
    ])
    // Distinct backer count is global, so BOB counts once despite two topics.
    expect(result.backerCount).toBe(1)
  })

  it('averages credibility over distinct backers only', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(BOB, 't2'), staker(CAROL, 't3')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.backerCount).toBe(2)
    expect(result.avgCredibility).toBeCloseTo((0.5 + 0.2) / 2) // 0.35
  })

  it('reads the oppose side when side="oppose"', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1')], [staker(ALICE, 't1'), staker(BOB, 't2')]),
      ],
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
      side: 'oppose',
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
    ])
  })

  it('normalizes a plain-object claim map (React Query localStorage round-trip)', () => {
    // After JSON persistence a Map becomes a plain object — must still work.
    const supportersByClaim: Record<string, ClaimSupporters> = {
      c1: claim([staker(ALICE, 't1'), staker(BOB, 't2')]),
    }
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.get('tech')).toEqual([
      { address: BOB, credibility: 0.5 },
    ])
  })

  it('returns an empty result for null/undefined supporters', () => {
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim: null,
      credibility: cred,
    })
    expect(result.byTopic.size).toBe(0)
    expect(result.backerCount).toBe(0)
    expect(result.avgCredibility).toBe(0)
  })

  it('returns an empty result when no follower stakes exist', () => {
    const supportersByClaim = new Map([
      ['c1', claim([staker(ALICE, 't1')])], // only the user, no followers
    ])
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(result.byTopic.size).toBe(0)
    expect(result.backerCount).toBe(0)
    expect(result.avgCredibility).toBe(0)
  })

  it('skips claims missing from the supporters map', () => {
    const result = computeBackersByTopic({
      accounts: accounts(ALICE),
      certs: [cert('missing', 't1', ['tech'])],
      supportersByClaim: new Map(),
      credibility: cred,
    })
    expect(result.byTopic.size).toBe(0)
    expect(result.backerCount).toBe(0)
  })
})
