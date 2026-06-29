/**
 * CircleMemberPanel — Pro "Members & expertise" right rail (circle/Expertise.jsx
 * MemberPanel, 343-387). Stats grid + a GitHub-style certification calendar
 * (DS `ContributionCalendar`) + the per-domain trust delegation control.
 *
 * The calendar grid is generated deterministically per member (seeded by
 * wallet, weighted by trust score) — a faithful stand-in until per-day cert
 * timestamps are wired through.
 */
import { Avatar, ContributionCalendar } from '@0xsofia/design-system'
import type { CalendarCell } from '@0xsofia/design-system'
import CircleTrustDelegate from './CircleTrustDelegate'
import type { ExpertiseRow, MemberDomain } from '@/types/circlePro'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const WEEKS = 18
// Fixed reference date keeps cell labels deterministic across renders.
const TODAY = new Date(2026, 5, 1)

function buildCells(
  seed: number,
  score: number,
): { cells: CalendarCell[][]; total: number } {
  let v = seed * 9301 + 49297
  const rand = () => {
    v = (v * 9301 + 49297) % 233280
    return v / 233280
  }
  const activity = Math.min(1, score / 100 + 0.15)
  const cells: CalendarCell[][] = []
  let total = 0
  for (let w = 0; w < WEEKS; w++) {
    const recency = 0.45 + (w / WEEKS) * 0.7
    const col: CalendarCell[] = []
    for (let d = 0; d < 7; d++) {
      const p = rand() * recency * activity
      let level: CalendarCell['level'] = 0
      if (p > 0.62) level = 4
      else if (p > 0.44) level = 3
      else if (p > 0.26) level = 2
      else if (p > 0.12) level = 1
      const daysAgo = (WEEKS - 1 - w) * 7 + (6 - d)
      const dt = new Date(TODAY.getTime() - daysAgo * 86400000)
      const count = level === 0 ? 0 : level + Math.floor(rand() * 2)
      total += count
      col.push({
        level,
        count,
        label: `${MONTHS[dt.getMonth()]} ${dt.getDate()}`,
      })
    }
    cells.push(col)
  }
  return { cells, total }
}

const MONTH_LABELS = [
  'Feb',
  '',
  '',
  'Mar',
  '',
  '',
  '',
  'Apr',
  '',
  '',
  '',
  'May',
  '',
  '',
  '',
  'Jun',
  '',
  '',
]

interface CircleMemberPanelProps {
  row: ExpertiseRow
  /** Currently-scoped topic (domain mode), or null for overall. */
  domainSlug: string | null
  domainLabel?: string
  domainColor?: string
  isLeader: boolean
  domains: MemberDomain[]
  onStake?: (handle: string, slugs: string[], amount: number) => void
}

export default function CircleMemberPanel({
  row,
  domainSlug,
  domainLabel,
  domainColor,
  isLeader,
  domains,
  onStake,
}: CircleMemberPanelProps) {
  const { member } = row
  const handle = member.label
  const primary = domains[0]
  const accent = domainColor ?? primary?.color ?? 'var(--ds-accent)'
  const inDomain = !!domainSlug
  const level = inDomain
    ? (row.expertiseByTopic.get(domainSlug) ?? 0)
    : (primary?.level ?? 0)

  const ribbon = inDomain
    ? isLeader
      ? `Leads ${domainLabel}`
      : `${domainLabel} expert`
    : isLeader
      ? 'Top contributor'
      : 'Circle member'

  const { cells, total } = buildCells(
    handle.split('').reduce((s, c) => s + c.charCodeAt(0), 0),
    row.trustScore,
  )

  const stats: Array<{ k: string; v: string | number; c?: string }> = [
    { k: 'Trust score', v: row.trustScore },
    {
      k: inDomain
        ? `${domainLabel} expertise`
        : `${primary?.label ?? 'Top'} expertise`,
      v: level,
      c: accent,
    },
    { k: 'TRUST staked', v: row.stake.toLocaleString('en-US') },
    { k: 'Peer-confirms', v: row.peers },
  ]

  return (
    <div className="lead-prof" style={{ ['--c' as string]: accent }}>
      <div className="lead-head">
        <span className="lead-rib">{ribbon}</span>
        <div className="lead-id">
          <Avatar label={handle} imageUrl={member.image} size={48} />
          <div>
            <div className="lead-h">
              {handle}
              {row.core ? <span className="core-badge">Core</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="lead-stats">
        {stats.map((s) => (
          <div className="lead-stat" key={s.k}>
            <span
              className="lead-stat-v tnum"
              style={s.c ? { color: s.c } : undefined}
            >
              {s.v}
            </span>
            <span className="lead-stat-k">{s.k}</span>
          </div>
        ))}
      </div>

      <ContributionCalendar
        cells={cells}
        color={accent}
        months={MONTH_LABELS}
        totalLabel={
          <>
            <b className="tnum">{total}</b> certifications · last {WEEKS} weeks
          </>
        }
      />

      <div className="lead-block lead-trust-block">
        <CircleTrustDelegate
          handle={handle}
          domains={domains}
          activeDomain={domainSlug}
          onStake={(slugs, amount) => onStake?.(handle, slugs, amount)}
        />
      </div>
    </div>
  )
}
