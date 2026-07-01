// Tag field over the Sofia taxonomy — Dropmark-style "Enter tags…" constrained
// to the taxonomy. Selected tags show as colored pills; on focus it suggests
// tags inferred from the page metadata (before typing); typing then searches.
import { useMemo, useRef, useState, type CSSProperties } from "react"

import { suggestFromText } from "~lib/addToSofia/suggest"
import { getTopicLucideIcon } from "~lib/config/topicIcons"
import { searchTaxonomy, type TaxoNode } from "~lib/addToSofia/taxonomyIndex"
import type { Context } from "~lib/addToSofia/types"

interface TagInputProps {
  selected: Context[]
  onChange: (next: Context[]) => void
  /** Page metadata blob — drives the on-focus suggestions. */
  hints?: string
}

export function TagInput({ selected, onChange, hints = "" }: TagInputProps) {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedIds = useMemo(
    () => new Set(selected.map((c) => c.id)),
    [selected]
  )

  // Typing → search; empty + focused → suggestions from the page metadata.
  const fromMeta = !query.trim()
  const matches: TaxoNode[] = useMemo(() => {
    if (query.trim()) return searchTaxonomy(query, selectedIds)
    if (focused) return suggestFromText(hints, selectedIds)
    return []
  }, [query, selectedIds, focused, hints])

  const add = (c: Context) => {
    onChange([
      ...selected,
      { id: c.id, label: c.label, color: c.color, level: c.level }
    ])
    setQuery("")
    setActive(0)
    inputRef.current?.focus()
  }

  const remove = (id: string) => onChange(selected.filter((c) => c.id !== id))

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && matches[active]) {
      e.preventDefault()
      add(matches[active])
    } else if (e.key === "Backspace" && !query && selected.length) {
      remove(selected[selected.length - 1].id)
    }
  }

  return (
    <div className="sis-tags">
      <div className="sis-tags-field">
        {selected.map((c) => (
          <span
            className="sis-tag"
            key={c.id}
            style={{ "--c": c.color } as CSSProperties}>
            <span className="sis-tag-dot" style={{ background: c.color }} />
            {c.label}
            <button
              className="sis-tag-x"
              onClick={() => remove(c.id)}
              aria-label="Remove">
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="sis-tags-input"
          placeholder={selected.length ? "" : "Enter tags…"}
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {matches.length ? (
        <div className="sis-suggest">
          {fromMeta ? (
            <div className="sis-suggest-head">Suggested from this page</div>
          ) : null}
          {matches.map((m, i) => {
            const Icon = getTopicLucideIcon(m.topicId)
            return (
              <button
                key={m.id}
                className={`sis-suggest-row${i === active ? " active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => add(m)}>
                <Icon
                  className="sis-suggest-ico"
                  size={15}
                  style={{ color: m.color }}
                />
                <span className="sis-suggest-label">{m.label}</span>
                <span className="sis-suggest-path">{m.path}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
