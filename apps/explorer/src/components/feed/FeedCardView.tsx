/**
 * FeedCardView — the ONE presentational feed card, shared by the explore
 * feed (home `FeedCard`) and the circle feed (`CircleFeedCard`). Implements
 * the Claude Design "Feed Card" handoff:
 *
 *   ┌────────────────────────────────────────┐
 *   │ avatar  handle                          │  header
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
 * Pure view: each caller resolves its own data (counts, certifier) and
 * hands it down. No data fetching, no business rules here.
 */
import { createPortal } from 'react-dom'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useChipOverflow, useAnchoredTooltip } from '@0xsofia/design-system'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill } from '@/components/profile/FeedPills'

/**
 * ChipOverflowRow — lays chips on a single line; any that would wrap to a
 * second line collapse into a trailing `+N` badge. The glitch-free
 * mirror-measure lives in the shared `useChipOverflow` hook
 * (@0xsofia/design-system); this only supplies the feed-card markup/classes.
 */
interface OverflowChip {
  node: ReactNode
  /** Plain-text label — surfaced in the `+N` badge tooltip when hidden. */
  label: string
  /** Dot color in the tooltip (topic/category color, or intent color). */
  color?: string
}

function ChipOverflowRow({
  chips,
  trailing,
}: {
  chips: OverflowChip[]
  /** Always-visible node appended after the chips + overflow badge (e.g. the
   *  "+ Context" button). Sits inline on the same row when there's room and
   *  wraps below only when the chips fill the line. */
  trailing?: ReactNode
}) {
  const total = chips.length
  const { mirrorRef, shown } = useChipOverflow(total)
  // Styled tooltip for the +N badge — same portal anchoring used by the
  // profile calendar, positioned from the badge's viewport rect.
  const tip = useAnchoredTooltip()

  const hidden = total - shown
  return (
    <div className="fc-chips-wrap">
      {/* hidden mirror — all chips, measured for the first-line fit */}
      <div
        className="fc-chips fc-chips--measure"
        ref={mirrorRef}
        aria-hidden="true"
      >
        {chips.map((c, i) => (
          <span key={i} data-chip="1" className="fc-chip-slot">
            {c.node}
          </span>
        ))}
      </div>
      {/* visible row — only what fits, + the overflow badge + trailing slot */}
      <div className="fc-chips">
        {chips.slice(0, shown).map((c, i) => (
          <span key={i} className="fc-chip-slot">
            {c.node}
          </span>
        ))}
        {hidden > 0 && (
          <span
            className="fc-chip-more"
            onMouseEnter={(e) =>
              tip.openFrom(e.currentTarget.getBoundingClientRect())
            }
            onMouseLeave={tip.close}
          >
            +{hidden}
          </span>
        )}
        {trailing}
      </div>
      {tip.anchor &&
        hidden > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fc-more-tip"
            style={{ left: `${tip.anchor.left}px`, top: `${tip.anchor.top}px` }}
            role="tooltip"
          >
            {chips.slice(shown).map((c, i) => (
              <div className="fc-more-tip-row" key={i}>
                <span
                  className="fc-more-tip-dot"
                  style={{ background: c.color || 'var(--ds-muted)' }}
                />
                <span className="fc-more-tip-label">{c.label}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}

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
  /** Glyph source — for a CATEGORY pill, pass the parent topic id so the
   *  family icon shows. Defaults to `id` (a topic shows its own glyph). */
  glyphTopicId?: string
}

interface FeedCardViewProps {
  /** Certifier / actor handle (ENS or short address). */
  handle: string
  /** Resolved avatar URL; falls back to gradient + initials when absent. */
  avatarUrl?: string
  /** Pre-formatted relative time (e.g. "2h ago"). */
  when: string
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
  /** Tooltip shown on a disabled thumb explaining why it's off (e.g. the
   *  cert has no topic context to stake on). The thumbs stay visible. */
  voteDisabledReason?: string
  /** Opens the underlying URL (whole-card click + Enter). */
  onOpen?: () => void
  /** Optional interactive handle (e.g. a link to the certifier profile).
   *  When given, replaces the plain-text handle. */
  handleSlot?: ReactNode
  /** Optional "+ Context" affordance rendered in the footer (between the
   *  chip row and the votes). Callers build it so this view stays data-free. */
  addContextSlot?: ReactNode
}

export default function FeedCardView({
  handle,
  avatarUrl,
  when,
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
  voteDisabledReason = 'No topic to endorse yet — this URL has no “in context of” tag.',
  onOpen,
  handleSlot,
  addContextSlot,
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

  // Topics + categories first, verbs last — the verb is the least important
  // chip, so it's the one that collapses into the `+N` badge when the row is
  // tight. The overflow row lays the whole stream out on one line.
  const chipNodes: OverflowChip[] = [
    ...topics.map((t) => ({
      label: t.label,
      color: t.color,
      node: (
        <TopicPill
          key={`t-${t.id}`}
          topicId={t.glyphTopicId ?? t.id}
          color={t.color || 'var(--ds-muted)'}
          label={t.label}
        />
      ),
    })),
    ...verbs.map((v) => ({
      label: v.label,
      color: v.color,
      node: (
        <span
          key={`v-${v.label}`}
          className="fc-verb"
          style={v.color ? { ['--vc' as string]: v.color } : undefined}
        >
          <i aria-hidden="true" />
          {v.label}
        </span>
      ),
    })),
  ]

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
        <ChipOverflowRow chips={chipNodes} trailing={addContextSlot} />
        {onVote ? (
          <div className="fc-votes">
            <button
              type="button"
              className={`fc-vote up${userUp ? ' on' : ''}${canUp ? '' : ' is-disabled'}`}
              aria-label={
                canUp
                  ? `Support (${up})`
                  : `Support off — ${voteDisabledReason}`
              }
              aria-pressed={userUp}
              aria-disabled={!canUp}
              onClick={canUp ? vote('support') : (e) => e.stopPropagation()}
            >
              <ThumbsUp aria-hidden="true" />
              {up}
              {!canUp && (
                <span className="fc-vote-tip" role="tooltip">
                  {voteDisabledReason}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`fc-vote down${userDown ? ' on' : ''}${canDown ? '' : ' is-disabled'}`}
              aria-label={
                canDown
                  ? `Oppose (${down})`
                  : `Oppose off — ${voteDisabledReason}`
              }
              aria-pressed={userDown}
              aria-disabled={!canDown}
              onClick={canDown ? vote('oppose') : (e) => e.stopPropagation()}
            >
              <ThumbsDown aria-hidden="true" />
              {down}
              {!canDown && (
                <span className="fc-vote-tip" role="tooltip">
                  {voteDisabledReason}
                </span>
              )}
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
      </footer>
    </article>
  )
}
