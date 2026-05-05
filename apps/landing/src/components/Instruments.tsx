import { useEffect, useState } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import styles from './Instruments.module.css';

/**
 * Sofia · Drafting room — three plates of pure SVG schematics:
 *   PLATE.A — Topics × intentions (radial polar field)
 *   PLATE.D — Iso stack (system topology, isometric 30°)
 *   PLATE.C — Three circles (attention relief, contour map)
 *
 * Each plate is 1px-stroke vector, monospace annotations, peach
 * highlight, drawn against the dark surface like an engineering
 * drawing. Animated from a single rAF loop per plate.
 */

const PEACH = 'var(--color-accent)';
const PEACH_FADE_14 = 'rgba(255, 198, 176, 0.14)';
const PEACH_FADE_40 = 'rgba(255, 198, 176, 0.4)';
const PEACH_FADE_50 = 'rgba(255, 198, 176, 0.5)';
const PEACH_FADE_25 = 'rgba(255, 198, 176, 0.25)';
const PEACH_FADE_35 = 'rgba(255, 198, 176, 0.35)';
const INK_PLATE_FILL = '#0E0E0E';

/* ── PLATE.A — Topics × intentions ──────────────────── */

function TopicsIntentions() {
  const [ang, setAng] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setAng((a) => (a + 0.25) % 360);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const cx = 240;
  const cy = 240;

  const TOPIC_NAMES = [
    'TECH & DEV', 'DESIGN', 'MUSIC', 'GAMING',
    'WEB3', 'SCIENCE', 'SPORT', 'VIDEO',
    'BUSINESS', 'ARTS', 'NATURE', 'FOOD',
    'LITERATURE', 'GROWTH',
  ];
  const topics = TOPIC_NAMES.map((name, i) => ({
    name,
    a: -90 + (i / TOPIC_NAMES.length) * 360,
  }));

  const INTENTIONS = [
    { name: 'WORK', v: 0.78 },
    { name: 'LEARNING', v: 0.92 },
    { name: 'FUN', v: 0.64 },
    { name: 'INSPIRATION', v: 0.71 },
    { name: 'BUYING', v: 0.42 },
    { name: 'MUSIC', v: 0.55 },
  ];
  const intentions = INTENTIONS.map((it, i) => ({
    ...it,
    a: -90 + (i / INTENTIONS.length) * 360,
  }));

  const Rt = 200;
  const Ri = 130;
  const rad = (a: number) => (a * Math.PI) / 180;

  const ticks: JSX.Element[] = [];
  for (let a = 0; a < 360; a += 5) {
    const inner = a % 45 === 0 ? Rt - 12 : a % 15 === 0 ? Rt - 8 : Rt - 4;
    ticks.push(
      <line
        key={a}
        x1={cx + Math.cos(rad(a - 90)) * inner}
        y1={cy + Math.sin(rad(a - 90)) * inner}
        x2={cx + Math.cos(rad(a - 90)) * Rt}
        y2={cy + Math.sin(rad(a - 90)) * Rt}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={a % 45 === 0 ? 0.8 : 0.4}
      />,
    );
  }

  const tSec = ang / 60;
  const pts = intentions.map((it, i) => {
    const phase = i * 1.05;
    const speed = 0.6 + (i % 3) * 0.18;
    const breathe =
      Math.sin(tSec * speed + phase) * 0.18 +
      Math.cos(tSec * speed * 1.3 + phase * 0.7) * 0.08;
    const v = Math.max(0.18, Math.min(0.98, it.v + breathe));
    const r = v * (Ri - 10);
    return {
      xy: [cx + Math.cos(rad(it.a)) * r, cy + Math.sin(rad(it.a)) * r] as const,
      v,
    };
  });

  return (
    <svg viewBox="0 0 480 480" className={styles.svg} xmlns="http://www.w3.org/2000/svg">
      <circle cx={cx} cy={cy} r={Rt} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
      <circle cx={cx} cy={cy} r={Rt - 12} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={Ri} fill="none" stroke={PEACH_FADE_40} strokeWidth="0.5" strokeDasharray="2 3" />
      <circle cx={cx} cy={cy} r={Ri - 50} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={Ri - 90} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {ticks}

      <line x1={cx} y1={cy - Rt - 4} x2={cx} y2={cy + Rt + 4} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      <line x1={cx - Rt - 4} y1={cy} x2={cx + Rt + 4} y2={cy} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />

      {topics.map((t) => {
        const x = cx + Math.cos(rad(t.a)) * (Rt + 16);
        const y = cy + Math.sin(rad(t.a)) * (Rt + 16);
        let rot = t.a + 90;
        if (rot > 90 && rot < 270) rot -= 180;
        return (
          <text
            key={t.name}
            x={x}
            y={y}
            transform={`rotate(${rot} ${x} ${y})`}
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="0.18em"
          >
            {t.name}
          </text>
        );
      })}
      {topics.map((t) => (
        <circle
          key={'d' + t.name}
          cx={cx + Math.cos(rad(t.a)) * Rt}
          cy={cy + Math.sin(rad(t.a)) * Rt}
          r="2"
          fill="#ffffff"
        />
      ))}

      <polygon
        points={pts.map((p) => p.xy.map((n) => n.toFixed(1)).join(',')).join(' ')}
        fill={PEACH_FADE_14}
        stroke={PEACH}
        strokeWidth="1"
      />
      {pts.map((p, i) => {
        const it = intentions[i];
        const lx = cx + Math.cos(rad(it.a)) * (Ri - 4);
        const ly = cy + Math.sin(rad(it.a)) * (Ri - 4);
        return (
          <g key={i}>
            <circle cx={p.xy[0]} cy={p.xy[1]} r="3" fill={PEACH} />
            <text
              x={lx}
              y={ly - 4}
              fontFamily="JetBrains Mono, monospace"
              fontSize="8"
              fill={PEACH}
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
              fill="rgba(255,255,255,0.55)"
              textAnchor="middle"
            >
              {p.v.toFixed(2)}
            </text>
          </g>
        );
      })}

      <g transform={`rotate(${ang} ${cx} ${cy})`}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - Rt} stroke={PEACH_FADE_50} strokeWidth="0.75" />
        <circle cx={cx} cy={cy - Rt} r="2" fill={PEACH} />
      </g>

      <circle cx={cx} cy={cy} r="6" fill={PEACH} />
      <circle cx={cx} cy={cy} r="2" fill="#000000" />

      <g
        transform="translate(14, 462)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="rgba(255,255,255,0.5)"
        letterSpacing="0.15em"
      >
        <text>n = 14 topics · 6 intentions</text>
      </g>
      <g
        transform="translate(380, 462)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="rgba(255,255,255,0.5)"
        letterSpacing="0.15em"
      >
        <text>θ · {Math.round(ang)}°</text>
      </g>
    </svg>
  );
}

