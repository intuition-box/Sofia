/**
 * ProfileAttributes — "Skills & Tools" profile block (sidebar).
 *
 * Two modes:
 *  - owner (`canDeclare`): the sidebar shows only the declared chips with a
 *    small edit (pencil) button per group. Editing happens in a modal — a
 *    search box per group adds your own skills/tools (max 5 each) → queues an
 *    on-chain declaration via the cart. Keeps the sidebar clean (chips only).
 *  - visitor (`onEndorse`): each chip shows a support counter + a "+" button
 *    to endorse (vote), Atlas-style.
 *
 * The declared chips are read on-chain via useUserAttributes.
 */
import { useState, useMemo } from 'react'
import { Plus, ChevronUp, Sparkles, Wrench } from 'lucide-react'
import MagnifierIcon from '@/components/icons/MagnifierIcon'
import { SKILLS, TOOLS, type Attribute } from '@0xsofia/taxonomy'
import { useUserAttributes } from '@/hooks/useUserAttributes'
import { useDeclareSkill } from '@/hooks/useDeclareSkill'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useCart } from '@/hooks/useCart'
import type { UserAttribute } from '@/services/userAttributesService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import '@/components/styles/profile-attributes.css'

const MAX_PER_GROUP = 5
// Cap the skill/tool autocomplete dropdown to keep it scannable.
const MAX_SUGGESTIONS = 6

/** A declared attribute plus an optional `pending` flag: entries the owner has
 *  just added are queued in the cart (not yet minted on-chain) and render as
 *  dashed chips so it's obvious the declaration still needs to be submitted. */
type DisplayAttribute = UserAttribute & { pending?: boolean }

interface ProfileAttributesProps {
  /** One address (public profile) or the full linked-wallet set (own profile),
   *  since skills may have been declared under any linked wallet. */
  address: string | string[] | undefined
  /** When set, each chip gets an endorse ("vote") button (public profile). */
  onEndorse?: (attr: UserAttribute) => void
  /** When true, show the edit button + modal to declare your own skills/tools. */
  canDeclare?: boolean
}

