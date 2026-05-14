/**
 * CircleMostActiveCard — leaderboard of the circle's most active
 * members inside a configurable time window (7d / 30d / all). Renders
 * 4 rows with a Fraunces-serif rank, an avatar, the member label and
 * a pixel bar (▮▮▮) whose length scales with the count. Sits next to
 * the Members card in the 3-col info row.
 */
import { useMemo, useState } from 'react'
import type { CircleItem } from '@/services/circleService'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import {
  computeMostActive,
  type ActivityWindow,
} from '@/services/circleStats'
import MemberAvatar from './MemberAvatar'

interface CircleMostActiveCardProps {
  items: CircleItem[]
  members: TrustCircleAccount[]
}

const WINDOWS: { id: ActivityWindow; label: string }[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All' },
]

const MAX_BARS = 6

export default function CircleMostActiveCard({
  items,
  members,
}: CircleMostActiveCardProps) {
  const [window, setWindow] = useState<ActivityWindow>('7d')

  const ranked = useMemo(
    () => computeMostActive(items, members, window, 4),
    [items, members, window],
  )
  const max = ranked.reduce((m, r) => Math.max(m, r.count), 0) || 1

  return (
    <div className="crd-active-card">
      <div className="crd-active-head">
        <span className="crd-active-label">Most active</span>
        <div className="crd-active-tabs" role="tablist" aria-label="Window">
          {WINDOWS.map((w) => (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={window === w.id}
              className={`crd-active-tab${window === w.id ? ' is-active' : ''}`}
              onClick={() => setWindow(w.id)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="crd-active-empty">
          No activity{' '}
          {window === '7d'
            ? 'this week'
            : window === '30d'
              ? 'this month'
              : 'yet'}
          {window !== 'all' && (
            <>
              {' '}
              ·{' '}
              <button
                type="button"
                className="crd-active-empty-cta"
                onClick={() => setWindow(window === '7d' ? '30d' : 'all')}
              >
                check {window === '7d' ? '30d' : 'all'} ↗
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="crd-active-list">
          {ranked.map((r, idx) => {
            const bars = Math.max(1, Math.round((r.count / max) * MAX_BARS))
            return (
              <div key={r.member.termId} className="crd-active-row">
                <span className="crd-active-rank">{idx + 1}</span>
                <MemberAvatar member={r.member} linkable />
                <span className="crd-active-name" title={r.member.label}>
                  {r.member.label}
                </span>
                <span className="crd-active-count">{r.count}</span>
                <span
                  className="crd-active-bar"
                  aria-hidden="true"
                  title={`${r.count} signal${r.count === 1 ? '' : 's'}`}
                >
                  {'▮'.repeat(bars)}
                  <span className="crd-active-bar-rest">
                    {'▯'.repeat(MAX_BARS - bars)}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
