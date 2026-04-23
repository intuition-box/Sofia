/**
 * CircleFeedCard — single feed item styled 1:1 with the proto `.feed-card`.
 *
 * Covers: favicon + title + host, optional "Certified by" endorser row,
 * topic tags, intent verb pills, star badge (proto `computeStars` rule)
 * and support/oppose thumb buttons.
 *
 * Stars / support / oppose counts are **mocked** from a deterministic
 * hash of `item.id` until the on-chain aggregate is exposed. The thumb
 * buttons are display-only for now (`aria-disabled`) — clicking will be
 * wired to deposit/redeem when the feed lands the `onDeposit` path.
 */
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { CircleItem } from '@/services/circleService'
import { displayLabelToIntentionType, INTENTION_CONFIG } from '@/config/intentions'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'

interface CircleFeedCardProps {
  item: CircleItem
  /** Display name + avatar of the certifier, resolved via `useEnsNames`. */
  certifierName: string
  certifierAvatar: string
}

const VERB_CLASS_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(INTENTION_CONFIG).map((v) => [v.label, v.cssClass]),
)

/** Deterministic 32-bit hash — same FNV-1a used for synthetic radar counts. */
function hash32(key: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

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

export default function CircleFeedCard({ item, certifierName }: CircleFeedCardProps) {
  const { topicById } = useTaxonomy()
  const host = item.domain || (item.url ? extractDomain(item.url) : '')
  const favicon = item.favicon || (host ? getFaviconUrl(host) : '')

  const verbs = item.intentions
    .filter((l) => !l.startsWith('quest:'))
    .slice(0, 2)

  const topicTags = item.topicContexts
    .map((id) => topicById(id)?.label?.split(' ')[0])
    .filter((x): x is string => !!x)
    .slice(0, 2)

  // Mocked aggregate counts — deterministic per item.
  const seed = hash32(item.id)
  const supports = 1 + (seed % 28)
  const opposes = (seed >> 8) % 6
  const stars = computeStars(supports)
  const totalVotes = supports + opposes

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
            <img className="fc-favicon-img" src={favicon} alt="" loading="lazy" />
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
          <span className="fc-cert-who">{certifierName}</span>
        </div>
      ) : null}

      <div className="fc-bottom">
        <div className="fc-tags">
          {topicTags.map((t) => (
            <span key={t} className="fc-tag">
              {t}
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

        {/* Support / oppose thumbs — display-only until deposit is wired. */}
        <div className="fc-positions" onClick={(e) => e.preventDefault()}>
          <button
            type="button"
            className="fc-pos support"
            data-count={supports}
            aria-label={`Support (${supports})`}
          >
            <ThumbsUp size={16} />
          </button>
          <button
            type="button"
            className="fc-pos oppose"
            data-count={opposes}
            aria-label={`Oppose (${opposes})`}
          >
            <ThumbsDown size={16} />
          </button>
        </div>
      </div>
    </a>
  )
}
