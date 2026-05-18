import { useEffect, useRef, useState } from 'react'
import styles from './IsoStack.module.css'

/**
 * IsoStack — isometric 30° stack of 5 layered rhombuses, animated
 * from a single rAF loop. Reveal sequence is triggered when the
 * closest `[data-deck-slide]` ancestor becomes active, so plates fade
 * in top → bottom after the diagonal wipe finishes.
 */

const PEACH = 'var(--color-accent)'
const PEACH_FADE_35 = 'rgba(255, 198, 176, 0.35)'

type DiagramMode = 'dark' | 'light'

interface Layer {
  z: number
  tag: string
  name: string
  sub: string
  detail: string
  color: string
  dots: number
}

const ISO_PALETTE: Record<
  DiagramMode,
  {
    fg: string
    fgSoft: string
    fgDim: string
    fgFaint: string
    plateFill: string
    plateFillTop: string
    grid: string
    framePath: string
    flowText: string
    block: string
    travel: string
    spineDashed: string
  }
> = {
  dark: {
    fg: '#ffffff',
    fgSoft: 'rgba(255,255,255,0.55)',
    fgDim: 'rgba(255,255,255,0.5)',
    fgFaint: 'rgba(255,255,255,0.45)',
    plateFill: 'rgba(255,255,255,0.02)',
    plateFillTop: 'rgba(255,255,255,0.05)',
    grid: 'rgba(255,255,255,0.06)',
    framePath: 'rgba(255,255,255,0.4)',
    flowText: 'rgba(255,255,255,0.6)',
    block: 'rgba(255,255,255,0.25)',
    travel: 'var(--color-accent)',
    spineDashed: PEACH_FADE_35,
  },
  light: {
    fg: '#02000e',
    fgSoft: 'rgba(0,0,0,0.6)',
    fgDim: 'rgba(0,0,0,0.55)',
    fgFaint: 'rgba(0,0,0,0.5)',
    plateFill: 'rgba(0,0,0,0.04)',
    plateFillTop: 'rgba(0,0,0,0.08)',
    grid: 'rgba(0,0,0,0.12)',
    framePath: 'rgba(0,0,0,0.5)',
    flowText: 'rgba(0,0,0,0.65)',
    block: 'rgba(0,0,0,0.3)',
    travel: '#02000e',
    spineDashed: 'rgba(0,0,0,0.4)',
  },
}

