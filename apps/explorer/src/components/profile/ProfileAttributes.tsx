/**
 * ProfileAttributes — "Skills & Tools" profile block. Surfaces the user's
 * on-chain skill/tool endorsements (via useUserAttributes), labelled against
 * the shared Atlas taxonomy. Each chip shows the endorser count when backed,
 * giving a read on real, attested usage rather than self-declared tags.
 */
import { Sparkles, Wrench, ThumbsUp } from 'lucide-react'
import { useUserAttributes } from '@/hooks/useUserAttributes'
import type { UserAttribute } from '@/services/userAttributesService'
import '@/components/styles/profile-attributes.css'

interface ProfileAttributesProps {
  address: string | undefined
  /** When set, each chip gets an endorse ("vote") button. */
  onEndorse?: (attr: UserAttribute) => void
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
            <span className="pa-chip-count" title="Endorsers">
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
              <ThumbsUp className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function ProfileAttributes({
  address,
  onEndorse,
}: ProfileAttributesProps) {
  const { skills, tools, loading } = useUserAttributes(address)

  return (
    <section className="pa-section">
      <h3 className="pa-title">Skills &amp; Tools</h3>
      <p className="pa-sub">Endorsed on-chain by the community.</p>

      {loading ? (
        <div className="pa-loading">Reading endorsements…</div>
      ) : (
        <div className="pa-groups">
          <div className="pa-group">
            <div className="pa-group-head">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Skills</span>
              <span className="pa-group-count">{skills.length}</span>
            </div>
            {skills.length ? (
              <AttributeChips items={skills} onEndorse={onEndorse} />
            ) : (
              <p className="pa-empty">No skill endorsements yet.</p>
            )}
          </div>

          <div className="pa-group">
            <div className="pa-group-head">
              <Wrench className="h-4 w-4" aria-hidden="true" />
              <span>Tools</span>
              <span className="pa-group-count">{tools.length}</span>
            </div>
            {tools.length ? (
              <AttributeChips items={tools} onEndorse={onEndorse} />
            ) : (
              <p className="pa-empty">No tool endorsements yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
