/**
 * Roles & domains — functional roles (what people DO) ≠ topics (what they
 * KNOW). Role overview grid, then a contributor roster for the picked role,
 * each card with endorsable role/skill/tool chips. Ported from
 * `circle-pro2/Roles.jsx`.
 */
import { useState } from 'react'
import { Avatar } from '../components/primitives'
import { GateBtn, Locked, requireJoin } from '../lib/gate'
import { ModuleHead } from '../components/primitives'
import { avGrad, dualScore, fmt, initials, topDomains } from '../data/helpers'
import { ROLE_MAP, ROLES, TOPIC_MAP, peopleByRole, personTools, roleCount } from '../data/mock'
import type { Person, RoleId } from '../data/types'

interface EndorseChipProps {
  label: string
  color: string
  glyph?: string
  seed: number
  reason: string
  dot?: boolean
}

function EndorseChip({ label, color, glyph, seed, reason, dot }: EndorseChipProps) {
  const [on, setOn] = useState(false)
  const [n, setN] = useState(seed)
  const toggle = () =>
    requireJoin(reason, () =>
      setOn((v) => {
        setN((c) => c + (v ? -1 : 1))
        return !v
      }),
    )
  return (
    <span className={`endo${on ? ' on' : ''}`} style={{ ['--c' as string]: color }}>
      {dot ? <span className="endo-dot" /> : null}
      {glyph ? <span className="endo-g">{glyph}</span> : null}
      <span className="endo-label">{label}</span>
      <button className="endo-btn" onClick={toggle} title={on ? 'Remove endorsement' : 'Endorse'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 15 6-6 6 6" />
        </svg>
        <span className="endo-n tnum">{n}</span>
      </button>
    </span>
  )
}

const SOCIALS = ['discord', 'github', 'x'] as const

function ContributorCard({ p }: { p: Person }) {
  const topics = topDomains(p, 3, p.extra ? 10 : 40)
  const tools = personTools(p).slice(0, 3)
  const s = dualScore(p)
  return (
    <div className={`ccard${p.extra ? ' ccard-discover' : ''}`}>
      <div className={`cc-stat${s.influence > s.trust ? ' cc-stat-infl' : ''}`}>
        <div className="cc-statblock">
          <span className="cc-trust tnum">{s.trust}</span>
          <span className="cc-stat-k">Trust</span>
        </div>
        <div className="cc-statdiv" />
        <div className="cc-statblock">
          <span className="cc-infl tnum">{s.influence}</span>
          <span className="cc-stat-k">Influence</span>
        </div>
        <div className="cc-statfoot">
          <GateBtn className="btn btn-sm cc-trustbtn" reason={`trust ${p.handle}`}>
            Trust
          </GateBtn>
          <span className="cc-contrib mono">{fmt(p.contributions)} contributions</span>
        </div>
      </div>

      <div className="cc-body">
        <header className="cc-head">
          <Avatar m={{ handle: p.handle, grad: p.grad }} size={40} />
          <div className="cc-id">
            <div className="cc-h">
              <span className="cc-name">{p.handle}</span>
              {p.core ? (
                <span className="core-badge">Core</span>
              ) : (
                <span className="member-badge" title="Member · outside the core team">
                  Member
                </span>
              )}
            </div>
            <div className="ccard-social">
              {SOCIALS.map((sc) => (
                <span key={sc} className="csoc-dot" title={sc} />
              ))}
            </div>
          </div>
        </header>

        {p.headline ? <p className="cc-headline">{p.headline}</p> : null}

        <dl className="cc-attrs">
          <div className="cc-attr">
            <dt>Roles</dt>
            <dd>
              {p.roles.map((r) => (
                <EndorseChip
                  key={r}
                  label={ROLE_MAP[r].label}
                  color={ROLE_MAP[r].color}
                  seed={Math.round(p.roleScore / 12) + 2}
                  reason={`endorse ${p.handle} as ${ROLE_MAP[r].label}`}
                  dot
                />
              ))}
            </dd>
          </div>
          <div className="cc-attr">
            <dt>Skills</dt>
            <dd>
              {topics.length ? (
                topics.map((t) => {
                  const th = TOPIC_MAP[t.id]
                  return (
                    <EndorseChip
                      key={t.id}
                      label={th.label}
                      color={th.color}
                      seed={Math.round((t.level || 30) / 6) + 3}
                      reason={`endorse ${p.handle} for ${th.label}`}
                    />
                  )
                })
              ) : (
                <span className="ccard-empty">—</span>
              )}
            </dd>
          </div>
          <div className="cc-attr">
            <dt>Tools</dt>
            <dd>
              {tools.length ? (
                tools.map((x) => (
                  <EndorseChip
                    key={x.t}
                    label={x.meta.label}
                    glyph={x.meta.glyph}
                    color={x.meta.color}
                    seed={Math.max(2, Math.round(x.intensity * 9))}
                    reason={`endorse ${p.handle}'s use of ${x.meta.label}`}
                  />
                ))
              ) : (
                <span className="ccard-empty">opt-in</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export function Roles() {
  const [role, setRole] = useState<RoleId>('design')
  const roster = peopleByRole(role)
  const r = ROLE_MAP[role]
  return (
    <section className="module" id="roles">
      <ModuleHead title="Roles & domains" />

      <div className="role-grid">
        {ROLES.map((rr) => {
          const n = roleCount(rr.id)
          const top = peopleByRole(rr.id).slice(0, 4)
          return (
            <button
              key={rr.id}
              className={`role-tile${role === rr.id ? ' active' : ''}`}
              style={{ ['--c' as string]: rr.color }}
              onClick={() => setRole(rr.id)}
            >
              <div className="role-tile-head">
                <span className="role-tile-dot" />
                <span className="role-tile-label">{rr.label}</span>
                <span className="role-tile-n tnum">{n}</span>
              </div>
              <p className="role-tile-blurb">{rr.blurb}</p>
              <div className="role-tile-avs">
                {top.map((p, j) => (
                  <span
                    key={p.handle}
                    className="role-av"
                    style={{ background: avGrad(p.grad), zIndex: 9 - j }}
                    title={p.handle}
                  >
                    {initials(p.handle)}
                  </span>
                ))}
                {n > 4 ? <span className="role-av role-av-more">+{n - 4}</span> : null}
              </div>
            </button>
          )
        })}
      </div>

      <div className="role-roster">
        <div className="role-roster-head">
          <span className="rolepill active" style={{ ['--c' as string]: r.color }}>
            <span className="rolepill-dot" />
            {r.label}
          </span>
          <span className="role-roster-sub mono">{roster.length} contributors · sorted by role score</span>
        </div>
        <Locked label={`the full ${r.label} roster`} reason={`see all ${r.label} contributors`} minH={260}>
          <div className="ccard-grid">
            {roster.map((p) => (
              <ContributorCard key={p.handle} p={p} />
            ))}
          </div>
        </Locked>
      </div>
    </section>
  )
}
