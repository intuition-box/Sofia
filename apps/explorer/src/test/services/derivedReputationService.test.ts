import { describe, it, expect } from 'vitest'

import {
  computeDerivedReputation,
  collectFollowerAddresses,
  buildReputationClaims,
  type ReputationCert,
} from '@/services/derivedReputationService'
import type {
  ClaimSupporters,
  ClaimStaker,
} from '@/services/claimSupportersService'

// ── Fixtures ──
const ALICE = '0xAAA'
const BOB = '0xBBB'
const CAROL = '0xCCC'
const DAVE = '0xDDD'
const SYBIL = '0xS1B11'

// Credibility (eigentrust) map. SYBIL absent → contributes 0.
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

describe('computeDerivedReputation', () => {
  it('a Pioneer earns from every later follower, weighted by credibility', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(BOB, 't2'), staker(CAROL, 't3')]),
      ],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(out.get('tech')).toBeCloseTo(0.7) // BOB 0.5 + CAROL 0.2
  })

  it('a middle staker earns only from those who came after them', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(BOB, 't2'), staker(CAROL, 't3')]),
      ],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(BOB),
      certs: [cert('c1', 't2', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(out.get('tech')).toBeCloseTo(0.2) // only CAROL is after BOB
  })

  it('the last staker earns nothing (no topic entry)', () => {
    const supportersByClaim = new Map([
      ['c1', claim([staker(ALICE, 't1'), staker(CAROL, 't3')])],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(CAROL),
      certs: [cert('c1', 't3', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(out.get('tech')).toBeUndefined()
  })

  it("excludes the user's own wallets from followers (multi-wallet)", () => {
    // ALICE + DAVE are the same user; DAVE staked after but must NOT count.
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(DAVE, 't2'), staker(BOB, 't3')]),
      ],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(ALICE, DAVE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(out.get('tech')).toBeCloseTo(0.5) // only BOB; DAVE excluded
  })

  it('Sybil / unknown credibility contributes 0 (anti-farm)', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(SYBIL, 't2'), staker(BOB, 't3')]),
      ],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(out.get('tech')).toBeCloseTo(0.5) // SYBIL 0 + BOB 0.5
  })

  it('aggregates across topics and across claims', () => {
    const supportersByClaim = new Map([
      ['c1', claim([staker(ALICE, 't1'), staker(BOB, 't2')])],
      ['c2', claim([staker(ALICE, 't1'), staker(CAROL, 't2')])],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech', 'web3']), cert('c2', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
    })
    expect(out.get('tech')).toBeCloseTo(0.7) // 0.5 (c1) + 0.2 (c2)
    expect(out.get('web3')).toBeCloseTo(0.5) // 0.5 (c1)
  })

  it('the oppose side mirrors support', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1')], [staker(ALICE, 't1'), staker(BOB, 't2')]),
      ],
    ])
    const out = computeDerivedReputation({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
      credibility: cred,
      side: 'oppose',
    })
    expect(out.get('tech')).toBeCloseTo(0.5)
  })

  it('skips claims absent from the supporters map', () => {
    const out = computeDerivedReputation({
      accounts: accounts(ALICE),
      certs: [cert('missing', 't1', ['tech'])],
      supportersByClaim: new Map(),
      credibility: cred,
    })
    expect(out.size).toBe(0)
  })
})

describe('buildReputationClaims (hybrid: certs + context triples)', () => {
  it('includes BOTH cert triples and context triples as claims', () => {
    const claims = buildReputationClaims({
      certs: [{ termId: 'cert1', certifiedAt: 't1', topicSlugs: ['tech'] }],
      contextAdditions: [
        { contextTermId: 'ctx1', addedAt: 't2', topicSlug: 'web3' },
      ],
    })
    expect(claims).toEqual([
      { termId: 'cert1', certifiedAt: 't1', topicSlugs: ['tech'] },
      { termId: 'ctx1', certifiedAt: 't2', topicSlugs: ['web3'] },
    ])
  })

  it('drops claims with no term_id or no topic', () => {
    const claims = buildReputationClaims({
      certs: [{ termId: '', certifiedAt: 't1', topicSlugs: ['tech'] }],
      contextAdditions: [
        { contextTermId: 'ctx1', addedAt: 't2', topicSlug: '' },
      ],
    })
    expect(claims).toEqual([])
  })

  it('dedups a repeated term_id, merging topics and keeping the earliest ts', () => {
    const claims = buildReputationClaims({
      certs: [{ termId: 'x', certifiedAt: 't3', topicSlugs: ['tech'] }],
      // same term_id arriving again (e.g. a granular category roll-up)
      contextAdditions: [{ contextTermId: 'x', addedAt: 't1', topicSlug: 'web3' }],
    })
    expect(claims).toHaveLength(1)
    expect(claims[0].termId).toBe('x')
    expect(claims[0].certifiedAt).toBe('t1') // earliest wins → all later stake counts
    expect(claims[0].topicSlugs.sort()).toEqual(['tech', 'web3'])
  })
})

describe('collectFollowerAddresses', () => {
  it('returns after-user stakers from both sides, excluding own wallets, deduped', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(ALICE, 't1'), staker(BOB, 't2')], [staker(CAROL, 't2')]),
      ],
    ])
    const addrs = collectFollowerAddresses({
      accounts: accounts(ALICE),
      certs: [cert('c1', 't1', ['tech'])],
      supportersByClaim,
    })
    expect([...addrs].sort()).toEqual([BOB, CAROL].sort())
  })

  it('omits the user and pre-user stakers', () => {
    const supportersByClaim = new Map([
      [
        'c1',
        claim([staker(DAVE, 't1'), staker(BOB, 't2'), staker(CAROL, 't3')]),
      ],
    ])
    // user = BOB at t2 → only CAROL (t3) is a follower; DAVE (t1) is before.
    const addrs = collectFollowerAddresses({
      accounts: accounts(BOB),
      certs: [cert('c1', 't2', ['tech'])],
      supportersByClaim,
    })
    expect(addrs).toEqual([CAROL])
  })
})
