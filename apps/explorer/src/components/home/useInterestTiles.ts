/**
 * useInterestTiles — builds the data powering the Home interest grid.
 *
 * Mirrors proto-explorer/src/views/home.ts `buildTiles()`, adapted to
 * Sofia's real hooks:
 *   - topics  → `useTaxonomy().topics`
 *   - items   → `useAllActivity()` (caller passes them in)
 *   - verbs   → 6 canonical intents (work/learning/fun/inspiration/buying/music)
 *
 * Each tile reports count + up-to-6 sample items; its tier (hero /
 * featured / standard / compact) is derived from its rank and drives
 * the visual weight in `<InterestTile>`.
 */
import { useMemo } from 'react'
import type { CircleItem } from '@/services/circleService'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { INTENTION_PASTEL } from '@0xsofia/design-system'

export type InterestKind = 'topic' | 'verb'
export type InterestTier = 'hero' | 'featured' | 'standard' | 'compact'

export interface InterestPreset {
  kind: InterestKind
  id: string
}

export interface InterestTile {
  kind: InterestKind
  id: string
  label: string
  /** Tile accent colour — topic tint or intention pastel. */
  color: string
  /** Matching feed items count. Drives ranking. */
  count: number
  /** Up to 6 sample items used by the tile body. */
  samples: CircleItem[]
  tier: InterestTier
}

type VerbDef = { id: string; label: string }

const VERBS: VerbDef[] = [
  { id: 'work', label: 'Work' },
  { id: 'learning', label: 'Learning' },
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'fun', label: 'Fun' },
  { id: 'buying', label: 'Buying' },
  { id: 'music', label: 'Music' },
]

function tierFor(rank: number): InterestTier {
  if (rank < 2) return 'hero'
  if (rank < 6) return 'featured'
  if (rank < 12) return 'standard'
  return 'compact'
}

/** Stable FNV-1a hash for seeding per-tile variance. */
export function seedHash(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

export function useInterestTiles(items: CircleItem[]): InterestTile[] {
  const { topics } = useTaxonomy()

  return useMemo(() => {
    const topicTiles: InterestTile[] = topics.map((t) => {
      const matches = items.filter((u) => u.topicContexts.includes(t.id))
      return {
        kind: 'topic' as const,
        id: t.id,
        label: t.label,
        color: t.color,
        count: matches.length,
        samples: matches.slice(0, 6),
        tier: 'compact' as const, // placeholder — overwritten below
      }
    })

    const verbTiles: InterestTile[] = VERBS.map((v) => {
      const matches = items.filter((u) =>
        u.intentions.some((i) => i.toLowerCase() === v.id),
      )
      return {
        kind: 'verb' as const,
        id: v.id,
        label: v.label,
        color:
          INTENTION_PASTEL[v.id as keyof typeof INTENTION_PASTEL] ??
          'var(--ds-accent)',
        count: matches.length,
        samples: matches.slice(0, 6),
        tier: 'compact' as const,
      }
    })

    const all = [...topicTiles, ...verbTiles].sort((a, b) => b.count - a.count)
    return all.map((tile, rank) => ({ ...tile, tier: tierFor(rank) }))
  }, [items, topics])
}
