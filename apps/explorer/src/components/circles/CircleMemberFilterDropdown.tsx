/**
 * CircleMemberFilterDropdown — Popover-driven member filter for the
 * circles feed. Mirrors CircleVerbFilterDropdown / CircleTopicFilterDropdown
 * so all three filters share the same trigger + cell chrome. The active
 * dot uses `avatarColor(label)` so the trigger picks up the selected
 * member's identity color at a glance.
 */
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { avatarColor } from '@/utils/avatarColor'

interface CircleMemberFilterDropdownProps {
  /** `'all'` or the member's `walletAddress ?? termId`. */
  active: string
  onChange: (id: string) => void
  members: TrustCircleAccount[]
}

export default function CircleMemberFilterDropdown({
  active,
  onChange,
  members,
}: CircleMemberFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const activeMember =
    active === 'all'
      ? null
      : members.find(
          (m) =>
            (m.walletAddress ?? m.termId).toLowerCase() ===
            active.toLowerCase(),
        )
  const activeLabel = activeMember ? activeMember.label : 'All members'
  const dotColor = activeMember
    ? avatarColor(activeMember.label)
    : 'var(--ds-muted, #888)'

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="crd-filter-trigger crd-filter-trigger--wide"
          aria-label="Filter by member"
        >
          <span
            className="crd-filter-trigger__dot"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
          <span className="crd-filter-trigger__label">Member</span>
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
            All members
          </button>
          {members.map((m) => {
            const value = m.walletAddress ?? m.termId
            return (
              <button
                key={m.termId}
                type="button"
                className={`crd-filter-pop__cell${
                  active.toLowerCase() === value.toLowerCase()
                    ? ' is-active'
                    : ''
                }`}
                onClick={() => handleSelect(value)}
                title={m.label}
              >
                <span
                  className="crd-filter-pop__dot"
                  style={{ background: avatarColor(m.label) }}
                  aria-hidden="true"
                />
                {m.label}
              </button>
            )
          })}
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
