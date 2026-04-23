/**
 * ActivityCalendar — GitHub-style 18-week × 7-day contribution heatmap.
 * Ported from proto-explorer/src/components/profileCharts.ts renderActivityCalendar.
 *
 * Pure view: callers compute the per-topic series and pass it in. The
 * helpers in `@/lib/activityCalendar` provide CAL_DAYS/CAL_WEEKS, a
 * synthetic series builder, and the month-label layout.
 */

import { useMemo } from 'react'
import {
  CAL_DAYS,
  CAL_WEEKS,
  computeCalendarMonthLabels,
  dateStringForDaysAgo,
  dayLabel,
  type CalendarTopicSeries,
} from '@/lib/activityCalendar'

interface ActivityCalendarProps {
  /** One series per topic. Order drives legend order. */
  topicSeries: CalendarTopicSeries[]
  /** Accent color for the radial backdrop. Defaults to `var(--ds-accent)`. */
  accent?: string
}

export default function ActivityCalendar({ topicSeries, accent = 'var(--ds-accent)' }: ActivityCalendarProps) {
  const months = useMemo(() => computeCalendarMonthLabels(), [])

  // Fallback series so the grid renders when the caller passes an empty list.
  const series: CalendarTopicSeries[] = topicSeries.length > 0
    ? topicSeries
    : [{ id: 'all', label: 'Activity', color: 'var(--ds-accent)', counts: new Array(CAL_DAYS).fill(0) }]

  const dailyTotals = useMemo(
    () =>
      Array.from({ length: CAL_DAYS }, (_, t) =>
        series.reduce((a, td) => a + (td.counts[t] ?? 0), 0),
      ),
    [series],
  )
  const maxDailyTotal = Math.max(1, ...dailyTotals)
  const totalSignals = dailyTotals.reduce((a, b) => a + b, 0)

  return (
    <div className="pc-chart-wrap pc-cal-wrap" style={{ ['--cal-base' as string]: accent }}>
      <div className="pc-chart-meta">
        <span>{totalSignals} signal{totalSignals === 1 ? '' : 's'} in the last {CAL_WEEKS} weeks</span>
        <span className="pc-chart-hint">hover to inspect</span>
      </div>
      <div className="pc-cal">
        <div className="pc-cal-surface">
          <div className="pc-cal-corner" />
          <div className="pc-cal-months">
            {months.map((m) => (
              <span key={`${m.label}-${m.weekIdx}`} className="pc-cal-month" style={{ gridColumn: m.weekIdx }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="pc-cal-days">
            <span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span>
          </div>
          <div className="pc-cal-grid">
            {Array.from({ length: CAL_DAYS }, (_, idx) => {
              const daysAgo = CAL_DAYS - 1 - idx
              const perTopic = series.map((td) => ({
                id: td.id,
                label: td.label,
                color: td.color,
                count: td.counts[idx] ?? 0,
              }))
              const totalDay = perTopic.reduce((a, t) => a + t.count, 0)

              let dominant = perTopic[0]
              for (const t of perTopic) if (t.count > dominant.count) dominant = t

              const activeCount = perTopic.filter((t) => t.count > 0).length
              const intensity = Math.min(1, totalDay / maxDailyTotal)

              const cellStyle =
                totalDay > 0
                  ? {
                      background: `color-mix(in srgb, ${dominant.color} ${Math.round(intensity * 80 + 18)}%, var(--ds-bg-subtle))`,
                    }
                  : undefined

              const classes = ['pc-cal-cell']
              classes.push(totalDay > 0 ? 'has-data' : 'l0')
              if (activeCount > 1) classes.push('multi')

              const tooltipLines = perTopic
                .filter((t) => t.count > 0)
                .map((t) => `${t.label}: ${t.count}`)
                .join(', ')
              const tooltip = totalDay > 0
                ? `${dateStringForDaysAgo(daysAgo)} — ${dayLabel(daysAgo)}\n${tooltipLines} (total ${totalDay})`
                : `${dateStringForDaysAgo(daysAgo)} — no activity`

              return (
                <div
                  key={idx}
                  className={classes.join(' ')}
                  style={cellStyle}
                  data-day={daysAgo}
                  data-count={totalDay}
                  title={tooltip}
                />
              )
            })}
          </div>
        </div>
        <div className="pc-cal-legend">
          {series.map((td) => (
            <span
              key={td.id}
              className="pc-cal-legend-topic"
              style={{ ['--leg-color' as string]: td.color }}
            >
              <span className="pc-cal-legend-dot" />
              <span>{td.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
