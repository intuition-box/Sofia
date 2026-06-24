/**
 * Topic cartography — a squarified treemap where each cell's area is the
 * topic's mark intensity. Clicking a cell scopes the Members view to that
 * topic. Ported from `circle/ExpertiseMap.jsx` (Bruls–Huizing–van Wijk).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { TOPICS } from '../data/mock'
import { fmt } from '../data/helpers'
import { ModuleHead } from './primitives'

interface SqItem {
  id: string
  label: string
  color: string
  certs: number
  signals: number
  value: number
}
interface SqRect extends SqItem {
  x: number
  y: number
  w: number
  h: number
}

function squarify(items: SqItem[], X: number, Y: number, W: number, H: number): SqRect[] {
  const total = items.reduce((s, i) => s + i.value, 0)
  const scale = (W * H) / total
  const data = items.map((i) => ({ ...i, area: i.value * scale }))
  const out: SqRect[] = []
  let x = X,
    y = Y,
    w = W,
    h = H
  let row: (SqItem & { area: number })[] = []
  let rowArea = 0
  const q = data.slice()

  const side = () => Math.min(w, h)
  const worst = (r: { area: number }[], area: number, s: number) => {
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
  const bars: number[] = []
  let v = seed * 9301 + 49297
  for (let i = 0; i < 11; i++) {
    v = (v * 9301 + 49297) % 233280
    bars.push(0.32 + (v / 233280) * 0.68)
  }
  return (
    <div className="tmap-spark">
      {bars.map((b, i) => (
        <i key={i} style={{ height: `${b * 100}%`, opacity: 0.35 + b * 0.4 }} />
      ))}
    </div>
  )
}

interface TopicsTreemapProps {
  domain: string
  onPick: (id: string) => void
}

export function TopicsTreemap({ domain, onPick }: TopicsTreemapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(1040)
  const H = 388

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
    const items: SqItem[] = TOPICS.map((t) => ({
      id: t.id,
      label: t.label,
      color: t.color,
      certs: t.certs,
      signals: t.signals,
      value: t.signals,
    })).sort((a, b) => b.value - a.value)
    if (!W || W <= 0) return []
    return squarify(items, 0, 0, W, H)
  }, [W])

  const active = domain && domain !== 'all' ? domain : null

  return (
    <section className="module">
      <ModuleHead title="Topics" desc="Pick a topic to scope members and bookmarks to it." />
      <div className="tmap" ref={wrapRef} style={{ height: H }}>
        {rects.map((r) => {
          const big = r.w > 150 && r.h > 90
          const med = r.w > 96 && r.h > 56
          const sz = Math.min(30, Math.sqrt(r.w * r.h) / 7, (r.w - 26) / 6.2, r.h / 3)
          const labelSize = Math.max(13, Number.isFinite(sz) ? sz : 13)
          const dimmed = active && active !== r.id
          return (
            <div
              key={r.id}
              className={`tmap-cell${active === r.id ? ' active-cell' : ''}${dimmed ? ' dimmed' : ''}`}
              style={{ left: r.x, top: r.y, width: r.w, height: r.h, ['--c' as string]: r.color }}
              onClick={() => onPick(active === r.id ? 'all' : r.id)}
            >
              <div className="tmap-cell-inner">
                <div className="tmap-meta" style={{ visibility: med ? 'visible' : 'hidden' }}>
                  {fmt(r.certs)} bookmarks
                </div>
                <div>
                  <div className="tmap-label" style={{ fontSize: labelSize }}>
                    {r.label}
                  </div>
                  {big ? <Sparkline seed={r.signals} /> : null}
                </div>
              </div>
              {active === r.id ? <span className="tmap-picked">Scoped ↓</span> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
