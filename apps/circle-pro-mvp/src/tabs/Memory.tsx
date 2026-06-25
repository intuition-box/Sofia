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
import { MEMORY, MEMORY_KIND, ROLE_MAP, TOPIC_MAP, peopleByRole } from '../data/mock'
import { DomainTagByTopic } from '../components/Tag'
import { requireJoin } from '../lib/gate'
import { MemoryView } from './MemoryView'
import type { MemoryKind, MemoryRecord, RoleId } from '../data/types'

interface MemoryProps {
  role?: RoleId | null
}

const KINDS: (MemoryKind | 'all')[] = ['all', 'thread', 'doc']

/* Nordic tag-hue + Material Symbol per memory kind, so the filter chips read
 * as tags (with an icon, like every Claude Design tag). */
const KIND_HUE: Record<string, string> = {
  thread: '#7FA088',
  doc: '#6B8BA4',
  decision: '#C9A24B',
  signal: '#A47B9E',
}
const KIND_GLYPH: Record<string, string> = {
  thread: 'forum',
  doc: 'description',
  decision: 'gavel',
  signal: 'bolt',
}

export function Memory({ role = null }: MemoryProps) {
  const [kind, setKind] = useState<MemoryKind | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const [openMem, setOpenMem] = useState<MemoryRecord | null>(null)

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
      <div
        className="memcard"
        key={m.id}
        style={{ ['--c' as string]: k.color }}
        role="button"
        tabIndex={0}
        onClick={() => {
          setShowAll(false)
          setOpenMem(m)
        }}
      >
        <h4 className="memcard-title">{m.title}</h4>
        <div className="memcard-foot">
          {TOPIC_MAP[m.topic] ? <DomainTagByTopic id={m.topic} label={TOPIC_MAP[m.topic].label} /> : null}
          <span className="memcard-open">
            Open <Icon name="arrow" />
          </span>
        </div>
      </div>
    )
  }

  return (
    <section className={`module${team ? ' mem-team' : ''}`} id={team ? `memory-${role}` : 'memory'}>
      {base.length === 0 ? (
        <>
          <div className="mem-empty">
            <p>
              No decisions, threads or docs recorded by the <b>{team ? team.label : 'Circle'}</b> team yet.
            </p>
            <span className="mono">Memory fills as this team votes, ships and documents on-chain.</span>
          </div>
        </>
      ) : (
        <>

          <div className="mem-filters">
            {KINDS.map((k) => (
              <button
                key={k}
                className={`mem-fil${kind === k ? ' active' : ''}`}
                style={k === 'all' ? undefined : { ['--fc' as string]: KIND_HUE[k] }}
                onClick={() => setKind(k)}
              >
                {k === 'all' ? (
                  'All'
                ) : (
                  <>
                    <span className="topic-ms material-symbols-outlined" aria-hidden="true">
                      {KIND_GLYPH[k]}
                    </span>{' '}
                    {MEMORY_KIND[k].label + 's'}
                  </>
                )}
              </button>
            ))}
            <button className="btn btn--quiet btn--sm mem-viewall" onClick={() => setShowAll(true)}>
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

          {openMem ? (
            <div className="skmodal" role="dialog" aria-modal="true" onClick={() => setOpenMem(null)}>
              <div className="skmodal-card skmodal-card--mv" onClick={(e) => e.stopPropagation()}>
                <MemoryView mem={openMem} onClose={() => setOpenMem(null)} />
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
