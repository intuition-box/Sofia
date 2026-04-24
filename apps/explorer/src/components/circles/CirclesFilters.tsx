/**
 * CirclesFilters — topic + sort chips above the grid. UI-only until we
 * have more than one real circle; interactions update local state but
 * don't filter the list yet.
 */
import { useState } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'

const SORT_OPTIONS = [
  { id: 'activity', label: 'Active today' },
  { id: 'size', label: 'Members' },
  { id: 'trust', label: 'TRUST locked' },
] as const

export default function CirclesFilters() {
  const { topics } = useTaxonomy()
  const [topic, setTopic] = useState<string>('all')
  const [sort, setSort] = useState<string>('activity')

  return (
    <div className="cr-filters">
      <div className="cr-filter-group">
        <span className="cr-filter-label">Topic</span>
        <div className="cr-chips">
          <button
            type="button"
            className={`cr-chip${topic === 'all' ? ' active' : ''}`}
            onClick={() => setTopic('all')}
          >
            All
          </button>
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`cr-chip${topic === t.id ? ' active' : ''}`}
              onClick={() => setTopic(t.id)}
            >
              <span
                className="cr-chip-dot"
                aria-hidden="true"
                style={{ background: t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cr-filter-group">
        <span className="cr-filter-label">Sort by</span>
        <div className="cr-chips">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`cr-chip${sort === s.id ? ' active' : ''}`}
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
