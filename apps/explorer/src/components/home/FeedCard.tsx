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
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { CircleItem } from '@/services/circleService'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { INTENTION_COLORS } from '@/config/intentions'
import { timeAgo } from '@/utils/formatting'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill, VerbPill } from '@/components/profile/FeedPills'

function topicMeta(slug: string) {
  return SOFIA_TOPICS.find((t) => t.id === slug)
}

interface FeedCardProps {
  item: CircleItem
  displayName: string
  avatar: string
  isPrivate?: boolean
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
}

export default function FeedCard({
  item,
  displayName,
  avatar,
  isPrivate,
  onDeposit,
}: FeedCardProps) {
  const shownName = isPrivate ? 'Someone' : displayName

  // Aggregate position counts + the viewer's own stake across every
  // intention vault — same rule as CircleFeedCard. `userSupported` /
  // `userOpposed` come from the feed payload (useSofiaFeed passes the
  // viewer's wallets), so a thumb the user has staked on stays lit
  // across reloads instead of resetting on every render.
  let supports = 0
  let opposes = 0
  let userSupported = false
  let userOpposed = false
  for (const v of Object.values(item.intentionVaults)) {
    supports += v.supportCount
    opposes += v.opposeCount
    if (v.userSupported) userSupported = true
    if (v.userOpposed) userOpposed = true
  }
  const canSupport = Object.values(item.intentionVaults).some((v) => v.termId)
  const canOppose = Object.values(item.intentionVaults).some(
    (v) => v.counterTermId,
  )

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
      className="fc fc-standard fc--has-header"
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
      <UrlPreview
        variant="card"
        url={item.url}
        domain={item.domain}
        className="fc-thumb"
        alt={item.title || item.domain}
      />
      <div className="fc-head">
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
          {item.topicContexts?.slice(0, 2).map((slug) => {
            const meta = topicMeta(slug)
            return (
              <TopicPill
                key={slug}
                topicId={slug}
                color={meta?.color ?? 'var(--ds-muted)'}
                label={meta?.label ?? slug}
              />
            )
          })}
          {item.intentions.map((intent) => (
            <VerbPill key={intent} label={intent} color={INTENTION_COLORS[intent]} />
          ))}
        </div>

        {onDeposit && (canSupport || canOppose) && (
          <div className="fc-positions">
            <button
              type="button"
              className={`fc-pos support${userSupported ? ' active' : ''}`}
              data-count={supports}
              aria-label={`Support (${supports})`}
              aria-pressed={userSupported}
              title={
                userSupported
                  ? `You supported · ${supports} total`
                  : `${supports} support`
              }
              onClick={handlePos('support')}
              disabled={!canSupport}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`fc-pos oppose${userOpposed ? ' active' : ''}`}
              data-count={opposes}
              aria-label={`Oppose (${opposes})`}
              aria-pressed={userOpposed}
              title={
                userOpposed
                  ? `You opposed · ${opposes} total`
                  : `${opposes} oppose`
              }
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
