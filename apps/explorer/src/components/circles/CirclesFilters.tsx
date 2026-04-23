/**
 * CirclesFilters — topic dropdown + sort chips above the grid. UI-only
 * until we have more than one real circle; interactions update local
 * state but don't filter the list yet.
 */
import { useState } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { getTopicEmoji } from '@/config/topicEmoji'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="cr-topic-trigger" aria-label="Filter circles by topic">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="cr-topic-item">
                  <span aria-hidden="true">{getTopicEmoji(t.id) || '📌'}</span>
                  {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