function AttributeChips({
  items,
  onEndorse,
}: {
  items: DisplayAttribute[]
  onEndorse?: (attr: UserAttribute) => void
}) {
  return (
    <ul className="pa-chips">
      {items.map((a) => {
        const votable = !!onEndorse && !a.pending
        const voted = !a.pending && a.viewerEndorsed
        return (
          <li
            key={a.id}
            className={`pa-chip${votable ? ' pa-chip--votable' : ''}${
              a.pending ? ' pa-chip--pending' : ''
            }${voted ? ' pa-chip--mine' : ''}`}
            title={
              a.pending
                ? 'Queued — submit your cart to confirm on-chain'
                : voted
                  ? 'You back this'
                  : undefined
            }
          >
            <span className="pa-chip-label">{a.label}</span>
            {a.pending ? (
              <span className="pa-chip-tag" aria-label="Pending declaration">
                queued
              </span>
            ) : votable && a.termId ? (
              <button
                type="button"
                className={`pa-chip-vote${voted ? ' pa-chip-vote--voted' : ''}`}
                onClick={() => onEndorse!(a)}
                aria-label={
                  voted
                    ? `You back ${a.label} — add more support`
                    : `Endorse ${a.label}`
                }
                title={
                  voted
                    ? 'You back this — click to add more support'
                    : `Endorse ${a.label}`
                }
              >
                <ChevronUp className="pa-chip-vote-ic" aria-hidden="true" />
                <span className="pa-chip-vote-n">{a.endorserCount}</span>
              </button>
            ) : (
              a.endorserCount > 0 && (
                <span
                  className={`pa-chip-vote pa-chip-vote--static${
                    voted ? ' pa-chip-vote--voted' : ''
                  }`}
                  title={voted ? 'You back this' : 'Supporters'}
                >
                  <ChevronUp className="pa-chip-vote-ic" aria-hidden="true" />
                  <span className="pa-chip-vote-n">{a.endorserCount}</span>
                </span>
              )
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Search box that adds an attribute from the taxonomy (owner only, in modal). */
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
        .slice(0, MAX_SUGGESTIONS)
    : []

  return (
    <div className="pa-adder">
      <span className="pa-adder-field">
        <MagnifierIcon
          className="pa-adder-icon h-3.5 w-3.5"
          aria-hidden="true"
        />
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

/** Sidebar group — clean: head (edit button when owner) + chips, no inline adder. */
function AttributeGroup({
  kind,
  items,
  onEndorse,
  canDeclare,
  onEdit,
}: {
  kind: 'skill' | 'tool'
  items: DisplayAttribute[]
  onEndorse?: (attr: UserAttribute) => void
  canDeclare?: boolean
  onEdit: () => void
}) {
  const Icon = kind === 'skill' ? Sparkles : Wrench

  return (
    <div className="pa-group">
      <div className="pa-group-head">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{kind === 'skill' ? 'Skills' : 'Tools'}</span>
        {canDeclare ? (
          <button
            type="button"
            className="pa-group-edit"
            onClick={onEdit}
            aria-label={`Edit ${kind}s`}
          >
            edit
          </button>
        ) : (
          <span className="pa-group-count">{items.length}</span>
        )}
      </div>

      {items.length ? (
        <AttributeChips items={items} onEndorse={onEndorse} />
      ) : (
        <p className="pa-empty">
          {canDeclare
            ? `No ${kind}s yet — tap edit to add.`
            : `No ${kind} endorsements yet.`}
        </p>
      )}
    </div>
  )
}

/** Modal group — head with count, search to add, and current chips. */
function EditGroup({
  kind,
  items,
  pool,
  onPick,
}: {
  kind: 'skill' | 'tool'
  items: DisplayAttribute[]
  pool: readonly Attribute[]
  onPick: (id: string) => void
}) {
  const Icon = kind === 'skill' ? Sparkles : Wrench
  // Pending (queued) entries count toward both the "already declared" set (so
  // the adder won't re-suggest them) and the max — you can't queue more than
  // MAX_PER_GROUP total across confirmed + pending.
  const declared = new Set(items.map((a) => a.label.toLowerCase()))
  const atMax = items.length >= MAX_PER_GROUP

  return (
    <div className="pa-edit-group">
      <div className="pa-group-head">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{kind === 'skill' ? 'Skills' : 'Tools'}</span>
        <span className="pa-group-count">
          {items.length}/{MAX_PER_GROUP}
        </span>
      </div>

      {atMax ? (
        <p className="pa-empty">Max {MAX_PER_GROUP} reached.</p>
      ) : (
        <AttributeAdder
          pool={pool}
          declared={declared}
          onPick={onPick}
          placeholder={`Add a ${kind}…`}
        />
      )}

      {items.length > 0 && <AttributeChips items={items} />}
    </div>
  )
}

/** Append the owner's queued (cart) declarations to the confirmed list,
 *  skipping any whose label is already declared on-chain. */
function withPending(
  confirmed: UserAttribute[],
  pending: DisplayAttribute[],
): DisplayAttribute[] {
  const have = new Set(confirmed.map((a) => a.label.toLowerCase()))
  return [
    ...confirmed,
    ...pending.filter((p) => !have.has(p.label.toLowerCase())),
  ]
}

export default function ProfileAttributes({
  address,
  onEndorse,
  canDeclare,
}: ProfileAttributesProps) {
  // The connected viewer's wallets — flags which chips they already endorsed
  // so we can render those in a stronger "voted" state.
  const { addresses: viewerAddresses } = useLinkedWallets()
  const { skills, tools, loading } = useUserAttributes(address, viewerAddresses)
  const { declare } = useDeclareSkill()
  const cart = useCart()
  const [editOpen, setEditOpen] = useState(false)

  // Skill/tool declarations the owner just added sit in the cart as
  // `create-skill` items until the cart is submitted on-chain. Surface them as
  // dashed "queued" chips so the add is visibly acknowledged. Only on the
  // owner's own profile (`canDeclare`) — the cart is the current user's, not
  // the profile being viewed.
  const pending = useMemo(() => {
    const skillsP: DisplayAttribute[] = []
    const toolsP: DisplayAttribute[] = []
    if (canDeclare) {
      for (const it of cart.items) {
        const draft = it.kind === 'create-skill' ? it.skillDraft : undefined
        if (!draft) continue
        const entry: DisplayAttribute = {
          id: it.id,
          label: draft.label,
          category: draft.category,
          endorserCount: 0,
          viewerEndorsed: false,
          termId: it.termId,
          pending: true,
        }
        ;(draft.category === 'skill' ? skillsP : toolsP).push(entry)
      }
    }
    return { skills: skillsP, tools: toolsP }
  }, [cart.items, canDeclare])

  const skillsDisplay = withPending(skills, pending.skills)
  const toolsDisplay = withPending(tools, pending.tools)

  return (
    <section className="pa-section">
      {loading ? (
        <div className="pa-loading">Reading endorsements…</div>
      ) : (
        <div className="pa-groups">
          <AttributeGroup
            kind="skill"
            items={skillsDisplay}
            onEndorse={onEndorse}
            canDeclare={canDeclare}
            onEdit={() => setEditOpen(true)}
          />
          <AttributeGroup
            kind="tool"
            items={toolsDisplay}
            onEndorse={onEndorse}
            canDeclare={canDeclare}
            onEdit={() => setEditOpen(true)}
          />
        </div>
      )}

      {canDeclare && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="pa-edit-modal">
            <DialogHeader>
              <DialogTitle>Edit skills &amp; tools</DialogTitle>
            </DialogHeader>
            <div className="pa-edit-body">
              <EditGroup
                kind="skill"
                items={skillsDisplay}
                pool={SKILLS}
                onPick={declare}
              />
              <EditGroup
                kind="tool"
                items={toolsDisplay}
                pool={TOOLS}
                onPick={declare}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
