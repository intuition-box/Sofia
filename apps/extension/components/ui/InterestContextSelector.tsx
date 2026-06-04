/**
 * InterestContextSelector — the Mark-page context picker, ported 1:1 from the
 * explorer's ContextPicker: a popover with a two-step CHECKBOX drill-down.
 * Open a topic to tick precise categories, or tick the whole topic. Multi-
 * select — every checked slug (topic or category) becomes an `in context of`
 * triple on submit.
 */
import { Check, ChevronRight, Plus } from "lucide-react"
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

import { SOFIA_TOPICS } from "@0xsofia/taxonomy"

import { TOPIC_COLORS, TOPIC_ICON, TOPIC_LABELS } from "~/lib/config/topicConfig"

import "../styles/ContextPicker.css"

interface InterestContextSelectorProps {
  /** Chosen context slugs — topics and/or categories. */
  selectedContexts: string[]
  onChange: (slugs: string[]) => void
  disabled?: boolean
  /** Context slugs already certified on-chain for this page — rendered as
   *  done/disabled so they can't be re-added. */
  certifiedContexts?: string[]
}

export const InterestContextSelector = memo(
  ({
    selectedContexts,
    onChange,
    disabled = false,
    certifiedContexts = [],
  }: InterestContextSelectorProps) => {
    const [open, setOpen] = useState(false)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [rect, setRect] = useState<{ top: number; left: number } | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popRef = useRef<HTMLDivElement>(null)

    const selected = useMemo(() => new Set(selectedContexts), [selectedContexts])
    const applied = useMemo(() => new Set(certifiedContexts), [certifiedContexts])

    useLayoutEffect(() => {
      if (!open || !triggerRef.current) return
      const place = () => {
        const r = triggerRef.current!.getBoundingClientRect()
        const popW = 300
        const left = Math.max(
          8,
          Math.min(r.left, window.innerWidth - popW - 8),
        )
        setRect({ top: r.bottom + 6, left })
      }
      place()
      window.addEventListener("scroll", place, true)
      window.addEventListener("resize", place)
      return () => {
        window.removeEventListener("scroll", place, true)
        window.removeEventListener("resize", place)
      }
    }, [open])

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

    const toggle = (slug: string) => {
      if (applied.has(slug)) return
      const next = new Set(selected)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      onChange([...next])
    }
    const toggleExpand = (slug: string) => {
      setExpanded((prev) => {
        const n = new Set(prev)
        if (n.has(slug)) n.delete(slug)
        else n.add(slug)
        return n
      })
    }

    const count = selectedContexts.length
    const triggerLabel =
      count === 0 ? "Add context" : `${count} context${count === 1 ? "" : "s"}`

    const panel =
      open && rect ? (
        <div
          ref={popRef}
          className="ext-ctx-pop"
          style={{ top: rect.top, left: rect.left }}
          role="dialog">
          <p className="ext-ctx-hint">
            Open a topic to tag a precise category, or tick the topic itself.
          </p>
          <div className="ext-ctx-list">
            {SOFIA_TOPICS.map((topic) => {
              const isSel = selected.has(topic.id)
              const isDone = applied.has(topic.id)
              const isOpen = expanded.has(topic.id)
              const hasCats = topic.categories.length > 0
              const color = TOPIC_COLORS[topic.id] ?? "#888888"
              const accent = { ["--ext-ctx-color" as string]: color }
              return (
                <div key={topic.id} className="ext-ctx-group">
                  <div
                    className={`ext-ctx-row${isSel ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                    style={accent}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSel || isDone}
                      disabled={isDone}
                      className="ext-ctx-check"
                      onClick={() => toggle(topic.id)}
                      aria-label={`Tag with ${TOPIC_LABELS[topic.id] ?? topic.id}`}>
                      {(isSel || isDone) && <Check size={12} aria-hidden />}
                    </button>
                    <button
                      type="button"
                      className="ext-ctx-main"
                      onClick={() =>
                        hasCats ? toggleExpand(topic.id) : toggle(topic.id)
                      }
                      aria-expanded={hasCats ? isOpen : undefined}>
                      <span
                        className="ext-ctx-glyph material-symbols-outlined"
                        style={{ background: color }}
                        aria-hidden>
                        {TOPIC_ICON[topic.id]}
                      </span>
                      <span className="ext-ctx-label">
                        {TOPIC_LABELS[topic.id] ?? topic.id}
                      </span>
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
                      {[...topic.categories]
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map((cat) => {
                          const cSel = selected.has(cat.id)
                          const cDone = applied.has(cat.id)
                          return (
                            <div
                              key={cat.id}
                              className={`ext-ctx-row ext-ctx-row--cat${cSel ? " is-active" : ""}${cDone ? " is-done" : ""}`}
                              style={accent}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={cSel || cDone}
                                disabled={cDone}
                                className="ext-ctx-check"
                                onClick={() => toggle(cat.id)}
                                aria-label={`Tag with ${cat.label}`}>
                                {(cSel || cDone) && (
                                  <Check size={12} aria-hidden />
                                )}
                              </button>
                              <button
                                type="button"
                                className="ext-ctx-main"
                                disabled={cDone}
                                onClick={() => toggle(cat.id)}>
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
            })}
          </div>
        </div>
      ) : null

    return (
      <div className="ext-ctx" ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`ext-ctx-trigger${count > 0 ? " has-value" : ""}`}
          aria-label="Add a topic or category context"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}>
          <Plus size={13} aria-hidden />
          <span>{triggerLabel}</span>
        </button>
        {panel && createPortal(panel, document.body)}
      </div>
    )
  },
)

export default InterestContextSelector
