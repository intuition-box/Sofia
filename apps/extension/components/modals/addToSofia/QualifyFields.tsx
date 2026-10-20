// The qualification fields for "Add to Sofia": an editable title, optional
// intention tags and taxonomy tags — all tags on the page's Recommend.
// Controlled.
//
// PRO (later): the prototype also had a free-text `context` note. It's kept on
// the value shape + commented in the UI below so the Pro bookmark flow can
// revive it without re-deriving the component.
import { IntentionPills } from "~components/modals/addToSofia/IntentionPills"
import { TagInput } from "~components/modals/addToSofia/TagInput"
import { TitleSearchInput } from "~components/modals/addToSofia/TitleSearchInput"
import type { Context } from "~lib/addToSofia/types"
import type { IntentionPurpose } from "~types/intentionCategories"

export interface QualifyValue {
  title: string
  /** Optional intention tags (`intent:work`…) on the page's Recommend */
  intentions: IntentionPurpose[]
  /** Taxonomy tags → the cart item's interestContexts. */
  contexts: Context[]
  /** Set when the user picked an existing atom in the title search → the cart
   *  reuses it (deposit on its term_id). Cleared when the title is edited. */
  objectTermId: string | null
  // PRO (later): free-text editorial note ("the context only you have").
  context: string
}

export const emptyQualify = (title = ""): QualifyValue => ({
  title,
  intentions: [],
  contexts: [],
  objectTermId: null,
  context: ""
})

interface QualifyFieldsProps {
  value: QualifyValue
  onChange: (next: QualifyValue) => void
  /** Page metadata blob — drives the tag field's on-focus suggestions. */
  hints?: string
}

export function QualifyFields({ value, onChange, hints }: QualifyFieldsProps) {
  const set = <K extends keyof QualifyValue>(k: K, v: QualifyValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="sis-fields">
      <section className="sis-section">
        <label className="sis-field-lab">Title</label>
        <TitleSearchInput
          value={value.title}
          picked={!!value.objectTermId}
          // Free typing clears any picked atom → a new one is created from the URL.
          onChange={(title) => onChange({ ...value, title, objectTermId: null })}
          // Picked an existing atom → reuse its term_id, show its label.
          onPick={(atom) =>
            onChange({ ...value, title: atom.label, objectTermId: atom.termId })
          }
        />
      </section>

      <section className="sis-section">
        <label className="sis-field-lab">Why? (optional tags)</label>
        <IntentionPills
          selected={value.intentions}
          // Multi-select: toggle this intention in/out of the set.
          onToggle={(key) =>
            set(
              "intentions",
              value.intentions.includes(key)
                ? value.intentions.filter((k) => k !== key)
                : [...value.intentions, key]
            )
          }
        />
      </section>

      {/* PRO (later): free-text editorial context. Revive for the Pro flow.
      <section className="sis-section">
        <label className="sis-field-lab">Context</label>
        <textarea
          className="sis-context-input"
          value={value.context}
          onChange={(e) => set("context", e.target.value)}
          rows={3}
          placeholder="Why is this useful? The context only you have…"
        />
      </section> */}

      <section className="sis-section">
        <label className="sis-field-lab">Tags</label>
        <TagInput
          selected={value.contexts}
          onChange={(c) => set("contexts", c)}
          hints={hints}
        />
      </section>
    </div>
  )
}
