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
}

export default function InterestTilesGrid({ items, onPick }: InterestTilesGridProps) {
  const tiles = useInterestTiles(items)

  return (
    <div className="hm-grid">
      {tiles.map((t) => (
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
