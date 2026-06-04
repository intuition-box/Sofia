/**
 * UntaggedCertCard — one cert rendered as a feed-style card with the shared
 * <ContextPicker> topic picker.
 *
 * Shows the cert's favicon / title / host, the topics already queued for
 * tagging (real-time mirror of the cart, each removable) and the picker's
 * "Add topics" button. The picker (multi-select + confirm) is the same
 * control used on the feed cards, so tagging behaves identically everywhere.
 */
import { useMemo } from 'react'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { INTENTION_COLORS } from '@/config/intentions'
import { useCart } from '@/hooks/useCart'
import { contextCartId } from '@/services/contextCartService'
import { UrlPreview } from '@/components/UrlPreview'
import ContextPicker from '@/components/ContextPicker'
import TopicBadge from './TopicBadge'
import '@/components/styles/feed-card.css'

interface UntaggedCertCardProps {
  certTermId: string
  title: string
  url: string
  domain: string
  favicon: string
  intentionLabel: string
}

const TOPIC_BY_ID = new Map(SOFIA_TOPICS.map((t) => [t.id, t]))

export default function UntaggedCertCard({
  certTermId,
  title,
  url,
  domain,
  favicon,
  intentionLabel,
}: UntaggedCertCardProps) {
  const cart = useCart()
  // Intent colour for the verb chip — same `.fc-verb` style as the feed cards.
  const verbColor = INTENTION_COLORS[intentionLabel] ?? 'var(--ds-muted)'

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

  const queuedList = [...queuedTopics]
    .map((slug) => TOPIC_BY_ID.get(slug))
    .filter((t): t is (typeof SOFIA_TOPICS)[number] => !!t)

  return (
    <div
      className={`ctx-card ctx-card--has-thumb${queuedTopics.size > 0 ? ' ctx-card--active' : ''}`}
    >
      <UrlPreview
        variant="card"
        url={url}
        domain={domain}
        className="ctx-card-thumb"
        alt={title || domain}
      />
      <div className="ctx-card-body">
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
          <div className="ctx-card-sub-row">
            <span
              className="fc-verb"
              style={{ ['--vc' as string]: verbColor }}
            >
              <i aria-hidden="true" />
              {intentionLabel}
            </span>
            {domain && <span className="ctx-card-sub">{domain}</span>}
          </div>
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
              onClick={() => cart.removeItem(contextCartId(certTermId, topic.id))}
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
      </div>

      <ContextPicker
        certTermId={certTermId}
        certTitle={title || domain}
        certFavicon={favicon}
      />
    </div>
  )
}
