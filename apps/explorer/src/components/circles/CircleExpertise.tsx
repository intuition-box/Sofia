/**
 * CircleExpertise — Pro "Members & expertise" module (circle/Expertise.jsx).
 * One table, two modes:
 *   - Overall: every member ranked by Trust score.
 *   - Domain (a topic picked on the treemap): the staked question "Most expert
 *     in {topic}", same table re-ranked by TRUST backing, wrapped by a question
 *     banner + the domain's signal cards, with a live member panel on the rail.
 *
 * Presentational: consumes the `useCircleExpertise` result (passed down by
 * `CircleDetailView`). DS primitives: Avatar, AvailDot, Icon, ModuleHead.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  AvailDot,
  Icon,
  ModuleHead,
  toast,
} from '@0xsofia/design-system'
import type { CircleItem } from '@/services/circleService'
import type { ExpertiseRow, MemberDomain } from '@/types/circlePro'
import CircleMemberPanel from './CircleMemberPanel'

interface TopicMeta {
  id: string
  label: string
  color: string
}

interface CircleExpertiseProps {
  rows: ExpertiseRow[]
  topicMeta: (slug: string) => TopicMeta
  topDomains: (row: ExpertiseRow, n?: number, min?: number) => MemberDomain[]
  /** Scoped topic slug, or null/'all' for the overall view. */
  domain: string | null
  onClearDomain: () => void
  /** Feed items — the source for the domain's signal strip. */
  feedItems: CircleItem[]
}

const DOMAIN_EXPERT_MIN = 40

function scoreColor(s: number): string {
  return s >= 80
    ? 'var(--trusted-p)'
    : s >= 60
      ? 'var(--ds-ink)'
      : 'var(--ds-muted)'
}

function ReachIcons({ handle }: { handle: string }) {
  const stop = (msg: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    toast(msg)
  }
  return (
    <div className="reach-icons">
      <button
        type="button"
        className="rec-chan"
        title={`Reach ${handle} on X`}
        onClick={stop(`Opening X for ${handle}`)}
      >
        <Icon name="x" />
      </button>
      <button
        type="button"
        className="rec-chan"
        title={`Reach ${handle} on Discord`}
        onClick={stop(`Opening Discord for ${handle}`)}
      >
        <Icon name="discord" />
      </button>
      <button
        type="button"
        className="rec-chan"
        title={`Reach ${handle} on Telegram`}
        onClick={stop(`Opening Telegram for ${handle}`)}
      >
        <Icon name="telegram" />
      </button>
      <button
        type="button"
        className="rec-chan"
        title={`Email ${handle}`}
        onClick={stop(`Drafting an email to ${handle}`)}
      >
        <Icon name="gmail" />
      </button>
    </div>
  )
}

