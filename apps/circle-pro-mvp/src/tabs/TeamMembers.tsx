/**
 * TeamMembers — the "Members" tab of a team. Per-member cards with a Trust /
 * Influence rail and votable Roles / Skills / Tools chips, ported from the
 * Claude Design "Circle Pro v2" member cards onto the app's .ccard styles.
 */
import { useState } from 'react'
import { Avatar } from '../components/primitives'

interface Chip {
  label: string
  color: string
  n: number
  glyph?: string
}

interface MemberV2 {
  handle: string
  grad: number
  trust: number
  influence: number
  contributions: number
  headline?: string
  roles: Chip[]
  skills: Chip[]
  tools: Chip[]
}

const SOCIALS = ['discord.com', 'github.com', 'x.com']

const MEMBERS_V2: MemberV2[] = [
  {
    handle: 'remy.design',
    grad: 2,
    trust: 86,
    influence: 59,
    contributions: 142,
    headline: 'Design systems & brand for grant programs',
    roles: [{ label: 'Design', color: '#ec4899', n: 9 }],
    skills: [
      { label: 'Funding', color: '#22c55e', n: 10 },
      { label: 'Governance', color: '#f59e0b', n: 7 },
    ],
    tools: [
      { label: 'Figma', color: '#ec4899', glyph: 'F', n: 9 },
      { label: 'Framer', color: '#06b6d4', glyph: '▲', n: 5 },
      { label: 'Notion', color: '#e5e2f5', glyph: 'N', n: 4 },
    ],
  },
  {
    handle: 'bytewitch',
    grad: 4,
    trust: 74,
    influence: 44,
    contributions: 73,
    roles: [
      { label: 'Dev', color: '#3b82f6', n: 8 },
      { label: 'Design', color: '#ec4899', n: 8 },
    ],
    skills: [
      { label: 'Dev Tooling', color: '#3b82f6', n: 17 },
      { label: 'Security', color: '#ef4444', n: 13 },
      { label: 'AI', color: '#8b5cf6', n: 11 },
    ],
    tools: [
      { label: 'VS Code', color: '#3b82f6', glyph: '{}', n: 9 },
      { label: 'GitHub', color: '#8b5cf6', glyph: '⎇', n: 8 },
      { label: 'Foundry', color: '#ff5722', glyph: '⚒', n: 5 },
    ],
  },
  {
    handle: 'nadia.eth',
    grad: 0,
    trust: 69,
    influence: 37,
    contributions: 62,
    roles: [
      { label: 'Design', color: '#ec4899', n: 8 },
      { label: 'Writer', color: '#06b6d4', n: 8 },
    ],
    skills: [
      { label: 'AI', color: '#8b5cf6', n: 17 },
      { label: 'Funding', color: '#22c55e', n: 11 },
    ],
    tools: [
      { label: 'Figma', color: '#ec4899', glyph: 'F', n: 6 },
      { label: 'Obsidian', color: '#a78bdb', glyph: '◆', n: 4 },
    ],
  },
  {
    handle: 'ria.ux',
    grad: 1,
    trust: 68,
    influence: 46,
    contributions: 88,
    headline: 'UX research & flows for the grants stack',
    roles: [
      { label: 'Design', color: '#ec4899', n: 8 },
      { label: 'Writer', color: '#06b6d4', n: 8 },
    ],
    skills: [{ label: 'Funding', color: '#22c55e', n: 9 }],
    tools: [
      { label: 'Figma', color: '#ec4899', glyph: 'F', n: 8 },
      { label: 'Obsidian', color: '#a78bdb', glyph: '◆', n: 5 },
    ],
  },
]

/* Votable Role / Skill / Tool chip (▲ count), local-state toggle. */
const TOOL_HOSTS: Record<string, string> = {
  Figma: 'figma.com',
  Framer: 'framer.com',
  Notion: 'notion.so',
  'VS Code': 'code.visualstudio.com',
  GitHub: 'github.com',
  Foundry: 'getfoundry.sh',
  Obsidian: 'obsidian.md',
}

function Endo({ c }: { c: Chip }) {
  const [on, setOn] = useState(false)
  const host = c.glyph ? TOOL_HOSTS[c.label] : undefined
  return (
    <button
      type="button"
      className={`endo${on ? ' on' : ''}`}
      style={{ ['--c' as string]: c.color }}
      onClick={() => setOn((v) => !v)}
    >
      {host ? (
        <img
          className="endo-fav"
          src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
          alt=""
          loading="lazy"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
          }}
        />
      ) : c.glyph ? (
        <b className="endo-glyph">{c.glyph}</b>
      ) : (
        <span className="endo-dot" />
      )}
      {c.label}
      <span className="endo-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 15 6-6 6 6" />
        </svg>
        {c.n + (on ? 1 : 0)}
      </span>
    </button>
  )
}

export function TeamMembers() {
  return (
    <div className="ccard-grid tm-grid">
      {MEMBERS_V2.map((m) => (
        <div className="ccard" key={m.handle}>
          <div className="cc-body">
            <div className="cc-head">
              <Avatar m={{ handle: m.handle, grad: m.grad }} size={40} />
              <div className="cc-h-wrap">
                <div className="cc-h">
                  <span className="cc-name">{m.handle}</span>
                </div>
                <div className="ccard-social">
                  {SOCIALS.map((s) => (
                    <span className="csoc" key={s}>
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${s}&sz=32`}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                        }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>


            <dl className="cc-attrs">
              <div className="cc-attr">
                <dt>Roles</dt>
                <dd>{m.roles.map((c) => <Endo key={c.label} c={c} />)}</dd>
              </div>
              <div className="cc-attr">
                <dt>Skills</dt>
                <dd>{m.skills.map((c) => <Endo key={c.label} c={c} />)}</dd>
              </div>
              <div className="cc-attr">
                <dt>Tools</dt>
                <dd>{m.tools.map((c) => <Endo key={c.label} c={c} />)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ))}
    </div>
  )
}
