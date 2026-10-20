/**
 * PortfolioChart — P&L of a wallet's positions over time: the headline total
 * P&L, the change for the period (deposits and exits left out), a line you
 * can scrub, period chips underneath. Green when up, red when down.
 */
import { useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/trend-hunter.css'
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory'
import {
  performance,
  PORTFOLIO_RANGES,
  sliceRange,
  type PortfolioPoint,
  type PortfolioRange,
} from '@/services/portfolioHistoryService'

const UP = '#22c55e'
const DOWN = '#ef4444'

function trust(n: number): string {
  const abs = Math.abs(n)
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : 4
  return `${n.toLocaleString('en', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} T`
}

function signed(n: number): string {
  return `${n >= 0 ? '+' : '−'}${trust(Math.abs(n))}`
}

const RANGE_LABEL: Record<PortfolioRange, string> = {
  '1W': 'past week',
  '1M': 'past month',
  '3M': 'past 3 months',
  '1Y': 'past year',
  MAX: 'since the start',
}

function formatDay(t: number): string {
  return new Date(t).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function PortfolioChart({
  walletAddress,
}: {
  walletAddress?: string
}) {
  const { points, loading, error } = usePortfolioHistory(walletAddress)
  const [range, setRange] = useState<PortfolioRange>('1M')
  const [hover, setHover] = useState<number | null>(null)

  // Plot the P&L (value − net put in): taking gains out lowers both sides
  // equally, so an exit doesn't read as a drop.
  const data = useMemo(
    () =>
      sliceRange(points, range).map((p) => ({
        ...p,
        pnl: p.value - p.invested,
      })),
    [points, range],
  )
  const perf = useMemo(() => performance(data), [data])
  // Scrubbing: the headline follows the finger / cursor
  const shown: (PortfolioPoint & { pnl: number }) | undefined =
    hover != null ? data[hover] : data[data.length - 1]
  const shownPerf = useMemo(
    () => (hover != null ? performance(data.slice(0, hover + 1)) : perf),
    [hover, data, perf],
  )
  const color = perf.change >= 0 ? UP : DOWN

  if (loading) {
    return (
      <section className="pf-chart pf-chart--loading">
        <SofiaLoader size={40} />
      </section>
    )
  }
  if (error || points.length < 2) return null

  return (
    <section className="pf-chart" aria-label="Profit and loss over time">
      <div className="pf-head">
        <span className="th-eyebrow">Total P&amp;L</span>
        <span className={`pf-value ${shown && shown.pnl < 0 ? 'down' : 'up'}`}>
          {shown ? signed(shown.pnl) : '—'}
        </span>
        <span className={`pf-perf ${shownPerf.change >= 0 ? 'up' : 'down'}`}>
          {signed(shownPerf.change)}
          {shownPerf.pct != null &&
            ` (${shownPerf.pct >= 0 ? '+' : ''}${shownPerf.pct.toFixed(2)}%)`}
          <span className="pf-perf-when">
            {hover != null && shown ? formatDay(shown.t) : RANGE_LABEL[range]}
          </span>
        </span>
      </div>

      <div className="pf-plot">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
            onMouseMove={(s) =>
              setHover(
                typeof s?.activeTooltipIndex === 'number'
                  ? s.activeTooltipIndex
                  : null,
              )
            }
            onMouseLeave={() => setHover(null)}
          >
            <YAxis
              hide
              domain={[
                (min: number) => Math.min(min, 0),
                (max: number) => Math.max(max, 0),
              ]}
            />
            <Tooltip
              content={() => null}
              cursor={{ stroke: 'var(--ds-muted)', strokeDasharray: '3 3' }}
            />
            <ReferenceLine
              y={0}
              stroke="var(--ds-border)"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'var(--ds-card)' }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pf-foot">
        <div className="pf-ranges" role="tablist" aria-label="Period">
          {PORTFOLIO_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={range === r.key}
              className={`pm-chip${range === r.key ? ' active' : ''}`}
              onClick={() => {
                setRange(r.key)
                setHover(null)
              }}
            >
              {r.key === 'MAX' ? 'Max' : r.key}
            </button>
          ))}
        </div>
        {shown && (
          <span className="pf-legend">
            Value {trust(shown.value)} · Put in {trust(shown.invested)}
          </span>
        )}
      </div>
    </section>
  )
}
