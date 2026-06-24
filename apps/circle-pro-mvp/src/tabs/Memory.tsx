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
import { MEMORY, MEMORY_KIND, ROLE_MAP, peopleByRole, personByHandle } from '../data/mock'
import { avGrad, initials } from '../data/helpers'
import { requireJoin } from '../lib/gate'
import type { MemoryKind, MemoryRecord, RoleId } from '../data/types'

interface MemoryProps {
  role?: RoleId | null
}

const KINDS: (MemoryKind | 'all')[] = ['all', 'thread', 'doc']

export function Memory({ role = null }: MemoryProps) {
  const [kind, setKind] = useState<MemoryKind | 'all'>('all')
  const [showAll, setShowAll] = useState(false)

  // team scope: a memory belongs to a team if any of its authors hold that role
  const team = role ? ROLE_MAP[role] : null
  const teamHandles = role ? new Set(peopleByRole(role).map((p) => p.handle)) : null
  const base = (team && teamHandles ? MEMORY.filter((m) => m.who.some((h) => teamHandles.has(h))) : MEMORY).filter(
    (m) => m.kind !== 'decision',
  )

  const filtered = base.filter((m) => kind === 'all' || m.kind === kind)

  const renderMem = (m: MemoryRecord) => {
    const k = MEMORY_KIND[m.kind]
    return (
      <div className="memcard" key={m.id} style={{ ['--c' as string]: k.color }}>
        <h4 className="memcard-title">{m.title}</h4>
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
  }

  return (
    <section className={`module${team ? ' mem-team' : ''}`} id={team ? `memory-${role}` : 'memory'}>
      {base.length === 0 ? (
        <>
          <ModuleHead title="Memory" />
          <div className="mem-empty">
            <p>
              No decisions, threads or docs recorded by the <b>{team ? team.label : 'Circle'}</b> team yet.
            </p>
            <span className="mono">Memory fills as this team votes, ships and documents on-chain.</span>
          </div>
        </>
      ) : (
        <>
          <ModuleHead title="Memory" />

          <div className="mem-filters">
            {KINDS.map((k) => (
              <button key={k} className={`mem-fil${kind === k ? ' active' : ''}`} onClick={() => setKind(k)}>
                {k === 'all' ? 'All' : MEMORY_KIND[k].label + 's'}
              </button>
            ))}
            <button className="view-all-btn mem-viewall" onClick={() => setShowAll(true)}>
              View all
            </button>
          </div>

          <div className="mem-grid mem-grid--compact">
            <button className="memcard--create" onClick={() => requireJoin('add to memory')}>
              <span className="skcard-create-plus">+</span>
              <span className="skcard-create-label">Add memory</span>
            </button>
            {filtered.slice(0, 3).map((m) => renderMem(m))}
          </div>

          {showAll ? (
            <div className="skmodal" role="dialog" aria-modal="true" onClick={() => setShowAll(false)}>
              <div className="skmodal-card skmodal-card--skv" onClick={(e) => e.stopPropagation()}>
                <div className="va">
                  <header className="va-head">
                    <h2 className="va-title">All memory</h2>
                    <button className="skv-icon" aria-label="Close" onClick={() => setShowAll(false)}>
                      <Icon name="close" />
                    </button>
                  </header>
                  <div className="va-body sk-scroll">
                    <div className="mem-grid">{filtered.map((m) => renderMem(m))}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