/* ── PLATE.D — Iso stack ────────────────────────────── */

interface Layer {
  z: number;
  tag: string;
  name: string;
  sub: string;
  detail: string;
  color: string;
  dots: number;
}

function IsoStack() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      setT((performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const iso = (x: number, y: number, z: number): [number, number] => [
    (x - y) * 0.866,
    (x + y) * 0.5 - z,
  ];
  const W = 70;
  const layers: Layer[] = [
    { z: 250, tag: 'L.01', name: 'BROWSER', sub: 'page · session · attention', color: '#A6AF6B', dots: 6, detail: 'plasmo · chromium' },
    { z: 200, tag: 'L.02', name: 'AGENT', sub: 'observe · classify · propose', color: '#cea2fd', dots: 9, detail: 'mastra · gaianet · qwen2.5' },
    { z: 150, tag: 'L.03', name: 'ATOMS', sub: 'url · intention · user', color: '#ffa7b1', dots: 13, detail: 'ipfs · subject / pred / object' },
    { z: 100, tag: 'L.04', name: 'TRIPLES', sub: '[you] → [verb] → [content]', color: '#ffc6b0', dots: 17, detail: 'multivault · createTriple()' },
    { z: 50, tag: 'L.05', name: 'SIGNAL', sub: 'stake · trust · distrust', color: '#F59E0B', dots: 21, detail: '$TRUST · bonding curve' },
    { z: 0, tag: 'L.06', name: 'PROTOCOL', sub: 'knowledge graph · onchain', color: '#945941', dots: 25, detail: 'intuition · base · DAG' },
  ];

  const cx = 215;
  const cy = 130;
  const pt = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = iso(x, y, z);
    return [cx + px, cy - py];
  };

  const Plate = ({ z, tag, name, sub, detail, color, dots, idx, isTop }: Layer & { idx: number; isTop: boolean }) => {
    const tl = pt(-W, -W, z);
    const tr = pt(W, -W, z);
    const br = pt(W, W, z);
    const bl = pt(-W, W, z);
    const path = `M ${tl[0]},${tl[1]} L ${tr[0]},${tr[1]} L ${br[0]},${br[1]} L ${bl[0]},${bl[1]} Z`;
    const dotPos: [number, number][] = [];
    for (let i = 0; i < dots; i++) {
      const seed = i * 17 + idx * 31;
      dotPos.push([
        ((seed * 73) % 1000) / 1000 * 1.7 * W - 0.85 * W,
        ((seed * 41) % 1000) / 1000 * 1.7 * W - 0.85 * W,
      ]);
    }
    const right = pt(W, -W, z);
    const labelX = right[0] + 22;
    const labelY = right[1] + 2;
    return (
      <g>
        <path
          d={path}
          fill={isTop ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'}
          stroke={color}
          strokeWidth={isTop ? 1.2 : 1}
          strokeLinejoin="miter"
        />
        {[-W * 0.5, 0, W * 0.5].map((g, gi) => {
          const a = pt(g, -W, z);
          const b = pt(g, W, z);
          const c = pt(-W, g, z);
          const d = pt(W, g, z);
          return (
            <g key={gi} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5">
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
              <line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />
            </g>
          );
        })}
        {dotPos.map(([dx, dy], i) => {
          const drift = Math.sin(t * 0.6 + i + idx) * 3;
          const driftY = Math.cos(t * 0.5 + i * 1.3 + idx) * 3;
          const [x, y] = pt(dx + drift, dy + driftY, z);
          return <circle key={i} cx={x} cy={y} r="1.4" fill={color} />;
        })}
        <line x1={right[0]} y1={right[1]} x2={labelX - 3} y2={labelY} stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <circle cx={right[0]} cy={right[1]} r="2" fill={color} />
        <text x={labelX} y={labelY - 4} fontFamily="JetBrains Mono, monospace" fontSize="7.5" fill="rgba(255,255,255,0.55)" letterSpacing="0.18em">
          {tag}
        </text>
        <text x={labelX} y={labelY + 7} fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="500" fill="#ffffff" letterSpacing="0.14em">
          {name}
        </text>
        <text x={labelX} y={labelY + 18} fontFamily="JetBrains Mono, monospace" fontSize="7" fill="rgba(255,255,255,0.5)" letterSpacing="0.1em">
          {sub}
        </text>
        <text x={labelX} y={labelY + 28} fontFamily="JetBrains Mono, monospace" fontSize="6.5" fill={color} fillOpacity="0.7" letterSpacing="0.14em">
          {detail}
        </text>
      </g>
    );
  };

  const spineTop = pt(0, 0, 250);
  const spineBot = pt(0, 0, 0);

  const travelDots = [0, 0.2, 0.4, 0.6, 0.8].map((off) => {
    const u = (off + ((t * 0.16) % 1)) % 1;
    return { p: pt(0, 0, 250 - u * 250), u };
  });

  return (
    <svg viewBox="0 0 540 540" className={styles.svg} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="iso-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>
        <pattern id="iso-grid-fine" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.4" />
        </pattern>
        <marker id="iso-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill={PEACH} />
        </marker>
      </defs>
      <rect width="540" height="540" fill="url(#iso-grid-fine)" />
      <rect width="540" height="540" fill="url(#iso-grid)" />

      <g stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" fill="none">
        <path d="M 8 8 L 24 8 M 8 8 L 8 24" />
        <path d="M 532 8 L 516 8 M 532 8 L 532 24" />
        <path d="M 8 532 L 24 532 M 8 532 L 8 516" />
        <path d="M 532 532 L 516 532 M 532 532 L 532 516" />
      </g>

      <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" fill="none">
        <path d="M 26 70 L 26 470" markerEnd="url(#iso-arr)" />
      </g>
      <g
        transform="translate(18, 270) rotate(-90)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8.5"
        fill="rgba(255,255,255,0.6)"
        textAnchor="middle"
        letterSpacing="0.25em"
      >
        <text>FLOW · CAPTURE → PROOF → CHAIN</text>
      </g>

      <line
        x1={spineTop[0]}
        y1={spineTop[1]}
        x2={spineBot[0]}
        y2={spineBot[1]}
        stroke={PEACH_FADE_35}
        strokeWidth="0.75"
        strokeDasharray="3 3"
      />

      {layers.map((L, i) => (
        <Plate key={i} {...L} idx={i} isTop={i === 0} />
      ))}

      {travelDots.map(({ p, u }, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={PEACH} opacity={0.4 + u * 0.6} />
      ))}

      <g
        transform="translate(40, 36)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8.5"
        fill="#ffffff"
        letterSpacing="0.2em"
      >
        <text>FIG.D · SOFIA SYSTEM TOPOLOGY</text>
        <text y="12" fontSize="7" fill="rgba(255,255,255,0.5)" letterSpacing="0.18em">
          6 LAYERS · ISOMETRIC 30°
        </text>
      </g>

      <g
        fontFamily="JetBrains Mono, monospace"
        fontSize="7"
        fill="rgba(255,255,255,0.45)"
        letterSpacing="0.18em"
      >
        <text x="40" y="500">[A] LOCAL · NEVER LEAVES BROWSER</text>
        <text x="40" y="514">[B] AGENT · LOCAL-FIRST · YOU APPROVE</text>
        <text x="40" y="528">[C] CHAIN · INTUITION · PERMANENT</text>
      </g>

      <g
        transform="translate(380, 488)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="7.5"
        fill="rgba(255,255,255,0.55)"
      >
        <rect x="0" y="0" width="148" height="34" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <line x1="48" y1="0" x2="48" y2="34" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <line x1="0" y1="17" x2="148" y2="17" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <text x="5" y="12">DWG</text>
        <text x="53" y="12">SOFIA-STACK-002</text>
        <text x="5" y="29">REV</text>
        <text x="53" y="29">B.0 · ISO 30°</text>
      </g>
    </svg>
  );
}

/* ── PLATE.C — Three Circles (attention relief) ─────── */

function ThreeCircles() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      setT((performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const blobs = [
    { c: [240, 180] as const, base: 30, name: 'INTUITION CIRCLE', peak: 'PEAK · 0.94', phase: 0, speed: 0.45 },
    { c: [360, 200] as const, base: 28, name: 'VITALIK CIRCLE', peak: 'PEAK · 0.71', phase: 2.1, speed: 0.55 },
    { c: [480, 170] as const, base: 26, name: 'SOFIA CIRCLE', peak: 'PEAK · 0.58', phase: 4.3, speed: 0.38 },
  ];

  const contours: JSX.Element[] = [];
  blobs.forEach((b, bi) => {
    const breathe = 1 + Math.sin(t * b.speed + b.phase) * 0.025;
    for (let level = 0; level < 12; level++) {
      const r = (b.base + level * 9) * breathe;
      const pts: [number, number][] = [];
      const segs = 48;
      const tPhase = t * (0.35 + bi * 0.08) + level * 0.12;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const noise =
          Math.sin(a * 3 + bi * 1.3 + tPhase) * 4 +
          Math.cos(a * 2 + level * 0.7 - tPhase * 0.8) * 3 +
          Math.sin(a * 5 + bi + level + tPhase * 1.4) * 1.5;
        const rr = r + noise + level * 1.2;
        pts.push([b.c[0] + Math.cos(a) * rr, b.c[1] + Math.sin(a) * rr * 0.72]);
      }
      const d = 'M ' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L ') + ' Z';
      const isPeak = level === 0;
      const isOuter = level >= 10;
      contours.push(
        <path
          key={`${bi}-${level}`}
          d={d}
          fill="none"
          stroke={isPeak ? PEACH : isOuter ? 'rgba(255,255,255,0.14)' : `rgba(255,198,176,${0.55 - level * 0.04})`}
          strokeWidth={isPeak ? 1.2 : level < 4 ? 0.7 : 0.5}
          strokeDasharray={isOuter ? '1 3' : 'none'}
        />,
      );
    }
  });

  return (
    <svg viewBox="0 0 720 360" className={styles.svg} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="cir-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        </pattern>
        <pattern id="cir-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,198,176,0.06)" strokeWidth="0.5" />
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
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}>
          <line x1={40 + i * 110} y1="20" x2={40 + i * 110} y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          <text
            x={40 + i * 110}
            y="11"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7"
            fill="rgba(255,255,255,0.5)"
            textAnchor="middle"
          >
            {(i * 4).toString().padStart(2, '0')}h
          </text>
        </g>
      ))}

      {contours}

      {blobs.map((b, i) => {
        const labelY = b.c[1] + 78;
        const labelX = Math.max(60, Math.min(b.c[0], 700 - 110));
        return (
          <g key={i}>
            <line x1={b.c[0] - 5} y1={b.c[1]} x2={b.c[0] + 5} y2={b.c[1]} stroke={PEACH} strokeWidth="0.75" />
            <line x1={b.c[0]} y1={b.c[1] - 5} x2={b.c[0]} y2={b.c[1] + 5} stroke={PEACH} strokeWidth="0.75" />
            <circle cx={b.c[0]} cy={b.c[1]} r="3" fill={PEACH}>
              <animate attributeName="r" values="3;5;3" dur="2.4s" repeatCount="indefinite" />
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
            <rect x={labelX - 56} y={labelY - 11} width="112" height="26" fill={INK_PLATE_FILL} stroke={PEACH_FADE_25} strokeWidth="0.5" />
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
        );
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
  );
}

/* ── Section ────────────────────────────────────────── */

export function Instruments() {
  const headerRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });
  const plateARef = useScrollAnim<HTMLDivElement>();
  const plateDRef = useScrollAnim<HTMLDivElement>();
  const plateCRef = useScrollAnim<HTMLDivElement>();

  return (
    <section className={styles.section} id="instruments">
      <span className={`${styles.tick} ${styles.tickTl}`} />
      <span className={`${styles.tick} ${styles.tickTr}`} />
      <span className={`${styles.tick} ${styles.tickBl}`} />
      <span className={`${styles.tick} ${styles.tickBr}`} />

      <div className={styles.coord}>
        <span className={styles.coordDot} /> S.04 · MICROGRAPHICS
      </div>
      <div className={styles.coordR}>VECTOR · 1PX · 1:1</div>

      <div className="container" style={{ paddingTop: 56 }}>
        <div ref={headerRef} className={`${styles.head} anim anim-up`}>
          <div>
            <span className="mono-eyebrow">Drafting room</span>
            <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
              Sofia, <em>drawn to scale.</em>
            </h2>
          </div>
          <p className={`section-subtitle ${styles.sub}`}>
            Three plates from the Sofia drawing set: the topics &amp; intentions
            field, the system topology, and the three circles in which a reader
            actually moves.
          </p>
        </div>

        <div className={styles.row2}>
          <div ref={plateARef} className={`${styles.plate} anim anim-up`}>
            <div className={styles.plateHead}>
              <div className={styles.plateHeadLeft}>
                <span className={styles.plateTag}>PLATE.A</span>
                <span className={styles.plateTitle}>Topics × intentions · polar field</span>
              </div>
              <div className={styles.plateMeta}>
                <span>OUTER · TOPICS</span>
                <span>INNER · INTENTIONS</span>
              </div>
            </div>
            <div className={`${styles.plateBody} ${styles.plateBodyCompact}`}>
              <TopicsIntentions />
            </div>
            <div className={styles.plateFoot}>
              <span>14 TOPICS</span>
              <span>6 INTENTIONS</span>
              <span>SHEET 01/03</span>
            </div>
          </div>

          <div ref={plateDRef} className={`${styles.plate} anim anim-up anim-d2`}>
            <div className={styles.plateHead}>
              <div className={styles.plateHeadLeft}>
                <span className={styles.plateTag}>PLATE.D</span>
                <span className={styles.plateTitle}>Stack · system topology · iso 30°</span>
              </div>
              <div className={styles.plateMeta}>
                <span>6 LAYERS</span>
                <span>BROWSER → PROTOCOL</span>
              </div>
            </div>
            <div className={`${styles.plateBody} ${styles.plateBodyCompact}`}>
              <IsoStack />
            </div>
            <div className={styles.plateFoot}>
              <span>LOCAL → CHAIN</span>
              <span>PROOF FLOWS DOWN</span>
              <span>SHEET 02/03</span>
            </div>
          </div>
        </div>

        <div ref={plateCRef} className={`${styles.plate} ${styles.plateWide} anim anim-up`}>
          <div className={styles.plateHead}>
            <div className={styles.plateHeadLeft}>
              <span className={styles.plateTag}>PLATE.C</span>
              <span className={styles.plateTitle}>Three circles · intuition × vitalik × sofia</span>
            </div>
            <div className={styles.plateMeta}>
              <span>RELIEF</span>
              <span>12 BANDS</span>
            </div>
          </div>
          <div className={styles.plateBody}>
            <ThreeCircles />
          </div>
          <div className={styles.plateFoot}>
            <span>3 CIRCLES</span>
            <span>ATTENTION RELIEF</span>
            <span>SHEET 03/03</span>
          </div>
        </div>
      </div>
    </section>
  );
}

