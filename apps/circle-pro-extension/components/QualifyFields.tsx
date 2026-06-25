// The qualification fields — title (editable, pre-filled), free-text context,
// and taxonomy tags. Controlled, shared by the injected modal and the popup so
// "Share in Sofia" looks and behaves identically everywhere.
import { TagInput } from "~components/TagInput"
import type { Context } from "~lib/bookmarks"

export interface QualifyValue {
  title: string
  context: string
  contexts: Context[]
}

export const emptyQualify = (title = ""): QualifyValue => ({
  title,
  context: "",
  contexts: []
})

interface QualifyFieldsProps {
  value: QualifyValue
  onChange: (next: QualifyValue) => void
  /** Page metadata blob — drives the tag field's on-focus suggestions. */
  hints?: string
  compact?: boolean
}

export function QualifyFields({ value, onChange, hints, compact }: QualifyFieldsProps) {
  const set = <K extends keyof QualifyValue>(k: K, v: QualifyValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="sis-fields">
      <label className="sis-field-lab">Title</label>
      <input
        className="sis-title-input"
        value={value.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Title"
      />

      <label className="sis-field-lab">Context</label>
      <textarea
        className="sis-context-input"
        value={value.context}
        onChange={(e) => set("context", e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="Why is this useful? The context only you have…"
      />

      <label className="sis-field-lab">Tags</label>
      <TagInput
        selected={value.contexts}
        onChange={(c) => set("contexts", c)}
        hints={hints}
      />
    </div>
  )
}
