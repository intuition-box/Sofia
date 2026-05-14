import { useEffect, useRef } from 'react'

/* Plate A — Radar / polar field.
 * Port of the V2 micrographics study "Sofia Slide Plate A.html".
 * 11 axes (3 topics + 8 intentions). Three concentric polygons breathe
 * along each axis via requestAnimationFrame; one set of 11 dots tracks
 * the outermost polygon.
 *
 * The component is self-contained: it owns the SVG and the rAF loop,
 * tears down the loop on unmount, and inherits ink colour from the
 * parent (so it reads correctly on both peach and dark slabs). */

const ANGLES = [
  90, 150, 191.25, 213.75, 236.25, 258.75, 281.25,
  303.75, 326.25, 348.75, 30,
]

const POLYS = [
  {
    id: 'pAll',
    base: [0.92, 0.58, 0.22, 0.78, 0.45, 0.4, 0.32, 0.55, 0.88, 0.85, 0.8],
    amp: 0.05,
    speed: 0.45,
  },
] as const

interface PlateAProps {
  /** Ink palette — defaults to deep-ink for peach slabs. Pass `light`
   *  when rendering on a dark slab so the strokes/labels stay readable. */
  ink?: 'dark' | 'light'
}

export function PlateA({ ink = 'dark' }: PlateAProps) {
  const polyRefs = useRef<(SVGPolygonElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    const cx = 240
    const cy = 240
    const R = 175
    const axes = ANGLES.map((a) => {
      const r = (a * Math.PI) / 180
      return { cos: Math.cos(r), sin: Math.sin(r) }
    })

    let rafId = 0
    function frame(now: number) {
      const t = now / 1000
      POLYS.forEach((p, pi) => {
        const el = polyRefs.current[pi]
        if (!el) return
        const parts: string[] = []
        for (let i = 0; i < 11; i++) {
          const phase = i * 1.05 + pi * 0.7
          const breath =
            Math.sin(t * p.speed + phase) * p.amp +
            Math.cos(t * p.speed * 1.3 + phase * 0.6) * (p.amp * 0.4)
          const v = Math.max(0.08, Math.min(0.99, p.base[i] + breath))
          const x = cx + axes[i].cos * R * v
          const y = cy - axes[i].sin * R * v
          parts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
          if (pi === 0) {
            const dot = dotRefs.current[i]
            if (dot) {
              dot.setAttribute('cx', x.toFixed(2))
              dot.setAttribute('cy', y.toFixed(2))
            }
          }
        }
        el.setAttribute('points', parts.join(' '))
      })
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const inkHex = ink === 'light' ? '#f5e9d8' : '#0a0a0a'
  const dim = ink === 'light' ? 'rgba(245,233,216,0.55)' : 'rgba(10,10,10,0.55)'
  const grid = ink === 'light' ? 'rgba(245,233,216,0.3)' : 'rgba(10,10,10,0.3)'
  const lattice =
    ink === 'light' ? 'rgba(245,233,216,0.22)' : 'rgba(10,10,10,0.22)'
  const dimLabel =
    ink === 'light' ? 'rgba(245,233,216,0.45)' : 'rgba(10,10,10,0.45)'
  const ring = ink === 'light' ? 'rgba(245,233,216,0.45)' : 'rgba(10,10,10,0.45)'
  const fillBase = ink === 'light' ? '245,233,216' : '10,10,10'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 600,
        aspectRatio: '1 / 1',
        fontFamily: 'var(--font-mono)',
        color: inkHex,
      }}
    >
      {/* Single SVG canvas — no external border, no corner ticks, no
          header/footer bars. Chrome (FIG tag + sub label + progress bar)
          lives inline inside the SVG, matching the Fig V.06 chassis. */}
      <svg
        /* viewBox tightened around the chart so the radar fills more of
           the cell. Padding keeps the leftmost (DISTRUST) / rightmost
           label pills visible and reserves space for the inline FIG
           header (top) and progress bar (bottom). */
        viewBox="-25 -30 500 500"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto' }}
      >
          {/* Outer ring */}
          <circle
            cx="240"
            cy="240"
            r="175"
            fill="none"
            stroke={ring}
            strokeWidth="1"
          />
          {/* Concentric lattice rings (20/40/60/80 %) */}
          <g fill="none" stroke={lattice} strokeWidth="0.6">
            <polygon points="240,205 209.7,222.5 205.7,246.8 210.9,259.4 220.6,269.1 233.2,274.3 246.8,274.3 259.4,269.1 269.1,259.4 274.3,246.8 270.3,222.5" />
            <polygon points="240,170 179.4,205 171.4,253.6 181.8,278.88 201.1,298.2 226.4,308.6 253.6,308.6 278.9,298.2 298.2,278.88 308.6,253.6 300.6,205" />
            <polygon points="240,135 149.0,187.5 137.0,260.5 152.7,298.3 181.7,327.3 219.5,342.9 260.5,342.9 298.3,327.3 327.3,298.3 342.9,260.5 330.9,187.5" />
            <polygon points="240,100 118.7,170 102.7,267.3 123.6,317.8 162.2,356.4 212.7,377.3 267.3,377.3 317.8,356.4 356.4,317.8 377.3,267.3 361.3,170" />
          </g>
          {/* Horizontal datum */}
          <line
            x1="65"
            y1="240"
            x2="415"
            y2="240"
            stroke={dim}
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          {/* 11 axis spokes */}
          <g stroke={grid} strokeWidth="0.6">
            <line x1="240" y1="240" x2="240" y2="65" />
            <line x1="240" y1="240" x2="88.4" y2="152.5" />
            <line x1="240" y1="240" x2="391.6" y2="152.5" />
            <line x1="240" y1="240" x2="411.6" y2="274.1" />
            <line x1="240" y1="240" x2="385.5" y2="337.2" />
            <line x1="240" y1="240" x2="337.2" y2="385.5" />
            <line x1="240" y1="240" x2="274.1" y2="411.6" />
            <line x1="240" y1="240" x2="205.9" y2="411.6" />
            <line x1="240" y1="240" x2="142.8" y2="385.5" />
            <line x1="240" y1="240" x2="94.5" y2="337.2" />
            <line x1="240" y1="240" x2="68.4" y2="274.1" />
          </g>
          {/* Ring scale labels */}
          <g fontSize="7" fill={dimLabel} textAnchor="end">
            <text x="236" y="208">20</text>
            <text x="236" y="173">40</text>
            <text x="236" y="138">60</text>
            <text x="236" y="103">80</text>
            <text x="236" y="68">100</text>
          </g>

          {/* Animated polygon (with tracker dots on its vertices) */}
          <polygon
            ref={(el) => {
              polyRefs.current[0] = el
            }}
            points=""
            fill={`rgba(${fillBase},0.12)`}
            stroke={inkHex}
            strokeWidth="1.3"
          />

          {/* Outer-poly tracker dots */}
          <g fill={inkHex}>
            {Array.from({ length: 11 }).map((_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  dotRefs.current[i] = el
                }}
                r="2.2"
              />
            ))}
          </g>

          {/* Topic labels (top axes) — wrapped in a colored pill bg.
              Colours pulled from packages/design-system topic palette
              and the matching intention atom palette. */}
          <PillLabel x={240} y={50} anchor="middle" bg="#7bade0" fontSize={11}>
            TECH &amp; DEV
          </PillLabel>
          <PillLabel x={80} y={146} anchor="end" bg="#d98cb3" fontSize={11}>
            DESIGN
          </PillLabel>
          <PillLabel x={400} y={146} anchor="start" bg="#6dd4a0" fontSize={11}>
            WEB3
          </PillLabel>

          {/* Intention labels (lower hemisphere) — 1:1 mapping to the
              design system intention palette (--work / --learning / …). */}
          <PillLabel x={420} y={277} anchor="start" bg="#7bade0" fontSize={10}>
            WORK
          </PillLabel>
          <PillLabel x={395} y={343} anchor="start" bg="#5cc4d6" fontSize={10}>
            LEARNING
          </PillLabel>
          <PillLabel x={345} y={395} anchor="start" bg="#e4b95a" fontSize={10}>
            FUN
          </PillLabel>
          <PillLabel x={278} y={427} anchor="start" bg="#d98cb3" fontSize={10}>
            BUYING
          </PillLabel>
          <PillLabel x={202} y={427} anchor="end" bg="#e0896a" fontSize={10}>
            MUSIC
          </PillLabel>
          <PillLabel x={135} y={395} anchor="end" bg="#a78bdb" fontSize={10}>
            INSPIRATION
          </PillLabel>
          <PillLabel x={85} y={343} anchor="end" bg="#6dd4a0" fontSize={10}>
            TRUST
          </PillLabel>
          <PillLabel x={60} y={277} anchor="end" bg="#e87c7c" fontSize={10}>
            DISTRUST
          </PillLabel>
          {/* Centre node */}
          <circle cx="240" cy="240" r="2.8" fill={inkHex} />

          {/* Inline FIG header — same chassis as Fig V.06. Top-left
              tag + sub label, top-right step dots. */}
          <g fontFamily="JetBrains Mono, monospace">
            <text
              x={-20}
              y={-14}
              fontSize="8"
              fill={dim}
              letterSpacing="0.22em"
            >
              FIG · A · 01/01 · TOPICS × INTENTIONS
            </text>
            <text
              x={-20}
              y={-3}
              fontSize="7"
              fill={dimLabel}
              letterSpacing="0.18em"
            >
              POLAR FIELD · 11 AXES
            </text>
            <g transform="translate(460, -8)">
              {[0, 1, 2].map((k) => (
                <circle
                  key={k}
                  cx={k * 12 - 24}
                  cy={0}
                  r="2.6"
                  fill={k === 0 ? inkHex : dim}
                />
              ))}
            </g>
          </g>

          {/* Bottom progress bar — same shape as Fig V.06. */}
          <g>
            <rect
              x={-20}
              y={462}
              width={490}
              height="2"
              fill={dim}
              opacity="0.3"
            />
            <rect
              x={-20}
              y={462}
              width={490 * 0.5}
              height="2"
              fill={inkHex}
            />
          </g>
        </svg>
    </div>
  )
}

