/**
 * FeedCardView — the ONE presentational feed card, shared by the explore
 * feed (home `FeedCard`) and the circle feed (`CircleFeedCard`). Implements
 * the Claude Design "Feed Card" handoff (size variants + one-row footer).
 *
 *   ┌────────────────────────────────────────┐
 *   │ avatar  handle                    ⋯   │  header
 *   │         2h ago                         │
 *   ├────────────────────────────────────────┤
 *   │                                        │
 *   │            preview image               │  media (cover)
 *   │  ┌──────────────┐                      │
 *   │  │ fav  domain  │                      │  domain badge (bottom-left)
 *   └──┴──────────────┴──────────────────────┘
 *   │ Renault Clio full hybrid E-Tech …      │  title
 *   ├────────────────────────────────────────┤
 *   │ 👍 5  👎 0   │  INSPIRATION LEARNING   │  footer (one row: votes | chips)
 *   └────────────────────────────────────────┘
 *
 * Sizes: lg (432) · md (360) · sm (300) · xs (list row, no hero)
 *
 * Pure view: each caller resolves its own data (counts, certifier) and
 * hands it down. No data fetching, no business rules here.
 */
import { createPortal } from 'react-dom'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useState, useRef, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, MoreVertical, Trash2 } from 'lucide-react'
import { useChipOverflow, useAnchoredTooltip } from '@0xsofia/design-system'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill } from '@/components/profile/FeedPills'

/** Sizes matching the Claude Design Feed Card spec. */
export type FeedCardSize = 'lg' | 'md' | 'sm' | 'xs'

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
  trailing?: ReactNode
}) {
  const total = chips.length
  const { mirrorRef, shown } = useChipOverflow(total)
  const tip = useAnchoredTooltip()

  const hidden = total - shown
  return (
    <div className="fc-chips-wrap">
      {/* hidden mirror — measured for first-line fit */}
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
      {/* visible row — only what fits, + overflow badge + trailing slot */}
      <div className="fc-chips">
        {chips.slice(0, shown).map((c, i) => (
          <span key={i} className="fc-chip-slot">
            {c.node}
          </span>
        ))}
        {hidden > 0 && (
          <button
            type="button"
            className="fc-chip-more"
            aria-label={`Show ${hidden} more: ${chips
              .slice(shown)
              .map((c) => c.label)
              .join(', ')}`}
            onMouseEnter={(e) =>
              tip.openFrom(e.currentTarget.getBoundingClientRect())
            }
            onMouseLeave={tip.close}
            onFocus={(e) =>
              tip.openFrom(e.currentTarget.getBoundingClientRect())
            }
            onBlur={tip.close}
            onClick={(e) => e.stopPropagation()}
          >
            +{hidden}
          </button>
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

/** Owner kebab menu — fires onDelete when "Delete post" is tapped. */
function OwnerMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) =>
      e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="fc-kebab-wrap" ref={ref}>
      <button
        type="button"
        className={`fc-kebab${open ? ' open' : ''}`}
        aria-label="More options"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <div className="fc-kebab-menu" role="menu">
          <button
            type="button"
            className="fc-kebab-item danger"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
          >
            <Trash2 size={15} />
            Delete post
          </button>
        </div>
      )}
    </div>
  )
}

export interface FeedCardVerb {
  label: string
  color?: string
}

export interface FeedCardTopic {
  id: string
  label: string
  color?: string
  glyphTopicId?: string
}

