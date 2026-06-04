/**
 * CircleVerbFilterDropdown — Popover-driven verb filter for the circles
 * feed. Replaces the inline 8-chip bar that crowded the filter row.
 * Trigger reads as `[dot] VERBS · <active label> ▾` so the active state
 * stays visible at rest.
 */
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'

export type VerbFilterId = 'all' | IntentionType

const VERBS: { id: IntentionType; label: string; color: string }[] = [
  {
    id: 'trusted',
    label: INTENTION_CONFIG.trusted.label,
    color: INTENTION_CONFIG.trusted.color,
  },
  {
    id: 'work',
    label: INTENTION_CONFIG.work.label,
    color: INTENTION_CONFIG.work.color,
  },
  {
    id: 'learning',
    label: INTENTION_CONFIG.learning.label,
    color: INTENTION_CONFIG.learning.color,
  },
  {
    id: 'inspiration',
    label: INTENTION_CONFIG.inspiration.label,
    color: INTENTION_CONFIG.inspiration.color,
  },
  {
    id: 'fun',
    label: INTENTION_CONFIG.fun.label,
    color: INTENTION_CONFIG.fun.color,
  },
  {
    id: 'buying',
    label: INTENTION_CONFIG.buying.label,
    color: INTENTION_CONFIG.buying.color,
  },
  {
    id: 'music',
    label: INTENTION_CONFIG.music.label,
    color: INTENTION_CONFIG.music.color,
  },
]

interface CircleVerbFilterDropdownProps {
  active: VerbFilterId
  onChange: (id: VerbFilterId) => void
}

export default function CircleVerbFilterDropdown({
  active,
  onChange,
}: CircleVerbFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const activeVerb =
    active === 'all' ? null : VERBS.find((v) => v.id === active)
  const activeLabel = activeVerb ? activeVerb.label : 'All'
  const dotColor = activeVerb ? activeVerb.color : 'var(--ds-muted, #888)'

  const handleSelect = (id: VerbFilterId) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="crd-filter-trigger"
          aria-label="Filter by verb"
        >
          <span
            className="crd-filter-trigger__dot"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
          <span className="crd-filter-trigger__label">Intention</span>
          <span className="crd-filter-trigger__value">{activeLabel}</span>
          <ChevronDown size={12} className="crd-filter-trigger__chev" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="crd-filter-pop" align="start" sideOffset={6}>
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
          {VERBS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`crd-filter-pop__cell${
                active === v.id ? ' is-active' : ''
              }`}
              onClick={() => handleSelect(v.id)}
            >
              <span
                className="crd-filter-pop__dot"
                style={{ background: v.color }}
                aria-hidden="true"
              />
              {v.label}
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
