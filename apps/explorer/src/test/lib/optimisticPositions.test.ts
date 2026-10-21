import { describe, expect, it } from 'vitest'
import {
  MAX_AGE_MS,
  mergeOptimisticPositions,
  pendingPosition,
  pruneOptimisticPositions,
} from '@/lib/realtime/optimisticPositions'
import type { MarketPosition } from '@/services/userPositionsService'

const pos = (termId: string, value: string, shares = '10'): MarketPosition => ({
  ...pendingPosition({
    termId,
    amountWei: BigInt(value),
    title: termId,
    image: null,
    objectTermId: `page-${termId}`,
    predicateLabel: 'visits for work',
    side: 'support',
  }),
  shares,
})

const NOW = 1_000_000_000

describe('optimistic positions', () => {
  it('hides exited positions and shows new ones before the indexer', () => {
    const real = [pos('a', '100'), pos('b', '50')]
    const merged = mergeOptimisticPositions(
      real,
      {
        exited: [{ termId: 'a', at: NOW }],
        added: [{ position: pos('c', '80', '0'), baseShares: '0', at: NOW }],
      },
      NOW,
    )
    expect(merged.map((p) => p.termId)).toEqual(['c', 'b'])
  })

  it('adds a top-up on the indexed row until its shares change', () => {
    const real = [pos('a', '100', '10')]
    const overlay = {
      exited: [],
      added: [{ position: pos('a', '30'), baseShares: '10', at: NOW }],
    }
    expect(mergeOptimisticPositions(real, overlay, NOW)[0].value).toBe('130')
    const indexed = [pos('a', '131', '13')]
    expect(mergeOptimisticPositions(indexed, overlay, NOW)[0].value).toBe('131')
    expect(pruneOptimisticPositions(indexed, overlay, NOW).added).toEqual([])
  })

  it('prunes what the indexer reflects and what is too old', () => {
    const overlay = {
      exited: [
        { termId: 'gone', at: NOW },
        { termId: 'still', at: NOW },
        { termId: 'old', at: NOW - MAX_AGE_MS - 1 },
      ],
      added: [
        { position: pos('new', '5', '0'), baseShares: '0', at: NOW },
        { position: pos('seen', '5', '0'), baseShares: '0', at: NOW },
      ],
    }
    const real = [pos('still', '1'), pos('old', '1'), pos('seen', '5', '4')]
    const next = pruneOptimisticPositions(real, overlay, NOW)
    expect(next.exited.map((e) => e.termId)).toEqual(['still'])
    expect(next.added.map((a) => a.position.termId)).toEqual(['new'])
  })
})
