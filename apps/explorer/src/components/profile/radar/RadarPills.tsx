/**
 * RadarPills — filter row shown above (or below) the radar. Each pill
 * toggles the single `focus` id shared with the rim emojis.
 */
import type { RadarAxis, SeriesFilter } from '@/lib/radar'

interface RadarPillsProps {
  items: readonly RadarAxis[]
  seriesFilter: SeriesFilter
  onFocus: (id: SeriesFilter) => void
}

export default function RadarPills({ items, seriesFilter, onFocus }: RadarPillsProps) {
  return (
    <div className="pc-radar-verbs">
      <button
        type="button"
        className={`pc-radar-verb${seriesFilter === 'all' ? ' active' : ''}`}
        data-verb-radar="all"
        onClick={() => onFocus('all')}
      >
        All
      </button>
      {items.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`pc-radar-verb${seriesFilter === s.id ? ' active' : ''}`}
          data-verb-radar={s.id}
          style={{ ['--verb-color' as string]: s.color }}
          onClick={() => onFocus(s.id)}
        >
          <span className="pc-radar-verb-emoji">{s.emoji}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}
