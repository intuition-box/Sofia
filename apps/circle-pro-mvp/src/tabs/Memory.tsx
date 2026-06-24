/**
 * Collective memory — the Circle's shared context (decisions, threads, docs)
 * with an ask-and-retrieve box so members can recall "what did we decide about
 * X?" instead of relitigating it. Ported from `circle-pro2/Memory.jsx`.
 *
 * When given a `role`, the module scopes to that team: a record belongs to a
 * team if any of its authors hold the role. Rendered role-scoped inside the
 * Roles tab, or global (no prop) on its own.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ModuleHead } from '../components/primitives'
import { MEMORY, MEMORY_ASKS, MEMORY_KIND, ROLE_MAP, TOPIC_MAP, peopleByRole, personByHandle } from '../data/mock'
import { avGrad, initials } from '../data/helpers'
import { requireJoin } from '../lib/gate'
import type { MemoryKind, MemoryRecord, RoleId } from '../data/types'

interface Answer {
  text: string
  refs: MemoryRecord[]
}

interface MemoryProps {
  role?: RoleId | null
}

const KINDS: (MemoryKind | 'all')[] = ['all', 'decision', 'thread', 'doc']

export function Memory({ role = null }: MemoryProps) {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [kind, setKind] = useState<MemoryKind | 'all'>('all')

  // team scope: a memory belongs to a team if any of its authors hold that role
  const team = role ? ROLE_MAP[role] : null
  const teamHandles = role ? new Set(peopleByRole(role).map((p) => p.handle)) : null
  const base = team && teamHandles ? MEMORY.filter((m) => m.who.some((h) => teamHandles.has(h))) : MEMORY

  const ask = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim().toLowerCase()
    if (!query) return
    if (!requireJoin(team ? `ask the ${team.label} team's memory` : "ask the team's memory")) return
    const hit = MEMORY_ASKS.find((a) => query.split(' ').some((w) => w.length > 2 && a.q.includes(w)))
    const baseIds = new Set(base.map((m) => m.id))
    if (hit && (!team || hit.refs.some((id) => baseIds.has(id)))) {
      setAnswer({
        text: hit.a,
        refs: hit.refs
          .map((id) => MEMORY.find((m) => m.id === id))
          .filter((m): m is MemoryRecord => !!m && (!team || baseIds.has(m.id))),
      })
    } else {
      // text-search the scoped records as a fallback
      const matches = base.filter((m) =>
        (m.title + ' ' + m.snippet)
          .toLowerCase()
          .split(' ')
          .some((w) => query.includes(w) && w.length > 3),
      )
      if (matches.length)
        setAnswer({
          text: `${matches.length} ${team ? team.label + ' ' : ''}record${matches.length > 1 ? 's' : ''} match your question.`,
          refs: matches.slice(0, 4),
        })
      else
        setAnswer({
          text: team
            ? `No ${team.label} decision recorded on that yet.`
            : 'No decision recorded on that yet. Try "treasury LSTs", "GG24 funding", or "audit".',
          refs: [],
        })
    }
  }

  const filtered = base.filter((m) => {
    if (kind !== 'all' && m.kind !== kind) return false
    if (!q.trim()) return true
    const s = (m.title + ' ' + m.snippet + ' ' + m.who.join(' ')).toLowerCase()
    return q
      .toLowerCase()
      .split(' ')
      .every((w) => s.includes(w))
  })

  return (
    <section className={`module${team ? ' mem-team' : ''}`} id={team ? `memory-${role}` : 'memory'}>
      <ModuleHead title={team ? `${team.label} team memory` : 'Collective memory'} />

      {base.length === 0 ? (
        <div className="mem-empty">
          <p>
            No decisions, threads or docs recorded by the <b>{team ? team.label : 'Circle'}</b> team yet.
          </p>
          <span className="mono">Memory fills as this team votes, ships and documents on-chain.</span>
        </div>
      ) : (
        <>
          <form className="mem-ask" onSubmit={ask}>
            <span className="mem-ask-ic">
              <Icon name="search" />
            </span>
            <input
              className="mem-ask-input"
              placeholder={
                team
                  ? `Ask the ${team.label} team's memory — e.g. "what did we decide?"`
                  : `Ask the team's memory — e.g. "what did we decide about the treasury?"`
              }
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setAnswer(null)
              }}
            />
            <button className="btn btn-accent btn-sm" type="submit">
              Recall
            </button>
          </form>

          {answer ? (
            <div className="mem-answer">
              <span className="mem-answer-tag mono">
                <span className="mem-spark">✦</span> Recalled from {answer.refs.length || 'the'}{' '}
                {answer.refs.length === 1 ? 'record' : 'records'}
              </span>
              <p className="mem-answer-text">{answer.text}</p>
              {answer.refs.length ? (
                <div className="mem-answer-refs">
                  {answer.refs.map((r) => (
                    <span key={r.id} className="mem-ref" style={{ ['--c' as string]: MEMORY_KIND[r.kind].color }}>
                      {MEMORY_KIND[r.kind].label} · {r.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mem-filters">
            {KINDS.map((k) => (
              <button key={k} className={`mem-fil${kind === k ? ' active' : ''}`} onClick={() => setKind(k)}>
                {k === 'all' ? 'All' : MEMORY_KIND[k].label + 's'}
              </button>
            ))}
          </div>

          <div className="mem-grid">
            {filtered.map((m) => {
              const k = MEMORY_KIND[m.kind]
              const th = TOPIC_MAP[m.topic]
              return (
                <div className="memcard" key={m.id} style={{ ['--c' as string]: k.color }}>
                  <div className="memcard-top">
                    <span className="memcard-kind">{k.label}</span>
                    {th ? (
                      <span className="memcard-topic" style={{ color: th.color }}>
                        #{th.label}
                      </span>
                    ) : null}
                    <span className="memcard-when mono">{m.when}</span>
                  </div>
                  <h4 className="memcard-title">{m.title}</h4>
                  <p className="memcard-snippet">{m.snippet}</p>
                  <div className="memcard-foot">
                    <div className="memcard-who">
                      {m.who.map((h) => {
                        const p = personByHandle(h)
                        return (
                          <span key={h} className="memcard-av" style={{ background: avGrad(p?.grad ?? 0) }} title={h}>
                            {initials(h)}
                          </span>
                        )
                      })}
                      <span className="memcard-who-h mono">
                        {m.who[0]}
                        {m.who.length > 1 ? ` +${m.who.length - 1}` : ''}
                      </span>
                    </div>
                    <button className="memcard-open" onClick={() => requireJoin(`open "${m.title}"`)}>
                      {m.refs} refs <Icon name="arrow" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        </>
      )}
    </section>
  )
}
