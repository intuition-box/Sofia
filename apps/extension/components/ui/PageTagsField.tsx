/**
 * PageTagsField — the Page tab's tags, same field as the Add-to-Sofia modal:
 * "Why?" intention pills + taxonomy tags with suggestions read from the page
 * (title, description, keywords…) and live search. Props only.
 */
import { IntentionPills } from "~/components/modals/addToSofia/IntentionPills"
import { TagInput } from "~/components/modals/addToSofia/TagInput"
import { taxonomyNodeById } from "~/lib/addToSofia/taxonomyIndex"
import type { Context } from "~/lib/addToSofia/types"
import type { IntentionPurpose } from "~/types/discovery"

import "~/contents/addToSofia.css"
import "../styles/PageTagsField.css"

interface PageTagsFieldProps {
  intentions: IntentionPurpose[]
  onToggleIntention: (purpose: IntentionPurpose) => void
  /** Topic / category / niche slugs */
  contexts: string[]
  onChangeContexts: (slugs: string[]) => void
  /** Page metadata — drives "Suggested from this page" */
  hints: string
}

const PageTagsField = ({
  intentions,
  onToggleIntention,
  contexts,
  onChangeContexts,
  hints
}: PageTagsFieldProps) => {
  const selected: Context[] = contexts
    .map((slug) => taxonomyNodeById(slug))
    .filter((node): node is NonNullable<typeof node> => !!node)

  return (
    <div className="ptf">
      <section className="sis-section">
        <label className="sis-field-lab">Why? (optional)</label>
        <IntentionPills selected={intentions} onToggle={onToggleIntention} />
      </section>
      <section className="sis-section">
        <label className="sis-field-lab">Tags</label>
        <TagInput
          selected={selected}
          onChange={(next) => onChangeContexts(next.map((c) => c.id))}
          hints={hints}
        />
      </section>
    </div>
  )
}

export default PageTagsField
