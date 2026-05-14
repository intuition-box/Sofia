import { useEffect, useRef, useState } from 'react'
import styles from './Instruments.module.css'

/**
 * Sofia · Drafting room — pure SVG schematics, used as side visuals
 * inside the section frames (Hero, Features, Steps).
 *   PLATE.A — Topics × intentions (radial polar field)
 *   PLATE.D — Iso stack (system topology, isometric 30°)
 *   PLATE.C — Three circles (attention relief, contour map)
 *
 * Each plate is 1px-stroke vector, monospace annotations, peach
 * highlight. Animated from a single rAF loop per plate.
 */

const PEACH = 'var(--color-accent)'
const PEACH_FADE_14 = 'rgba(255, 198, 176, 0.14)'
const PEACH_FADE_40 = 'rgba(255, 198, 176, 0.4)'
const PEACH_FADE_50 = 'rgba(255, 198, 176, 0.5)'
const PEACH_FADE_25 = 'rgba(255, 198, 176, 0.25)'
const PEACH_FADE_35 = 'rgba(255, 198, 176, 0.35)'
const INK_PLATE_FILL = '#0E0E0E'

/* ── TopicsIntentions theme palette ─────────────────────
 * `dark` (default) = white-on-dark used inside ink plates.
 * `light` = ink-on-peach for use directly on the peach Hero. */
type DiagramMode = 'dark' | 'light'

const TOPICS_PALETTE: Record<
  DiagramMode,
  {
    fg: string
    fgSoft: string
    fgDim: string
    ring: string
    ringFaint: string
    axis: string
    ticks: string
    accent: string
    accentFill: string
    accentDashed: string
    accentLine: string
    centerInner: string
  }
> = {
  dark: {
    fg: '#ffffff',
    fgSoft: 'rgba(255,255,255,0.55)',
    fgDim: 'rgba(255,255,255,0.5)',
    ring: 'rgba(255,255,255,0.35)',
    ringFaint: 'rgba(255,255,255,0.08)',
    axis: 'rgba(255,255,255,0.12)',
    ticks: 'rgba(255,255,255,0.4)',
    accent: 'var(--color-accent)',
    accentFill: PEACH_FADE_14,
    accentDashed: PEACH_FADE_40,
    accentLine: PEACH_FADE_50,
    centerInner: '#000000',
  },
  light: {
    fg: '#02000e',
    fgSoft: 'rgba(0,0,0,0.55)',
    fgDim: 'rgba(0,0,0,0.5)',
    ring: 'rgba(0,0,0,0.45)',
    ringFaint: 'rgba(0,0,0,0.18)',
    axis: 'rgba(0,0,0,0.22)',
    ticks: 'rgba(0,0,0,0.4)',
    accent: '#02000e',
    accentFill: 'rgba(0,0,0,0.10)',
    accentDashed: 'rgba(0,0,0,0.5)',
    accentLine: 'rgba(0,0,0,0.55)',
    centerInner: '#ffffff',
  },
}

/* ── PLATE.A — Topics × intentions ──────────────────── */

