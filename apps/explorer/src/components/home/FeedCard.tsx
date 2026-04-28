/**
 * FeedCard — proto-styled URL card for the Home drill view.
 *
 * Mirrors the visual structure of proto-explorer's `.feed-card.fc-*`
 * (urlCard.ts + shared.css `fc-*`): favicon + title + host, an actor
 * line for the certifier, a bottom row with topic tags + verb tags +
 * support/oppose thumbs. No shadcn Card — bare DOM + DS tokens.
 *
 * Sofia data lacks the proto's star count + item description, so the
 * star badge and `fc-desc` sections aren't rendered here.
 */
import type { MouseEvent } from 'react'
import { FaviconWrapper } from '@0xsofia/design-system'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { CircleItem } from '@/services/circleService'
import { INTENTION_COLORS } from '@/config/intentions'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { timeAgo } from '@/utils/formatting'

interface FeedCardProps {
  item: CircleItem
  displayName: string
  avatar: string
  isPrivate?: boolean
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
}

function topicLabel(slug: string): string {
  return SOFIA_TOPICS.find((t) => t.id === slug)?.label ?? slug
}

/** Proto verb-tag class is lowercase — Sofia intentions come capitalised. */
function verbClass(intent: string): string {
  return intent.toLowerCase()
}

export default function FeedCard({
  item,
  displayName,
  avatar,
  isPrivate,
  onDeposit,
}: FeedCardProps) {
  const shownName = isPrivate ? 'Someone' : displayName
  const canSupport = Object.keys(item.intentionVaults).length > 0
  const canOppose = Object.values(item.intentionVaults).some((v) => v.counterTermId)

  const openUrl = () => {
    if (!item.url) return
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  const handlePos = (side: 'support' | 'oppose') => (e: MouseEvent) => {
    e.stopPropagation()
    onDeposit?.(side, item)
  }

  return (
    <article
      className="fc fc-standard"
      role="link"
      tabIndex={0}
      onClick={openUrl}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          openUrl()
        }
      }}
    >
      <div className="fc-head">
        <FaviconWrapper size={34} src={item.favicon} alt={item.domain} />
        <div className="fc-title-wrap">
          <div className="fc-title">{item.title}</div>
          <div className="fc-host">{item.domain}</div>
        </div>
      </div>

      <div className="fc-actor-line">
        {!isPrivate && avatar && (
          <img
            src={avatar}
            alt=""
            className="fc-actor-avatar"
            referrerPolicy="no-referrer"
          />
        )}
        <span className="fc-actor-ens">{shownName}</span>
        <span className="fc-actor-ago">{timeAgo(item.timestamp)}</span>
      </div>

      <div className="fc-bottom">
        <div className="fc-tags">
          {item.topicContexts?.slice(0, 2).map((slug) => (
            <span key={slug} className="fc-tag">
              {topicLabel(slug)}
            </span>
          ))}
          {item.intentions.map((intent) => (
            <span
              key={intent}
              className={`fc-verb-tag ${verbClass(intent)}`}
              style={{ background: INTENTION_COLORS[intent] ?? undefined }}
            >
              {intent}
            </span>
          ))}
        </div>

        {onDeposit && (canSupport || canOppose) && (
          <div className="fc-positions">
            <button
              type="button"
              className="fc-pos support"
              aria-label="Support"
              onClick={handlePos('support')}
              disabled={!canSupport}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="fc-pos oppose"
              aria-label="Oppose"
              onClick={handlePos('oppose')}
              disabled={!canOppose}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
