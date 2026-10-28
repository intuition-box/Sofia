import { describe, expect, it } from 'vitest'
import {
  computeDailyMissions,
  monthMissionCredits,
  type ClaimBacker,
  type MissionPosition,
} from '@0xsofia/quests'

const DAY = 86_400_000
// Wed 2026-10-28 12:00 UTC
const NOW = Date.UTC(2026, 9, 28, 12)
const ME = '0xme'
const own = new Set([ME])
/** A free Recommend's deposit once fees are taken */
const FREE = 9_735_000_000_000_000n

const pos = (claim: string, at: number, deposit = FREE): MissionPosition => ({
  claimTermId: claim,
  pageKey: `page-${claim}`,
  createdAt: at,
  deposit,
})
const backer = (account: string, at: number): ClaimBacker => ({
  account,
  createdAt: at,
})
const byId = (missions: ReturnType<typeof computeDailyMissions>) =>
  Object.fromEntries(missions.map((m) => [m.id, m]))

describe('computeDailyMissions', () => {
  it('a free Recommend counts toward Express 3', () => {
    const today = [1, 2, 3].map((i) => pos(`c${i}`, NOW - i * 60_000))
    const m = byId(
      computeDailyMissions({
        positions: today,
        backers: new Map(),
        own,
        now: NOW,
      }),
    )
    expect(m['express-3'].done).toBe(true)
    // Below the floor: ignored
    const dust = [pos('d', NOW, 1_000_000_000_000_000n)]
    expect(
      byId(
        computeDailyMissions({
          positions: dust,
          backers: new Map(),
          own,
          now: NOW,
        }),
      )['express-3'].progress,
    ).toBe(0)
  })

  it('Back a pick: 3 others recommended the page in the week before you', () => {
    const backers = new Map([
      [
        'pick',
        [
          backer('0xa', NOW - 2 * DAY),
          backer('0xb', NOW - 3 * DAY),
          backer('0xc', NOW - 6 * DAY),
          backer(ME, NOW),
        ],
      ],
      [
        'stale',
        [
          backer('0xa', NOW - 9 * DAY),
          backer('0xb', NOW - 8 * DAY),
          backer('0xc', NOW - 2 * DAY),
          backer(ME, NOW),
        ],
      ],
    ])
    const done = (claim: string) =>
      byId(
        computeDailyMissions({
          positions: [pos(claim, NOW)],
          backers,
          own,
          now: NOW,
        }),
      )['back-a-pick'].done
    expect(done('pick')).toBe(true)
    expect(done('stale')).toBe(false)
  })

  it('Pioneer: the earliest position on the claim is yours', () => {
    const backers = new Map([
      ['first', [backer('0xa', NOW + 1), backer(ME, NOW)]],
      ['late', [backer('0xa', NOW - DAY), backer(ME, NOW)]],
    ])
    const pioneer = (claim: string) =>
      byId(
        computeDailyMissions({
          positions: [pos(claim, NOW)],
          backers,
          own,
          now: NOW,
        }),
      ).pioneer.done
    expect(pioneer('first')).toBe(true)
    expect(pioneer('late')).toBe(false)
  })
})

describe('monthMissionCredits', () => {
  const topic = { id: 'tech', label: 'Tech' }

  it('one credit per daily mission done, three per weekly one', () => {
    const day1 = Date.UTC(2026, 9, 2, 10)
    const day2 = Date.UTC(2026, 9, 20, 10)
    const positions = [
      ...[1, 2, 3].map((i) => pos(`a${i}`, day1 + i)),
      ...[1, 2, 3].map((i) => pos(`b${i}`, day2 + i)),
    ]
    // Week of Mon 2026-10-19: 5 tags on the week's topic
    const taggedPages = [1, 2, 3, 4, 5].map((i) => ({
      pageKey: `t${i}`,
      createdAt: Date.UTC(2026, 9, 19 + i, 9),
      topicId: 'tech',
    }))
    const credits = monthMissionCredits({
      positions,
      backers: new Map(),
      own,
      taggedPages,
      topicAt: () => topic,
      now: NOW,
    })
    expect(credits).toBe(2 * 1 + 3)
  })

  it('last month does not count', () => {
    const positions = [1, 2, 3].map((i) =>
      pos(`old${i}`, Date.UTC(2026, 8, 30, 10) + i),
    )
    expect(
      monthMissionCredits({
        positions,
        backers: new Map(),
        own,
        taggedPages: [],
        topicAt: () => topic,
        now: NOW,
      }),
    ).toBe(0)
  })
})
