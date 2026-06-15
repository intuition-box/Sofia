/**
 * InterestTile — one clickable interest tile on the Explore home.
 *
 * Reddit /explore style: just the topic/verb name plus a small strip of
 * platform favicons (no URL rows, no coloured borders). Tier only drives how
 * many favicons show, for a bit of rhythm in the masonry.
 */
import type { KeyboardEvent } from 'react'
import { FaviconWrapper } from '@0xsofia/design-system'
import type { CircleItem } from '@/services/circleService'
import type { InterestKind, InterestTier } from './useInterestTiles'

interface InterestTileProps {
  kind: InterestKind
  id: string
  label: string
  description: string
  tier: InterestTier
  samples: CircleItem[]
  onPick: () => void
}

/** Uniform favicon cap — every tile is the same size now. */
const MAX_FAVS = 5

/** First N distinct-host samples — drives the favicon strip. */
function uniqueFavicons(samples: CircleItem[], max: number): CircleItem[] {
  const out: CircleItem[] = []
  const seen = new Set<string>()
  for (const s of samples) {
    const host = (s.domain || '').toLowerCase()
    if (!host || seen.has(host)) continue
    seen.add(host)
    out.push(s)
    if (out.length >= max) break
  }
  return out
}

export default function InterestTile({
  kind,
  id,
  label,
  description,
  tier,
  samples,
  onPick,
}: InterestTileProps) {
  const favs = uniqueFavicons(samples, MAX_FAVS)

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPick()
    }
  }

  return (
    <button
      type="button"
      className={`hm-tile hm-${tier} hm-${kind}`}
      onClick={() => onPick()}
      onKeyDown={handleKey}
      data-interest-id={id}
    >
      <div className="hm-tile-body">
        <div className="hm-tile-label">{label}</div>
        {description && <p className="hm-tile-desc">{description}</p>}
      </div>
      {favs.length > 0 && (
        <div className="hm-platforms">
          <div className="hm-platform-favs">
            {favs.map((s, idx) => (
              <FaviconWrapper
                key={`${s.domain}-${idx}`}
                size={26}
                src={s.favicon}
                alt={s.domain}
              />
            ))}
          </div>
        </div>
      )}
    </button>
  )
}
