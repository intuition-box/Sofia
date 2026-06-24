/**
 * Essential — the team's knowledge home (imported from the Claude Design
 * `Essential.dc.html`). A search-first landing: ask a question or paste a link,
 * then the team's essential tools, most-discussed links, and core members.
 * Rebuilt on the Sofia design-system tokens (no Claude-Design hex), no emoji
 * (favicons + hairline icons + initials avatars), to sit under the app's nav.
 */
import { Icon } from '../components/Icon'
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
  { name: 'Notion HQ', host: 'notion.so', desc: "Base de connaissance & docs partagés de l'équipe.", team: 'Marketing', color: '#3b82f6', bm: 28 },
  { name: 'Figma', host: 'figma.com', desc: 'Design system & maquettes produit.', team: 'Development', color: '#8b5cf6', bm: 19 },
  { name: 'Linear', host: 'linear.app', desc: 'Suivi des sprints & roadmap dev.', team: 'Development', color: '#8b5cf6', bm: 15 },
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
  { rank: 1, title: 'Le guide async-first de Notion', source: 'notion.so', who: 'Lina', team: 'Marketing', color: '#3b82f6', comments: 24 },
  { rank: 2, title: 'Architecture decision records — v2', source: 'Document', who: 'Tom', team: 'Development', color: '#8b5cf6', comments: 17 },
  { rank: 3, title: 'Modèles de pricing SaaS 2026', source: 'openview.com', who: 'Marc', team: 'Marketing', color: '#3b82f6', comments: 12 },
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

function SectionHead({ title, sub, action }: { title: string; sub: string; action: string }) {
  return (
    <div className="es-sec-head">
      <div className="es-sec-titles">
        <h2 className="es-sec-title">{title}</h2>
        <span className="es-sec-sub">{sub}</span>
      </div>
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
          <div className="es-eyebrow mono">Intuition team · Essential</div>
          <h1 className="es-h1">Que cherches-tu à savoir ?</h1>
          <p className="es-lede">Le savoir de ton équipe, à portée de recherche.</p>
        </header>

        {/* Search engine */}
        <div className="es-search">
          <div className="es-search-row">
            <Icon name="search" />
            <span className="es-search-ph">Pose une question, ou colle un lien à partager…</span>
            <span className="es-kbd mono">⌘K</span>
          </div>
          <div className="es-search-foot">
            <button className="es-search-ic" aria-label="Add"><Icon name="plus" /></button>
            <button className="es-search-ic mono" aria-label="Topic">#</button>
            <button className="es-search-ic mono" aria-label="Mention">@</button>
            <button className="es-search-go">Rechercher</button>
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
          <SectionHead title="Essential tools" sub="Les indispensables de l'équipe" action="Tout voir" />
          <div className="es-grid-3">
            {TOOLS.map((t) => (
              <a className="es-tool" key={t.name}>
                <div className="es-tool-top">
                  <Favicon host={t.host} />
                  <div className="es-tool-id">
                    <div className="es-tool-name">{t.name}</div>
                    <div className="es-tool-host mono">{t.host}</div>
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

        {/* Most commented */}
        <section className="es-section">
          <SectionHead title="Most commented" sub="Ce qui fait parler l'équipe" action="Tout voir" />
          <div className="es-ranked">
            {COMMENTED.map((c) => (
              <a className="es-rank-row" key={c.rank}>
                <span className={`es-rank-n${c.rank === 1 ? ' top' : ''}`}>{c.rank}</span>
                <Favicon host={c.source.includes('.') ? c.source : 'notion.so'} />
                <div className="es-rank-id">
                  <div className="es-rank-title">{c.title}</div>
                  <div className="es-rank-meta mono">{c.source} · partagé par {c.who}</div>
                </div>
                <span className="es-team-tag" style={{ ['--c' as string]: c.color }}>{c.team}</span>
                <span className="es-rank-comments">
                  <Icon name="thumbup" /> {c.comments}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Core team members */}
        <section className="es-section es-section--last">
          <SectionHead title="Core team members" sub="Qui sait quoi" action="Voir l'équipe" />
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
                  {m.shares} partages · {m.nTopics} topics
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
