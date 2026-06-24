/**
 * Collective memory — the Circle's shared context (decisions, threads, docs)
 * with an ask-and-retrieve box so members can recall "what did we decide about
 * X?" instead of relitigating it. Ported from `circle-pro2/Memory.jsx`.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ModuleHead } from '../components/primitives'
import { MEMORY, MEMORY_ASKS, MEMORY_KIND, TOPIC_MAP, personByHandle } from '../data/mock'
import { avGrad, initials } from '../data/helpers'
import { requireJoin } from '../lib/gate'
import type { MemoryKind, MemoryRecord } from '../data/types'

interface Answer {
  text: string
  refs: MemoryRecord[]
}

const KINDS: (MemoryKind | 'all')[] = ['all', 'decision', 'thread', 'doc']

export function Memory() {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [kind, setKind] = useState<MemoryKind | 'all'>('all')

  const ask = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim().toLowerCase()
    if (!query) return
    if (!requireJoin("ask the team's memory")) return
    const hit = MEMORY_ASKS.find((a) =>
      query.split(' ').some((w) => w.length > 2 && a.q.includes(w)),
    )
    if (hit)
      setAnswer({
        text: hit.a,
        refs: hit.refs.map((id) => MEMORY.find((m) => m.id === id)).filter((m): m is MemoryRecord => !!m),
      })
    else
      setAnswer({
        text: 'No decision recorded on that yet. Try "treasury LSTs", "GG24 funding", or "audit".',
        refs: [],
      })
  }

  const filtered = MEMORY.filter((m) => {
    if (kind !== 'all' && m.kind !== kind) return false
    if (!q.trim()) return true
    const s = (m.title + ' ' + m.snippet + ' ' + m.who.join(' ')).toLowerCase()
    return q
      .toLowerCase()
      .split(' ')
      .every((w) => s.includes(w))
  })

  return (
    <section className="module" id="memory">
      <ModuleHead title="Collective memory" />

      <form className="mem-ask" onSubmit={ask}>
        <span className="mem-ask-ic">
          <Icon name="search" />
        </span>
        <input
          className="mem-ask-input"
          placeholder='Ask the team&apos;s memory — e.g. "what did we decide about the treasury?"'
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
        <span className="mem-count mono">{filtered.length} records</span>
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

      <p className="module-cap">
        Memory is built from the team's own saved resources and decisions — nothing is
        invented. Recall surfaces the original records so context travels with the answer.
      </p>
    </section>
  )
}
