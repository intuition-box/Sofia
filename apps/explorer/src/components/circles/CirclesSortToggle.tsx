/**
 * CirclesSortToggle — segmented toggle that sets the sort key for the
 * /circles list grid. Sits in the filter row next to the topic
 * dropdown so the list view shares the same chrome as the feed
 * filters on /circles/:id (mono uppercase "Sort" label + pill chips).
 */

export type CirclesSortId = 'activity' | 'size' | 'trust'

interface CirclesSortToggleProps {
  active: CirclesSortId
  onChange: (id: CirclesSortId) => void
}

const SORTS: { id: CirclesSortId; label: string }[] = [
  { id: 'activity', label: 'Most active' },
  { id: 'size', label: 'Most members' },
  { id: 'trust', label: 'Most TRUST' },
]

export default function CirclesSortToggle({
  active,
  onChange,
}: CirclesSortToggleProps) {
  return (
    <div className="cfs-bar" role="toolbar" aria-label="Sort circles">
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
