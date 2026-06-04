/**
 * UntaggedCertCard — one cert rendered as the shared feed-card, mirroring
 * the cards on `/profile/platform/:domain`: URL preview + title on top, then
 * a bottom row carrying the verb, any topics queued for tagging (removable),
 * and the <ContextPicker> "+ Context" button.
 *
 * The picker (multi-select + confirm) is the same control used on the feed
 * cards, so tagging behaves identically everywhere.
 */
import { useMemo } from 'react'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { INTENTION_COLORS } from '@/config/intentions'
import { useCart } from '@/hooks/useCart'
import { contextCartId } from '@/services/contextCartService'
import { UrlPreview } from '@/components/UrlPreview'
import ContextPicker from '@/components/ContextPicker'
import { VerbPill } from '@/components/profile/FeedPills'
import TopicBadge from './TopicBadge'
import '@/components/styles/feed-card.css'
import '@/components/styles/context-manager.css'

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
  // Intent colour for the verb pill — same INTENTION_COLORS the feed uses.
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
      className={`feed-card feed-card--has-header${queuedTopics.size > 0 ? ' ctx-card--active' : ''}`}
    >
      <UrlPreview
        variant="card"
        url={url}
        domain={domain}
        className="fc-thumb"
        alt={title || domain}
      />
      <div className="fc-head">
        <div className="fc-favicon">
          {favicon ? (
            <img
              className="fc-favicon-img"
              src={favicon}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            (title || domain).slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="fc-title-wrap">
          <div className="fc-title">{title || domain}</div>
          <div className="fc-host">{domain}</div>
        </div>
      </div>

      {/* Bottom row: verb + queued topics (removable) + the picker, same
          shape as the platform-page card's `.fc-bottom`. */}
      <div className="fc-bottom">
        <div className="fc-tags">
          <VerbPill label={intentionLabel} color={verbColor} />
          {queuedList.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="ctx-card-tag"
              style={{ ['--ctx-tag-color' as string]: topic.color }}
              onClick={() =>
                cart.removeItem(contextCartId(certTermId, topic.id))
              }
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
          <ContextPicker
            certTermId={certTermId}
            certTitle={title || domain}
            certFavicon={favicon}
          />
        </div>
      </div>
    </div>
  )
}
