/**
 * <FeedCardSkeleton> — ghost card matching the .feed-card / .fc layout
 * with the URL preview header at the top. Used by:
 *   - loading states (where the real cards are about to render)
 *   - empty states (wrapped in <EmptyFeedState>) to communicate
 *     "this is the layout, no data yet" without a bare text message.
 *
 * Mirrors the production card's vertical rhythm so the grid never
 * shifts when real cards take over.
 */
export function FeedCardSkeleton() {
  return (
    <div className="feed-card feed-card--has-header feed-card--skeleton">
      <div className="fc-thumb-skeleton" />
      <div className="fc-head">
        <div className="fc-title-wrap">
          <div className="fc-skel-line fc-skel-line--lg" />
          <div className="fc-skel-line fc-skel-line--sm" />
        </div>
      </div>
      <div className="fc-bottom">
        <div className="fc-skel-pill" />
        <div className="fc-skel-pill" />
      </div>
    </div>
  )
}