/* SVG pill label — solid background swatch + label text centred on
 * top. Radius matches the explorer's intention-pill (6px). Label width
 * is approximated from char count × the mono pitch at the requested
 * font-size, and text is centred vertically via dominantBaseline. */
function PillLabel({
  x,
  y,
  anchor,
  bg,
  fontSize,
  children,
}: {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  bg: string
  fontSize: number
  /** A single string (used for width estimation). */
  children: string
}) {
  const text = String(children).replace(/\s+/g, ' ').trim()
  /* Letter pitch tuned for mono + 0.18em letter-spacing. */
  const charW = fontSize * 0.78
  const padX = 8
  const padY = 4
  const textWidth = text.length * charW
  const width = textWidth + padX * 2
  const height = fontSize + padY * 2
  /* Anchor-aware horizontal offset for the rect — pad on BOTH sides
   * so the text is always horizontally centred inside the pill:
   *   start  → pill starts padX before the text start
   *   end    → pill ends padX after the text end
   *   middle → pill is centred on the same x as the text */
  const rectX =
    anchor === 'middle'
      ? x - width / 2
      : anchor === 'end'
        ? x - textWidth - padX
        : x - padX
  /* Pill is centred on the y point so text (dominantBaseline=central)
   * lands exactly in the middle of the swatch. */
  const rectY = y - height / 2
  return (
    <g>
      <rect
        x={rectX}
        y={rectY}
        width={width}
        height={height}
        rx={6}
        ry={6}
        fill={bg}
      />
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        dominantBaseline="central"
        fontFamily="JetBrains Mono, monospace"
        fontSize={fontSize}
        fontWeight={500}
        letterSpacing="0.18em"
        fill="#02000e"
      >
        {text}
      </text>
    </g>
  )
}

