/**
 * UntaggedCertCard — one cert rendered as a feed-style card with a
 * popover topic picker.
 *
 * Each card shows the cert's favicon / title / host, the topics
 * already queued for tagging (real-time mirror of the cart) and a
 * "Add topics" button that opens a popover with the full taxonomy.
 * Toggling a topic chip queues or un-queues the matching nested
 * triple via the cart.
 */
import { useMemo } from 'react'
import { Plus, Check } from 'lucide-react'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { useCart } from '@/hooks/useCart'
import {
  buildContextCartItem,
  contextCartId,
} from '@/services/contextCartService'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import TopicBadge from './TopicBadge'

interface UntaggedCertCardProps {
  certTermId: string
  title: string
  domain: string
  favicon: string
  intentionLabel: string
}

const TOPIC_BY_ID = new Map(SOFIA_TOPICS.map((t) => [t.id, t]))

export default function UntaggedCertCard({
  certTermId,
  title,
  domain,
  favicon,
  intentionLabel,
}: UntaggedCertCardProps) {
  const cart = useCart()

  // Set of topic slugs queued for THIS cert. Recomputed from the cart
  // so external removals (cart drawer, batch submit) immediately
  // update the card without a manual sync.
  const queuedTopics = useMemo(() => {
    const set = new Set<string>()
    const prefix = `context-${certTermId}-`
    for (const item of cart.items) {
      if (item.id.startsWith(prefix)) {
        const slug = item.id.slice(prefix.length)
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

  const queuedList = [...queuedTopics]
    .map((slug) => TOPIC_BY_ID.get(slug))
    .filter((t): t is (typeof SOFIA_TOPICS)[number] => !!t)

  return (
    <div
      className={`ctx-card${queuedTopics.size > 0 ? ' ctx-card--active' : ''}`}
    >
      <div className="ctx-card-head">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            referrerPolicy="no-referrer"
            className="ctx-card-favicon"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span className="ctx-card-favicon ctx-card-favicon--fallback" />
        )}
        <div className="ctx-card-meta">
          <span className="ctx-card-title">{title || domain}</span>
          <span className="ctx-card-sub">
            {intentionLabel}
            {domain ? ` · ${domain}` : ''}
          </span>
        </div>
      </div>

      {queuedList.length > 0 && (
        <div className="ctx-card-tags">
          {queuedList.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="ctx-card-tag"
              style={{ ['--ctx-tag-color' as string]: topic.color }}
              onClick={() => toggle(topic.id, topic.label, topic.color)}
              title="Remove from cart"
            >
              <TopicBadge
                topicId={topic.id}
                color={topic.color}
                size={16}
                title={topic.label}
              />
              {topic.label}
              <span className="ctx-card-tag-remove" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="ctx-card-add">
            <Plus className="h-3.5 w-3.5" />
            {queuedTopics.size === 0 ? 'Add topics' : 'Edit topics'}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="ctx-popover"
          sideOffset={6}
        >
          <p className="ctx-popover-title">Tag this URL with…</p>
          <div className="ctx-popover-list">
            {SOFIA_TOPICS.map((topic) => {
              const active = queuedTopics.has(topic.id)
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`ctx-popover-item${active ? ' ctx-popover-item--active' : ''}`}
                  onClick={() => toggle(topic.id, topic.label, topic.color)}
                  style={
                    active
                      ? ({ ['--ctx-tag-color' as string]: topic.color } as React.CSSProperties)
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
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
