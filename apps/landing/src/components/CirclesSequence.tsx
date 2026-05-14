/**
 * Sofia · Circles Sequence V4 — animated SVG.
 *
 * Ported from the Anthropic design handoff
 * (`sofia-landing-page/project/components/CirclesSequenceV4.jsx`).
 * Cycles DUAD → TRIAD → QUARTET → MESH on a tilted-ring 3D orbit
 * projection with billboarded discs and packet-flow animation.
 *
 * Adapted for the deck's palette: the `variant` prop swaps between
 * the dark original (peach accent on near-black) and a peach
 * inversion (deep ink accent on peach) so the same graphic reads
 * correctly on both slab variants.
 */
import { useEffect, useState } from 'react'

interface CirclesSequenceProps {
  /** Palette to render in. Matches the deck slide variants. */
  variant?: 'peach' | 'dark'
}

interface Palette {
  HL: string
  FG: string
  FG_DIM: string
  FG_FAINT: string
  BG: string
}

const PALETTES: Record<'peach' | 'dark', Palette> = {
  /* Dark — original design. Peach accent against a near-black slab. */
  dark: {
    HL: '#ffc6b0',
    FG: '#ffffff',
    FG_DIM: 'rgba(255,255,255,0.45)',
    FG_FAINT: 'rgba(255,255,255,0.18)',
    BG: '#02000e',
  },
  /* Peach — inverted. Deep ink as both highlight and stroke so the
     ring still reads with strong contrast on the peach slab; the
     hex-nucleus "hole" fill matches the slab colour so it looks like
     a true cut-out rather than a painted disc. */
  peach: {
    HL: '#02000e',
    FG: '#02000e',
    FG_DIM: 'rgba(2,0,14,0.55)',
    FG_FAINT: 'rgba(2,0,14,0.22)',
    BG: 'transparent',
  },
}

/* English handle list — the original used a francophone mix; these
   are illustrative ENS-style names and don't need to be real. */
const ENS = [
  '0xbilly.eth',
  'passive-records.box',
  'wieedze.eth',
  'zet.box',
  'vitalik.eth',
  'alice.eth',
]

/* Per-nucleus intention colour. Maps 1:1 to ENS handles above and
 * pulls from the design system's intention palette (--work / --music
 * / --learning / --fun / --inspiration / --trusted). Used as the
 * stroke + inner-hex fill for each user's hexagon nucleus. */
const NUCLEUS_COLORS = [
  '#7bade0', // 0xbilly.eth        — work
  '#e0896a', // passive-records.box — music
  '#5cc4d6', // wieedze.eth         — learning
  '#e4b95a', // zet.box             — fun
  '#a78bdb', // vitalik.eth         — inspiration
  '#6dd4a0', // alice.eth           — trusted
]

