/**
 * UntaggedCertRow — one cert + a strip of topic chips.
 *
 * Clicking a topic toggles the (cert, topic) cart item: a click adds
 * the corresponding nested-triple mint to the cart, a second click
 * removes it. Visual state mirrors the cart so the user always sees
 * what they've queued at a glance.
 */
import { useMemo } from 'react'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { getTopicEmoji } from '@/config/topicEmoji'
import { useCart } from '@/hooks/useCart'
import {
  buildContextCartItem,
  contextCartId,
} from '@/services/contextCartService'

interface UntaggedCertRowProps {
  certTermId: string
  title: string
  domain: string
  favicon: string
  intentionLabel: string
}

export default function UntaggedCertRow({
  certTermId,
  title,
  domain,
  favicon,
  intentionLabel,
}: UntaggedCertRowProps) {
  const cart = useCart()

  // Set of topic slugs queued for THIS cert. Recomputed from the cart
  // so external removals (e.g. via the cart drawer's "remove" button)
  // immediately turn the chip back off without an extra hook.
  const queuedTopics = useMemo(() => {
    const set = new Set<string>()
    for (const item of cart.items) {
      if (item.id.startsWith(`context-${certTermId}-`)) {
        // id shape: context-<certTermId>-<slug>
        const slug = item.id.slice(`context-${certTermId}-`.length)
        if (slug) set.add(slug)
      }
    }
    return set
  }, [cart.items, certTermId])

  const toggle = (slug: string, label: string, color: string) => {
    const id = contextCartId(certTermId, slug)
    if (queuedTopics.has(slug)) {
      cart.removeItem(id)
      return
    }
    const item = buildContextCartItem({
      certTermId,
      topicSlug: slug,
      topicLabel: label,
      topicColor: color,
      certTitle: title || domain,
      certFavicon: favicon,
    })
    if (item) cart.addItem(item)
  }

  return (
    <div className="ctx-row">
      <div className="ctx-row-head">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            referrerPolicy="no-referrer"
            className="ctx-row-favicon"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span className="ctx-row-favicon ctx-row-favicon--fallback" />
        )}
        <div className="ctx-row-meta">
          <span className="ctx-row-title">{title || domain}</span>
          <span className="ctx-row-sub">
            {intentionLabel}
            {domain ? ` · ${domain}` : ''}
          </span>
        </div>
        {queuedTopics.size > 0 && (
          <span className="ctx-row-badge">
            {queuedTopics.size} queued
          </span>
        )}
      </div>

      <div className="ctx-row-chips">
        {SOFIA_TOPICS.map((topic) => {
          const active = queuedTopics.has(topic.id)
          return (
            <button
              key={topic.id}
              type="button"
              className={`ctx-chip${active ? ' ctx-chip--active' : ''}`}
              onClick={() => toggle(topic.id, topic.label, topic.color)}
              style={
                active
                  ? ({ ['--ctx-chip-color' as string]: topic.color } as React.CSSProperties)
                  : undefined
              }
              aria-pressed={active}
            >
              <span className="ctx-chip-dot" style={{ background: topic.color }}>
                <span aria-hidden="true">{getTopicEmoji(topic.id) || '📌'}</span>
              </span>
              {topic.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
