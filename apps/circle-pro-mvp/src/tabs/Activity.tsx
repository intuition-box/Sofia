/**
 * Activity — two lenses on what the Circle is doing:
 *  · Skills — demonstrated, peer-confirmed competencies
 *  · Tools  — opt-in stacks (frequency · intensity · recency)
 * Ported from `circle-pro2/ActivityPro.jsx`.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ModuleHead } from '../components/primitives'
import { Locked } from '../lib/gate'
import { avGrad, initials, parseRecency } from '../data/helpers'
import {
  PEOPLE,
  ROLE_MAP,
  SKILLS,
  TOOLS,
  TOPIC_MAP,
  personByHandle,
  skillEvidence,
} from '../data/mock'

type Lens = 'skills' | 'tools'

const LENSES: { id: Lens; label: string }[] = [
  { id: 'skills', label: 'Skills' },
  { id: 'tools', label: 'Tools' },
]

export function Activity() {
  const [lens, setLens] = useState<Lens>('skills')
  return (
    <section className="module" id="activity-pro">
      <ModuleHead title="Activity">
        <div className="lens-tabs">
          {LENSES.map((l) => (
            <button
              key={l.id}
              className={`lens-tab${lens === l.id ? ' active' : ''}`}
              onClick={() => setLens(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </ModuleHead>

      {lens === 'skills' ? <SkillsLens /> : null}
      {lens === 'tools' ? <ToolsLens /> : null}
    </section>
  )
}

function SkillsLens() {
  const max = Math.max(...SKILLS.map((s) => s.signals))
  return (
    <div className="skills-wrap">
      <p className="tools-note mono">
        A skill shows only when corroborated — peer-confirmed signals <b>and</b> the tools used to
        produce the work back it up.
      </p>
      <div className="skcard-grid">
        {SKILLS.map((s) => {
          const r = ROLE_MAP[s.role]
          const th = TOPIC_MAP[s.theme]
          const pct = Math.round((s.confirmed / s.signals) * 100)
          const ev = skillEvidence(s)
          return (
            <div className="skcard" key={s.skill} style={{ ['--c' as string]: r.color }}>
              <div className="skcard-head">
                <span className="sk-role" style={{ ['--c' as string]: r.color }}>
                  <i />
                  {r.label}
                </span>
                <span className="sk-trend mono">
                  {s.trend} <span className="sk-trend-k">30d</span>
                </span>
              </div>
              <span className="sk-name">{s.skill}</span>
              <div className="sk-who">
                {s.who.map((h) => {
                  const m = personByHandle(h)
                  return (
                    <span key={h} className="sk-av" style={{ background: avGrad(m?.grad ?? 0) }} title={h}>
                      {initials(h)}
                    </span>
                  )
                })}
                <span className="sk-who-h mono">{s.who.join(' · ')}</span>
              </div>
              <div className="skcard-bar">
                <div className="sk-bar">
                  <span
                    className="sk-bar-fill"
                    style={{ width: `${(s.confirmed / max) * 100}%`, background: r.color }}
                  />
                  <span
                    className="sk-bar-ghost"
                    style={{ width: `${(s.signals / max) * 100}%`, borderColor: r.color }}
                  />
                </div>
                <span className="sk-bar-lab mono">
                  <b className="tnum">{s.confirmed}</b>/{s.signals} confirmed · {pct}%
                </span>
              </div>
              <div className="skcard-proof">
                <span className="sk-proof-label mono">Proof</span>
                <span className="sk-ev sk-ev-sig">▣ {s.signals} signals</span>
                <span className="sk-ev sk-ev-conf"><Icon name="check" /> {s.confirmed} peer-confirmed</span>
                {th ? (
                  <span
                    className="sk-ev"
                    style={{
                      color: th.color,
                      background: `color-mix(in srgb, ${th.color} 13%, transparent)`,
                      borderColor: `color-mix(in srgb, ${th.color} 28%, transparent)`,
                    }}
                  >
                    #{th.label}
                  </span>
                ) : null}
                {ev.tools.map((t) => (
                  <span
                    key={t.t}
                    className="sk-ev-tool"
                    style={{ ['--c' as string]: t.meta.color }}
                    title={`${t.meta.label} · ${t.hrs}h/wk · last ${t.recLabel}`}
                  >
                    <b className="sk-ev-g">{t.meta.glyph}</b>
                    {t.meta.label} <span className="sk-ev-hrs mono">{t.hrs}h/wk</span>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ToolAgg {
  t: string
  meta: (typeof TOOLS)[string]
  hrs: number
  users: string[]
  maxInt: number
  rec: number
  recLabel: string
}

function ToolsLens() {
  const agg: Record<string, ToolAgg> = {}
  PEOPLE.forEach((p) =>
    (p.tools || []).forEach((x) => {
      if (!agg[x.t])
        agg[x.t] = { t: x.t, meta: TOOLS[x.t], hrs: 0, users: [], maxInt: 0, rec: 1e9, recLabel: x.last }
      agg[x.t].hrs += x.hrs
      agg[x.t].users.push(p.handle)
      agg[x.t].maxInt = Math.max(agg[x.t].maxInt, x.intensity)
      const r = parseRecency(x.last)
      if (r < agg[x.t].rec) {
        agg[x.t].rec = r
        agg[x.t].recLabel = x.last
      }
    }),
  )
  const rows = Object.values(agg).sort((a, b) => b.hrs - a.hrs)
  const maxHrs = Math.max(...rows.map((r) => r.hrs))
  const fresh = (r: ToolAgg) => r.rec <= 60
  return (
    <div className="tools-wrap">
      <p className="tools-note mono">
        Opt-in only · members chose to share their stack. Each tool shows <b>frequency</b> (h/wk),{' '}
        <b>intensity</b> of use, and <b>recency</b>.
      </p>
      <div className="toolcard-grid">
        {rows.map((r) => (
          <div className="toolcard" key={r.t} style={{ ['--c' as string]: r.meta.color }}>
            <div className="toolcard-head">
              <span className="toolcard-glyph">{r.meta.glyph}</span>
              <span className="toolcard-name">{r.meta.label}</span>
              <span className={`toolcard-rec mono${fresh(r) ? ' live' : ''}`}>
                {fresh(r) ? <i /> : null}
                {r.recLabel}
              </span>
            </div>
            <div className="toolcard-stats">
              <div className="tcs">
                <span className="tcs-v tnum">
                  {r.hrs}
                  <small>h/wk</small>
                </span>
                <span className="tcs-k">frequency</span>
              </div>
              <div className="tcs">
                <div className="tool-int big" title={`intensity ${Math.round(r.maxInt * 100)}%`}>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`ti${i < Math.round(r.maxInt * 4) ? ' on' : ''}`} />
                  ))}
                </div>
                <span className="tcs-k">intensity</span>
              </div>
              <div className="tcs">
                <span className="tcs-v tnum">{r.users.length}</span>
                <span className="tcs-k">{r.users.length === 1 ? 'user' : 'users'}</span>
              </div>
            </div>
            <div className="toolcard-bar">
              <span style={{ width: `${(r.hrs / maxHrs) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Locked label="per-member tool timelines" reason="see who uses what, and when" minH={64}>
        <div className="tool-detail-hint mono">
          Drill into any tool to see per-member usage timelines and handoffs.
        </div>
      </Locked>
    </div>
  )
}
