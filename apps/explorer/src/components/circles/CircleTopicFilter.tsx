/**
 * CircleTopicFilter — inline pill bar that narrows the circle feed to
 * items carrying one specific topic context. Twin of CircleVerbFilter
 * but driven by the SOFIA taxonomy (14 topics) so callers don't have
 * to wire up a parallel chip palette.
 */
import { SOFIA_TOPICS } from '@/config/taxonomy'
import TopicBadge from '@/components/profile/TopicBadge'

export type TopicFilterId = 'all' | string

interface CircleTopicFilterProps {
  active: TopicFilterId
  onChange: (id: TopicFilterId) => void
}

export default function CircleTopicFilter({
  active,
  onChange,
}: CircleTopicFilterProps) {
  return (
    <div className="vf-bar" role="toolbar" aria-label="Filter by topic">
      <button
        type="button"
        className={`vf-chip${active === 'all' ? ' active' : ''}`}
        onClick={() => onChange('all')}
      >
        All
      </button>
      {SOFIA_TOPICS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`vf-chip${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
          title={t.label}
        >
          <TopicBadge
            topicId={t.id}
            color={t.color}
            size={14}
            title={t.label}
          />
          {t.label}
        </button>
      ))}
    </div>
  )
}
