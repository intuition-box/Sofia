/**
 * TopicsIntentions — PLATE.A diagram (radial topics × intentions).
 *
 * Ported from apps/landing/src/components/Instruments.tsx so the
 * Explorer login page can reuse the same signature visual as the
 * marketing Hero. Pure SVG, single rAF loop for the breathing
 * polygon + sweeping radial.
 *
 * mode='light' is ink-on-peach (used directly on the peach hero).
 * mode='dark' is white-on-ink (used inside an ink plate).
 */

import { useEffect, useState } from 'react'

type DiagramMode = 'dark' | 'light'

const PEACH_FADE_14 = 'rgba(255, 198, 176, 0.14)'
const PEACH_FADE_40 = 'rgba(255, 198, 176, 0.4)'
const PEACH_FADE_50 = 'rgba(255, 198, 176, 0.5)'

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
    accent: '#ffc6b0',
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

export function TopicsIntentions({
  mode = 'light',
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
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx={cx} cy={cy} r={Rt} fill="none" stroke={c.ring} strokeWidth="0.75" />
      <circle cx={cx} cy={cy} r={Rt - 12} fill="none" stroke={c.ringFaint} strokeWidth="0.5" />
      <circle
        cx={cx}
        cy={cy}
        r={Ri}
        fill="none"
        stroke={c.accentDashed}
        strokeWidth="0.5"
        strokeDasharray="2 3"
      />
      <circle cx={cx} cy={cy} r={Ri - 50} fill="none" stroke={c.ringFaint} strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={Ri - 90} fill="none" stroke={c.ringFaint} strokeWidth="0.5" />
      {ticks}

      <line x1={cx} y1={cy - Rt - 4} x2={cx} y2={cy + Rt + 4} stroke={c.axis} strokeWidth="0.5" />
      <line x1={cx - Rt - 4} y1={cy} x2={cx + Rt + 4} y2={cy} stroke={c.axis} strokeWidth="0.5" />

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
        points={pts.map((p) => p.xy.map((n) => n.toFixed(1)).join(',')).join(' ')}
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
