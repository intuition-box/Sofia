/**
 * ContextPicker — the ONE reusable "tag this URL with a context" control,
 * shared across the explorer (feed cards on Explore / Circles / Scores, the
 * Context Manager, …).
 *
 * Opens a single-column popover. The user multi-selects CONTEXTS — either a
 * whole topic (e.g. "Web3") or, by expanding a topic, one of its categories
 * (e.g. "DeFi") for a sharper tag. Confirming queues one
 * `(cert, in_context_of, <topic|category>)` nested-triple mint per pick into
 * the cart (via `buildContextCartItems`). A category scores under its parent
 * topic (rollup), so the user gets precision without splitting the score.
 *
 * Contexts already applied to the cert — or already queued — render as
 * done/disabled so they can't be re-added.
 */
import { useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { Plus, Check, ChevronRight } from 'lucide-react'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { useCart } from '@/hooks/useCart'
import { buildContextCartItems } from '@/services/contextCartService'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import TopicBadge from '@/components/profile/TopicBadge'
import '@/components/styles/context-manager.css'

export interface ContextPickerProps {
  /** Cert triple term_id — the new "in context of" triple's subject. */
  certTermId: string
  /** Title surfaced in the cart row + WeightModal triplet card. */
  certTitle: string
  /** Optional favicon shown next to the cart row. */
  certFavicon?: string
  /** Context slugs already tagged on this cert (topics or categories) —
   *  shown as done. */
  existingTopics?: string[]
}

/** slug → { label, color } for every selectable context (topics +
 *  categories), so confirm can resolve a pick without re-walking the tree. */
const CONTEXT_META = new Map<string, { label: string; color: string }>()
for (const topic of SOFIA_TOPICS) {
  CONTEXT_META.set(topic.id, { label: topic.label, color: topic.color })
  for (const cat of topic.categories) {
    CONTEXT_META.set(cat.id, { label: cat.label, color: topic.color })
  }
}

export default function ContextPicker({
  certTermId,
  certTitle,
  certFavicon,
  existingTopics = [],
}: ContextPickerProps) {
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const applied = useMemo(() => new Set(existingTopics), [existingTopics])

  // Context slugs already queued in the cart for THIS cert, so a second open
  // doesn't offer to add them again.
  const queued = useMemo(() => {
    const set = new Set<string>()
    const prefix = `context-${certTermId}-`
    for (const item of cart.items) {
      if (item.id.startsWith(prefix)) set.add(item.id.slice(prefix.length))
    }
    return set
  }, [cart.items, certTermId])

  const stop = (e: MouseEvent) => e.stopPropagation()

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const confirm = (e: MouseEvent) => {
    e.stopPropagation()
    const picks = [...selected]
      .map((slug) => {
        const meta = CONTEXT_META.get(slug)
        return meta ? { slug, label: meta.label, color: meta.color } : null
      })
      .filter((p): p is { slug: string; label: string; color: string } => !!p)
    if (picks.length > 0) {
      cart.addItems(
        buildContextCartItems(certTermId, certTitle, certFavicon, picks),
      )
      cart.open()
    }
    setSelected(new Set())
    setOpen(false)
  }

  // No cert triple to attach to — hide rather than render a dead button.
  if (!certTermId) return null

  const renderState = (slug: string) => {
    const isDone = applied.has(slug) || queued.has(slug)
    return { isDone, isSel: selected.has(slug) }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setSelected(new Set())
          setExpanded(new Set())
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cp-trigger"
          aria-label="Add a topic or category context to this URL"
          onClick={stop}
        >
          <Plus aria-hidden="true" />
          Context
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="ctx-popover"
        onClick={stop}
      >
        <p className="ctx-popover-title">Tag this URL with…</p>
        <div className="ctx-popover-list">
          {SOFIA_TOPICS.map((topic) => {
            const { isDone, isSel } = renderState(topic.id)
            const isOpen = expanded.has(topic.id)
            const hasCats = topic.categories.length > 0
            const accent = {
              ['--ctx-tag-color' as string]: topic.color,
            } as CSSProperties
            return (
              <div key={topic.id} className="ctx-pick-group">
                <div
                  className={`ctx-pick-row${isSel ? ' ctx-pick-row--active' : ''}${isDone ? ' ctx-pick-row--done' : ''}`}
                  style={accent}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSel || isDone}
                    disabled={isDone}
                    className="ctx-check"
                    onClick={() => toggle(topic.id)}
                    aria-label={`Tag with ${topic.label}`}
                  >
                    {(isSel || isDone) && (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="ctx-pick-main"
                    onClick={() =>
                      hasCats ? toggleExpand(topic.id) : toggle(topic.id)
                    }
                    aria-expanded={hasCats ? isOpen : undefined}
                  >
                    <TopicBadge
                      topicId={topic.id}
                      color={topic.color}
                      size={22}
                      title={topic.label}
                    />
                    <span className="ctx-pick-label">{topic.label}</span>
                    {hasCats && (
                      <ChevronRight
                        className={`ctx-pick-chevron h-4 w-4${isOpen ? ' ctx-pick-chevron--open' : ''}`}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
                {isOpen && hasCats && (
                  <div className="ctx-pick-cats">
                    {[...topic.categories]
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((cat) => {
                        const cs = renderState(cat.id)
                        return (
                          <div
                            key={cat.id}
                            className={`ctx-pick-row ctx-pick-row--cat${cs.isSel ? ' ctx-pick-row--active' : ''}${cs.isDone ? ' ctx-pick-row--done' : ''}`}
                            style={accent}
                          >
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={cs.isSel || cs.isDone}
                              disabled={cs.isDone}
                              className="ctx-check"
                              onClick={() => toggle(cat.id)}
                              aria-label={`Tag with ${cat.label}`}
                            >
                              {(cs.isSel || cs.isDone) && (
                                <Check className="h-3 w-3" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              className="ctx-pick-main"
                              disabled={cs.isDone}
                              onClick={() => toggle(cat.id)}
                            >
                              <span className="ctx-pick-cat-label">
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
        <button
          type="button"
          className="ctx-popover-confirm"
          disabled={selected.size === 0}
          onClick={confirm}
        >
          {selected.size > 0
            ? `Add to cart (${selected.size})`
            : 'Select a context'}
        </button>
      </PopoverContent>
    </Popover>
  )
}
