/**
 * FilterDropdown — self-contained dropdown ported from the explorer's
 * CircleVerb/TopicFilterDropdown (no Radix; the extension has no popover
 * primitive). Trigger reads as `[dot] LABEL · <active> ▾`; the panel is a
 * grid of color-dotted cells with a Reset. Filtering is client-side — the
 * parent owns the value and applies it over already-loaded data, exactly
 * like CircleFeedSection in the explorer.
 */
import { ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import "../styles/FilterDropdown.css"

export interface FilterOption {
  id: string
  label: string
  /** Optional swatch color (intention / topic palette). */
  color?: string
  /** Material Symbols glyph name. When set the dot enlarges and hosts
   *  the monochrome pictogram — same silhouette as the explorer's
   *  TopicBadge. Verbs leave this unset → plain small dot. */
  icon?: string
}

interface FilterDropdownProps {
  /** Static label shown before the active value (e.g. "Verbs"). */
  label: string
  /** Active option id, or "all". */
  value: string
  onChange: (id: string) => void
  /** Options excluding the implicit "All" entry. */
  options: FilterOption[]
  /** Wider trigger for long values (topics). */
  wide?: boolean
}

const MUTED = "var(--ds-muted, #888)"

/** Colored disc; hosts a Material Symbols glyph when `icon` is set
 *  (topics) and stays a plain small dot otherwise (verbs / "All"). */
function Dot({
  base,
  color,
  icon
}: {
  base: string
  color: string
  icon?: string
}) {
  return (
    <span
      className={`${base}${icon ? " has-icon" : ""}`}
      style={{ background: color }}
      aria-hidden="true">
      {icon && (
        <span className="material-symbols-outlined ext-filter-glyph">
          {icon}
        </span>
      )}
    </span>
  )
}

export default function FilterDropdown({
  label,
  value,
  onChange,
  options,
  wide = false
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const activeOption =
    value === "all" ? null : options.find((o) => o.id === value)
  const activeLabel = activeOption ? activeOption.label : "All"
  const dotColor = activeOption?.color ?? MUTED

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div className="ext-filter" ref={rootRef}>
      <button
        type="button"
        className={`ext-filter-trigger${wide ? " ext-filter-trigger--wide" : ""}`}
        aria-label={`Filter by ${label.toLowerCase()}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}>
        <Dot
          base="ext-filter-trigger__dot"
          color={dotColor}
          icon={activeOption?.icon}
        />
        <span className="ext-filter-trigger__label">{label}</span>
        <span className="ext-filter-trigger__value">{activeLabel}</span>
        <ChevronDown size={12} className="ext-filter-trigger__chev" />
      </button>

      {open && (
        <div className="ext-filter-pop" role="listbox">
          <div className="ext-filter-pop__grid">
            <button
              type="button"
              className={`ext-filter-pop__cell${value === "all" ? " is-active" : ""}`}
              onClick={() => handleSelect("all")}>
              <Dot base="ext-filter-pop__dot" color={MUTED} />
              All
            </button>
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`ext-filter-pop__cell${value === o.id ? " is-active" : ""}`}
                onClick={() => handleSelect(o.id)}>
                <Dot
                  base="ext-filter-pop__dot"
                  color={o.color ?? MUTED}
                  icon={o.icon}
                />
                {o.label}
              </button>
            ))}
          </div>
          {value !== "all" && (
            <button
              type="button"
              className="ext-filter-pop__reset"
              onClick={() => handleSelect("all")}>
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}
