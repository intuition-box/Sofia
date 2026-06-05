/**
 * CircleTopicFilterDropdown — Popover-driven topic filter for the
 * circles feed. Twin of CircleVerbFilterDropdown but renders the 14
 * SOFIA topics with their TopicBadge so the palette stays consistent
 * with the rest of the explorer (profile interests, top topics card).
 */
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { TopicPill } from '@/components/profile/FeedPills'

export type TopicFilterId = 'all' | string

interface CircleTopicFilterDropdownProps {
  active: TopicFilterId
  onChange: (id: TopicFilterId) => void
}

export default function CircleTopicFilterDropdown({
  active,
  onChange,
}: CircleTopicFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const activeTopic =
    active === 'all' ? null : SOFIA_TOPICS.find((t) => t.id === active)
  const activeLabel = activeTopic ? activeTopic.label : 'All'
  const dotColor = activeTopic ? activeTopic.color : 'var(--ds-muted, #888)'

  const handleSelect = (id: TopicFilterId) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="crd-filter-trigger crd-filter-trigger--wide"
          aria-label="Filter by topic"
        >
          <span
            className="crd-filter-trigger__dot"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
          <span className="crd-filter-trigger__label">Topics</span>
          <span className="crd-filter-trigger__value">{activeLabel}</span>
          <ChevronDown size={12} className="crd-filter-trigger__chev" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="crd-filter-pop crd-filter-pop--topics"
        align="start"
        sideOffset={6}
      >
        <div className="crd-filter-pop__grid">
          <button
            type="button"
            className={`crd-filter-pop__cell${
              active === 'all' ? ' is-active' : ''
            }`}
            onClick={() => handleSelect('all')}
          >
            <span
              className="crd-filter-pop__dot"
              style={{ background: 'var(--ds-muted, #888)' }}
              aria-hidden="true"
            />
            All
          </button>
          {SOFIA_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`crd-filter-pop__cell${
                active === t.id ? ' is-active' : ''
              }`}
              onClick={() => handleSelect(t.id)}
            >
              <TopicPill
                topicId={t.id}
                color={t.color}
                label={t.label}
                iconOnly
              />
              {t.label}
            </button>
          ))}
        </div>
        {active !== 'all' && (
          <button
            type="button"
            className="crd-filter-pop__reset"
            onClick={() => handleSelect('all')}
          >
            Reset
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
