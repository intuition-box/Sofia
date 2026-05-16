/**
 * ImmersiveRosace — login-screen hero vector.
 *
 * Replaces the orbital CirclesSequence with a denser, fractal-ish field:
 * dozens of overlapping coloured circles spread across a square viewport,
 * each one pulsing on its own offset. Combined with the perspective +
 * rotateY animation on `.hp-diagram-stage`, the user feels like they've
 * stepped inside a constellation of trust circles rather than watching
 * one assemble.
 *
 * Pure SVG + a tiny `useTime` for breathing — no canvas, no extra deps.
 */

import { useEffect, useState } from "react"

const PALETTE = [
  "#7bade0", // work
  "#e0896a", // music
  "#5cc4d6", // learning
  "#e4b95a", // fun
  "#a78bdb", // inspiration
  "#6dd4a0", // trusted
  "#ff9ec2", // social
  "#9fb1ff" // play
]

/* Deterministic pseudo-random so the layout is stable across renders. */
function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface RosaceDisc {
  cx: number
  cy: number
  r: number
  color: string
  opacity: number
  strokeWidth: number
  pulseOffset: number
  pulseAmp: number
  depth: number // 0 = far, 1 = near (affects scale/opacity slightly)
}

function buildField(count: number, seed = 17): RosaceDisc[] {
  const rand = mulberry32(seed)
  const discs: RosaceDisc[] = []
  // Distribute on a polar grid with jitter, so we get full coverage but
  // not a regular pattern.
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const radius = Math.pow(rand(), 0.45) * 520 // bias toward outer ring
    const cx = 600 + Math.cos(angle) * radius
    const cy = 600 + Math.sin(angle) * radius
    const depth = rand()
    const r = 35 + depth * 95 + rand() * 25
    const color = PALETTE[Math.floor(rand() * PALETTE.length)]
    const opacity = 0.18 + depth * 0.32 + rand() * 0.1
    const strokeWidth = 1.2 + depth * 1.4
    const pulseOffset = rand() * Math.PI * 2
    const pulseAmp = 0.04 + rand() * 0.08
    discs.push({
      cx,
      cy,
      r,
      color,
      opacity,
      strokeWidth,
      pulseOffset,
      pulseAmp,
      depth
    })
  }
  // Force a central anchor disc so the eye always lands on the middle.
  discs.push({
    cx: 600,
    cy: 600,
    r: 60,
    color: "#02000e",
    opacity: 0.85,
    strokeWidth: 2.4,
    pulseOffset: 0,
    pulseAmp: 0.05,
    depth: 1
  })
  return discs
}

const DISCS = buildField(54)

function useTime(fps = 30) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let id: number
    let last = performance.now()
    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => prev + dt)
      id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [fps])
  return t
}

export function ImmersiveRosace() {
  const t = useTime()

  return (
    <svg
      viewBox="0 0 1200 1200"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* Central radial glow so the deepest "tunnel" point feels lit. */}
        <radialGradient id="immersive-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#02000e" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#02000e" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#02000e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        x="0"
        y="0"
        width="1200"
        height="1200"
        fill="url(#immersive-core)"
      />

      {/* Scale the rosace up around the centre so the login animation reads
       *  larger / more immersive. The bg rect stays full-bleed; slice + this
       *  group keep it edge-to-edge with no gaps. */}
      <g transform="translate(600 600) scale(1.4) translate(-600 -600)">
        {DISCS.map((d, i) => {
          const pulse = 1 + Math.sin(t * 1.4 + d.pulseOffset) * d.pulseAmp
          const r = d.r * pulse
          const op =
            d.opacity * (0.78 + 0.22 * Math.sin(t * 0.9 + d.pulseOffset * 0.7))
          return (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={d.strokeWidth}
              opacity={op}
            />
          )
        })}

        {/* Subtle intersection accents: tiny coloured dots scattered on a
         *  second seed so they don't overlap the disc centres exactly. */}
        {Array.from({ length: 28 }).map((_, i) => {
          const rand = mulberry32(91 + i)
          const angle = rand() * Math.PI * 2
          const radius = Math.pow(rand(), 0.6) * 540
          const cx = 600 + Math.cos(angle) * radius
          const cy = 600 + Math.sin(angle) * radius
          const color = PALETTE[Math.floor(rand() * PALETTE.length)]
          const pulse = 0.5 + Math.sin(t * 2.2 + i) * 0.5
          return (
            <circle
              key={`dot-${i}`}
              cx={cx}
              cy={cy}
              r={2.4 + pulse * 1.4}
              fill={color}
              opacity={0.35 + pulse * 0.45}
            />
          )
        })}
      </g>
    </svg>
  )
}

export default ImmersiveRosace
