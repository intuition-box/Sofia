/**
 * InterestTile — one clickable interest tile on the Home page.
 * Tier (`hero | featured | standard | compact`) drives padding, body
 * density and whether it renders URL preview rows or a platform strip.
 *
 * Ported 1:1 from proto-explorer/src/views/home.ts `renderTile`, with
 * CSS tokens remapped to `--ds-*` in home.css.
 */
import type { MouseEvent } from 'react'
import { FaviconWrapper } from '@0xsofia/design-system'
import type { CircleItem } from '@/services/circleService'
import type { InterestKind, InterestTier } from './useInterestTiles'
import { seedHash } from './useInterestTiles'

interface InterestTileProps {
  kind: InterestKind
  id: string
  label: string
  color: string
  tier: InterestTier
  samples: CircleItem[]
  onPick: () => void
}

function uniqueByHost(samples: CircleItem[], max: number): CircleItem[] {
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

function UrlRows({
  samples,
  max,
}: {
  samples: CircleItem[]
  max: number
}) {
  const items = uniqueByHost(samples, max)
  if (items.length === 0) return null
  return (
    <div className="hm-urls">
      {items.map((s, idx) => (
        <div className="hm-url-row" key={`${s.domain}-${idx}`}>
          <FaviconWrapper size={30} src={s.favicon} alt={s.domain} />
          <span className="hm-url-host">{s.domain}</span>
        </div>
      ))}
    </div>
  )
}

function PlatformStrip({
  samples,
  max,
}: {
  samples: CircleItem[]
  max: number
}) {
  const items = uniqueByHost(samples, max)
  if (items.length === 0) return null
  return (
    <div className="hm-platforms">
      <div className="hm-platform-favs">
        {items.map((s, idx) => (
          <FaviconWrapper
            key={`${s.domain}-${idx}`}
            size={30}
            src={s.favicon}
            alt={s.domain}
          />
        ))}
      </div>
    </div>
  )
}

export default function InterestTile({
  kind,
  id,
  label,
  color,
  tier,
  samples,
  onPick,
}: InterestTileProps) {
  const seed = seedHash(`${kind}:${id}`)

  let body: React.ReactNode = null
  if (tier === 'hero') {
    body = <UrlRows samples={samples} max={4} />
  } else if (tier === 'featured') {
    const rows = 2 + (seed % 3)
    body = <UrlRows samples={samples} max={Math.min(rows, samples.length)} />
  } else if (tier === 'standard') {
    const rows = 1 + (seed % 3)
    body = <UrlRows samples={samples} max={Math.min(rows, samples.length)} />
  } else if (samples.length > 0) {
    if (seed % 3 === 0) {
      body = <UrlRows samples={samples} max={1} />
    } else {
      const favCount = 3 + (seed % 3)
      body = <PlatformStrip samples={samples} max={favCount} />
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPick()
    }
  }

  const handleClick = (_e: MouseEvent) => {
    onPick()
  }

  return (
    <button
      type="button"
      className={`hm-tile hm-${tier} hm-${kind}`}
      style={kind === 'verb' ? ({ ['--verb-color' as string]: color }) : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
    >
      <div className="hm-tile-body">
        <div className="hm-tile-label">{label}</div>
      </div>
      {body}
    </button>
  )
}
