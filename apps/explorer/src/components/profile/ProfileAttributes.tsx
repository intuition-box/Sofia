/**
 * ProfileAttributes — "Skills & Tools" profile block. Surfaces the user's
 * on-chain skill/tool endorsements (via useUserAttributes), labelled against
 * the shared Atlas taxonomy. Each chip shows the endorser count when backed,
 * giving a read on real, attested usage rather than self-declared tags.
 */
import { Sparkles, Wrench } from 'lucide-react'
import { SectionH2 } from '@0xsofia/design-system'
import { useUserAttributes } from '@/hooks/useUserAttributes'
import type { UserAttribute } from '@/services/userAttributesService'
import '@/components/styles/profile-attributes.css'

interface ProfileAttributesProps {
  address: string | undefined
}

function AttributeChips({ items }: { items: UserAttribute[] }) {
  return (
    <ul className="pa-chips">
      {items.map((a) => (
        <li key={a.id} className="pa-chip">
          <span className="pa-chip-label">{a.label}</span>
          {a.endorserCount > 0 && (
            <span className="pa-chip-count" title="Endorsers">
              {a.endorserCount}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function ProfileAttributes({ address }: ProfileAttributesProps) {
  const { skills, tools, loading } = useUserAttributes(address)

  // No endorsements and nothing in flight → don't render an empty block.
  if (!loading && skills.length === 0 && tools.length === 0) return null

  return (
    <section className="pp-section pa-section">
      <SectionH2>Skills &amp; Tools</SectionH2>
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
              <AttributeChips items={skills} />
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
              <AttributeChips items={tools} />
            ) : (
              <p className="pa-empty">No tool endorsements yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
