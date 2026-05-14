/**
 * RadarPills — single dropdown that drives the radar focus filter.
 * Replaces the wrap-flow pill row that used to sit above the radar
 * (which got noisy as soon as the user had a few topics + verbs). The
 * dropdown mirrors the look of the /circles filters (CircleTopicFilter
 * Dropdown) so the chrome stays consistent across the explorer.
 */
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import type { RadarAxis, SeriesFilter } from '@/lib/radar'

interface RadarPillsProps {
  items: readonly RadarAxis[]
  seriesFilter: SeriesFilter
  onFocus: (id: SeriesFilter) => void
}

export default function RadarPills({
  items,
  seriesFilter,
  onFocus,
}: RadarPillsProps) {
  const [open, setOpen] = useState(false)
  const active =
    seriesFilter === 'all' ? null : items.find((i) => i.id === seriesFilter)
  const activeLabel = active ? active.label : 'All'
  const dotColor = active ? active.color : 'var(--ds-muted, #888)'

  const handleSelect = (id: SeriesFilter) => {
    onFocus(id)
    setOpen(false)
  }

  return (
    <div className="pc-radar-verbs">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="pc-radar-filter-trigger"
            aria-label="Filter the radar"
          >
            <span
              className="pc-radar-filter-trigger__dot"
              style={{ background: dotColor }}
              aria-hidden="true"
            />
            <span className="pc-radar-filter-trigger__label">Focus</span>
            <span className="pc-radar-filter-trigger__value">
              {activeLabel}
            </span>
            <ChevronDown size={12} className="pc-radar-filter-trigger__chev" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="pc-radar-filter-pop"
          align="start"
          sideOffset={6}
        >
          <div className="pc-radar-filter-pop__grid">
            <button
              type="button"
              className={`pc-radar-filter-pop__cell${
                seriesFilter === 'all' ? ' is-active' : ''
              }`}
              onClick={() => handleSelect('all')}
            >
              <span
                className="pc-radar-filter-pop__dot"
                style={{ background: 'var(--ds-muted, #888)' }}
                aria-hidden="true"
              />
              All
            </button>
            {items.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`pc-radar-filter-pop__cell${
                  seriesFilter === s.id ? ' is-active' : ''
                }`}
                onClick={() => handleSelect(s.id)}
              >
                <span
                  className="pc-radar-filter-pop__dot"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span className="pc-radar-filter-pop__emoji">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
          {seriesFilter !== 'all' && (
            <button
              type="button"
              className="pc-radar-filter-pop__reset"
              onClick={() => handleSelect('all')}
            >
              Reset
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
