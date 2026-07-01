// The qualification fields for "Add to Sofia": an editable title, one or more
// intentions (a cart predicate each) and taxonomy tags (the cart's contexts).
// Controlled.
//
// PRO (later): the prototype also had a free-text `context` note. It's kept on
// the value shape + commented in the UI below so the Pro bookmark flow can
// revive it without re-deriving the component.
import type { CSSProperties } from "react"

import { TagInput } from "~components/modals/addToSofia/TagInput"
import { TitleSearchInput } from "~components/modals/addToSofia/TitleSearchInput"
import type { Context } from "~lib/addToSofia/types"
import { INTENTION_ICONS } from "~lib/config/intentionIcons"
import {
  INTENTION_CONFIG,
  INTENTION_ITEMS,
  type IntentionPurpose
} from "~types/intentionCategories"

export interface QualifyValue {
  title: string
  /** Chosen intentions → one cart item (predicate) per selection. At least one
   *  is required to submit. */
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
        <label className="sis-field-lab">Intentions</label>
        <div className="sis-intentions">
          {INTENTION_ITEMS.map((it) => {
            const color = INTENTION_CONFIG[it.type].color
            const on = value.intentions.includes(it.key)
            const Glyph = INTENTION_ICONS[it.type]
            return (
              <button
                key={it.key}
                type="button"
                className={`sis-intention${on ? " on" : ""}`}
                style={{ "--c": color } as CSSProperties}
                // Multi-select: toggle this intention in/out of the set.
                onClick={() =>
                  set(
                    "intentions",
                    on
                      ? value.intentions.filter((k) => k !== it.key)
                      : [...value.intentions, it.key]
                  )
                }>
                {Glyph ? (
                  <Glyph
                    className="sis-intention-glyph"
                    size={14}
                    style={{ color }}
                  />
                ) : null}
                {INTENTION_CONFIG[it.type].label}
              </button>
            )
          })}
        </div>
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