function SignalCard({
  item,
  color,
  label,
}: {
  item: CircleItem
  color: string
  label: string
}) {
  const intent = item.intentions[0]
  return (
    <a
      className="cp-sig"
      href={item.url}
      target="_blank"
      rel="noreferrer"
      style={{ ['--c' as string]: color }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cp-sig-head">
        {item.favicon ? (
          <img className="cp-sig-fav" src={item.favicon} alt="" />
        ) : (
          <span className="cp-sig-fav cp-sig-fav--empty">
            {item.domain[0]?.toUpperCase()}
          </span>
        )}
        <span className="cp-sig-domain">{item.domain}</span>
      </div>
      <h4 className="cp-sig-title">{item.title}</h4>
      <div className="cp-sig-foot">
        {intent ? <span className="cp-sig-verb">{intent}</span> : null}
        <span className="cp-sig-tag" style={{ ['--c' as string]: color }}>
          <i />
          {label}
        </span>
      </div>
    </a>
  )
}

interface RowProps {
  row: ExpertiseRow
  rank: number
  isAll: boolean
  metricColor: string
  metricVal: string | number
  metricUnit?: string
  metricSub: React.ReactNode
  leading: boolean
  selected: boolean
  onSelect: () => void
}

function MemberRow({
  row,
  rank,
  metricColor,
  metricVal,
  metricUnit,
  metricSub,
  leading,
  selected,
  onSelect,
}: RowProps) {
  const { member } = row
  return (
    <tr className={selected ? 'mem-tr open' : 'mem-tr'}>
      <td className={`c-rank tnum${rank <= 3 ? ' top r' + rank : ''}`}>
        {String(rank).padStart(2, '0')}
      </td>
      <td className="c-member">
        <div className="cmem">
          <Avatar label={member.label} imageUrl={member.image} size={34} />
          <div className="id">
            <div className="h">
              <AvailDot avail={row.avail} dotOnly className="av-dot-inline" />
              {member.label}
              {row.core ? (
                <span className="core-badge" title="Core contributor">
                  Core
                </span>
              ) : null}
              {leading ? <span className="vt-leading">Leading</span> : null}
            </div>
            <ReachIcons handle={member.label} />
          </div>
        </div>
      </td>
      <td className="mem-streak-cell">
        {row.streak > 0 ? (
          <span className={`streak${row.streak >= 14 ? ' hot' : ''}`}>
            <Icon name="flame" /> {row.streak}
            <small>d</small>
          </span>
        ) : (
          <span className="streak zero">—</span>
        )}
      </td>
      <td className="mem-score-cell">
        <div className="mem-metric">
          <div className="mm-top">
            <span className="big tnum" style={{ color: metricColor }}>
              {metricVal}
            </span>
            {metricUnit ? <span className="mm-unit">{metricUnit}</span> : null}
          </div>
          <div className="mm-sub">{metricSub}</div>
        </div>
      </td>
      <td className="mem-act-cell">
        <button
          type="button"
          className={
            selected ? 'btn btn-sm trust-btn on' : 'btn btn-sm trust-btn'
          }
          onClick={onSelect}
        >
          {selected ? 'Viewing' : 'Trust'}
        </button>
      </td>
    </tr>
  )
}

export default function CircleExpertise({
  rows,
  topicMeta,
  topDomains,
  domain,
  onClearDomain,
  feedItems,
}: CircleExpertiseProps) {
  const isAll = !domain || domain === 'all'
  const theme = isAll ? null : topicMeta(domain as string)

  // Optimistic backing bumps from the rail's Trust control: `${slug}:${handle}`.
  const [added, setAdded] = useState<Record<string, number>>({})
  const [selHandle, setSelHandle] = useState<string | null>(null)
  useEffect(() => {
    setSelHandle(null)
  }, [domain])

  const baseRows = useMemo(() => {
    if (isAll) return [...rows].sort((a, b) => b.trustScore - a.trustScore)
    const slug = domain as string
    return rows
      .filter((r) => (r.expertiseByTopic.get(slug) ?? 0) >= DOMAIN_EXPERT_MIN)
      .map((r) => {
        const extra = added[`${slug}:${r.member.label}`] ?? 0
        return { row: r, stake: r.stake + extra, mine: extra }
      })
      .sort((a, b) => b.stake - a.stake)
  }, [rows, isAll, domain, added])

  // Normalise to a common shape: { row, stake?, mine? }.
  const view = isAll
    ? (baseRows as ExpertiseRow[]).map((row) => ({ row, stake: 0, mine: 0 }))
    : (baseRows as Array<{ row: ExpertiseRow; stake: number; mine: number }>)

  const selRow = view.length
    ? (view.find((v) => v.row.member.label === selHandle) ?? view[0]).row
    : null
  const leaderHandle = view.length ? view[0].row.member.label : null

  const signals = useMemo(() => {
    if (isAll) return []
    const slug = domain as string
    return feedItems
      .filter((it) => (it.topicContexts ?? []).includes(slug))
      .slice(0, 6)
  }, [feedItems, isAll, domain])

  const onStakeInternal = (handle: string, slugs: string[], amount: number) => {
    if (isAll || !domain) return
    if (!slugs.includes(domain)) return
    setAdded((a) => ({
      ...a,
      [`${domain}:${handle}`]: (a[`${domain}:${handle}`] ?? 0) + amount,
    }))
  }

  return (
    <section className="module" id="cp-members">
      <ModuleHead title="Members" />
      <div className="panel">
        {!isAll && theme ? (
          <div className="vt-q" style={{ ['--c' as string]: theme.color }}>
            <div className="vt-q-line">
              <span className="vt-q-text">
                Most expert member in{' '}
                <b style={{ color: theme.color }}>{theme.label}</b>
              </span>
              <button type="button" className="ex-back" onClick={onClearDomain}>
                ‹ Overall trust
              </button>
            </div>
          </div>
        ) : null}

        {!isAll && theme ? (
          <div className="ex-signals ex-signals-top">
            <p className="ex-col-title">
              Signals in {theme.label} · {signals.length}
            </p>
            <div className="cp-sig-grid">
              {signals.map((it) => (
                <SignalCard
                  key={it.id}
                  item={it}
                  color={theme.color}
                  label={theme.label}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="ex-split">
          <div className="ex-split-main">
            <table className="ctab">
              <thead>
                <tr>
                  <th className="c-rank">#</th>
                  <th>Member</th>
                  <th>Streak</th>
                  <th className="num mm-th">
                    {isAll ? 'Trust score' : 'Backing'}
                  </th>
                  <th className="num">Trust</th>
                </tr>
              </thead>
              <tbody>
                {view.map((v, i) => (
                  <MemberRow
                    key={v.row.member.termId}
                    row={v.row}
                    rank={i + 1}
                    isAll={isAll}
                    metricColor={
                      isAll
                        ? scoreColor(v.row.trustScore)
                        : (theme?.color ?? 'var(--ds-ink)')
                    }
                    metricVal={
                      isAll ? v.row.trustScore : v.stake.toLocaleString('en-US')
                    }
                    metricUnit={isAll ? undefined : 'TRUST'}
                    metricSub={
                      isAll ? (
                        `${v.row.marks} marks`
                      ) : (
                        <>
                          {v.row.backers} backers
                          {v.mine ? (
                            <span className="cand-you">
                              {' '}
                              · you +{v.mine.toLocaleString('en-US')}
                            </span>
                          ) : null}
                        </>
                      )
                    }
                    leading={!isAll && i === 0}
                    selected={
                      !!selRow && v.row.member.label === selRow.member.label
                    }
                    onSelect={() => setSelHandle(v.row.member.label)}
                  />
                ))}
                {view.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="cp-empty">
                      No members with measured expertise here yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="ex-split-rail">
            {selRow ? (
              <CircleMemberPanel
                row={selRow}
                domainSlug={isAll ? null : (domain as string)}
                domainLabel={theme?.label}
                domainColor={theme?.color}
                isLeader={selRow.member.label === leaderHandle}
                domains={topDomains(selRow, 99, 12)}
                onStake={onStakeInternal}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
