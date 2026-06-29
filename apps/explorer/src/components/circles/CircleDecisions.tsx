/**
 * CircleDecisions — Pro "Decisions" room (circle/Decisions.jsx). Expertise-
 * weighted voting: each member's weight on a question is their expertise on its
 * topic — NOT their token balance. The headcount-vs-weighted contrast is the
 * point. Data is mock (see lib/circleDecisions) until the on-chain lifecycle
 * exists; the weight formula + topics + members are real-shaped so it swaps in.
 */
import { useState } from 'react'
import { Avatar, Icon, ModuleHead, toast } from '@0xsofia/design-system'
import { expertiseWeight } from '@/lib/circleDecisions'
import type {
  CircleDecision,
  CircleDecisionsData,
  QueueDecision,
  VoteChoice,
} from '@/types/circlePro'

interface CircleDecisionsProps {
  data: CircleDecisionsData
  /** Highlight a topic on the treemap (returns to the overview). */
  onTheme: (slug: string) => void
}

function StackBar({ yes, no }: { yes: number; no: number }) {
  const lead = yes >= no ? 'yes' : 'no'
  return (
    <div className="dec-bar weighted">
      <div className="dec-bar-cap">
        <span className={`dec-cap-yes${lead === 'yes' ? ' lead' : ''}`}>
          <i className="d" />
          Yes <b className="tnum">{yes}%</b>
        </span>
        <span className={`dec-cap-no${lead === 'no' ? ' lead' : ''}`}>
          <b className="tnum">{no}%</b> No <i className="d" />
        </span>
      </div>
      <div className="dec-bar-track">
        <div className="seg yes" style={{ width: `${yes}%` }} />
        <div className="seg no" style={{ width: `${no}%` }} />
      </div>
    </div>
  )
}

function VoteModal({
  dec,
  weight,
  level,
  onClose,
  onVote,
  onHow,
}: {
  dec: CircleDecision
  weight: number
  level: number
  onClose: () => void
  onVote: (c: VoteChoice) => void
  onHow: () => void
}) {
  const low = weight < 1
  const signals = Math.max(2, Math.round(level / 4))
  const peers = Math.max(1, Math.round(level / 10))
  const pios = Math.max(0, Math.round(level / 22))
  return (
    <div className="dec-modal-overlay" onClick={onClose}>
      <div
        className="dec-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ ['--c' as string]: dec.topicColor }}
      >
        <div className="dec-modal-head">
          <span className="dec-modal-eyebrow">Your vote on this question</span>
          <button
            type="button"
            className="drill-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="dec-modal-q">{dec.question}</p>

        <div className="dec-topic-row">
          <span className="dec-topic-lab">Topic detected</span>
          <span
            className="dec-tag"
            style={{ ['--c' as string]: dec.topicColor }}
          >
            <i />
            {dec.topicLabel}
          </span>
        </div>

        <div className="dec-weight-box">
          <div className="dec-weight-line">
            <span className="dec-weight-lab">
              Your expertise score in {dec.topicLabel}
            </span>
            <span className="dec-weight-val tnum">{weight.toFixed(1)}×</span>
          </div>
          {low ? (
            <>
              <p className="dec-weight-note">
                You have limited signal in this topic — your vote counts, but
                with reduced weight.
              </p>
              <div className="dec-weight-hint">
                <Icon name="bolt" /> Want more weight on these decisions? Start
                marking {dec.topicLabel} content.
              </div>
            </>
          ) : (
            <>
              <p className="dec-weight-sub">Based on</p>
              <ul className="dec-weight-basis">
                <li>
                  <b className="tnum">{signals}</b> signals marked in{' '}
                  {dec.topicLabel}
                </li>
                <li>
                  <b className="tnum">{pios}</b> Pioneer marks in{' '}
                  {dec.topicLabel}
                </li>
                <li>
                  Peer-confirmed by <b className="tnum">{peers}</b>{' '}
                  {dec.topicLabel}-aligned members
                </li>
              </ul>
              <p className="dec-weight-count">
                Your vote will count as{' '}
                <b className="tnum">{weight.toFixed(1)}</b> weighted points.
              </p>
            </>
          )}
        </div>

        <div className="dec-vote-actions">
          <button
            type="button"
            className="btn btn-accent dec-yes"
            onClick={() => onVote('yes')}
          >
            Vote Yes
          </button>
          <button
            type="button"
            className="btn dec-no"
            onClick={() => onVote('no')}
          >
            Vote No
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onVote('abstain')}
          >
            Abstain
          </button>
        </div>
        <button type="button" className="dec-how-link" onClick={onHow}>
          How is weight calculated?
        </button>
      </div>
    </div>
  )
}

function HowModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="dec-modal-overlay" onClick={onClose}>
      <div
        className="dec-modal dec-modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dec-modal-head">
          <span className="dec-modal-eyebrow">How is weight calculated?</span>
          <button
            type="button"
            className="drill-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="dec-how-body">
          Your weight on a question is your <b>expertise score in its topic</b>{' '}
          — signal coherence + TRUST staked + peer-confirmation. Pioneers and
          high-signal contributors weigh more. It is{' '}
          <b>expertise-weighted, not token-weighted</b>: holding more tokens
          does not buy a louder vote.
        </p>
        <a className="dec-how-src" href="#" onClick={(e) => e.preventDefault()}>
          Read the open-source formula <Icon name="ext" />
        </a>
      </div>
    </div>
  )
}

function DecisionCard({
  dec,
  userVote,
  weight,
  onOpenVote,
  onOpenHow,
  onTheme,
}: {
  dec: CircleDecision
  userVote?: VoteChoice
  weight: number
  onOpenVote: () => void
  onOpenHow: () => void
  onTheme: (slug: string) => void
}) {
  const [breakdown, setBreakdown] = useState(false)
  return (
    <div
      className="panel dec-card"
      style={{ ['--c' as string]: dec.topicColor }}
    >
      <div className="dec-head">
        <p className="dec-q">{dec.question}</p>
        <div className="dec-meta">
          <button
            type="button"
            className="dec-tag"
            style={{ ['--c' as string]: dec.topicColor }}
            onClick={() => onTheme(dec.topicSlug)}
            title={`Highlight ${dec.topicLabel} on the map`}
          >
            <i />
            {dec.topicLabel}
          </button>
          <span className="dec-meta-txt">
            posed by {dec.author} · {dec.ago}d ago · closes in {dec.closes}d
          </span>
        </div>
      </div>

      <div className="dec-bars">
        <StackBar yes={dec.weighted.yes} no={dec.weighted.no} />
      </div>

      <div className="dec-foot">
        <div className="dec-voters">
          <span className="dec-voters-lab">Top weight</span>
          <div className="dec-voters-avs">
            {dec.voters.map((v) => (
              <Avatar
                key={v.handle}
                label={v.handle}
                imageUrl={v.image}
                size={26}
                title={`${v.handle} · weight ${v.weight.toFixed(1)}× · ${dec.topicLabel} expert · voted ${v.vote}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="dec-breakdown-link"
            onClick={() => setBreakdown((b) => !b)}
          >
            {breakdown ? 'Hide breakdown' : 'See full breakdown'}
          </button>
        </div>

        <div className="dec-act">
          {userVote ? (
            <div className="dec-yourvote">
              <Icon name="check" /> You voted <b>{userVote}</b> · your weight{' '}
              <span className="tnum">{weight.toFixed(1)}×</span> (
              {dec.topicLabel})
            </div>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-accent"
                onClick={onOpenVote}
              >
                Cast your weighted vote
              </button>
              <button
                type="button"
                className="dec-how-link inline"
                onClick={onOpenHow}
              >
                How is weight calculated?
              </button>
            </>
          )}
        </div>
      </div>

      {breakdown ? (
        <div className="dec-bd">
          <div className="dec-bd-grid">
            {dec.voters.map((v) => (
              <div className="dec-bd-row" key={v.handle}>
                <Avatar label={v.handle} imageUrl={v.image} size={26} />
                <span className="dec-bd-h">{v.handle}</span>
                <span className="dec-bd-w tnum">{v.weight.toFixed(1)}×</span>
                <span className={`dec-bd-vote ${v.vote}`}>{v.vote}</span>
              </div>
            ))}
          </div>
          <p className="dec-bd-more">
            + {dec.totalVoters - dec.voters.length} more members voted ·
            weighted tally updates live
          </p>
        </div>
      ) : null}
    </div>
  )
}

function QueueItem({
  q,
  onTheme,
}: {
  q: QueueDecision
  onTheme: (slug: string) => void
}) {
  const open = q.status === 'open'
  return (
    <div className="dq-item" style={{ ['--c' as string]: q.topicColor }}>
      <div className="dq-top">
        <button
          type="button"
          className="dec-tag dq-tag"
          onClick={() => onTheme(q.topicSlug)}
          title={`Highlight ${q.topicLabel} on the map`}
        >
          <i />
          {q.topicLabel}
        </button>
        {open ? (
          <span className="dq-status open">
            <i className="dq-live" />
            closes {q.closes}d
          </span>
        ) : (
          <span className={`dq-status ${q.result}`}>
            {q.result === 'passed' ? 'Passed' : 'Rejected'}
          </span>
        )}
      </div>
      <p className="dq-q">{q.question}</p>
      {open ? (
        <div className="dq-foot">
          <span className="tnum">{q.voters}</span> members voted · weighted
          tally live
        </div>
      ) : (
        <div className="dq-result">
          <div className="dq-bar">
            <i style={{ width: `${q.weighted?.yes ?? 0}%` }} />
          </div>
          <span className="dq-result-txt">
            Yes <b className="tnum">{q.weighted?.yes ?? 0}%</b> · {q.voters}{' '}
            voted
          </span>
        </div>
      )}
    </div>
  )
}

export default function CircleDecisions({
  data,
  onTheme,
}: CircleDecisionsProps) {
  const { decisions, queue, meta, viewerExpertise } = data
  const [votes, setVotes] = useState<Record<string, VoteChoice>>({})
  const [modal, setModal] = useState<{
    kind: 'vote' | 'how'
    dec?: CircleDecision
  } | null>(null)

  const weightFor = (slug: string) =>
    expertiseWeight(viewerExpertise.get(slug) ?? 0)

  const castVote = (dec: CircleDecision, choice: VoteChoice) => {
    setVotes((v) => ({ ...v, [dec.id]: choice }))
    setModal(null)
    const w = weightFor(dec.topicSlug)
    toast(
      choice === 'abstain'
        ? `Abstained · ${dec.topicLabel}`
        : `Voted ${choice} · counted as ${w.toFixed(1)}× weight`,
    )
  }

  return (
    <section className="module" id="cp-decisions">
      <ModuleHead
        title="Decisions"
        right={
          <span className="dec-counter ds-mono">
            {meta.open} open · {meta.closed} closed
          </span>
        }
      />

      {decisions.length === 0 ? (
        <div className="panel cp-empty" style={{ padding: '40px 16px' }}>
          No open decisions in this Circle yet.
        </div>
      ) : (
        <div className="dec-layout">
          <div className="dec-list">
            {decisions.map((dec) => (
              <DecisionCard
                key={dec.id}
                dec={dec}
                userVote={votes[dec.id]}
                weight={weightFor(dec.topicSlug)}
                onOpenVote={() => setModal({ kind: 'vote', dec })}
                onOpenHow={() => setModal({ kind: 'how', dec })}
                onTheme={onTheme}
              />
            ))}
          </div>
          <aside className="dec-queue panel">
            <p className="dq-title">Other questions</p>
            <div className="dq-list">
              {queue.map((q) => (
                <QueueItem key={q.id} q={q} onTheme={onTheme} />
              ))}
            </div>
            <a
              className="btn btn-ghost btn-sm dq-all"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              View all {meta.open + meta.closed} decisions <Icon name="arrow" />
            </a>
          </aside>
        </div>
      )}

      {modal?.kind === 'vote' && modal.dec ? (
        <VoteModal
          dec={modal.dec}
          weight={weightFor(modal.dec.topicSlug)}
          level={viewerExpertise.get(modal.dec.topicSlug) ?? 0}
          onClose={() => setModal(null)}
          onVote={(c) => modal.dec && castVote(modal.dec, c)}
          onHow={() => setModal({ kind: 'how', dec: modal.dec })}
        />
      ) : null}
      {modal?.kind === 'how' ? (
        <HowModal onClose={() => setModal(null)} />
      ) : null}
    </section>
  )
}
