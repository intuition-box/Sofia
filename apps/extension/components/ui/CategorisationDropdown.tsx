/**
 * CategorisationDropdown — a single combobox multi-select that merges the
 * Mark-page's two old pickers (verb + context) into one dropdown, following
 * the "Categorisation Sidepanel" design (option 2a): a closed field that shows
 * the current selection as removable chips, opening a searchable A→Z checklist.
 *
 * Verbs (the 8 intentions) render with their lucide glyph; topics render with
 * their Material Symbols pictogram and keep the category drill-down. Every row
 * is a checkbox — multi-select throughout. The parent owns the state: verbs
 * toggle straight into the cart, contexts flow through the same onChange as the
 * old InterestContextSelector so deposit auto-queueing is preserved.
 */
import { SOFIA_TOPICS } from "@0xsofia/taxonomy"
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react"
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { createPortal } from "react-dom"

import {
  contextColor,
  contextIcon,
  contextLabel
} from "~/lib/config/contextDisplay"
import { INTENTION_ICONS } from "~/lib/config/intentionIcons"
import {
  TOPIC_COLORS,
  TOPIC_ICON,
  TOPIC_LABELS
} from "~/lib/config/topicConfig"
import {
  INTENTION_CONFIG,
  type IntentionType
} from "~/types/intentionCategories"

import "../styles/FilterDropdown.css"
import "../styles/ContextPicker.css"
import "../styles/CategorisationDropdown.css"

// Trust verbs first, then the six purposes — same order as the old picker.
const VERB_TYPES: IntentionType[] = [
  "trusted",
  "distrusted",
  "work",
  "learning",
  "fun",
  "inspiration",
  "buying",
  "music"
]

interface CategorisationDropdownProps {
  /** Verbs currently queued (derived from the cart by the parent). */
  selectedIntentions: IntentionType[]
  /** Toggle a verb in/out of the cart. */
  onToggleIntention: (type: IntentionType) => void
  /** Chosen context slugs — topics and/or categories. */
  selectedContexts: string[]
  /** Fires with the full next slug array (same contract as the old
   *  InterestContextSelector so the parent's deposit auto-queue still runs). */
  onChangeContexts: (slugs: string[]) => void
  /** Context slugs already certified on-chain — shown checked + disabled. */
  certifiedContexts?: string[]
  disabled?: boolean
}

