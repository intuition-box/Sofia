/**
 * InterestTilesGrid — masonry column grid of InterestTiles.
 * Uses CSS column-count (same pattern as proto `.hm-grid`). `break-
 * inside: avoid` on `.hm-tile` keeps tiles intact across columns.
 */
import type { CircleItem } from '@/services/circleService'
import InterestTile from './InterestTile'
import { useInterestTiles, type InterestPreset } from './useInterestTiles'

interface InterestTilesGridProps {
  items: CircleItem[]
  onPick: (preset: InterestPreset) => void
  /** Case-insensitive substring filter on tile label. */
  query?: string
}

export default function InterestTilesGrid({ items, onPick, query }: InterestTilesGridProps) {
  const tiles = useInterestTiles(items)
  const q = (query ?? '').trim().toLowerCase()
  const visibleTiles = q
    ? tiles.filter((t) => t.label.toLowerCase().includes(q))
    : tiles

  if (q && visibleTiles.length === 0) {
    return <p className="hm-empty">No topic or intent matches “{query}”.</p>
  }

  return (
    <div className="hm-grid">
      {visibleTiles.map((t) => (
        <InterestTile
          key={`${t.kind}:${t.id}`}
          kind={t.kind}
          id={t.id}
          label={t.label}
          color={t.color}
          tier={t.tier}
          samples={t.samples}
          onPick={() => onPick({ kind: t.kind, id: t.id })}
        />
      ))}
    </div>
  )
}
