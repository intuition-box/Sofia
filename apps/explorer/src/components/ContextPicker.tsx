/**
 * ContextPicker — the ONE reusable "tag this URL with a topic" control,
 * shared across the explorer (feed cards on Explore / Circles / Scores, the
 * Context Manager, …).
 *
 * Opens a single-column popover; the user multi-selects topics and confirms,
 * which queues one `(cert, in_context_of, topic)` nested-triple mint per pick
 * into the cart (via `buildContextCartItems`). Topics already applied to the
 * cert — or already queued in the cart — render as done/disabled so they
 * can't be re-added.
 *
 * `variant` only swaps the trigger chrome; the popover body is identical
 * everywhere so the interaction is consistent across surfaces.
 */
import { useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { Plus, Check } from 'lucide-react'
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
  /** Topic slugs already tagged on this cert — shown as done. */
  existingTopics?: string[]
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

  const applied = useMemo(() => new Set(existingTopics), [existingTopics])

  // Topic slugs already queued in the cart for THIS cert, so a second open
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

  const confirm = (e: MouseEvent) => {
    e.stopPropagation()
    const topics = SOFIA_TOPICS.filter((t) => selected.has(t.id)).map((t) => ({
      slug: t.id,
      label: t.label,
      color: t.color,
    }))
    if (topics.length > 0) {
      cart.addItems(
        buildContextCartItems(certTermId, certTitle, certFavicon, topics),
      )
      cart.open()
    }
    setSelected(new Set())
    setOpen(false)
  }

  // No cert triple to attach to — hide rather than render a dead button.
  if (!certTermId) return null

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSelected(new Set())
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cp-trigger"
          aria-label="Add a topic context to this URL"
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
            const isDone = applied.has(topic.id) || queued.has(topic.id)
            const isSel = selected.has(topic.id)
            return (
              <button
                key={topic.id}
                type="button"
                disabled={isDone}
                className={`ctx-popover-item${isSel ? ' ctx-popover-item--active' : ''}${isDone ? ' ctx-popover-item--done' : ''}`}
                onClick={() => toggle(topic.id)}
                style={
                  isSel
                    ? ({
                        ['--ctx-tag-color' as string]: topic.color,
                      } as CSSProperties)
                    : undefined
                }
              >
                <TopicBadge
                  topicId={topic.id}
                  color={topic.color}
                  size={22}
                  title={topic.label}
                />
                <span className="ctx-popover-label">{topic.label}</span>
                {(isSel || isDone) && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="ctx-popover-confirm"
          disabled={selected.size === 0}
          onClick={confirm}
        >
          {selected.size > 0 ? `Add to cart (${selected.size})` : 'Select topics'}
        </button>
      </PopoverContent>
    </Popover>
  )
}
