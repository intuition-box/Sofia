/**
 * Essential — the team's knowledge home (imported from the Claude Design
 * `Essential.dc.html`). A search-first landing: ask a question or paste a link,
 * then the team's essential tools, most-discussed links, and core members.
 * Rebuilt on the Sofia design-system tokens (no Claude-Design hex), no emoji
 * (favicons + hairline icons + initials avatars), to sit under the app's nav.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { TopicIcon } from '../components/TopicIcon'
import { DeptTagByName, DomainTag, DomainTagByTopic, RoleTag, SkillTag } from '../components/Tag'
import { topicHue, deptHue, type TagHueName } from '../data/tagStyles'

/* Cycle Nordic hues across the taxonomy topics so each reads distinctly. */
const DOMAIN_CYCLE: TagHueName[] = ['teal', 'indigo', 'violet', 'amber', 'pink', 'orange']
import { CATEGORIES } from '../data/topics'
import { avGrad, initials } from '../data/helpers'

interface Tool {
  name: string
  host: string
  desc: string
  roles: string[]
  bm: number
}
const TOOLS: Tool[] = [
  { name: 'Notion HQ', host: 'notion.so', desc: "The team's shared knowledge base & docs.", roles: ['Writer', 'PM'], bm: 28 },
  { name: 'Figma', host: 'figma.com', desc: 'Design system & product mockups.', roles: ['Designer'], bm: 19 },
  { name: 'Linear', host: 'linear.app', desc: 'Sprint tracking & dev roadmap.', roles: ['PM', 'Dev'], bm: 15 },
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
  { name: 'Tom Bauer', role: 'Lead Protocol Engineer', grad: 5, topics: ['Solidity', 'EVM'], shares: 37, nTopics: 6 },
  { name: 'Inès Roy', role: 'Product Designer', grad: 2, topics: ['Design system', 'Figma'], shares: 29, nTopics: 5 },
  { name: 'Marc Petit', role: 'Head of Sales', grad: 3, topics: ['BD', 'Pricing'], shares: 24, nTopics: 4 },
  { name: 'Sofia Rossi', role: 'Data Analyst', grad: 1, topics: ['Dune', 'Funnels'], shares: 31, nTopics: 7 },
  { name: 'Yuki Sato', role: 'Frontend Engineer', grad: 4, topics: ['React', 'wagmi'], shares: 26, nTopics: 5 },
  { name: 'Noah Klein', role: 'Smart Contract Engineer', grad: 5, topics: ['Foundry', 'Audits'], shares: 33, nTopics: 6 },
  { name: 'Aria Khan', role: 'Community Lead', grad: 2, topics: ['Discord', 'Ambassadors'], shares: 45, nTopics: 9 },
  { name: 'Diego Alvarez', role: 'Growth Marketer', grad: 0, topics: ['SEO', 'Lifecycle'], shares: 19, nTopics: 4 },
  { name: 'Mei Lin', role: 'Product Manager', grad: 3, topics: ['Roadmap', 'Discovery'], shares: 28, nTopics: 6 },
  { name: 'Omar Haddad', role: 'Security Researcher', grad: 5, topics: ['Security', 'Fuzzing'], shares: 22, nTopics: 5 },
  { name: 'Clara Mendez', role: 'Brand Designer', grad: 1, topics: ['Brand', 'Motion'], shares: 17, nTopics: 3 },
  { name: 'Felix Wagner', role: 'Backend Engineer', grad: 4, topics: ['Indexers', 'GraphQL'], shares: 30, nTopics: 6 },
  { name: 'Nadia Aziz', role: 'UX Researcher', grad: 2, topics: ['Research', 'Flows'], shares: 21, nTopics: 4 },
  { name: 'Leo Santos', role: 'Developer Relations', grad: 0, topics: ['Docs', 'SDK'], shares: 36, nTopics: 7 },
  { name: 'Priya Nair', role: 'Ops Lead', grad: 3, topics: ['Finance', 'Legal'], shares: 14, nTopics: 3 },
  { name: 'Hugo Lefebvre', role: 'Protocol Researcher', grad: 5, topics: ['Mechanism', 'Tokenomics'], shares: 27, nTopics: 6 },
  { name: 'Sara Cohen', role: 'Content Lead', grad: 1, topics: ['Editorial', 'Newsletter'], shares: 23, nTopics: 5 },
  { name: 'Kenji Mori', role: 'Infra Engineer', grad: 4, topics: ['Infra', 'CI/CD'], shares: 18, nTopics: 4 },
  { name: 'Emma Dubois', role: 'Partnerships', grad: 2, topics: ['BD', 'Ecosystem'], shares: 20, nTopics: 4 },
  { name: 'Ravi Patel', role: 'Full-stack Engineer', grad: 5, topics: ['Next.js', 'viem'], shares: 25, nTopics: 5 },
  { name: 'Hana Park', role: 'Motion Designer', grad: 1, topics: ['Motion', 'Framer'], shares: 16, nTopics: 3 },
  { name: 'Adam Novak', role: 'Growth Lead', grad: 0, topics: ['Growth', 'Analytics'], shares: 34, nTopics: 7 },
  { name: 'Lucas Silva', role: 'Solutions Engineer', grad: 4, topics: ['Integrations', 'API'], shares: 22, nTopics: 5 },
  { name: 'Zoe Martin', role: 'People Ops', grad: 3, topics: ['Hiring', 'Culture'], shares: 13, nTopics: 3 },
]

const PILLS = [
  { label: 'Growth', kind: 'domain' },
  { label: 'AI tooling', kind: 'domain' },
  { label: 'Design', kind: 'domain' },
  { label: 'Funding', kind: 'skill' },
  { label: 'Security', kind: 'skill' },
  { label: 'Research', kind: 'skill' },
] as const

