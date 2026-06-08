/**
 * CircleTopicsTreemap — Free-tier "Topics" module (Phase 2).
 *
 * A squarified treemap of the topics the circle is active in: every cell
 * is sized by REAL activity (certifications per topic-context slug, from
 * `useCircleTopicActivity`), coloured per topic (taxonomy `TOPIC_META`),
 * and — on larger cells — labelled with the certification count + a
 * decorative sparkline.
 *
 * Read-only in the free tier: clicking a cell does NOT scope or drill —
 * it fires the shared upsell toast. The Pro `ExpertFlyout` (top-experts
 * hover panel) is intentionally NOT rendered here; a light CSS hover state
 * is all the free treemap gets.
 *
 * Data degradation: when the circle has no topic activity yet (empty feed
 * / no resolvable topic slugs) we render a graceful empty state instead of
 * fabricating cells.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { circleUpsellToast } from './CircleUpsellToast'
import { squarify } from './squarify'
import {
  useCircleTopicActivity,
  type CircleTopicActivity,
} from '@/hooks/useCircleTopicActivity'
import type { CircleItem } from '@/services/circleService'

interface CircleTopicsTreemapProps {
  /** Circle feed items — the source of per-topic certification counts. */
  items: readonly CircleItem[]
  /** Whether the circle has a Pro plan. False for the Trust Circle, where
   *  cells stay read-only without the "drill with Pro" upsell. */
  showPlan: boolean
}

// Treemap box height (matches the prototype's fixed 388px canvas).
const TREEMAP_HEIGHT = 388
// Cell-content thresholds (px) for progressive disclosure.
const BIG_W = 150
const BIG_H = 90
const MED_W = 96
const MED_H = 56
const SPARK_BARS = 11

/** Deterministic pseudo-random sparkline seeded by a topic's signal count.
 *  Purely decorative — the cell SIZE + count are the real data. */
function sparkBars(seed: number): number[] {
  const bars: number[] = []
  let v = seed * 9301 + 49297
  for (let i = 0; i < SPARK_BARS; i++) {
    v = (v * 9301 + 49297) % 233280
    bars.push(0.32 + (v / 233280) * 0.68)
  }
  return bars
}

interface SparklineProps {
  seed: number
}

function Sparkline({ seed }: SparklineProps) {
  const bars = useMemo(() => sparkBars(seed), [seed])
  return (
    <div className="cf-tmap-spark" aria-hidden="true">
      {bars.map((b, i) => (
        <i
          key={i}
          style={{ height: `${b * 100}%`, opacity: 0.35 + b * 0.4 }}
        />
      ))}
    </div>
  )
}

export default function CircleTopicsTreemap({
  items,
  showPlan,
}: CircleTopicsTreemapProps) {
  const topics = useCircleTopicActivity(items)
  const wrapRef = useRef<HTMLDivElement>(null)
  // Start at 0 (not a guessed width): the cells memo skips rendering until we
  // have a real measurement, so the treemap never paints at the wrong size.
  const [width, setWidth] = useState(0)

  // Re-run on `topics.length` so the observer attaches once the container
  // actually mounts. The wrap div is only rendered when topics > 0, so on the
  // first paint (topics still loading) `wrapRef.current` is null and a deps:[]
  // effect would bail forever — leaving width at its default and the treemap
  // half-filled until a reload. useLayoutEffect measures before paint, so the
  // correct layout shows on the first frame the container exists.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [topics.length])

  const cells = useMemo(() => {
    if (width <= 0 || topics.length === 0) return []
    // squarify wants a value-descending feed; useCircleTopicActivity
    // already sorts by signals desc.
    const seeded = topics.map((t) => ({ ...t, value: t.signals }))
    return squarify(seeded, 0, 0, width, TREEMAP_HEIGHT)
  }, [topics, width])

  // Free groups fire the "drill with Pro" upsell on click; the Trust Circle
  // has no Pro plan, so cells are inert there.
  const onPick = showPlan
    ? (label: string) =>
        circleUpsellToast(`Drill into ${label}'s experts with Sofia Pro`)
    : undefined

  return (
    <section className="cf-module" aria-labelledby="cf-topics-title">
      <div className="cf-module-head">
        <h2 id="cf-topics-title" className="cf-module-title">
          Topics
        </h2>
        <span className="cf-module-note">
          {topics.length} active {topics.length === 1 ? 'topic' : 'topics'}
        </span>
      </div>

      {topics.length === 0 ? (
        <div className="cf-tmap-empty">No topic activity yet.</div>
      ) : (
        <div
          className="cf-tmap"
          ref={wrapRef}
          style={{ height: TREEMAP_HEIGHT }}
        >
          {cells.map((cell) => (
            <TreemapCell key={cell.slug} cell={cell} onPick={onPick} />
          ))}
        </div>
      )}
    </section>
  )
}

interface TreemapCellProps {
  cell: CircleTopicActivity & { x: number; y: number; w: number; h: number }
  /** Click handler — undefined when the cell is inert (Trust Circle). */
  onPick?: (label: string) => void
}

function TreemapCell({ cell, onPick }: TreemapCellProps) {
  const big = cell.w > BIG_W && cell.h > BIG_H
  const med = cell.w > MED_W && cell.h > MED_H
  const sized = Math.min(
    30,
    Math.sqrt(cell.w * cell.h) / 7,
    (cell.w - 26) / 6.2,
    cell.h / 3,
  )
  const labelSize = Math.max(13, Number.isFinite(sized) ? sized : 13)

  return (
    <button
      type="button"
      className="cf-tmap-cell"
      style={{
        left: cell.x,
        top: cell.y,
        width: cell.w,
        height: cell.h,
        ['--c' as string]: cell.color,
      }}
      onClick={onPick ? () => onPick(cell.label) : undefined}
      aria-label={
        onPick
          ? `${cell.label} — ${cell.signals} certifications. Upgrade to Pro to drill into experts.`
          : `${cell.label} — ${cell.signals} certifications.`
      }
    >
      <span className="cf-tmap-cell-inner">
        <span
          className="cf-tmap-meta"
          style={{ visibility: med ? 'visible' : 'hidden' }}
        >
          <span className="cf-tmap-dot" aria-hidden="true" />
          {cell.signals} certifications
        </span>
        <span className="cf-tmap-cell-foot">
          <span className="cf-tmap-label" style={{ fontSize: labelSize }}>
            {cell.label}
          </span>
          {big ? <Sparkline seed={cell.signals} /> : null}
        </span>
      </span>
    </button>
  )
}