export function IsoStack({
  mode = 'dark',
  plateFill,
  plateFillTop,
  plateStroke,
  dotFill,
  dotFills,
}: {
  mode?: DiagramMode
  /** Override the side (non-top) plate fill. */
  plateFill?: string
  /** Override the top plate fill. Falls back to `plateFill` if only
   *  one override is provided. */
  plateFillTop?: string
  /** Override the plate outline colour — replaces the per-layer
   *  accent stroke with a single colour for a flat, mono look. */
  plateStroke?: string
  /** Override the colour of the scattered dots inside each plate.
   *  Defaults to the layer accent colour. */
  dotFill?: string
  /** Optional palette to vary dot colours within a plate. When set,
   *  each dot picks one of these colours pseudo-randomly (seeded by
   *  its index) so the rhombuses get a salt-and-pepper read instead
   *  of a monochrome one. Overrides `dotFill` when both are set. */
  dotFills?: string[]
} = {}) {
  const base = ISO_PALETTE[mode]
  const p = {
    ...base,
    plateFill: plateFill ?? base.plateFill,
    plateFillTop: plateFillTop ?? plateFill ?? base.plateFillTop,
  }
  const [t, setT] = useState(0)
  /* Restart the reveal timer when the host slide enters the viewport.
   * Plates are mounted off-screen via transform: translate3d on the
   * parent slide; IntersectionObserver therefore can't see them.
   * Instead we watch the closest `[data-deck-slide]` ancestor for the
   * `data-active` attribute flip via MutationObserver — when the slide
   * becomes active, t is reset to 0 and the rAF loop counts up so the
   * 5 plates fade in after the diagonal wipe finishes (~700ms). */
  const wrapperRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const wrapper = wrapperRef.current
    const slide = wrapper?.closest('[data-deck-slide]') as HTMLElement | null
    let raf = 0
    let startedAt = 0
    let active = slide?.dataset.active === 'true'
    const tick = () => {
      if (active) setT((performance.now() - startedAt) / 1000)
      raf = requestAnimationFrame(tick)
    }
    const begin = () => {
      startedAt = performance.now()
      setT(0)
    }
    if (active) begin()
    raf = requestAnimationFrame(tick)
    let mo: MutationObserver | null = null
    if (slide) {
      mo = new MutationObserver(() => {
        const next = slide.dataset.active === 'true'
        if (next && !active) begin()
        active = next
      })
      mo.observe(slide, { attributes: true, attributeFilter: ['data-active'] })
    }
    return () => {
      cancelAnimationFrame(raf)
      mo?.disconnect()
    }
  }, [])

  const iso = (x: number, y: number, z: number): [number, number] => [
    (x - y) * 0.866,
    (x + y) * 0.5 - z,
  ]
  const W = 70
  /* Per-layer intention colours — sourced from packages/design-system
   * theme tokens (--learning / --work / --inspiration / --fun /
   * --trusted). Used as the rhombus fill (low-opacity tint) AND the
   * outline / dot accent so the whole stack reads as an intention map. */
  const lc = ['#5cc4d6', '#7bade0', '#a78bdb', '#e4b95a', '#6dd4a0']
  /* Z-axis runs LOW (top of screen) → HIGH (bottom of screen) thanks to
     the iso projection inverting Y. The stack reads top-to-bottom:
     BROWSING → EXTENSION → PUBLIC LEDGER → COLLECTIVE → TRUSTED. Dots
     density increases as we go down (6 → 22) so the funnel widens
     toward the trusted circle at the bottom. */
  const layers: Layer[] = [
    {
      z: 0,
      tag: 'L.01',
      name: 'BROWSING ACTIVITY',
      sub: 'pages · sessions · echoes',
      color: lc[0],
      dots: 6,
      detail: 'your data · stays local',
    },
    {
      z: 62.5,
      tag: 'L.02',
      name: 'EXTENSION',
      sub: 'capture · summarize · sign',
      color: lc[1],
      dots: 10,
      detail: 'chromium · local-first agent',
    },
    {
      z: 125,
      tag: 'L.03',
      name: 'PUBLIC LEDGER',
      sub: 'signed · permanent · yours',
      color: lc[2],
      dots: 14,
      detail: 'a record nobody can rewrite',
    },
    {
      z: 187.5,
      tag: 'L.04',
      name: 'COLLECTIVE INTELLIGENCE',
      sub: 'resonance · ranking · trends',
      color: lc[3],
      dots: 18,
      detail: 'aggregated signal · network',
    },
    {
      z: 250,
      tag: 'L.05',
      name: 'TRUSTED CIRCLE',
      sub: 'follow · stake · reputation',
      color: lc[4],
      dots: 22,
      detail: 'your people · your weighting',
    },
  ]

  const REVEAL_START = 0.3
  const REVEAL_STRIDE = 0.55
  const REVEAL_FADE = 0.4
  const layerOpacity = (i: number) => {
    const start = REVEAL_START + i * REVEAL_STRIDE
    return Math.max(0, Math.min(1, (t - start) / REVEAL_FADE))
  }
  const allRevealed =
    t > REVEAL_START + (layers.length - 1) * REVEAL_STRIDE + REVEAL_FADE

  const cx = 215
  const cy = 130
  const pt = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = iso(x, y, z)
    return [cx + px, cy - py]
  }

  const Plate = ({
    z,
    tag,
    name,
    sub,
    detail,
    color,
    dots,
    idx,
    isTop,
    opacity,
  }: Layer & { idx: number; isTop: boolean; opacity: number }) => {
    const tl = pt(-W, -W, z)
    const tr = pt(W, -W, z)
    const br = pt(W, W, z)
    const bl = pt(-W, W, z)
    const path = `M ${tl[0]},${tl[1]} L ${tr[0]},${tr[1]} L ${br[0]},${br[1]} L ${bl[0]},${bl[1]} Z`
    const dotPos: [number, number][] = []
    for (let i = 0; i < dots; i++) {
      const seed = i * 17 + idx * 31
      dotPos.push([
        (((seed * 73) % 1000) / 1000) * 1.7 * W - 0.85 * W,
        (((seed * 41) % 1000) / 1000) * 1.7 * W - 0.85 * W,
      ])
    }
    const right = pt(W, -W, z)
    const labelX = right[0] + 22
    const labelY = right[1] + 2
    return (
      <g opacity={opacity} className={styles.plate}>
        <path
          d={path}
          fill={plateFill ?? color}
          fillOpacity={plateFill ? 1 : 0.18}
          stroke={plateStroke ?? color}
          strokeWidth={isTop ? 1.2 : 1}
          strokeLinejoin="miter"
        />
        {[-W * 0.5, 0, W * 0.5].map((g, gi) => {
          const a = pt(g, -W, z)
          const b = pt(g, W, z)
          const c = pt(-W, g, z)
          const d = pt(W, g, z)
          return (
            <g key={gi} stroke={p.grid} strokeWidth="0.5">
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
              <line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />
            </g>
          )
        })}
        {dotPos.map(([dx, dy], i) => {
          const drift = Math.sin(t * 0.6 + i + idx) * 3
          const driftY = Math.cos(t * 0.5 + i * 1.3 + idx) * 3
          const [x, y] = pt(dx + drift, dy + driftY, z)
          const dotColor =
            dotFills && dotFills.length > 0
              ? dotFills[(i * 31 + idx * 17) % dotFills.length]
              : (dotFill ?? color)
          return <circle key={i} cx={x} cy={y} r="1.4" fill={dotColor} />
        })}
        <line
          x1={right[0]}
          y1={right[1]}
          x2={labelX - 3}
          y2={labelY}
          stroke={p.framePath}
          strokeWidth="0.5"
        />
        <circle cx={right[0]} cy={right[1]} r="2" fill={color} />
        <text
          x={labelX}
          y={labelY - 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize="7.5"
          fill={p.fgSoft}
          letterSpacing="0.18em">
          {tag}
        </text>
        <text
          x={labelX}
          y={labelY + 7}
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fontWeight="500"
          fill={p.fg}
          letterSpacing="0.14em">
          {name}
        </text>
        <text
          x={labelX}
          y={labelY + 18}
          fontFamily="JetBrains Mono, monospace"
          fontSize="7"
          fill={p.fgDim}
          letterSpacing="0.1em">
          {sub}
        </text>
        <text
          x={labelX}
          y={labelY + 28}
          fontFamily="JetBrains Mono, monospace"
          fontSize="6.5"
          fill={p.fgDim}
          letterSpacing="0.14em">
          {detail}
        </text>
      </g>
    )
  }

  const spineTop = pt(0, 0, 250)
  const spineBot = pt(0, 0, 0)

  const travelDots = [0, 0.2, 0.4, 0.6, 0.8].map((off) => {
    const u = (off + ((t * 0.16) % 1)) % 1
    return { p: pt(0, 0, u * 250), u }
  })

  return (
    <svg
      ref={wrapperRef}
      viewBox="0 0 540 540"
      className={styles.svg}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="iso-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern
          id="iso-grid-fine"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse">
          <path
            d="M 4 0 L 0 0 0 4"
            fill="none"
            stroke="rgba(255,255,255,0.025)"
            strokeWidth="0.4"
          />
        </pattern>
        <marker
          id="iso-arr"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill={PEACH} />
        </marker>
      </defs>
      <g fontFamily="JetBrains Mono, monospace">
        <text x="20" y="30" fontSize="8" fill={p.fgDim} letterSpacing="0.22em">
          FIG · D · 01/01 · ISO STACK
        </text>
        <g transform="translate(480, 28)">
          {[0, 1, 2].map((k) => (
            <circle
              key={k}
              cx={k * 14 - 28}
              cy={0}
              r="3"
              fill={k === 0 ? p.fg : p.fgFaint}
            />
          ))}
        </g>
      </g>

      <line
        x1={spineTop[0]}
        y1={spineTop[1]}
        x2={spineBot[0]}
        y2={spineBot[1]}
        stroke={p.spineDashed}
        strokeWidth="0.75"
        strokeDasharray="3 3"
      />

      {layers.map((L, i) => (
        <Plate
          key={i}
          {...L}
          idx={i}
          isTop={i === 0}
          opacity={layerOpacity(i)}
        />
      ))}

      {allRevealed &&
        travelDots.map(({ p: pos, u }, i) => (
          <circle
            key={i}
            cx={pos[0]}
            cy={pos[1]}
            r="2.5"
            fill={p.travel}
            opacity={0.4 + u * 0.6}
          />
        ))}

      <g>
        <rect
          x="20"
          y="522"
          width="500"
          height="2"
          fill={p.fgFaint}
          opacity="0.3"
        />
        <rect x="20" y="522" width={500 * 0.5} height="2" fill={p.fg} />
      </g>
    </svg>
  )
}
