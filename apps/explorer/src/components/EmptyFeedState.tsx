/**
 * <EmptyFeedState> — uniform "no data yet" pattern across feed surfaces.
 *
 * Renders a faded grid of skeleton cards in the actual layout the feed
 * would use, with the empty message overlaid in a centered glass panel.
 * Tells the user "this is the shape of the missing content" instead of
 * dropping them on a bare text line.
 *
 * Skeleton + grid className are caller-supplied so the empty state
 * matches whatever layout (masonry, CSS-grid, bento) the feed actually
 * uses. The wrapper handles the overlay, the muting, and the a11y
 * (skeletons are aria-hidden — only the message reaches assistive tech).
 */
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import './styles/empty-feed-state.css'

interface EmptyFeedStateProps {
  /** Headline shown in the centered panel. */
  message: string
  /** Secondary line — optional helper text under the headline. */
  hint?: string
  /** Optional CTA (button, link) rendered below the hint. */
  action?: ReactNode
  /** Number of ghost cards to render behind the message. */
  skeletonCount?: number
  /** Renders one skeleton card. Called `skeletonCount` times. */
  renderSkeleton: () => ReactNode
  /** Class for the wrapping grid — e.g. `'bento-grid bento-grid-3'`,
   *  `'masonry-grid'`, `'hm-drill-grid'`. */
  gridClassName: string
}

export function EmptyFeedState({
  message,
  hint,
  action,
  skeletonCount = 6,
  renderSkeleton,
  gridClassName,
}: EmptyFeedStateProps) {
  return (
    <div className="feed-empty-stack">
      <div
        className={`${gridClassName} feed-empty-skeletons`}
        aria-hidden="true"
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Fragment key={i}>{renderSkeleton()}</Fragment>
        ))}
      </div>
      <div className="feed-empty-overlay" role="status">
        <p className="feed-empty-msg">{message}</p>
        {hint ? <p className="feed-empty-hint">{hint}</p> : null}
        {action ? <div className="feed-empty-action">{action}</div> : null}
      </div>
    </div>
  )
}
