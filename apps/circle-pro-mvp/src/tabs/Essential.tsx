/**
 * Essential — the team's knowledge home (imported from the Claude Design
 * `Essential.dc.html`). A search-first landing: ask a question or paste a link,
 * then the team's essential tools, most-discussed links, and core members.
 * Rebuilt on the Sofia design-system tokens (no Claude-Design hex), no emoji
 * (favicons + hairline icons + initials avatars), to sit under the app's nav.
 */
import { Icon } from '../components/Icon'
import { TopicIcon } from '../components/TopicIcon'
import { CATEGORIES } from '../data/topics'
import { avGrad, initials } from '../data/helpers'

interface Tool {
  name: string
  host: string
  desc: string
  team: string
  color: string
  bm: number
}
const TOOLS: Tool[] = [
  { name: 'Notion HQ', host: 'notion.so', desc: "The team's shared knowledge base & docs.", team: 'Marketing', color: '#3b82f6', bm: 28 },
  { name: 'Figma', host: 'figma.com', desc: 'Design system & product mockups.', team: 'Development', color: '#8b5cf6', bm: 19 },
  { name: 'Linear', host: 'linear.app', desc: 'Sprint tracking & dev roadmap.', team: 'Development', color: '#8b5cf6', bm: 15 },
]

interface Commented {
  rank: number
  title: string
  source: string
  who: string
  team: string
  color: string
  comments: number
}
const COMMENTED: Commented[] = [
  { rank: 1, title: "Notion's async-first guide", source: 'notion.so', who: 'Lina', team: 'Marketing', color: '#3b82f6', comments: 24 },
  { rank: 2, title: 'Architecture decision records — v2', source: 'Document', who: 'Tom', team: 'Development', color: '#8b5cf6', comments: 17 },
  { rank: 3, title: 'SaaS pricing models 2026', source: 'openview.com', who: 'Marc', team: 'Marketing', color: '#3b82f6', comments: 12 },
]

interface Member {
  name: string
  role: string
  grad: number
  topics: string[]
  shares: number
  nTopics: number
}
const MEMBERS: Member[] = [
  { name: 'Lina Moreau', role: 'Head of Marketing', grad: 0, topics: ['Growth', 'Brand'], shares: 42, nTopics: 8 },
  { name: 'Tom Bauer', role: 'Lead Engineer', grad: 5, topics: ['Infra', 'AI'], shares: 37, nTopics: 6 },
  { name: 'Inès Roy', role: 'Product Designer', grad: 2, topics: ['DS', 'Figma'], shares: 29, nTopics: 5 },
]

const PILLS = [
  { label: 'Marketing', color: '#3b82f6' },
  { label: 'Development', color: '#8b5cf6' },
  { label: 'Growth' },
  { label: 'AI tooling' },
  { label: 'Design' },
] as const

const TOPICS = CATEGORIES.slice(0, 8).map((c, i) => ({
  id: c.id,
  label: c.label,
  color: c.color,
  count: 6 + ((i * 7 + 3) % 22),
}))

function Favicon({ host }: { host: string }) {
  return (
    <span className="es-fav">
      <img
        src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
        alt=""
        loading="lazy"
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
        }}
      />
    </span>
  )
}

function SectionHead({ title, action }: { title: string; action: string }) {
  return (
    <div className="es-sec-head">
      <h2 className="es-sec-title">{title}</h2>
      <button className="es-sec-all">{action} →</button>
    </div>
  )
}

export function Essential() {
  return (
    <div className="es-content">
      <div className="es-wrap">
        {/* Hero */}
        <header className="es-hero">
          <h1 className="es-h1">What do you want to know?</h1>
          <p className="es-lede">Your team's knowledge, one search away.</p>
        </header>

        {/* Search engine */}
        <div className="es-search">
          <div className="es-search-row">
            <Icon name="search" />
            <span className="es-search-ph">Ask a question, or paste a link to share…</span>
            <span className="es-kbd mono">⌘K</span>
          </div>
          <div className="es-search-foot">
            <button className="es-search-ic" aria-label="Add"><Icon name="plus" /></button>
            <button className="es-search-ic mono" aria-label="Topic">#</button>
            <button className="es-search-ic mono" aria-label="Mention">@</button>
            <button className="es-search-go">Search</button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="es-pills">
          {PILLS.map((p) => (
            <button className="es-pill" key={p.label}>
              {'color' in p && p.color ? (
                <span className="es-pill-dot" style={{ background: p.color }} />
              ) : (
                <span className="es-pill-hash mono">#</span>
              )}
              {p.label}
            </button>
          ))}
        </div>

        {/* Essential tools */}
        <section className="es-section">
          <SectionHead title="Most used tools" action="See all" />
          <div className="es-grid-3">
            {TOOLS.map((t) => (
              <a className="es-tool" key={t.name}>
                <div className="es-tool-top">
                  <Favicon host={t.host} />
                  <div className="es-tool-id">
                    <div className="es-tool-name">{t.name}</div>
                  </div>
                </div>
                <div className="es-tool-desc">{t.desc}</div>
                <div className="es-tool-foot">
                  <span className="es-team-tag" style={{ ['--c' as string]: t.color }}>{t.team}</span>
                  <span className="es-tool-bm">
                    <Icon name="bookmark" /> {t.bm}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Topics */}
        <section className="es-section">
          <SectionHead title="Topics" action="See all" />
          <div className="es-topics">
            {TOPICS.map((t) => (
              <a className="es-topic" key={t.id} style={{ ['--c' as string]: t.color }}>
                <span className="es-topic-ic">
                  <TopicIcon id={t.id} size={18} />
                </span>
                <span className="es-topic-name">{t.label}</span>
                <span className="es-topic-n mono">{t.count}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Most commented */}
        <section className="es-section">
          <SectionHead title="Most commented" action="See all" />
          <div className="es-ranked">
            {COMMENTED.map((c) => (
              <a className="es-rank-row" key={c.rank}>
                <Favicon host={c.source.includes('.') ? c.source : 'notion.so'} />
                <div className="es-rank-id">
                  <div className="es-rank-title">{c.title}</div>
                  <div className="es-rank-meta mono">shared by {c.who}</div>
                </div>
                <span className="es-rank-comments">
                  <Icon name="thumbup" /> {c.comments}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Core team members */}
        <section className="es-section es-section--last">
          <SectionHead title="Core team members" action="See the team" />
          <div className="es-grid-3">
            {MEMBERS.map((m) => (
              <div className="es-member" key={m.name}>
                <span className="es-member-av" style={{ background: avGrad(m.grad) }}>
                  {initials(m.name)}
                </span>
                <div className="es-member-name">{m.name}</div>
                <div className="es-member-role">{m.role}</div>
                <div className="es-member-tags">
                  {m.topics.map((t) => (
                    <span className="es-member-tag mono" key={t}>#{t}</span>
                  ))}
                </div>
                <div className="es-member-stats mono">
                  {m.shares} shares · {m.nTopics} topics
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
