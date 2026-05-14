/**
 * CircleTopEngagedStrip — "Hot picks" strip of the top 4 URLs in the
 * circle by engagement score. Rendered inside CircleFeedSection just
 * below the filter row so it reads as the curated header of the feed
 * rather than a separate band. Cards reuse the same star-tier palette
 * as `CircleFeedCard` so the visual scale is consistent across the
 * page.
 */
import { Star } from 'lucide-react'
import type { CircleItem } from '@/services/circleService'
import { computeStars, starTier } from '@/services/circleFeedSort'
import { UrlPreview } from '@/components/UrlPreview'
import { extractDomain } from '@/utils/formatting'

interface CircleTopEngagedStripProps {
  items: CircleItem[]
}

function aggregateCounts(item: CircleItem): {
  supports: number
  opposes: number
} {
  let supports = 0
  let opposes = 0
  for (const v of Object.values(item.intentionVaults)) {
    supports += v.supportCount
    opposes += v.opposeCount
  }
  return { supports, opposes }
}

export default function CircleTopEngagedStrip({
  items,
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
          const { supports, opposes } = aggregateCounts(item)
          const stars = computeStars(supports)
          const host = item.domain || (item.url ? extractDomain(item.url) : '')
          const href =
            item.url && item.url.startsWith('http') ? item.url : '#'
          return (
            <a
              key={item.id}
              className="crd-te-card"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={item.title || host}
            >
              <UrlPreview
                variant="card"
                url={item.url}
                domain={host}
                className="crd-te-thumb"
                alt={item.title || host}
              />
              <p className="crd-te-title">{item.title || host}</p>
              <div className="crd-te-meta">
                <div
                  className="crd-te-stars"
                  aria-label={`${stars} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((slot) => (
                    <Star
                      key={slot}
                      size={9}
                      fill="currentColor"
                      strokeWidth={0}
                      className={`fc-star fc-star--${starTier(slot, stars)}`}
                    />
                  ))}
                </div>
                <span className="crd-te-count">{supports + opposes}</span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
