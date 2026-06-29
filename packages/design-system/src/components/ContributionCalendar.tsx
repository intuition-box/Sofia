import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * `<ContributionCalendar>` — a GitHub-style activity heatmap ported from the
 * newexplorerDAO handoff (circle/Expertise.jsx CertCalendar, 264-341).
 *
 * Presentational: the caller supplies the grid as `cells` (column-major:
 * `cells[week][day]`), each cell a `{ level 0-4, count, label }`. Cell color
 * intensity is mixed from a single `color`. A hover tooltip shows the cell's
 * count + label.
 *
 * Requires `import "@0xsofia/design-system/styles/contribution-calendar.css"`.
 */
export interface CalendarCell {
  /** 0 (empty) … 4 (max) — drives the tint. */
  level: 0 | 1 | 2 | 3 | 4
  /** Raw count shown in the tooltip. */
  count: number
  /** Date/label shown in the tooltip. */
  label: string
}

export interface ContributionCalendarProps {
  /** Column-major grid: `cells[week][day]`. */
  cells: CalendarCell[][]
  /** Accent color mixed into the cell levels. */
  color: string
  /** Header line (e.g. `<><b>312</b> certifications · last 18 weeks</>`). */
  totalLabel?: ReactNode
  /** Optional month labels, one slot per week column. */
  months?: string[]
  /** Show the Less/More legend (default true). */
  legend?: boolean
  className?: string
}

export function ContributionCalendar({
  cells,
  color,
  totalLabel,
  months,
  legend = true,
  className,
}: ContributionCalendarProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{
    x: number
    y: number
    cell: CalendarCell
  } | null>(null)

  const move = (e: React.MouseEvent, cell: CalendarCell) => {
    const r = bodyRef.current?.getBoundingClientRect()
    if (!r) return
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, cell })
  }

  return (
    <div className={className ? `ds-cal ${className}` : 'ds-cal'}>
      {totalLabel != null && (
        <div className="ds-cal-head">
          <span className="ds-cal-total">{totalLabel}</span>
        </div>
      )}
      {months && months.length > 0 && (
        <div
          className="ds-cal-months"
          style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
        >
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      )}
      <div
        className="ds-cal-body"
        ref={bodyRef}
        onMouseLeave={() => setTip(null)}
      >
        <div className="ds-cal-grid" style={{ ['--ds-cell' as string]: color }}>
          {cells.map((col, wi) => (
            <div className="ds-cal-col" key={wi}>
              {col.map((cell, di) => (
                <i
                  key={di}
                  className={`ds-cal-cell l${cell.level}`}
                  onMouseEnter={(e) => move(e, cell)}
                  onMouseMove={(e) => move(e, cell)}
                />
              ))}
            </div>
          ))}
        </div>
        {tip && (
          <div className="ds-cal-tip" style={{ left: tip.x, top: tip.y }}>
            <b className="tnum">
              {tip.cell.count
                ? `${tip.cell.count} certification${tip.cell.count > 1 ? 's' : ''}`
                : 'No activity'}
            </b>
            <span>{tip.cell.label}</span>
          </div>
        )}
      </div>
      {legend && (
        <div
          className="ds-cal-legend"
          style={{ ['--ds-cell' as string]: color }}
        >
          <span>Less</span>
          <i className="ds-cal-cell l0" />
          <i className="ds-cal-cell l1" />
          <i className="ds-cal-cell l2" />
          <i className="ds-cal-cell l3" />
          <i className="ds-cal-cell l4" />
          <span>More</span>
        </div>
      )}
    </div>
  )
}