function hex(xC: number, yC: number, rad: number, rot = 0) {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3 + rot
    pts.push(
      `${(xC + Math.cos(a) * rad).toFixed(2)} ${(yC + Math.sin(a) * rad).toFixed(2)}`,
    )
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`
}

function smooth(t: number) {
  const u = Math.max(0, Math.min(1, t))
  return u * u * (3 - 2 * u)
}

/* Hex-ring layout — six positions equally spaced around a circle of
   radius DIST centred at (CX, CY). The reveal order traverses them
   in a star-pattern (top → bottom → top-right → …) so each new frame
   adds a node opposite the last one. */
const CX = 300
const CY = 305
const DIST = 128
const R_BIG = 95
const NR = 14
const ANGLES = [0, 3, 1, 4, 2, 5]

function ringPos(angleIdx: number) {
  const a = -Math.PI / 2 + (angleIdx * Math.PI) / 3
  return {
    cx: CX + Math.cos(a) * DIST,
    cy: CY + Math.sin(a) * DIST,
    ang: a,
  }
}

interface Circle {
  id: number
  angIdx: number
  name: string
  cx: number
  cy: number
  r: number
  nR: number
  ang: number
}

const CIRCLES: Circle[] = ANGLES.map((angIdx, i) => {
  const p = ringPos(angIdx)
  return {
    id: i,
    angIdx,
    name: ENS[i],
    cx: p.cx,
    cy: p.cy,
    r: R_BIG,
    nR: NR,
    ang: p.ang,
  }
})

const FRAMES = [
  { name: 'DUAD', sub: '2 nuclei · dialogue', members: [0, 1] },
  { name: 'TRIAD', sub: '3 nuclei · trust circle', members: [0, 1, 2] },
  { name: 'QUARTET', sub: '4 nuclei · expansion', members: [0, 1, 2, 3] },
  {
    name: 'MESH',
    sub: '6 nuclei · ring + diagonals',
    members: [0, 1, 2, 3, 4, 5],
  },
]

type Edge = [number, number, number, number]

function buildEdges(memberIds: number[]): Edge[] {
  const sorted = [...memberIds].sort(
    (a, b) => CIRCLES[a].angIdx - CIRCLES[b].angIdx,
  )
  const edges: Edge[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (sorted.length === 2 && i === 1) break
    const a = sorted[i]
    const b = sorted[(i + 1) % sorted.length]
    edges.push([a, b, 3.4 + (i % 2) * 0.3, i * 0.55])
  }
  if (sorted.length === 2) edges.push([sorted[1], sorted[0], 3.4, 1.7])
  if (sorted.length === 6) {
    edges.push([sorted[0], sorted[3], 5.4, 0.7])
    edges.push([sorted[1], sorted[4], 5.4, 2.4])
    edges.push([sorted[2], sorted[5], 5.4, 4.1])
  }
  return edges
}

const FRAME_EDGES = FRAMES.map((f) => buildEdges(f.members))

/* Orbit projection — tilts the ring plane 62° around X and projects
   with a 520-px focal length. Discs stay billboarded (face camera);
   only their position on the ring is tilted, so the ring becomes a
   foreshortened ellipse and back-of-ring circles sit higher and
   smaller. */
const TILT = (62 * Math.PI) / 180
const FOCAL = 520

interface Projected {
  x: number
  y: number
  rx: number
  ry: number
  nScale: number
  depth: number
  ground: number
  shadowDx: number
  nx: number
  ny: number
}

function projectOrbit(c: Circle): Projected {
  const xL = DIST * Math.cos(c.ang)
  const zL = DIST * Math.sin(c.ang)
  const yP = -zL * Math.sin(TILT)
  const zP = zL * Math.cos(TILT)
  const scale = FOCAL / (FOCAL + zP)
  const xS = CX + xL * scale
  const yS = CY + yP * scale - 20
  return {
    x: xS,
    y: yS,
    rx: c.r * scale,
    ry: c.r * scale,
    nScale: scale,
    depth: zP,
    ground: 520,
    shadowDx: 4 * scale,
    nx: Math.cos(c.ang),
    ny: -Math.sin(c.ang) * Math.sin(TILT),
  }
}

const HOLD_T = 2.4
const FADE_T = 1.6
const STEP_T = HOLD_T + FADE_T
const TOTAL_T = STEP_T * FRAMES.length

function circleVisibility(circleId: number, time: number) {
  let firstFrame = -1
  for (let f = 0; f < FRAMES.length; f++) {
    if (FRAMES[f].members.includes(circleId)) {
      firstFrame = f
      break
    }
  }
  if (firstFrame === -1) return 0
  const appearStart = firstFrame === 0 ? 0 : firstFrame * STEP_T - FADE_T
  const appearEnd = firstFrame * STEP_T + 0.2
  if (time < appearStart) return 0
  if (time >= appearEnd) return 1
  return smooth((time - appearStart) / Math.max(0.001, appearEnd - appearStart))
}

function currentFrame(time: number) {
  const cycle = ((time % TOTAL_T) + TOTAL_T) % TOTAL_T
  const idx = Math.floor(cycle / STEP_T)
  return { idx, cycle }
}

function useTime() {
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
  return t
}

interface LabelPos {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  line: [number, number, number, number]
}

/* Place each label OUTSIDE its disc — distance is the projected
   radius plus a fixed gap, so labels clear even the front-most
   (perspective-enlarged) circles. The connector line starts just
   outside the disc edge and ends a few pixels before the text. */
const LABEL_GAP = 50
const LABEL_LEAD_IN = 6
const LABEL_LEAD_OUT = 12

function buildLabels(P: Projected[]): LabelPos[] {
  return CIRCLES.map((_, i) => {
    const p = P[i]
    const radial = Math.max(p.rx, p.ry)
    const dist = radial + LABEL_GAP
    const lx = p.x + p.nx * dist
    const ly = p.y + p.ny * dist
    const x1 = p.x + p.nx * (radial + LABEL_LEAD_IN)
    const y1 = p.y + p.ny * (radial + LABEL_LEAD_IN)
    const x2 = p.x + p.nx * (dist - LABEL_LEAD_OUT)
    const y2 = p.y + p.ny * (dist - LABEL_LEAD_OUT)
    let anchor: 'start' | 'middle' | 'end' = 'middle'
    if (p.nx > 0.3) anchor = 'start'
    else if (p.nx < -0.3) anchor = 'end'
    return { x: lx, y: ly, anchor, line: [x1, y1, x2, y2] }
  })
}

export function CirclesSequence({ variant = 'dark' }: CirclesSequenceProps) {
  const pal = PALETTES[variant]
  const t = useTime()
  const { idx, cycle } = currentFrame(t)
  const frame = FRAMES[idx]
  const edges = FRAME_EDGES[idx]
  const vis = CIRCLES.map((c) => circleVisibility(c.id, cycle))

  const P = CIRCLES.map(projectOrbit)
  const drawOrder = CIRCLES.map((_, i) => i).sort(
    (a, b) => P[b].depth - P[a].depth,
  )
  const labels = buildLabels(P)

  /* Track per-edge activity so each circle can show a brief peach
     "lens" highlight when a packet enters / exits its boundary. */
  const overlapActivity: Record<string, number> = {}
  edges.forEach(([f, to, period, offset]) => {
    const u = ((t + offset) % period) / period
    const k = f < to ? `${f}-${to}` : `${to}-${f}`
    const intensity = Math.max(0, 1 - Math.abs(u - 0.5) * 2.2)
    overlapActivity[k] = Math.max(overlapActivity[k] ?? 0, intensity)
  })

  const radialId = `seq-radial-${variant}`
  const shadowId = `seq-shadow-${variant}`

  return (
    <svg
      viewBox="0 0 600 600"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={radialId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pal.HL} stopOpacity="0.32" />
          <stop offset="35%" stopColor={pal.HL} stopOpacity="0.10" />
          <stop offset="75%" stopColor={pal.HL} stopOpacity="0.02" />
          <stop offset="100%" stopColor={pal.HL} stopOpacity="0" />
        </radialGradient>
        {/* Per-circle intention-colour radial gradient — same shape as
            the shared one above but tinted with each user's nucleus
            colour, so the disc reads as a coloured glow emanating from
            the centre out to the edge. */}
        {CIRCLES.map((_, i) => {
          const c = NUCLEUS_COLORS[i % NUCLEUS_COLORS.length]
          return (
            <radialGradient
              key={`seq-radial-${variant}-${i}`}
              id={`seq-radial-${variant}-${i}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={c} stopOpacity="0.55" />
              <stop offset="35%" stopColor={c} stopOpacity="0.22" />
              <stop offset="70%" stopColor={c} stopOpacity="0.08" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
          )
        })}
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {P.map((p, i) => (
          <clipPath key={i} id={`seq-clip-${variant}-${i}`}>
            <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} />
          </clipPath>
        ))}
      </defs>

      {/* Tilted ring + vanishing-point floor for depth. */}
      <ellipse
        cx={CX}
        cy={CY - 20}
        rx={DIST}
        ry={DIST * Math.sin(TILT)}
        fill="none"
        stroke={pal.HL}
        strokeOpacity="0.18"
        strokeWidth="0.7"
        strokeDasharray="2 4"
      />
      <ellipse
        cx={CX}
        cy={CY - 20}
        rx={DIST + 40}
        ry={DIST * Math.sin(TILT) + 14}
        fill="none"
        stroke={pal.FG_FAINT}
        strokeWidth="0.4"
        strokeDasharray="1 6"
      />
      <g stroke={pal.FG_FAINT} strokeWidth="0.4" strokeOpacity="0.5">
        {[-260, -180, -100, -20, 60, 140, 220].map((x, i) => {
          const horizonY = CY - 20 - DIST * Math.sin(TILT) - 40
          return (
            <line
              key={`f${i}`}
              x1={300 + x * 1.6}
              y1={580}
              x2={300 + x * 0.05}
              y2={horizonY}
            />
          )
        })}
        {[0.2, 0.5, 1].map((tt, i) => {
          const y = CY - 20 + DIST * Math.sin(TILT) + 10 + tt * 90
          const w = 260 + tt * 200
          return <line key={`fb${i}`} x1={300 - w} y1={y} x2={300 + w} y2={y} />
        })}
      </g>
      <line
        x1={20}
        y1={CY - 20 - DIST * Math.sin(TILT) - 40}
        x2={580}
        y2={CY - 20 - DIST * Math.sin(TILT) - 40}
        stroke={pal.FG_FAINT}
        strokeWidth="0.4"
        strokeOpacity="0.4"
      />

      {/* Ground shadows removed — the discs sit flat without the
          parallax shadow underneath for a flatter, cleaner read. */}

      {/* Discs, drawn back-to-front. */}
      {drawOrder.map((i) => {
        if (vis[i] <= 0.01) return null
        const p = P[i]
        const overlaps: JSX.Element[] = []
        for (let j = 0; j < CIRCLES.length; j++) {
          if (j === i || vis[j] < 0.5 || vis[i] < 0.5) continue
          const pj = P[j]
          const d = Math.hypot(p.x - pj.x, p.y - pj.y)
          if (d >= p.rx + pj.rx - 6) continue
          const k = i < j ? `${i}-${j}` : `${j}-${i}`
          const act = overlapActivity[k] ?? 0
          const breath = 0.035 + act * 0.22
          overlaps.push(
            <g key={`ov${j}`} clipPath={`url(#seq-clip-${variant}-${i})`}>
              <ellipse
                cx={pj.x}
                cy={pj.y}
                rx={pj.rx}
                ry={pj.ry}
                fill={pal.HL}
                fillOpacity={breath}
              />
            </g>,
          )
        }
        return (
          <g key={`c${i}`}>
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={p.rx * vis[i]}
              ry={p.ry * vis[i]}
              fill={
                variant === 'dark'
                  ? 'rgba(255,255,255,0.025)'
                  : 'rgba(2,0,14,0.025)'
              }
            />
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={p.rx * vis[i]}
              ry={p.ry * vis[i]}
              fill={`url(#seq-radial-${variant}-${i})`}
              opacity={vis[i]}
            />
            {overlaps}
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={p.rx}
              ry={p.ry}
              fill="none"
              stroke={pal.FG}
              strokeWidth="1"
              strokeOpacity={0.55 * vis[i]}
            />
          </g>
        )
      })}

      {/* Edge underlay — faint static line connecting active nodes. */}
      <g stroke={pal.HL} strokeOpacity="0.12" strokeWidth="0.6">
        {edges.map(([f, to], k) => {
          if (vis[f] < 0.5 || vis[to] < 0.5) return null
          return (
            <line key={k} x1={P[f].x} y1={P[f].y} x2={P[to].x} y2={P[to].y} />
          )
        })}
      </g>

      {/* Packets travelling along each active edge. */}
      {edges.map(([fromId, toId, period, offset], k) => {
        const pa = P[fromId]
        const pb = P[toId]
        const u = ((t + offset) % period) / period
        const op = u < 0.08 ? u / 0.08 : u > 0.92 ? (1 - u) / 0.08 : 1
        const x = pa.x + (pb.x - pa.x) * u
        const y = pa.y + (pb.y - pa.y) * u
        const trail = [0.05, 0.1, 0.16].map((d) => {
          const uu = Math.max(0, u - d)
          return {
            x: pa.x + (pb.x - pa.x) * uu,
            y: pa.y + (pb.y - pa.y) * uu,
            op: op * (1 - d / 0.2) * 0.55,
          }
        })
        return (
          <g key={k}>
            <line
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={pal.HL}
              strokeOpacity="0.10"
              strokeWidth="0.6"
            />
            {trail.map((q, j) => (
              <circle
                key={j}
                cx={q.x}
                cy={q.y}
                r="1.3"
                fill={pal.HL}
                fillOpacity={q.op}
              />
            ))}
            <circle cx={x} cy={y} r="5" fill={pal.HL} fillOpacity={op * 0.18} />
            <circle cx={x} cy={y} r="2.2" fill={pal.HL} fillOpacity={op} />
          </g>
        )
      })}

      {/* Hex nuclei centred in each disc, with a packet-pulse glow
          when one of this nucleus' edges is firing. */}
      {drawOrder.map((i) => {
        if (vis[i] <= 0.01) return null
        const p = P[i]
        const involved = edges.some(([f, to, period, offset]) => {
          const u = ((t + offset) % period) / period
          return (f === i || to === i) && (u < 0.12 || u > 0.88)
        })
        const pulse = involved ? 1.22 : 1 + Math.sin(t * 1.3 + i * 1.7) * 0.06
        const nR = CIRCLES[i].nR * pulse * vis[i] * p.nScale
        /* Each nucleus carries one intention colour so the central
         * hex reads as an identity marker — no rotation, the hexagons
         * stay still so the eye locks onto the colour, not the spin. */
        const nucleusColor = NUCLEUS_COLORS[i % NUCLEUS_COLORS.length]
        return (
          <g key={`hex${i}`}>
            {/* Always-on colour halo around each nucleus.
             *
             * mix-blend-mode "lighten" picks the brighter channel at
             * each pixel, so when two coloured discs overlap the
             * intersection reads as a luminous blend of the two
             * intention hues — never darkens toward black the way
             * default alpha stacking does. */}
            <circle
              cx={p.x}
              cy={p.y}
              r={nR + 6 * p.nScale}
              fill={nucleusColor}
              fillOpacity={(involved ? 0.55 : 0.4) * vis[i]}
              style={{ mixBlendMode: 'lighten' }}
            />
            <path
              d={hex(p.x, p.y, nR, 0)}
              fill="#02000e"
              fillOpacity={vis[i]}
              stroke={nucleusColor}
              strokeWidth={1.4 * Math.max(0.6, p.nScale)}
              strokeOpacity={vis[i]}
            />
            <path
              d={hex(p.x, p.y, nR * 0.32, 0)}
              fill={nucleusColor}
              fillOpacity={vis[i]}
            />
          </g>
        )
      })}

      {/* ENS-style handles, with a connector line from disc to label. */}
      {CIRCLES.map((c, i) => {
        if (vis[i] <= 0.01) return null
        const L = labels[i]
        return (
          <g key={`L${i}`} opacity={vis[i]}>
            <line
              x1={L.line[0]}
              y1={L.line[1]}
              x2={L.line[2]}
              y2={L.line[3]}
              stroke={pal.FG_DIM}
              strokeWidth="0.5"
            />
            <text
              x={L.x}
              y={L.y}
              fontSize={10}
              fill={pal.FG}
              letterSpacing="0.18em"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              textAnchor={L.anchor}
            >
              {c.name}
            </text>
          </g>
        )
      })}

      {/* Header — FIG tag, frame index, frame description, and a row
          of step dots so the viewer can read where the sequence is. */}
      <g fontFamily="JetBrains Mono, ui-monospace, monospace">
        <text
          x="20"
          y="30"
          fontSize="8"
          fill={pal.FG_DIM}
          letterSpacing="0.22em"
        >
          FIG · V.06 · {String(idx + 1).padStart(2, '0')}/
          {String(FRAMES.length).padStart(2, '0')} · {frame.name}
        </text>
        <text
          x="20"
          y="42"
          fontSize="7"
          fill={pal.FG_FAINT}
          letterSpacing="0.18em"
        >
          {frame.sub.toUpperCase()} · ORBIT
        </text>
        <g transform="translate(540, 28)">
          {FRAMES.map((_, k) => (
            <circle
              key={k}
              cx={k * 14 - (FRAMES.length - 1) * 14}
              cy={0}
              r="3"
              fill={k === idx ? pal.HL : pal.FG_FAINT}
            />
          ))}
        </g>
      </g>

      {/* Progress bar at the bottom — fills across the full loop. */}
      <g>
        <rect
          x="20"
          y="582"
          width="560"
          height="2"
          fill={pal.FG_FAINT}
          opacity="0.3"
        />
        <rect
          x="20"
          y="582"
          width={Math.max(0, Math.min(560, 560 * (cycle / TOTAL_T)))}
          height="2"
          fill={pal.HL}
        />
      </g>
    </svg>
  )
}
