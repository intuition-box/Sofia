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
  /** Cap the number of tiles shown (top-N by rank). Omit to show all. */
  limit?: number
}

export default function InterestTilesGrid({
  items,
  onPick,
  query,
  limit,
}: InterestTilesGridProps) {
  const tiles = useInterestTiles(items)
  const q = (query ?? '').trim().toLowerCase()
  const filtered = q
    ? tiles.filter((t) => t.label.toLowerCase().includes(q))
    : tiles
  const visibleTiles = limit != null ? filtered.slice(0, limit) : filtered

  if (q && filtered.length === 0) {
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
