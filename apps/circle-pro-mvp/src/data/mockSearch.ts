/**
 * Mock knowledge sources for search — tools, team memory, and skills. These
 * surfaces don't have a backend yet, so the search results page filters these
 * curated arrays client-side to show the full "search everything" vision
 * alongside the real bookmarks/comments/people. Clearly labelled "soon" in the UI.
 */
export interface MockHit {
  id: string
  title: string
  sub: string
  host?: string
  color?: string
}

const TOOLS: MockHit[] = [
  { id: 't1', title: 'Notion HQ', sub: "Team's shared knowledge base & docs", host: 'notion.so' },
  { id: 't2', title: 'Figma', sub: 'Design system & product mockups', host: 'figma.com' },
  { id: 't3', title: 'Linear', sub: 'Sprint tracking & dev roadmap', host: 'linear.app' },
  { id: 't4', title: 'Dune', sub: 'On-chain analytics dashboards', host: 'dune.com' },
  { id: 't5', title: 'GitHub', sub: 'Code, reviews & open source', host: 'github.com' },
  { id: 't6', title: 'Foundry', sub: 'Smart-contract testing & fuzzing', host: 'getfoundry.sh' },
]

const MEMORY: MockHit[] = [
  { id: 'm1', title: 'Async-first communication decision', sub: 'Decision · we replaced daily syncs with written updates', color: '#8b5cf6' },
  { id: 'm2', title: 'Architecture decision records — v2', sub: 'Doc · how we structure protocol changes', color: '#3b82f6' },
  { id: 'm3', title: 'Pricing model for 2026', sub: 'Thread · usage-based tiers, decided in Q1', color: '#22c55e' },
  { id: 'm4', title: 'Security review process', sub: 'Decision · external audit before every mainnet deploy', color: '#e87c7c' },
]

const SKILLS: MockHit[] = [
  { id: 's1', title: 'Smart-contract security', sub: '5 members · Foundry, Slither, audits', color: '#e87c7c' },
  { id: 's2', title: 'Growth & lifecycle', sub: '4 members · SEO, funnels, retention', color: '#e4b95a' },
  { id: 's3', title: 'Design systems', sub: '3 members · Figma, tokens, motion', color: '#d98cb3' },
  { id: 's4', title: 'Tokenomics & mechanism design', sub: '2 members · incentives, modelling', color: '#a78bdb' },
]

function match(items: MockHit[], q: string): MockHit[] {
  // Tokenise like the backend so a multi-word hint ("AI / Machine Learning")
  // matches on ANY word — clicking a hint stays a superset of typing one word.
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2)
  const terms = tokens.length ? tokens : [q.toLowerCase()]
  return items.filter((i) => {
    const hay = `${i.title} ${i.sub}`.toLowerCase()
    return terms.some((t) => hay.includes(t))
  })
}

export function searchMock(q: string) {
  return {
    tools: match(TOOLS, q),
    memory: match(MEMORY, q),
    skills: match(SKILLS, q),
  }
}
