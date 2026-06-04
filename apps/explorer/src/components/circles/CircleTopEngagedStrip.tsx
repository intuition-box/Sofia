/**
 * CircleTopEngagedStrip — "Hot picks" strip of the top 4 URLs in the
 * circle by engagement score. Rendered inside CircleFeedSection just
 * below the filter row so it reads as the curated header of the feed
 * rather than a separate band.
 */
import { ThumbsUp } from 'lucide-react'
import type { CircleItem } from '@/services/circleService'
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
          const { supports } = aggregateCounts(item)
          const host = item.domain || (item.url ? extractDomain(item.url) : '')
          const href = item.url && item.url.startsWith('http') ? item.url : '#'
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
                <span className="crd-te-count" title={`${supports} like${supports === 1 ? '' : 's'}`}>
                  <ThumbsUp aria-hidden="true" />
                  {supports}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