export function TopicsIntentions({
  mode = 'dark',
}: { mode?: DiagramMode } = {}) {
  const c = TOPICS_PALETTE[mode]
  const [ang, setAng] = useState(0)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      setAng((a) => (a + 0.25) % 360)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  const cx = 240
  const cy = 240

  const TOPIC_NAMES = [
    'TECH & DEV',
    'DESIGN',
    'MUSIC',
    'GAMING',
    'WEB3',
    'SCIENCE',
    'SPORT',
    'VIDEO',
    'BUSINESS',
    'ARTS',
    'NATURE',
    'FOOD',
    'LITERATURE',
    'GROWTH',
  ]
  const topics = TOPIC_NAMES.map((name, i) => ({
    name,
    a: -90 + (i / TOPIC_NAMES.length) * 360,
  }))

  const INTENTIONS = [
    { name: 'WORK', v: 0.78 },
    { name: 'LEARNING', v: 0.92 },
    { name: 'FUN', v: 0.64 },
    { name: 'INSPIRATION', v: 0.71 },
    { name: 'BUYING', v: 0.42 },
    { name: 'MUSIC', v: 0.55 },
  ]
  const intentions = INTENTIONS.map((it, i) => ({
    ...it,
    a: -90 + (i / INTENTIONS.length) * 360,
  }))

  const Rt = 200
  const Ri = 130
  const rad = (a: number) => (a * Math.PI) / 180

  const ticks: JSX.Element[] = []
  for (let a = 0; a < 360; a += 5) {
    const inner = a % 45 === 0 ? Rt - 12 : a % 15 === 0 ? Rt - 8 : Rt - 4
    ticks.push(
      <line
        key={a}
        x1={cx + Math.cos(rad(a - 90)) * inner}
        y1={cy + Math.sin(rad(a - 90)) * inner}
        x2={cx + Math.cos(rad(a - 90)) * Rt}
        y2={cy + Math.sin(rad(a - 90)) * Rt}
        stroke={c.ticks}
        strokeWidth={a % 45 === 0 ? 0.8 : 0.4}
      />,
    )
  }

  const tSec = ang / 60
  const pts = intentions.map((it, i) => {
    const phase = i * 1.05
    const speed = 0.6 + (i % 3) * 0.18
    const breathe =
      Math.sin(tSec * speed + phase) * 0.18 +
      Math.cos(tSec * speed * 1.3 + phase * 0.7) * 0.08
    const v = Math.max(0.18, Math.min(0.98, it.v + breathe))
    const r = v * (Ri - 10)
    return {
      xy: [cx + Math.cos(rad(it.a)) * r, cy + Math.sin(rad(it.a)) * r] as const,
      v,
    }
  })

  return (
    <svg
      viewBox="0 0 480 480"
      className={styles.svg}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={cx}
        cy={cy}
        r={Rt}
        fill="none"
        stroke={c.ring}
        strokeWidth="0.75"
      />
      <circle
        cx={cx}
        cy={cy}
        r={Rt - 12}
        fill="none"
        stroke={c.ringFaint}
        strokeWidth="0.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={Ri}
        fill="none"
        stroke={c.accentDashed}
        strokeWidth="0.5"
        strokeDasharray="2 3"
      />
      <circle
        cx={cx}
        cy={cy}
        r={Ri - 50}
        fill="none"
        stroke={c.ringFaint}
        strokeWidth="0.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={Ri - 90}
        fill="none"
        stroke={c.ringFaint}
        strokeWidth="0.5"
      />
      {ticks}

      <line
        x1={cx}
        y1={cy - Rt - 4}
        x2={cx}
        y2={cy + Rt + 4}
        stroke={c.axis}
        strokeWidth="0.5"
      />
      <line
        x1={cx - Rt - 4}
        y1={cy}
        x2={cx + Rt + 4}
        y2={cy}
        stroke={c.axis}
        strokeWidth="0.5"
      />

      {topics.map((t) => {
        const x = cx + Math.cos(rad(t.a)) * (Rt + 16)
        const y = cy + Math.sin(rad(t.a)) * (Rt + 16)
        let rot = t.a + 90
        if (rot > 90 && rot < 270) rot -= 180
        return (
          <text
            key={t.name}
            x={x}
            y={y}
            transform={`rotate(${rot} ${x} ${y})`}
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fill={c.fg}
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="0.18em"
          >
            {t.name}
          </text>
        )
      })}
      {topics.map((t) => (
        <circle
          key={'d' + t.name}
          cx={cx + Math.cos(rad(t.a)) * Rt}
          cy={cy + Math.sin(rad(t.a)) * Rt}
          r="2"
          fill={c.fg}
        />
      ))}

      <polygon
        points={pts
          .map((p) => p.xy.map((n) => n.toFixed(1)).join(','))
          .join(' ')}
        fill={c.accentFill}
        stroke={c.accent}
        strokeWidth="1"
      />
      {pts.map((p, i) => {
        const it = intentions[i]
        const lx = cx + Math.cos(rad(it.a)) * (Ri - 4)
        const ly = cy + Math.sin(rad(it.a)) * (Ri - 4)
        return (
          <g key={i}>
            <circle cx={p.xy[0]} cy={p.xy[1]} r="3" fill={c.accent} />
            <text
              x={lx}
              y={ly - 4}
              fontFamily="JetBrains Mono, monospace"
              fontSize="8"
              fill={c.accent}
              textAnchor="middle"
              letterSpacing="0.16em"
            >
              {it.name}
            </text>
            <text
              x={lx}
              y={ly + 6}
              fontFamily="JetBrains Mono, monospace"
              fontSize="7"
              fill={c.fgSoft}
              textAnchor="middle"
            >
              {p.v.toFixed(2)}
            </text>
          </g>
        )
      })}

      <g transform={`rotate(${ang} ${cx} ${cy})`}>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - Rt}
          stroke={c.accentLine}
          strokeWidth="0.75"
        />
        <circle cx={cx} cy={cy - Rt} r="2" fill={c.accent} />
      </g>

      <circle cx={cx} cy={cy} r="6" fill={c.accent} />
      <circle cx={cx} cy={cy} r="2" fill={c.centerInner} />

      <g
        transform="translate(14, 462)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill={c.fgDim}
        letterSpacing="0.15em"
      >
        <text>n = 14 topics · 6 intentions</text>
      </g>
      <g
        transform="translate(380, 462)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill={c.fgDim}
        letterSpacing="0.15em"
      >
        <text>θ · {Math.round(ang)}°</text>
      </g>
    </svg>
  )
}

