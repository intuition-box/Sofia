/**
 * FeedCardView — the ONE presentational feed card, shared by the explore
 * feed (home `FeedCard`) and the circle feed (`CircleFeedCard`). Implements
 * the Claude Design "Feed Card" handoff:
 *
 *   ┌────────────────────────────────────────┐
 *   │ avatar  handle              ★★☆☆☆       │  header
 *   │         2h ago                          │
 *   ├────────────────────────────────────────┤
 *   │                                        │
 *   │            preview image               │  media (cover)
 *   │                                        │
 *   ├────────────────────────────────────────┤
 *   │ Renault Clio full hybrid E-Tech …      │  title
 *   ├────────────────────────────────────────┤
 *   │ 👍 5  👎 0          INSPIRATION LEARNING│  footer
 *   └────────────────────────────────────────┘
 *
 * Pure view: each caller resolves its own data (counts, certifier, stars)
 * and hands it down. No data fetching, no business rules here.
 */
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill } from '@/components/profile/FeedPills'

export interface FeedCardVerb {
  label: string
  /** Intent color (INTENTION_COLORS) — drives the chip tint, border + dot. */
  color?: string
}

export interface FeedCardTopic {
  id: string
  label: string
  /** Topic color from the taxonomy — drives the unified <TopicPill> fill. */
  color?: string
}

interface FeedCardViewProps {
  /** Certifier / actor handle (ENS or short address). */
  handle: string
  /** Resolved avatar URL; falls back to gradient + initials when absent. */
  avatarUrl?: string
  /** Pre-formatted relative time (e.g. "2h ago"). */
  when: string
  /** 0–5 expertise / engagement rating. Omit to hide the star row. */
  rating?: number
  title: string
  url?: string
  domain?: string
  verbs: FeedCardVerb[]
  /** Topic contexts — neutral `# Label` pills, shown after the verbs. */
  topics?: FeedCardTopic[]
  up: number
  down: number
  userUp?: boolean
  userDown?: boolean
  canUp?: boolean
  canDown?: boolean
  /** Fires on thumb click; omit to render the thumbs display-only. */
  onVote?: (side: 'support' | 'oppose') => void
  /** Opens the underlying URL (whole-card click + Enter). */
  onOpen?: () => void
  /** Optional interactive handle (e.g. a link to the certifier profile).
   *  When given, replaces the plain-text handle. */
  handleSlot?: ReactNode
}

function Stars({ n }: { n: number }) {
  return (
    <div className="fc-stars" title={`${n} / 5`} aria-label={`${n} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={i < n ? 'fc-star-on' : 'fc-star-off'}
          aria-hidden="true"
        >
          <path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.4 9.3l5.8-.8z" />
        </svg>
      ))}
    </div>
  )
}

export default function FeedCardView({
  handle,
  avatarUrl,
  when,
  rating,
  title,
  url,
  domain,
  verbs,
  topics = [],
  up,
  down,
  userUp,
  userDown,
  canUp = true,
  canDown = true,
  onVote,
  onOpen,
  handleSlot,
}: FeedCardViewProps) {
  const initials = (handle || '?').replace(/^0x/, '').slice(0, 2).toUpperCase()

  const handleKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onOpen?.()
    }
  }
  const vote = (side: 'support' | 'oppose') => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onVote?.(side)
  }

  return (
    <article
      className="fc-card"
      role="link"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={handleKey}
    >
      <header className="fc-hd">
        <div className="fc-hd-top">
          <span className="fc-avatar" aria-hidden="true">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="fc-avatar-img"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.visibility = 'hidden'
                }}
              />
            ) : (
              initials
            )}
          </span>
          <div className="fc-hd-id">
            <div className="fc-handle">{handleSlot ?? handle}</div>
            <div className="fc-when">{when}</div>
          </div>
          {rating != null && <Stars n={rating} />}
        </div>
      </header>

      <div className="fc-media">
        <UrlPreview
          variant="card"
          url={url}
          domain={domain}
          className="fc-media-img"
          alt={title || domain}
        />
      </div>

      <div className="fc-body">
        <h3 className="fc-card-title">{title}</h3>
      </div>

      <footer className="fc-foot">
        {onVote && (canUp || canDown) ? (
          <div className="fc-votes">
            <button
              type="button"
              className={`fc-vote up${userUp ? ' on' : ''}`}
              aria-label={`Support (${up})`}
              aria-pressed={userUp}
              onClick={vote('support')}
              disabled={!canUp}
            >
              <ThumbsUp aria-hidden="true" />
              {up}
            </button>
            <button
              type="button"
              className={`fc-vote down${userDown ? ' on' : ''}`}
              aria-label={`Oppose (${down})`}
              aria-pressed={userDown}
              onClick={vote('oppose')}
              disabled={!canDown}
            >
              <ThumbsDown aria-hidden="true" />
              {down}
            </button>
          </div>
        ) : (
          <div className="fc-votes">
            <span className="fc-vote up is-static">
              <ThumbsUp aria-hidden="true" />
              {up}
            </span>
            <span className="fc-vote down is-static">
              <ThumbsDown aria-hidden="true" />
              {down}
            </span>
          </div>
        )}

        <div className="fc-chips">
          {verbs.map((v) => (
            <span
              key={v.label}
              className="fc-verb"
              style={v.color ? { ['--vc' as string]: v.color } : undefined}
            >
              <i aria-hidden="true" />
              {v.label}
            </span>
          ))}
          {topics.map((t) => (
            <TopicPill
              key={t.id}
              topicId={t.id}
              color={t.color || 'var(--ds-muted)'}
              label={t.label}
            />
          ))}
        </div>
      </footer>
    </article>
  )
}
