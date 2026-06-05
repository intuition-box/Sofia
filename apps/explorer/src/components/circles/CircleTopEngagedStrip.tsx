/**
 * CircleTopEngagedStrip — "Hot picks" strip of the top 4 URLs in the
 * circle by engagement score. Rendered inside CircleFeedSection just
 * below the filter row so it reads as the curated header of the feed
 * rather than a separate band.
 *
 * Each pick renders as the unified <CircleFeedCard> (same card the main
 * masonry grid uses) so the hot-picks strip stays visually consistent
 * with the feed. The cards live in a horizontally scrolling strip; each
 * takes a fixed width (`.crd-top-engaged-item`) so they scroll sideways
 * instead of collapsing.
 */
import type { Address } from 'viem'
import type { CircleItem } from '@/services/circleService'
import CircleFeedCard from './CircleFeedCard'

interface CircleTopEngagedStripProps {
  items: CircleItem[]
  /** Resolves a certifier display name from their address. */
  getDisplay: (address: Address) => string
  /** Resolves a certifier avatar URL from their address. */
  getAvatar: (address: Address) => string
  /** Like / dislike handler, threaded from the feed section. */
  onDeposit?: (side: 'support' | 'oppose', item: CircleItem) => void
  /** Live set of staked term_ids, threaded from the feed section. */
  livePositionTermIds?: ReadonlySet<string>
}

export default function CircleTopEngagedStrip({
  items,
  getDisplay,
  getAvatar,
  onDeposit,
  livePositionTermIds,
}: CircleTopEngagedStripProps) {
  if (items.length === 0) return null

  return (
    <section className="crd-top-engaged">
      <div className="crd-top-engaged-head">
        <h3 className="crd-top-engaged-title">Hot picks</h3>
        <div className="crd-top-engaged-rule" aria-hidden="true" />
      </div>
      <div className="crd-top-engaged-strip">
        {items.map((item) => {
          const addr = item.certifierAddress as Address | undefined
          const name = addr ? getDisplay(addr) : item.certifier
          const av = addr ? getAvatar(addr) : ''
          return (
            <div key={item.id} className="crd-top-engaged-item">
              <CircleFeedCard
                item={item}
                certifierName={name}
                certifierAvatar={av}
                onDeposit={onDeposit}
                livePositionTermIds={livePositionTermIds}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
