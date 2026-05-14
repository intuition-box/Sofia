/**
 * CircleFeedSort — segmented toggle that picks the sort key for the
 * circles feed. Sits in the `.crd-feed-filters` row next to the verb /
 * topic / member filters. Reuses the `.vf-chip` chrome so the bar reads
 * as a single horizontal control surface.
 */
import type { FeedSortId } from '@/services/circleFeedSort'

interface CircleFeedSortProps {
  active: FeedSortId
  onChange: (id: FeedSortId) => void
}

const SORTS: { id: FeedSortId; label: string }[] = [
  { id: 'engagement', label: 'Top engagement' },
  { id: 'recent', label: 'Recent' },
]

export default function CircleFeedSort({
  active,
  onChange,
}: CircleFeedSortProps) {
  return (
    <div className="cfs-bar" role="toolbar" aria-label="Sort feed">
      <span className="cfs-label">Sort</span>
      {SORTS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`vf-chip${active === s.id ? ' active' : ''}`}
          onClick={() => onChange(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