interface FeedCardViewProps {
  handle: string
  avatarUrl?: string
  when: string
  title: string
  url?: string
  domain?: string
  verbs: FeedCardVerb[]
  topics?: FeedCardTopic[]
  up: number
  down: number
  userUp?: boolean
  userDown?: boolean
  canUp?: boolean
  canDown?: boolean
  onVote?: (side: 'support' | 'oppose') => void
  voteDisabledReason?: string
  onOpen?: () => void
  handleSlot?: ReactNode
  /** Optional "+ Context" affordance rendered in the footer chip row.
   *  Callers build it so this view stays data-free. */
  addContextSlot?: ReactNode
  /** Card size variant — defaults to 'lg' (432px, existing behaviour). */
  size?: FeedCardSize
  /** When true, renders the owner ⋯ menu with a Delete action.
   *  onDelete fires when the user confirms deletion. */
  isOwner?: boolean
  /** Optional badge overlay rendered in the top-right corner of the xs
   *  thumbnail (e.g. a topic icon disc or support/oppose check). */
  badgeSlot?: ReactNode
  onDelete?: () => void
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
  voteDisabledReason = 'No topic to endorse yet — this URL has no "in context of" tag.',
  onOpen,
  handleSlot,
  addContextSlot,
  size = 'lg',
  isOwner = false,
  onDelete,
  badgeSlot,
}: FeedCardViewProps) {
  const [removed, setRemoved] = useState(false)
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

  // ── Removed / undo state ─────────────────────────────────────────────────
  if (removed) {
    return (
      <article className={`fc-card fc-card--s-${size} fc-card--gone`}>
        <span className="fc-gone-note">Post removed</span>
        <button
          type="button"
          className="fc-gone-undo"
          onClick={(e) => {
            e.stopPropagation()
            setRemoved(false)
          }}
        >
          Undo
        </button>
      </article>
    )
  }

  // ── XS — list row (no full-bleed hero, compact) ──────────────────────────
  if (size === 'xs') {
    return (
      <article
        className="fc-card fc-card--s-xs"
        role="link"
        tabIndex={0}
        onClick={() => onOpen?.()}
        onKeyDown={handleKey}
      >
        <div className="fc-xs-row">
          {/* Thumbnail wrapper — overflow:visible so the badge can overflow
              the clipped thumb without being cut off. */}
          <div className="fc-xs-thumb-wrap">
            <div className="fc-xs-thumb">
              <UrlPreview
                variant="card"
                url={url}
                domain={domain}
                className="fc-xs-thumb-img"
                alt={title || domain}
              />
            </div>
            {badgeSlot && (
              <span className="fc-xs-badge">{badgeSlot}</span>
            )}
          </div>
          {/* Main */}
          <div className="fc-xs-main">
            <div className="fc-xs-head">
              {/* Only render the avatar when there's something to show —
                  avoids a blank gradient disc when handle is empty. */}
              {(avatarUrl || handle) && (
                <span className="fc-avatar fc-avatar--xs" aria-hidden="true">
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
              )}
              <span className="fc-xs-handle">
                {handleSlot ?? handle}
                {(handle || handleSlot) && <span className="fc-xs-sep">·</span>}
                {when}
              </span>
              {isOwner && onDelete && (
                <OwnerMenu onDelete={() => setRemoved(true)} />
              )}
            </div>
            <h3 className="fc-xs-title">{title}</h3>
            <div className="fc-xs-foot">
              <span className="fc-xs-domain">{domain}</span>
              <div className="fc-xs-votes">
                <span
                  className={`fc-xs-vote u${userUp ? ' on' : ''}`}
                  onClick={onVote ? vote('support') : undefined}
                  style={onVote ? { cursor: 'pointer' } : undefined}
                >
                  <ThumbsUp size={12} aria-hidden="true" />
                  {up}
                </span>
                <span
                  className={`fc-xs-vote d${userDown ? ' on' : ''}`}
                  onClick={onVote ? vote('oppose') : undefined}
                  style={onVote ? { cursor: 'pointer' } : undefined}
                >
                  <ThumbsDown size={12} aria-hidden="true" />
                  {down}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // ── LG / MD / SM — full card ─────────────────────────────────────────────
  return (
    <article
      className={`fc-card fc-card--s-${size}`}
      role="link"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={handleKey}
    >
      {/* Header */}
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
          {isOwner && onDelete && (
            <OwnerMenu onDelete={() => setRemoved(true)} />
          )}
        </div>
      </header>

      {/* Media with domain badge */}
      <div className="fc-media">
        <UrlPreview
          variant="card"
          url={url}
          domain={domain}
          className="fc-media-img"
          alt={title || domain}
        />
        {domain && (
          <div className="fc-media-domain">
            <span className="fc-media-fav">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt=""
                width={12}
                height={12}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </span>
            <span>{domain}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="fc-body">
        <h3 className="fc-card-title">{title}</h3>
      </div>

      {/* Footer — ONE ROW: votes left · chips+addContext right */}
      <footer className="fc-foot">
        {/* Votes — left side */}
        {onVote ? (
          <div className="fc-votes">
            <button
              type="button"
              className={`fc-vote up${userUp ? ' on' : ''}${canUp ? '' : ' is-disabled'}`}
              aria-label={canUp ? `Support (${up})` : `Support off — ${voteDisabledReason}`}
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
              aria-label={canDown ? `Oppose (${down})` : `Oppose off — ${voteDisabledReason}`}
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

        {/* Chips + addContextSlot — right side */}
        <ChipOverflowRow chips={chipNodes} trailing={addContextSlot} />
      </footer>
    </article>
  )
}
