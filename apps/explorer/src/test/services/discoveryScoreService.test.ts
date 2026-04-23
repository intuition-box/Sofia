import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@0xsofia/graphql', () => ({
  useGetUserSignalsCountQuery: {
    fetcher: vi.fn(),
  },
}))

// eslint-disable-next-line import/first
import { useGetUserSignalsCountQuery } from '@0xsofia/graphql'
// eslint-disable-next-line import/first
import { fetchDiscoveryStats } from '@/services/discoveryScoreService'
// eslint-disable-next-line import/first
import { SUBJECT_IDS, PREDICATE_IDS } from '@/config'

const mockedSignals = useGetUserSignalsCountQuery.fetcher as unknown as ReturnType<typeof vi.fn>

/**
 * Build a fetch mock that matches on the query body's query string and returns
 * a shaped response. Each entry can match on a unique substring of the query.
 */
function installFetchMock(
  byQuerySubstring: Array<{
    match: string
    response: unknown
    captureVariables?: (v: Record<string, unknown>) => void
  }>,
) {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse((init?.body as string) ?? '{}')
    const queryStr = String(body.query ?? '')
    for (const h of byQuerySubstring) {
      if (queryStr.includes(h.match)) {
        if (h.captureVariables) h.captureVariables(body.variables ?? {})
        return new Response(JSON.stringify({ data: h.response }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    return new Response(JSON.stringify({ data: null }), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('discoveryScoreService.fetchDiscoveryStats', () => {
  beforeEach(() => {
    mockedSignals.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns zeroed stats when no addresses are linked', async () => {
    const stats = await fetchDiscoveryStats([])
    expect(stats).toEqual({
      pioneerCount: 0,
      explorerCount: 0,
      contributorCount: 0,
      trustedCount: 0,
      totalCertifications: 0,
    })
    expect(mockedSignals).not.toHaveBeenCalled()
  })

  it('passes lowercased addresses to the direct queries as arrays', async () => {
    const capturedTriples: Record<string, unknown>[] = []
    const capturedAtoms: Record<string, unknown>[] = []

    installFetchMock([
      {
        match: 'UserTriplesWithCounts',
        response: { triples: [] },
        captureVariables: (v) => capturedTriples.push(v),
      },
      {
        match: 'FindAccountAtoms',
        response: { atoms: [] },
        captureVariables: (v) => capturedAtoms.push(v),
      },
    ])
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 0 } } }),
    )

    await fetchDiscoveryStats([
      '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    ])

    expect(capturedTriples[0].userAddresses).toEqual([
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ])
    expect(capturedAtoms[0].addresses).toEqual([
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ])
  })

  it('passes accountIds as the original-case addresses to the codegen signals query', async () => {
    installFetchMock([
      { match: 'UserTriplesWithCounts', response: { triples: [] } },
      { match: 'FindAccountAtoms', response: { atoms: [] } },
    ])
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 13 } } }),
    )

    const stats = await fetchDiscoveryStats(['0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'])

    expect(mockedSignals).toHaveBeenCalledWith({
      accountIds: ['0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'],
      subjectId: SUBJECT_IDS.I,
    })
    expect(stats.totalCertifications).toBe(13)
  })

  it('derives Pioneer / Explorer / Contributor buckets from certifier counts', async () => {
    installFetchMock([
      {
        match: 'UserTriplesWithCounts',
        response: {
          triples: [
            { object: { term_id: 'p-1' }, positions_aggregate: { aggregate: { count: 1 } } },
            { object: { term_id: 'p-2' }, positions_aggregate: { aggregate: { count: 5 } } },
            { object: { term_id: 'p-3' }, positions_aggregate: { aggregate: { count: 20 } } },
            // duplicate object_id → counted once
            { object: { term_id: 'p-1' }, positions_aggregate: { aggregate: { count: 1 } } },
          ],
        },
      },
      { match: 'FindAccountAtoms', response: { atoms: [] } },
    ])
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 3 } } }),
    )

    const stats = await fetchDiscoveryStats(['0xAAA'])
    expect(stats.pioneerCount).toBe(1) // p-1
    expect(stats.explorerCount).toBe(1) // p-2
    expect(stats.contributorCount).toBe(1) // p-3
  })

  it('queries TrustedBy using the union of account atoms for all linked wallets', async () => {
    let capturedTrustedVars: Record<string, unknown> | undefined

    installFetchMock([
      { match: 'UserTriplesWithCounts', response: { triples: [] } },
      {
        match: 'FindAccountAtoms',
        response: { atoms: [{ term_id: 'atom-1' }, { term_id: 'atom-2' }] },
      },
      {
        match: 'GetTrustedByPositions',
        response: {
          triples: [
            {
              term: {
                vaults: [
                  { positions_aggregate: { aggregate: { count: 4 } } },
                  { positions_aggregate: { aggregate: { count: 2 } } },
                ],
              },
            },
          ],
        },
        captureVariables: (v) => { capturedTrustedVars = v },
      },
    ])
    mockedSignals.mockReturnValue(() =>
      Promise.resolve({ signalsCount: { aggregate: { count: 0 } } }),
    )

    const stats = await fetchDiscoveryStats(['0xAAA', '0xBBB'])

    expect(capturedTrustedVars).toMatchObject({
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.TRUSTS,
      objectIds: ['atom-1', 'atom-2'],
    })
    expect(stats.trustedCount).toBe(6)
  })
})
