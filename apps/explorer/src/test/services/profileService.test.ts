import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetUserPositionsQuery: {
    fetcher: vi.fn(),
  },
  useGetUserSignalsCountQuery: {
    fetcher: vi.fn(),
  },
}))

// eslint-disable-next-line import/first
import {
  useGetUserPositionsQuery,
  useGetUserSignalsCountQuery,
} from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import {
  fetchUserProfile,
  fetchSignalsCount,
} from '@/services/profileService'
// eslint-disable-next-line import/first
import { SUBJECT_IDS } from '@/config'

const mockedPositions = useGetUserPositionsQuery.fetcher as unknown as ReturnType<typeof vi.fn>
const mockedSignals = useGetUserSignalsCountQuery.fetcher as unknown as ReturnType<typeof vi.fn>

const emptyPositionsData = {
  positions: [],
  total: { aggregate: { count: 0 } },
}

describe('profileService.fetchSignalsCount', () => {
  beforeEach(() => {
    mockedSignals.mockReset()
  })

  it('returns 0 and skips the fetcher when no addresses', async () => {
    const count = await fetchSignalsCount([])
    expect(count).toBe(0)
    expect(mockedSignals).not.toHaveBeenCalled()
  })

  it('calls the fetcher with accountIds array + subject "I"', async () => {
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 42 } } }),
    )

    const count = await fetchSignalsCount(['0xAAA', '0xBBB'])

    expect(mockedSignals).toHaveBeenCalledWith({
      accountIds: ['0xAAA', '0xBBB'],
      subjectId: SUBJECT_IDS.I,
    })
    expect(count).toBe(42)
  })

  it('defaults to 0 when the aggregate is missing', async () => {
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: null } }),
    )

    const count = await fetchSignalsCount(['0xAAA'])
    expect(count).toBe(0)
  })
})

describe('profileService.fetchUserProfile', () => {
  beforeEach(() => {
    mockedPositions.mockReset()
    mockedSignals.mockReset()
  })

  it('returns empty profile when no addresses passed (no queries fired)', async () => {
    const profile = await fetchUserProfile([])
    expect(profile.positions).toEqual([])
    expect(profile.totalPositions).toBe(0)
    expect(profile.totalCertifications).toBe(0)
    expect(profile.totalStaked).toBe(0)
    expect(profile.verifiedPlatforms).toEqual([])
    expect(mockedPositions).not.toHaveBeenCalled()
    expect(mockedSignals).not.toHaveBeenCalled()
  })

  it('passes the addresses array as accountIds to both fetchers', async () => {
    mockedPositions.mockReturnValue(() => Promise.resolve(emptyPositionsData))
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 0 } } }),
    )

    await fetchUserProfile(['0xAAA', '0xBBB'])

    expect(mockedPositions).toHaveBeenCalledWith({
      accountIds: ['0xAAA', '0xBBB'],
    })
    expect(mockedSignals).toHaveBeenCalledWith({
      accountIds: ['0xAAA', '0xBBB'],
      subjectId: SUBJECT_IDS.I,
    })
  })

  it('counts atom-only vs triple positions separately', async () => {
    mockedPositions.mockReturnValue(() =>
      Promise.resolve({
        total: { aggregate: { count: 2 } },
        positions: [
          {
            shares: '100',
            vault: {
              current_share_price: '1',
              term: { atom: { term_id: 'atom-1', label: 'github.com' }, triple: null },
            },
          },
          {
            shares: '200',
            vault: {
              current_share_price: '1',
              term: {
                atom: null,
                triple: {
                  term_id: 'triple-1',
                  predicate: { label: 'visits for work' },
                  object: { term_id: 'obj-1', label: 'example.com', value: null },
                  subject: { term_id: 'subj-1' },
                },
              },
            },
          },
        ],
      }),
    )
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 7 } } }),
    )

    const profile = await fetchUserProfile(['0xAAA'])

    expect(profile.positions).toHaveLength(2)
    expect(profile.totalAtomPositions).toBe(1)
    expect(profile.totalCertifications).toBe(7)
  })
})
