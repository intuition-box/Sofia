/**
 * ProfileAttributes — "Skills & Tools" profile block (sidebar).
 *
 * Two modes:
 *  - owner (`canDeclare`): a search box per group adds your own skills/tools
 *    (max 5 each) → queues an on-chain declaration via the cart.
 *  - visitor (`onEndorse`): each chip shows a support counter + a "+" button
 *    to endorse (vote), Atlas-style.
 *
 * The declared chips are read on-chain via useUserAttributes.
 */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import MagnifierIcon from '@/components/icons/MagnifierIcon'
import { Sparkles, Wrench } from 'lucide-react'
import { SKILLS, TOOLS, type Attribute } from '@0xsofia/taxonomy'
import { useUserAttributes } from '@/hooks/useUserAttributes'
import { useDeclareSkill } from '@/hooks/useDeclareSkill'
import type { UserAttribute } from '@/services/userAttributesService'
import '@/components/styles/profile-attributes.css'

const MAX_PER_GROUP = 5

interface ProfileAttributesProps {
  /** One address (public profile) or the full linked-wallet set (own profile),
   *  since skills may have been declared under any linked wallet. */
  address: string | string[] | undefined
  /** When set, each chip gets an endorse ("vote") button (public profile). */
  onEndorse?: (attr: UserAttribute) => void
  /** When true, show a search box to declare your own skills/tools. */
  canDeclare?: boolean
}

function AttributeChips({
  items,
  onEndorse,
}: {
  items: UserAttribute[]
  onEndorse?: (attr: UserAttribute) => void
}) {
  return (
    <ul className="pa-chips">
      {items.map((a) => (
        <li
          key={a.id}
          className={`pa-chip${onEndorse ? ' pa-chip--votable' : ''}`}
        >
          <span className="pa-chip-label">{a.label}</span>
          {a.endorserCount > 0 && (
            <span className="pa-chip-count" title="Supporters">
              {a.endorserCount}
            </span>
          )}
          {onEndorse && a.termId && (
            <button
              type="button"
              className="pa-chip-vote"
              onClick={() => onEndorse(a)}
              aria-label={`Endorse ${a.label}`}
              title={`Endorse ${a.label}`}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Search box that adds an attribute from the taxonomy (owner only). */
function AttributeAdder({
  pool,
  declared,
  onPick,
  placeholder,
}: {
  pool: readonly Attribute[]
  declared: Set<string>
  onPick: (id: string) => void
  placeholder: string
}) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const matches = query
    ? pool
        .filter(
          (a) =>
            a.label.toLowerCase().includes(query) &&
            !declared.has(a.label.toLowerCase()),
        )
        .slice(0, 6)
    : []

  return (
    <div className="pa-adder">
      <span className="pa-adder-field">
        <MagnifierIcon className="pa-adder-icon h-3.5 w-3.5" aria-hidden="true" />
        <input
          type="search"
          className="pa-adder-input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </span>
      {matches.length > 0 && (
        <ul className="pa-adder-list">
          {matches.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="pa-adder-opt"
                onClick={() => {
                  onPick(a.id)
                  setQ('')
                }}
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AttributeGroup({
  kind,
  items,
  pool,
  onEndorse,
  canDeclare,
  onDeclare,
}: {
  kind: 'skill' | 'tool'
  items: UserAttribute[]
  pool: readonly Attribute[]
  onEndorse?: (attr: UserAttribute) => void
  canDeclare?: boolean
  onDeclare: (id: string) => void
}) {
  const Icon = kind === 'skill' ? Sparkles : Wrench
  const declared = new Set(items.map((a) => a.label.toLowerCase()))
  const atMax = items.length >= MAX_PER_GROUP

  return (
    <div className="pa-group">
      <div className="pa-group-head">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{kind === 'skill' ? 'Skills' : 'Tools'}</span>
        <span className="pa-group-count">
          {canDeclare ? `${items.length}/${MAX_PER_GROUP}` : items.length}
        </span>
      </div>

      {canDeclare && !atMax && (
        <AttributeAdder
          pool={pool}
          declared={declared}
          onPick={onDeclare}
          placeholder={`Add a ${kind}…`}
        />
      )}

      {items.length ? (
        <AttributeChips items={items} onEndorse={onEndorse} />
      ) : (
        !canDeclare && (
          <p className="pa-empty">No {kind} endorsements yet.</p>
        )
      )}
    </div>
  )
}

export default function ProfileAttributes({
  address,
  onEndorse,
  canDeclare,
}: ProfileAttributesProps) {
  const { skills, tools, loading } = useUserAttributes(address)
  const { declare } = useDeclareSkill()

  return (
    <section className="pa-section">
      {loading ? (
        <div className="pa-loading">Reading endorsements…</div>
      ) : (
        <div className="pa-groups">
          <AttributeGroup
            kind="skill"
            items={skills}
            pool={SKILLS}
            onEndorse={onEndorse}
            canDeclare={canDeclare}
            onDeclare={declare}
          />
          <AttributeGroup
            kind="tool"
            items={tools}
            pool={TOOLS}
            onEndorse={onEndorse}
            canDeclare={canDeclare}
            onDeclare={declare}
          />
        </div>
      )}
    </section>
  )
}