export const CategorisationDropdown = memo(
  ({
    selectedIntentions,
    onToggleIntention,
    selectedContexts,
    onChangeContexts,
    certifiedContexts = [],
    disabled = false
  }: CategorisationDropdownProps) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [rect, setRect] = useState<{
      top: number
      left: number
      width: number
    } | null>(null)

    const rootRef = useRef<HTMLDivElement>(null)
    const fieldRef = useRef<HTMLDivElement>(null)
    const popRef = useRef<HTMLDivElement>(null)

    const verbSet = useMemo(
      () => new Set(selectedIntentions),
      [selectedIntentions]
    )
    const ctxSet = useMemo(() => new Set(selectedContexts), [selectedContexts])
    const applied = useMemo(
      () => new Set(certifiedContexts),
      [certifiedContexts]
    )

    // ── positioning: portal panel anchored under the field ──
    useLayoutEffect(() => {
      if (!open || !fieldRef.current) return
      const place = () => {
        const r = fieldRef.current!.getBoundingClientRect()
        const width = Math.max(r.width, 300)
        const left = Math.max(
          8,
          Math.min(r.left, window.innerWidth - width - 8)
        )
        setRect({ top: r.bottom + 6, left, width })
      }
      place()
      window.addEventListener("scroll", place, true)
      window.addEventListener("resize", place)
      return () => {
        window.removeEventListener("scroll", place, true)
        window.removeEventListener("resize", place)
      }
    }, [open])

    // ── outside-click + escape ──
    useEffect(() => {
      if (!open) return
      const onDown = (e: MouseEvent) => {
        const t = e.target as Node
        if (rootRef.current?.contains(t)) return
        if (popRef.current?.contains(t)) return
        setOpen(false)
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

    const toggleContext = (slug: string) => {
      if (applied.has(slug)) return
      const next = new Set(ctxSet)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      onChangeContexts([...next])
    }

    const toggleExpand = (slug: string) => {
      setExpanded((prev) => {
        const n = new Set(prev)
        if (n.has(slug)) n.delete(slug)
        else n.add(slug)
        return n
      })
    }

    const clearAll = () => {
      selectedIntentions.forEach(onToggleIntention)
      if (selectedContexts.length > 0) onChangeContexts([])
    }

    // ── filtered rows ──
    const q = query.trim().toLowerCase()

    const verbRows = useMemo(
      () =>
        VERB_TYPES.filter(
          (t) => !q || INTENTION_CONFIG[t].label.toLowerCase().includes(q)
        ).sort((a, b) =>
          INTENTION_CONFIG[a].label.localeCompare(INTENTION_CONFIG[b].label)
        ),
      [q]
    )

    const topicEntries = useMemo(
      () =>
        SOFIA_TOPICS.map((topic) => {
          const label = TOPIC_LABELS[topic.id] ?? topic.id
          const cats = topic.categories ?? []
          const topicMatch = !q || label.toLowerCase().includes(q)
          const matchingCats = cats.filter(
            (c) => !q || c.label.toLowerCase().includes(q)
          )
          const visible = topicMatch || matchingCats.length > 0
          return {
            topic,
            label,
            visible,
            hasCats: cats.length > 0,
            shownCats: q ? matchingCats : cats,
            forceExpand: !!q && matchingCats.length > 0
          }
        })
          .filter((e) => e.visible)
          .sort((a, b) => a.label.localeCompare(b.label)),
      [q]
    )

    const noResults = verbRows.length === 0 && topicEntries.length === 0

    // ── chips (field) — reuse the shared .fc-verb-tag look so they render
    // identically to the Stats tags. Verbs carry their intent class; topics
    // pass their color through --verb-color. ──
    const verbChips = selectedIntentions.map((type) => {
      const Icon = INTENTION_ICONS[type]
      return (
        <span key={`v-${type}`} className={`fc-verb-tag ${type} ext-cat-chip`}>
          <Icon className="fc-verb-ic" aria-hidden />
          <span>{INTENTION_CONFIG[type].label}</span>
          <button
            type="button"
            className="ext-cat-chip-x"
            aria-label={`Remove ${INTENTION_CONFIG[type].label}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleIntention(type)
            }}>
            <X size={11} aria-hidden />
          </button>
        </span>
      )
    })

    const ctxChips = selectedContexts.map((slug) => {
      const color = contextColor(slug)
      return (
        <span
          key={`c-${slug}`}
          className="fc-verb-tag ext-cat-chip"
          style={{ ["--verb-color" as string]: color }}>
          <span
            className="ext-cat-chip-glyph material-symbols-outlined"
            aria-hidden>
            {contextIcon(slug)}
          </span>
          <span>{contextLabel(slug) ?? slug}</span>
          <button
            type="button"
            className="ext-cat-chip-x"
            aria-label={`Remove ${contextLabel(slug) ?? slug}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleContext(slug)
            }}>
            <X size={11} aria-hidden />
          </button>
        </span>
      )
    })

    const count = selectedIntentions.length + selectedContexts.length
    const hasSelection = count > 0

    // ── verb row ──
    const renderVerbRow = (type: IntentionType) => {
      const Icon = INTENTION_ICONS[type]
      const color = INTENTION_CONFIG[type].color
      const isSel = verbSet.has(type)
      return (
        <div
          key={type}
          className={`ext-ctx-row${isSel ? " is-active" : ""}`}
          style={{ ["--ext-ctx-color" as string]: color }}>
          <button
            type="button"
            role="checkbox"
            aria-checked={isSel}
            className="ext-ctx-check"
            onClick={() => onToggleIntention(type)}
            aria-label={`Tag with ${INTENTION_CONFIG[type].label}`}>
            {isSel && <Check size={12} aria-hidden />}
          </button>
          <button
            type="button"
            className="ext-ctx-main"
            onClick={() => onToggleIntention(type)}>
            <span
              className="ext-ctx-glyph ext-cat-verb-glyph"
              style={{ background: color }}
              aria-hidden>
              <Icon size={13} aria-hidden />
            </span>
            <span className="ext-ctx-label">
              {INTENTION_CONFIG[type].label}
            </span>
          </button>
        </div>
      )
    }

    const panel =
      open && rect ? (
        <div
          ref={popRef}
          className="ext-cat-pop"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
          role="dialog">
          <div className="ext-cat-search">
            <Search size={14} className="ext-cat-search-ic" aria-hidden />
            <input
              type="text"
              className="ext-cat-search-input"
              placeholder="Search tags…"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="ext-cat-list ext-ctx-list">
            {verbRows.length > 0 && (
              <>
                <p className="ext-cat-group-label">Verbs</p>
                {verbRows.map(renderVerbRow)}
              </>
            )}

            {topicEntries.length > 0 && (
              <>
                <p className="ext-cat-group-label">Topics</p>
                {topicEntries.map(
                  ({ topic, label, hasCats, shownCats, forceExpand }) => {
                    const isSel = ctxSet.has(topic.id)
                    const isDone = applied.has(topic.id)
                    const isOpen = expanded.has(topic.id) || forceExpand
                    const color = TOPIC_COLORS[topic.id] ?? "#888888"
                    const accent = { ["--ext-ctx-color" as string]: color }
                    return (
                      <div key={topic.id} className="ext-ctx-group">
                        <div
                          className={`ext-ctx-row is-context${isSel ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                          style={accent}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isSel || isDone}
                            disabled={isDone}
                            className="ext-ctx-check"
                            onClick={() => toggleContext(topic.id)}
                            aria-label={`Tag with ${label}`}>
                            {(isSel || isDone) && (
                              <Check size={12} aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            className="ext-ctx-main"
                            onClick={() =>
                              hasCats
                                ? toggleExpand(topic.id)
                                : toggleContext(topic.id)
                            }
                            aria-expanded={hasCats ? isOpen : undefined}>
                            <span
                              className="ext-ctx-glyph material-symbols-outlined"
                              style={{ background: color }}
                              aria-hidden>
                              {TOPIC_ICON[topic.id]}
                            </span>
                            <span className="ext-ctx-label">{label}</span>
                            {hasCats && (
                              <ChevronRight
                                size={15}
                                className={`ext-ctx-chev${isOpen ? " is-open" : ""}`}
                                aria-hidden
                              />
                            )}
                          </button>
                        </div>
                        {isOpen && hasCats && (
                          <div className="ext-ctx-cats">
                            {[...shownCats]
                              .sort((a, b) => a.label.localeCompare(b.label))
                              .map((cat) => {
                                const cSel = ctxSet.has(cat.id)
                                const cDone = applied.has(cat.id)
                                return (
                                  <div
                                    key={cat.id}
                                    className={`ext-ctx-row ext-ctx-row--cat is-context${cSel ? " is-active" : ""}${cDone ? " is-done" : ""}`}
                                    style={accent}>
                                    <button
                                      type="button"
                                      role="checkbox"
                                      aria-checked={cSel || cDone}
                                      disabled={cDone}
                                      className="ext-ctx-check"
                                      onClick={() => toggleContext(cat.id)}
                                      aria-label={`Tag with ${cat.label}`}>
                                      {(cSel || cDone) && (
                                        <Check size={12} aria-hidden />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      className="ext-ctx-main"
                                      disabled={cDone}
                                      onClick={() => toggleContext(cat.id)}>
                                      <span className="ext-ctx-cat-label">
                                        {cat.label}
                                      </span>
                                    </button>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  }
                )}
              </>
            )}

            {noResults && (
              <div className="ext-cat-empty">No matching tags.</div>
            )}
          </div>

          <div className="ext-cat-foot">
            <span className="ext-cat-count">
              {count === 0
                ? "No tags"
                : `${count} tag${count > 1 ? "s" : ""} selected`}
            </span>
            {hasSelection && (
              <button
                type="button"
                className="ext-cat-clear"
                onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>
      ) : null

    return (
      <div className="ext-cat" ref={rootRef}>
        <div
          ref={fieldRef}
          className={`ext-cat-field${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (disabled) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setOpen((v) => !v)
            }
          }}>
          {count === 0 ? (
            <span className="ext-cat-placeholder">Add a tag</span>
          ) : (
            <span className="ext-cat-chips">
              {verbChips}
              {ctxChips}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`ext-cat-caret${open ? " is-open" : ""}`}
            aria-hidden
          />
        </div>
        {panel && createPortal(panel, document.body)}
      </div>
    )
  }
)

export default CategorisationDropdown
