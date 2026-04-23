/**
 * TopPlatforms — ranked list of certified platforms with a horizontal bar
 * indicating relative activity count + a mock up/down delta.
 * Ported from proto-explorer/src/components/profileCharts.ts renderTopPlatforms.
 *
 * Pure view. Caller passes the precomputed stats; TopPlatforms renders.
 */

export interface TopPlatformStat {
  id: string
  name: string
  /** Favicon image URL (caller resolves via getFaviconUrl or platform catalog). */
  faviconSrc: string
  /** Signal count for this platform. */
  count: number
  /** Hex/css color for the accent border + rank + topic chip. */
  color: string
  /** Short label for the primary topic (e.g. `Tech` / `Web3`). */
  primaryLabel: string
  /** Mock percentage delta over the period; positive = up, negative = down. */
  delta: number
}

interface TopPlatformsProps {
  items: TopPlatformStat[]
  /** Label shown in the empty state. */
  emptyMessage?: string
}

export default function TopPlatforms({
  items,
  emptyMessage = 'No certified platforms match this filter.',
}: TopPlatformsProps) {
  if (items.length === 0) {
    return <div className="pc-empty">{emptyMessage}</div>
  }

  const max = Math.max(...items.map((s) => s.count), 1)

  return (
    <div className="pc-platforms-list">
      {items.map((s, i) => {
        const pct = (s.count / max) * 100
        const up = s.delta >= 0
        const deltaColor = up ? 'var(--trusted, #6dd4a0)' : 'var(--distrusted, #e87c7c)'
        const rank = String(i + 1).padStart(2, '0')
        return (
          <div
            key={s.id}
            className={`pc-plat-row${i === 0 ? ' pc-plat-top' : ''}`}
            style={{
              ['--plat-color' as string]: s.color,
              ['--plat-bar' as string]: `${pct}%`,
            }}
          >
            <span className="pc-plat-rank">{rank}</span>
            <img
              className="pc-plat-fav"
              src={s.faviconSrc}
              alt=""
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="pc-plat-meta">
              <span className="pc-plat-name">{s.name}</span>
              <span className="pc-plat-topic">
                <span className="pc-plat-dot" />
                {s.primaryLabel}
              </span>
            </div>
            <div className="pc-plat-right">
              <span className="pc-plat-count">{s.count}</span>
              <span className="pc-plat-delta" style={{ color: deltaColor }}>
                {up ? '▲' : '▼'} {Math.abs(s.delta)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