/* ── PLATE.D — Iso stack ────────────────────────────── */

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
  /* Per-layer accent colors. In `light` mode (peach background) the
     pastel pinks/peaches collide with the surface, so we swap to darker
     ink-tinted variants that stay readable. */
  /* Per-layer intention colours — sourced from packages/design-system
   * theme tokens (--learning / --work / --inspiration / --fun /
   * --trusted). Used as the rhombus fill (low-opacity tint) AND the
   * outline / dot accent so the whole stack reads as an intention map. */
  const lc = ['#5cc4d6', '#7bade0', '#a78bdb', '#e4b95a', '#6dd4a0']
  /* Z-axis runs LOW (top of screen) → HIGH (bottom of screen) thanks to
     the iso projection inverting Y. The stack now reads top-to-bottom:
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
  /* Reveal order: top of screen first → bottom of screen last.
     With the inverted z values (L.01 at top, L.05 at bottom) and the
     array ordered top → bottom, the reveal index matches the array
     index directly. */
  const layerOpacity = (i: number) => {
    const order = i
    const start = REVEAL_START + order * REVEAL_STRIDE
    return Math.max(0, Math.min(1, (t - start) / REVEAL_FADE))
  }
  const allRevealed = t > REVEAL_START + (layers.length - 1) * REVEAL_STRIDE + REVEAL_FADE

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
      <g opacity={opacity} style={{ transition: 'opacity 0.2s linear' }}>
        {/* Rhombus interior — tinted with the layer's intention colour
            at low opacity so it reads as a coloured face on the slab
            without overpowering the dots / outline. Overrideable from
            outside via plateFill / plateFillTop if a flat look is
            needed for a specific instance. */}
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
          /* Vary dot colour from a provided palette using a stable
             hash of plate idx + dot idx so the salt-and-pepper
             distribution is consistent across renders. */
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
          letterSpacing="0.18em"
        >
          {tag}
        </text>
        <text
          x={labelX}
          y={labelY + 7}
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fontWeight="500"
          fill={p.fg}
          letterSpacing="0.14em"
        >
          {name}
        </text>
        <text
          x={labelX}
          y={labelY + 18}
          fontFamily="JetBrains Mono, monospace"
          fontSize="7"
          fill={p.fgDim}
          letterSpacing="0.1em"
        >
          {sub}
        </text>
        <text
          x={labelX}
          y={labelY + 28}
          fontFamily="JetBrains Mono, monospace"
          fontSize="6.5"
          fill={p.fgDim}
          letterSpacing="0.14em"
        >
          {detail}
        </text>
      </g>
    )
  }

  const spineTop = pt(0, 0, 250)
  const spineBot = pt(0, 0, 0)

  /* Travel dots flow top → bottom: u=0 starts at z=0 (top of screen),
     u=1 ends at z=250 (bottom of screen). */
  const travelDots = [0, 0.2, 0.4, 0.6, 0.8].map((off) => {
    const u = (off + ((t * 0.16) % 1)) % 1
    return { p: pt(0, 0, u * 250), u }
  })

  return (
    <svg
      ref={wrapperRef}
      viewBox="0 0 540 540"
      className={styles.svg}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="iso-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
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
          patternUnits="userSpaceOnUse"
        >
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
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill={PEACH} />
        </marker>
      </defs>
      {/* Fig V.06-style inline header — single FIG tag top-left + step
          dots top-right. No sub label (would duplicate the per-layer
          L.01–L.06 captions rendered next to each rhombus). */}
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

      {/* Bottom progress bar — same chassis as Fig V.06. */}
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

/* ── PLATE.C — Three Circles (attention relief) ─────── */

export function ThreeCircles() {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const loop = () => {
      setT((performance.now() - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  const blobs = [
    {
      c: [240, 180] as const,
      base: 30,
      name: 'INTUITION CIRCLE',
      peak: 'PEAK · 0.94',
      phase: 0,
      speed: 0.45,
    },
    {
      c: [360, 200] as const,
      base: 28,
      name: 'VITALIK CIRCLE',
      peak: 'PEAK · 0.71',
      phase: 2.1,
      speed: 0.55,
    },
    {
      c: [480, 170] as const,
      base: 26,
      name: 'SOFIA CIRCLE',
      peak: 'PEAK · 0.58',
      phase: 4.3,
      speed: 0.38,
    },
  ]

  const contours: JSX.Element[] = []
  blobs.forEach((b, bi) => {
    const breathe = 1 + Math.sin(t * b.speed + b.phase) * 0.025
    for (let level = 0; level < 12; level++) {
      const r = (b.base + level * 9) * breathe
      const pts: [number, number][] = []
      const segs = 48
      const tPhase = t * (0.35 + bi * 0.08) + level * 0.12
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2
        const noise =
          Math.sin(a * 3 + bi * 1.3 + tPhase) * 4 +
          Math.cos(a * 2 + level * 0.7 - tPhase * 0.8) * 3 +
          Math.sin(a * 5 + bi + level + tPhase * 1.4) * 1.5
        const rr = r + noise + level * 1.2
        pts.push([b.c[0] + Math.cos(a) * rr, b.c[1] + Math.sin(a) * rr * 0.72])
      }
      const d =
        'M ' +
        pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L ') +
        ' Z'
      const isPeak = level === 0
      const isOuter = level >= 10
      contours.push(
        <path
          key={`${bi}-${level}`}
          d={d}
          fill="none"
          stroke={
            isPeak
              ? PEACH
              : isOuter
                ? 'rgba(255,255,255,0.14)'
                : `rgba(255,198,176,${0.55 - level * 0.04})`
          }
          strokeWidth={isPeak ? 1.2 : level < 4 ? 0.7 : 0.5}
          strokeDasharray={isOuter ? '1 3' : 'none'}
        />,
      )
    }
  })

  return (
    <svg
      viewBox="0 0 720 360"
      className={styles.svg}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="cir-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          <path
            d="M 8 0 L 0 0 0 8"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern
          id="cir-hatch"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="4"
            stroke="rgba(255,198,176,0.06)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="720" height="360" fill="url(#cir-grid)" />

      {blobs.map((b, i) => (
        <ellipse
          key={'halo' + i}
          cx={b.c[0]}
          cy={b.c[1]}
          rx={b.base + 9 * 8}
          ry={(b.base + 9 * 8) * 0.72}
          fill="url(#cir-hatch)"
        />
      ))}

      <g stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none">
        <line x1="40" y1="20" x2="700" y2="20" />
        <line x1="40" y1="340" x2="700" y2="340" />
        <line x1="40" y1="20" x2="40" y2="340" />
        <line x1="700" y1="20" x2="700" y2="340" />
      </g>
      {(
        [
          'TRUST',
          'TECH',
          'MUSIC',
          'LEARNING',
          'WEB3',
          'DESIGN',
          'WORK',
        ] as const
      ).map((label, i) => (
        <g key={label}>
          <line
            x1={40 + i * 110}
            y1="20"
            x2={40 + i * 110}
            y2="14"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
          />
          <text
            x={40 + i * 110}
            y="11"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7"
            fill="rgba(255,255,255,0.5)"
            textAnchor="middle"
            letterSpacing="0.16em"
          >
            {label}
          </text>
        </g>
      ))}

      {contours}

      {blobs.map((b, i) => {
        const labelY = b.c[1] + 78
        const labelX = Math.max(60, Math.min(b.c[0], 700 - 110))
        return (
          <g key={i}>
            <line
              x1={b.c[0] - 5}
              y1={b.c[1]}
              x2={b.c[0] + 5}
              y2={b.c[1]}
              stroke={PEACH}
              strokeWidth="0.75"
            />
            <line
              x1={b.c[0]}
              y1={b.c[1] - 5}
              x2={b.c[0]}
              y2={b.c[1] + 5}
              stroke={PEACH}
              strokeWidth="0.75"
            />
            <circle cx={b.c[0]} cy={b.c[1]} r="3" fill={PEACH}>
              <animate
                attributeName="r"
                values="3;5;3"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </circle>
            <line
              x1={b.c[0]}
              y1={b.c[1] + 8}
              x2={b.c[0]}
              y2={labelY - 12}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <rect
              x={labelX - 56}
              y={labelY - 11}
              width="112"
              height="26"
              fill={INK_PLATE_FILL}
              stroke={PEACH_FADE_25}
              strokeWidth="0.5"
            />
            <text
              x={labelX}
              y={labelY}
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="#ffffff"
              textAnchor="middle"
              letterSpacing="0.14em"
            >
              {b.name}
            </text>
            <text
              x={labelX}
              y={labelY + 11}
              fontFamily="JetBrains Mono, monospace"
              fontSize="7"
              fill={PEACH}
              textAnchor="middle"
              letterSpacing="0.16em"
            >
              {b.peak}
            </text>
          </g>
        )
      })}

      <g
        transform="translate(50, 320)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="rgba(255,255,255,0.55)"
        letterSpacing="0.15em"
      >
        <text>FIG.C · ATTENTION RELIEF · 3 CIRCLES · 24H</text>
        <text y="12" fill="rgba(255,255,255,0.4)">
          Δ = 0.025 · 12 BANDS
        </text>
      </g>
    </svg>
  )
}
