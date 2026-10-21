/**
 * Formula guardrails for @0xsofia/reputation.
 *
 * All expected values are hand-computed from the fixtures below so the tests
 * pin the actual scoring math (not a snapshot). If a refactor changes a number
 * here, it changed user-visible scores — intentional or a regression.
 */
import { describe, expect, test } from 'bun:test'
import {
  buildReputationClaims,
  collectFollowerAddresses,
  computeDerivedReputation,
  countCertsByTopic,
  computeReputationProfile,
  POINTS_PER_CERT,
  type ClaimSupporters,
  type ReputationCert,
} from './index'

const staker = (account: string, createdAt: string) => ({
  account,
  createdAt,
  shares: '1',
})

describe('countCertsByTopic', () => {
  test('counts topics, skips quest-only certs, keeps intention-less certs', () => {
    const counts = countCertsByTopic([
      { intentions: ['visits for work'], topicContexts: ['ai', 'crypto'] },
      { intentions: ['quest:pioneer'], topicContexts: ['ai'] }, // quest-only → skipped
      { intentions: [], topicContexts: ['ai'] }, // no intention → still counts
    ])
    expect(counts.get('ai')).toBe(2)
    expect(counts.get('crypto')).toBe(1)
  })
})

describe('computeDerivedReputation', () => {
  test('sums credibility of stakers strictly after the user, both exclusions applied', () => {
    const accounts = new Set(['user1'])
    const certs: ReputationCert[] = [
      { termId: 'c1', certifiedAt: '2024-01-01T00:00:00Z', topicSlugs: ['ai'] },
    ]
    const supportersByClaim = new Map<string, ClaimSupporters>([
      [
        'c1',
        {
          support: [
            staker('user1', '2024-01-01T00:00:00Z'), // the user → excluded
            staker('early', '2023-01-01T00:00:00Z'), // before user → excluded
            staker('alice', '2024-02-01T00:00:00Z'), // after → counts (10)
            staker('bob', '2024-03-01T00:00:00Z'), // after → counts (5)
          ],
          oppose: [],
        },
      ],
    ])
    const credibility = new Map([
      ['alice', 10],
      ['bob', 5],
      ['early', 100],
    ])

    const byTopic = computeDerivedReputation({
      accounts,
      certs,
      supportersByClaim,
      credibility,
      side: 'support',
    })
    expect(byTopic.get('ai')).toBe(15) // 10 + 5, early & user excluded
  })
})

describe('collectFollowerAddresses', () => {
  test('dedupes followers-after across sides, excluding the user and earlier stakers', () => {
    const accounts = new Set(['user1'])
    const certs: ReputationCert[] = [
      { termId: 'c1', certifiedAt: '2024-01-01T00:00:00Z', topicSlugs: ['ai'] },
    ]
    const supportersByClaim = new Map<string, ClaimSupporters>([
      [
        'c1',
        {
          support: [
            staker('user1', '2024-01-01T00:00:00Z'),
            staker('early', '2023-01-01T00:00:00Z'),
            staker('alice', '2024-02-01T00:00:00Z'),
          ],
          oppose: [staker('bob', '2024-03-01T00:00:00Z')],
        },
      ],
    ])
    const followers = collectFollowerAddresses({
      accounts,
      certs,
      supportersByClaim,
    })
    expect([...followers].sort()).toEqual(['alice', 'bob'])
  })
})

describe('buildReputationClaims', () => {
  test('merges cert + context triples by term_id, keeping the earliest timestamp', () => {
    const claims = buildReputationClaims({
      certs: [
        {
          termId: 'c1',
          certifiedAt: '2024-02-01T00:00:00Z',
          topicSlugs: ['ai'],
        },
      ],
      contextAdditions: [
        {
          contextTermId: 'c1',
          addedAt: '2024-01-01T00:00:00Z',
          topicSlug: 'ai',
        },
        {
          contextTermId: 'c2',
          addedAt: '2024-03-01T00:00:00Z',
          topicSlug: 'crypto',
        },
      ],
    })
    const c1 = claims.find((c) => c.termId === 'c1')
    expect(c1?.certifiedAt).toBe('2024-01-01T00:00:00Z') // earliest wins
    expect(c1?.topicSlugs).toEqual(['ai'])
    expect(claims.find((c) => c.termId === 'c2')?.topicSlugs).toEqual([
      'crypto',
    ])
  })
})

describe('computeReputationProfile (no OAuth — the P1 backend path)', () => {
  test('trust-only score is capped at 15, then cert points are added uncapped', () => {
    const profile = computeReputationProfile(
      () => 'disconnected', // no platform connected
      ['tech-dev'], // a real SOFIA_TOPICS id
      [],
      50, // composite → trustBonus = round(50 * 0.2) = 10, capped at 15
      {}, // no signals (P1)
      new Map([['tech-dev', 2]]), // 2 certs → 2 * POINTS_PER_CERT
    )
    const topic = profile?.topics.find((t) => t.topicId === 'tech-dev')
    // min(10, 15) + 2 * POINTS_PER_CERT = 10 + 10 = 20
    expect(topic?.score).toBe(10 + 2 * POINTS_PER_CERT)
  })

  test('returns null when there is no platform, topic, nor cert signal', () => {
    expect(
      computeReputationProfile(() => 'disconnected', [], [], null, {}),
    ).toBeNull()
  })
})