const TOPICS = CATEGORIES.slice(0, 8).map((c, i) => ({
  id: c.id,
  label: c.label,
  color: c.color,
  count: 6 + ((i * 7 + 3) % 22),
}))

const SKILLS_USED = [
  { label: 'Funding', dept: 'Marketing', role: 'Writer' },
  { label: 'Security', dept: 'Engineering', role: 'Dev' },
  { label: 'AI', dept: 'Design', role: 'Designer' },
  { label: 'Governance', dept: 'Sales', role: 'PM' },
  { label: 'Brand', dept: 'Marketing', role: 'Designer' },
  { label: 'Research', dept: 'Product', role: 'Writer' },
]

const TEAMS = [
  { name: 'Engineering', color: '#3b82f6', members: 8, lead: 'Tom Bauer', focus: 'Protocol, frontend & infra' },
  { name: 'Design', color: '#ec4899', members: 4, lead: 'Inès Roy', focus: 'Product & brand design' },
  { name: 'Marketing', color: '#8b5cf6', members: 5, lead: 'Lina Moreau', focus: 'Growth, content & community' },
  { name: 'Sales / BD', color: '#22c55e', members: 3, lead: 'Marc Petit', focus: 'Pipeline & partnerships' },
  { name: 'Product', color: '#f59e0b', members: 3, lead: 'Mei Lin', focus: 'Roadmap & discovery' },
  { name: 'Research', color: '#06b6d4', members: 2, lead: 'Hugo Lefebvre', focus: 'Mechanism & tokenomics' },
]

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

function SectionHead({ title, action, onAction }: { title: string; action: string; onAction?: () => void }) {
  return (
    <div className="es-sec-head">
      <h2 className="es-sec-title">{title}</h2>
      <button className="es-sec-all" onClick={onAction}>
        {action} →
      </button>
    </div>
  )
}

function MemberCard({ m }: { m: Member }) {
  return (
    <div className="es-member">
      <span className="es-member-av" style={{ background: avGrad(m.grad) }}>
        {initials(m.name)}
      </span>
      <div className="es-member-name">{m.name}</div>
      <div className="es-member-role">{m.role}</div>
      <div className="es-member-tags">
        {m.topics.map((t) => (
          <span className="es-member-tag mono" key={t}>
            #{t}
          </span>
        ))}
      </div>
      <div className="es-member-stats mono">
        {m.shares} shares · {m.nTopics} topics
      </div>
    </div>
  )
}

export function Essential() {
  const [showAllMembers, setShowAllMembers] = useState(false)
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

        {/* Filter pills — domain + skill tags (each family reads distinctly) */}
        <div className="es-pills">
          {PILLS.map((p) =>
            p.kind === 'skill' ? (
              <SkillTag key={p.label} label={p.label} hue={topicHue(p.label)} />
            ) : (
              <DomainTagByTopic key={p.label} id={p.label} label={p.label} />
            ),
          )}
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
                  {t.roles.map((r) => (
                    <RoleTag key={r} label={r} hue={deptHue(r)} />
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Topics */}
        <section className="es-section">
          <SectionHead title="Collections" action="See all" />
          <div className="es-topics">
            {TOPICS.map((t, i) => (
              <DomainTag
                key={t.id}
                label={t.label}
                hue={DOMAIN_CYCLE[i % DOMAIN_CYCLE.length]}
                count={t.count}
                icon={<TopicIcon id={t.id} size={13} />}
              />
            ))}
          </div>
        </section>

        {/* Most used skills — skill + the dept & role that lean on it */}
        <section className="es-section">
          <SectionHead title="Most used skills" action="See all" />
          <div className="es-skills">
            {SKILLS_USED.map((s) => (
              <div className="es-skill-row" key={s.label}>
                <SkillTag label={s.label} hue={topicHue(s.label)} />
                <span className="es-skill-by">
                  <DeptTagByName name={s.dept} />
                  <RoleTag label={s.role} hue={deptHue(s.role)} />
                </span>
              </div>
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

        {/* Teams */}
        <section className="es-section">
          <SectionHead title="Teams" action="See all" />
          <div className="es-grid-3">
            {TEAMS.map((t) => (
              <a className="es-team" key={t.name} style={{ ['--c' as string]: t.color }}>
                <div className="es-team-top">
                  <span className="es-team-name">{t.name}</span>
                  <span className="es-team-n mono">{t.members}</span>
                </div>
                <div className="es-team-focus">{t.focus}</div>
                <div className="es-team-lead mono">Lead · {t.lead}</div>
              </a>
            ))}
          </div>
        </section>

        {/* Core team members */}
        <section className="es-section es-section--last">
          <SectionHead title="Core team members" action="See all" onAction={() => setShowAllMembers(true)} />
          <div className="es-grid-3">
            {MEMBERS.slice(0, 6).map((m) => (
              <MemberCard m={m} key={m.name} />
            ))}
          </div>
        </section>
      </div>

      {showAllMembers ? (
        <div className="skmodal" role="dialog" aria-modal="true" onClick={() => setShowAllMembers(false)}>
          <div className="skmodal-card skmodal-card--skv" onClick={(e) => e.stopPropagation()}>
            <div className="va">
              <header className="va-head">
                <h2 className="va-title">Core team members</h2>
                <button className="skv-icon" aria-label="Close" onClick={() => setShowAllMembers(false)}>
                  <Icon name="close" />
                </button>
              </header>
              <div className="va-body sk-scroll">
                <div className="es-grid-3">
                  {MEMBERS.map((m) => (
                    <MemberCard m={m} key={m.name} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
