/**
 * CircleFeedCard — single feed item styled 1:1 with the proto `.feed-card`.
 *
 * Covers: favicon + title + host, optional "Certified by" endorser row,
 * topic tags, intent verb pills, star badge (proto `computeStars` rule)
 * and support/oppose thumb buttons.
 *
 * Support / oppose counts are summed across all intention vaults of the
 * item from the position counts (all bonding curves) returned by
 * `GetSofiaTrustedActivity`. Clicking a thumb fires `onDeposit` so the
 * parent can route the action through the cart (and the predicate
 * picker for multi-intention items), mirroring DashboardPage.
 */
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { CircleItem } from '@/services/circleService'
import {
  displayLabelToIntentionType,
  INTENTION_CONFIG,
} from '@/config/intentions'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'
import TopicBadge from '@/components/profile/TopicBadge'

interface CircleFeedCardProps {
  item: CircleItem
  /** Display name + avatar of the certifier, resolved via `useEnsNames`. */
  certifierName: string
  certifierAvatar: string
  /**
   * Fires when the user clicks support/oppose. The parent owns the cart
   * and the optional PredicatePicker for items with multiple intentions.
   * When omitted, the thumbs render as display-only (no click handler).
   */
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
  /**
   * Live set of term_ids the user has shares > 0 on, sourced from the
   * realtime positions cache. Unioned with the per-vault `userSupported`
   * / `userOpposed` flags from the feed payload so the thumb state
   * updates instantly after a deposit without waiting for a refetch.
   */
  livePositionTermIds?: ReadonlySet<string>
}

const VERB_CLASS_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(INTENTION_CONFIG).map((v) => [v.label, v.cssClass]),
)

/** Proto `computeStars(supports)` — buckets 1..5. */
function computeStars(supports: number): number {
  if (supports >= 20) return 5
  if (supports >= 14) return 4
  if (supports >= 9) return 3
  if (supports >= 5) return 2
  return 1
}
function starLabel(stars: number): string {
  if (stars >= 5) return 'Highly recommended'
  if (stars >= 4) return 'Recommended'
  if (stars >= 3) return 'Moderate'
  if (stars >= 2) return 'Low engagement'
  return 'New'
}

export default function CircleFeedCard({
  item,
  certifierName,
  onDeposit,
  livePositionTermIds,
}: CircleFeedCardProps) {
  const { topicById } = useTaxonomy()
  const host = item.domain || (item.url ? extractDomain(item.url) : '')
  const favicon = item.favicon || (host ? getFaviconUrl(host) : '')

  const verbs = item.intentions
    .filter((l) => !l.startsWith('quest:'))
    .slice(0, 2)

  // Keep the id alongside the short label so the badge can resolve
  // the topic colour without a second lookup.
  const topicTags = item.topicContexts
    .map((id) => {
      const t = topicById(id)
      if (!t) return null
      return { id, label: t.label.split(' ')[0], color: t.color }
    })
    .filter((x): x is { id: string; label: string; color: string } => !!x)
    .slice(0, 2)

  // Aggregated position counts and user state across all intention vaults.
  // The user state is the UNION of (a) the snapshot from the feed payload
  // and (b) the live realtime positions set — whichever is "true" wins,
  // so a fresh deposit lights up the thumb without waiting for a refetch.
  let supports = 0
  let opposes = 0
  let userSupported = false
  let userOpposed = false
  for (const v of Object.values(item.intentionVaults)) {
    supports += v.supportCount
    opposes += v.opposeCount
    if (v.userSupported || livePositionTermIds?.has(v.termId)) {
      userSupported = true
    }
    if (v.userOpposed || livePositionTermIds?.has(v.counterTermId)) {
      userOpposed = true
    }
  }
  const stars = computeStars(supports)
  const totalVotes = supports + opposes

  const canSupport = Object.values(item.intentionVaults).some((v) => v.termId)
  const canOppose = Object.values(item.intentionVaults).some(
    (v) => v.counterTermId,
  )

  const handleThumb = (side: 'support' | 'oppose') => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDeposit?.(side, item)
  }

  const href = item.url && item.url.startsWith('http') ? item.url : '#'

  return (
    <a
      className="feed-card"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="fc-star-badge" title={starLabel(stars)}>
        <Star size={14} fill="currentColor" strokeWidth={0} />
        <span className="fc-star-num">{stars}</span>
        <div className="fc-star-tip">
          <strong>{starLabel(stars)}</strong> · {totalVotes} endorsed
        </div>
      </div>

      <div className="fc-head">
        <div className="fc-favicon">
          {favicon ? (
            <img
              className="fc-favicon-img"
              src={favicon}
              alt=""
              loading="lazy"
            />
          ) : (
            (host || item.title).slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="fc-title-wrap">
          <div className="fc-title">{item.title || host}</div>
          <div className="fc-host">{host}</div>
        </div>
      </div>

      {certifierName ? (
        <div className="fc-cert">
          <span className="fc-cert-label">Certified by</span>
          {item.certifierAddress ? (
            // The outer card is already an <a> so we can't nest another
            // link. Treat the certifier name as a "navigate on click"
            // span: stop the event from bubbling up so the card doesn't
            // also open the URL, then push the route programmatically.
            <CertifierLink
              name={certifierName}
              address={item.certifierAddress}
            />
          ) : (
            <span className="fc-cert-who">{certifierName}</span>
          )}
        </div>
      ) : null}

      <div className="fc-bottom">
        <div className="fc-tags">
          {topicTags.map((t) => (
            <span key={t.id} className="fc-tag">
              <TopicBadge
                topicId={t.id}
                color={t.color}
                size={14}
                title={t.label}
              />
              {t.label}
            </span>
          ))}
          {verbs.map((label) => {
            const intentType = displayLabelToIntentionType(label)
            const cssClass = VERB_CLASS_BY_LABEL[label] ?? intentType ?? ''
            return (
              <span key={label} className={`fc-verb-tag ${cssClass}`}>
                {label}
              </span>
            )
          })}
        </div>

        {/* Support / oppose thumbs — fires onDeposit when wired by the parent. */}
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
            onClick={handleThumb('support')}
            disabled={!onDeposit || !canSupport}
            aria-disabled={!onDeposit}
          >
            <ThumbsUp size={16} />
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
            onClick={handleThumb('oppose')}
            disabled={!onDeposit || !canOppose}
            aria-disabled={!onDeposit}
          >
            <ThumbsDown size={16} />
          </button>
        </div>
      </div>
    </a>
  )
}

/** Inline certifier name that routes to the public profile without
 *  triggering the parent card's external-URL anchor. Kept here as a
 *  local helper so the navigation concern stays next to its usage. */
function CertifierLink({ name, address }: { name: string; address: string }) {
  const navigate = useNavigate()
  return (
    <span
      className="fc-cert-who fc-cert-who--link"
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(`/profile/${address}`)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          navigate(`/profile/${address}`)
        }
      }}
    >
      {name}
    </span>
  )
}
