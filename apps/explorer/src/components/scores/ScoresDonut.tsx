/**
 * ScoresDonut — the reputation constellation donut, extracted from ScoresPage
 * to keep that page under the 800-line cap. Module-level so its hover state
 * survives parent re-renders. Arc = score, inner band = base (your certs),
 * glowing outer band = boost (others). Toggle Topics <-> Verbs; click a
 * segment to select it.
 */
import { useState } from 'react'

// ── Donut geometry ──
const VB = 520
const C = VB / 2
const RO = 196
const RI = 116

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}
function arcPath(ri: number, ro: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0
  const [x0o, y0o] = polar(ro, a0)
  const [x1o, y1o] = polar(ro, a1)
  const [x0i, y0i] = polar(ri, a1)
  const [x1i, y1i] = polar(ri, a0)
  return `M${x0o} ${y0o} A${ro} ${ro} 0 ${large} 1 ${x1o} ${y1o} L${x0i} ${y0i} A${ri} ${ri} 0 ${large} 0 ${x1i} ${y1i} Z`
}

export type Mode = 'topics' | 'verbs'

export interface Seg {
  slug: string
  label: string
  color: string
  score: number
  base: number
  boost: number
  certCount: number
  a0: number
  a1: number
  mid: number
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/* ── Donut (module-level so its hover state survives parent re-renders) ── */
export function ScoresDonut({
  items,
  mode,
  setMode,
  sel,
  setSel,
  totalScore,
}: {
  items: Seg[]
  mode: Mode
  setMode: (m: Mode) => void
  sel: string | null
  setSel: (s: string | null) => void
  totalScore: number
}) {
  const [hover, setHover] = useState<string | null>(null)
  const focus = sel ? items.find((s) => s.slug === sel) : null
  const hv = hover ? items.find((s) => s.slug === hover) : null
  const centerScore = focus
    ? focus.score
    : mode === 'topics'
      ? totalScore
      : items.reduce((s, x) => s + x.score, 0)
  const centerLabel = focus
    ? focus.label
    : mode === 'topics'
      ? 'total score'
      : 'total certs'

  return (
    <div className="sc2-canvas">
      <svg
        className="sc2-svg"
        viewBox={`0 0 ${VB} ${VB}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={() => setSel(null)}
      >
        <defs>
          {items.map((s) => (
            <filter
              key={'f' + s.slug}
              id={'glow-' + s.slug}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="5"
                floodColor={s.color}
                floodOpacity="0.9"
              />
            </filter>
          ))}
        </defs>

        {items.map((s) => {
          const dim = sel && sel !== s.slug
          const isFocus = sel === s.slug
          const ro = RO + (isFocus ? 10 : 0)
          const split = s.score ? RI + (ro - RI) * (s.base / s.score) : ro
          const wide = s.a1 - s.a0 > 16
          return (
            <g
              key={s.slug}
              opacity={dim ? 0.26 : 1}
              style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                setSel(isFocus ? null : s.slug)
              }}
              onMouseEnter={() => setHover(s.slug)}
              onMouseMove={() => setHover(s.slug)}
              onMouseLeave={() => setHover((h) => (h === s.slug ? null : h))}
            >
              <path
                d={arcPath(RI, split, s.a0, s.a1)}
                fill={s.color}
                fillOpacity={mode === 'topics' ? 0.72 : 1}
              />
              {s.boost > 0 && (
                <path
                  d={arcPath(split + 1.5, ro, s.a0, s.a1)}
                  fill={s.color}
                  filter={
                    isFocus || hover === s.slug
                      ? `url(#glow-${s.slug})`
                      : 'none'
                  }
                />
              )}
              {(isFocus || hover === s.slug) && (
                <path
                  d={arcPath(RI, ro, s.a0, s.a1)}
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1"
                />
              )}
              {wide &&
                (() => {
                  const [lx, ly] = polar((RI + ro) / 2, s.mid)
                  return (
                    <text
                      x={lx}
                      y={ly + 5}
                      textAnchor="middle"
                      className="sc2-seg-score"
                      fontSize={s.a1 - s.a0 > 28 ? 17 : 13}
                    >
                      {s.score}
                    </text>
                  )
                })()}
            </g>
          )
        })}

        {/* center */}
        <g pointerEvents="none">
          <text
            x={C}
            y={focus ? C - 16 : C - 6}
            textAnchor="middle"
            className="sc2-center-n"
            fontSize={focus ? 46 : 54}
            fill={focus ? focus.color : 'var(--ds-accent)'}
          >
            {fmt(centerScore)}
          </text>
          <text
            x={C}
            y={focus ? C + 16 : C + 20}
            textAnchor="middle"
            className="sc2-center-lab"
          >
            {centerLabel}
          </text>
          {focus && mode === 'topics' && (
            <text
              x={C}
              y={C + 38}
              textAnchor="middle"
              className="sc2-center-sub"
            >
              base {focus.base} · boost +{focus.boost}
            </text>
          )}
        </g>
      </svg>

      <div className="sc2-modes">
        <button
          className={`sc2-mode${mode === 'topics' ? ' active' : ''}`}
          onClick={() => {
            setMode('topics')
            setSel(null)
          }}
        >
          Topics
        </button>
        <button
          className={`sc2-mode${mode === 'verbs' ? ' active' : ''}`}
          onClick={() => {
            setMode('verbs')
            setSel(null)
          }}
        >
          Verbs
        </button>
      </div>

      <div className="sc2-legend">
        <div className="sc2-legend-row">
          <span className="sc2-lg-arc" />
          <span>
            arc = <b>score</b>
          </span>
        </div>
        <div className="sc2-legend-row">
          <span className="sc2-lg-core" />
          <span>
            inner = <b>your certs</b>
          </span>
        </div>
        {mode === 'topics' && (
          <div className="sc2-legend-row">
            <span className="sc2-lg-halo" />
            <span>
              outer = <b>others' boost</b>
            </span>
          </div>
        )}
      </div>

      {hv &&
        (() => {
          const [tx, ty] = polar(RO + 6, hv.mid)
          return (
            <div
              className="sc2-ctip"
              style={{
                left: `${(tx / VB) * 100}%`,
                top: `${(ty / VB) * 100}%`,
              }}
            >
              <div className="sc2-ctip-t">
                {hv.label} · {hv.score}
              </div>
              <div className="sc2-ctip-s">
                {mode === 'topics' && hv.boost > 0
                  ? `base ${hv.base} · boost +${hv.boost}`
                  : `${hv.certCount} certs`}
              </div>
            </div>
          )
        })()}
    </div>
  )
}
