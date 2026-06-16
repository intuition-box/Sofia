import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * `<Treemap>` — squarified treemap (Bruls, Huizing & van Wijk) ported from the
 * newexplorerDAO handoff (circle/ExpertiseMap.jsx). Presentational + generic:
 * the caller supplies `nodes` (each with a numeric `value`, a `color`, and a
 * `label`); the component lays them out to fill its measured width × `height`.
 *
 * Selection is controlled: pass `selectedId` and handle `onSelect(id)`. The
 * caller decides toggle semantics (the circle calls `onSelect(id === sel ?
 * 'all' : id)`). Non-selected cells dim while a selection is active.
 *
 * Requires `import "@0xsofia/design-system/styles/treemap.css"`.
 */
export interface TreemapNode {
  id: string
  /** Area weight (e.g. activity intensity). */
  value: number
  color: string
  label: string
  /** Optional meta line shown on medium+ cells (e.g. "312 certifications"). */
  meta?: ReactNode
  /** Optional sparkline seed (deterministic bars on big cells). */
  seed?: number
}

interface Rect extends TreemapNode {
  x: number
  y: number
  w: number
  h: number
}

function squarify(items: TreemapNode[], W: number, H: number): Rect[] {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total <= 0) return []
  const scale = (W * H) / total
  const data = items.map((i) => ({ ...i, area: i.value * scale }))
  const out: Rect[] = []
  let x = 0,
    y = 0,
    w = W,
    h = H
  let row: Array<TreemapNode & { area: number }> = []
  let rowArea = 0
  const q = data.slice()

  const side = () => Math.min(w, h)
  const worst = (r: Array<{ area: number }>, area: number, s: number) => {
    const max = Math.max(...r.map((it) => it.area))
    const min = Math.min(...r.map((it) => it.area))
    return Math.max((s * s * max) / (area * area), (area * area) / (s * s * min))
  }
  const flush = () => {
    const s = rowArea
    if (w >= h) {
      const colW = s / h
      let cy = y
      for (const it of row) {
        const ch = it.area / colW
        out.push({ ...it, x, y: cy, w: colW, h: ch })
        cy += ch
      }
      x += colW
      w -= colW
    } else {
      const rowH = s / w
      let cx = x
      for (const it of row) {
        const cw = it.area / rowH
        out.push({ ...it, x: cx, y, w: cw, h: rowH })
        cx += cw
      }
      y += rowH
      h -= rowH
    }
    row = []
    rowArea = 0
  }

  while (q.length) {
    const it = q[0]
    if (row.length === 0) {
      row.push(it)
      rowArea += it.area
      q.shift()
      continue
    }
    const s = side()
    const cur = worst(row, rowArea, s)
    const nxt = worst(row.concat(it), rowArea + it.area, s)
    if (nxt <= cur) {
      row.push(it)
      rowArea += it.area
      q.shift()
    } else flush()
  }
  if (row.length) flush()
  return out
}

function Sparkline({ seed }: { seed: number }) {
  const bars = useMemo(() => {
    const out: number[] = []
    let v = seed * 9301 + 49297
    for (let i = 0; i < 11; i++) {
      v = (v * 9301 + 49297) % 233280
      out.push(0.32 + (v / 233280) * 0.68)
    }
    return out
  }, [seed])
  return (
    <div className="ds-tmap-spark">
      {bars.map((b, i) => (
        <i key={i} style={{ height: `${b * 100}%`, opacity: 0.35 + b * 0.4 }} />
      ))}
    </div>
  )
}

export interface TreemapProps {
  nodes: TreemapNode[]
  /** Fixed pixel height of the map. Default 388. */
  height?: number
  /** Currently-scoped node id (or null/'all' for none). */
  selectedId?: string | null
  /** Fired with the clicked node id — caller owns toggle semantics. */
  onSelect?: (id: string) => void
  /** Render deterministic sparklines on big cells (default true). */
  sparkline?: boolean
  /** Label shown on the scoped cell (default "Scoped ↓"). */
  scopedLabel?: string
  className?: string
}

export function Treemap({
  nodes,
  height = 388,
  selectedId,
  onSelect,
  sparkline = true,
  scopedLabel = 'Scoped ↓',
  className,
}: TreemapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1040)

  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setW(wrapRef.current.clientWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const rects = useMemo(() => {
    if (!w || w <= 0) return []
    const items = [...nodes].sort((a, b) => b.value - a.value)
    return squarify(items, w, height)
  }, [nodes, w, height])

  const active = selectedId && selectedId !== 'all' ? selectedId : null

  return (
    <div
      className={className ? `ds-tmap ${className}` : 'ds-tmap'}
      ref={wrapRef}
      style={{ height }}>
      {rects.map((r) => {
        const big = r.w > 150 && r.h > 90
        const med = r.w > 96 && r.h > 56
        const sz = Math.min(30, Math.sqrt(r.w * r.h) / 7, (r.w - 26) / 6.2, r.h / 3)
        const labelSize = Math.max(13, Number.isFinite(sz) ? sz : 13)
        const dimmed = active != null && active !== r.id
        return (
          <div
            key={r.id}
            className={`ds-tmap-cell${active === r.id ? ' is-active' : ''}${dimmed ? ' is-dimmed' : ''}`}
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              ['--ds-cell' as string]: r.color,
            }}
            onClick={() => onSelect?.(r.id)}>
            <div className="ds-tmap-cell-inner">
              <div className="ds-tmap-meta" style={{ visibility: med && r.meta != null ? 'visible' : 'hidden' }}>
                <span className="dot" />
                {r.meta}
              </div>
              <div>
                <div className="ds-tmap-label" style={{ fontSize: labelSize }}>
                  {r.label}
                </div>
                {big && sparkline ? <Sparkline seed={r.seed ?? r.value} /> : null}
              </div>
            </div>
            {active === r.id ? <span className="ds-tmap-picked">{scopedLabel}</span> : null}
          </div>
        )
      })}
    </div>
  )
}
