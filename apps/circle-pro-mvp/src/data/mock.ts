/**
 * Mocked data layer — the ONLY place the MVP invents anything.
 *
 * Ported from the design's `circle/data.jsx` + `circle-pro2/pro2-data.jsx` +
 * `onboarding/onboarding-data.jsx`, re-typed and reframed toward the bookmark
 * use case. Topic taxonomy is collapsed to 5 buckets at module load (the
 * design's `THEME_REMAP`) so every record stays coherent.
 *
 * To wire real data later: keep these exported names, back them with the
 * explorer's GraphQL hooks in a `repository.ts`, and delete this file.
 */
import { parseRecency } from './helpers'
import type {
  Bookmark,
  Circle,
  Context,
  Intent,
  IntentId,
  MemoryAsk,
  MemoryKind,
  MemoryRecord,
  Member,
  OnchainEvent,
  OnchainKind,
  Person,
  Role,
  RoleId,
  Skill,
  Tool,
  Topic,
  TopicId,
} from './types'

/* ── Topics (treemap cell size = mark intensity over 30d) ──────────────── */
export const TOPICS: Topic[] = [
  { id: 'funding', label: 'Funding', color: '#22c55e', signals: 120, members: 58, pioneers: 9, certs: 540 },
  { id: 'gov', label: 'Governance', color: '#8b5cf6', signals: 92, members: 46, pioneers: 7, certs: 438 },
  { id: 'sec', label: 'Security', color: '#ef4444', signals: 73, members: 28, pioneers: 5, certs: 260 },
  { id: 'ai', label: 'AI', color: '#ec4899', signals: 38, members: 22, pioneers: 4, certs: 129 },
  { id: 'devtool', label: 'Dev Tooling', color: '#ff5722', signals: 17, members: 11, pioneers: 2, certs: 52 },
]
export const TOPIC_MAP: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t]),
)

/** Old (8-bucket) taxonomy → the 5 we ship. */
const THEME_REMAP: Record<string, TopicId> = {
  pubgoods: 'funding',
  gov: 'gov',
  defi: 'funding',
  qf: 'funding',
  zk: 'sec',
  sec: 'sec',
  ai: 'ai',
  devtool: 'devtool',
}
const remapKey = (k: string): string => THEME_REMAP[k] ?? k

function collapseThemes(themes: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { funding: 0, gov: 0, sec: 0, ai: 0, devtool: 0 }
  for (const [k, v] of Object.entries(themes)) {
    const nk = remapKey(k)
    out[nk] = Math.max(out[nk] ?? 0, v)
  }
  return out
}

/* ── Members ──────────────────────────────────────────────────────────── */
interface RawMember extends Omit<Member, 'streak' | 'core'> {
  github?: boolean
}

const RAW_MEMBERS: RawMember[] = [
  { handle: 'sejal.eth', wallet: '0x9f...3aa1', grad: 0, coherence: 92, stake: 1840, peers: 31, raw: 47, score: 94, state: 'aligned', avail: 'active', pioneer30d: 9, avgLead: 6.4, themes: { pubgoods: 96, qf: 88, gov: 71, defi: 24, zk: 12, ai: 30, sec: 9, devtool: 18 }, pioneerThemes: ['pubgoods', 'qf'], timeline: [{ d: 'May 28', url: 'vitalik.eth/general/2026/05/qf-v3.html', lead: 8 }, { d: 'May 21', url: 'gov.gitcoin.co/t/gg23-retro', lead: 5 }, { d: 'May 14', url: 'ethresear.ch/t/quadratic-trust', lead: 6 }] },
  { handle: '0xmara', wallet: '0x41...c0de', grad: 1, coherence: 88, stake: 2210, peers: 27, raw: 39, score: 91, state: 'aligned', avail: 'active', pioneer30d: 7, avgLead: 5.3, themes: { zk: 95, sec: 78, defi: 52, gov: 28, pubgoods: 19, ai: 22, qf: 14, devtool: 31 }, pioneerThemes: ['zk', 'sec'], timeline: [{ d: 'May 30', url: 'eprint.iacr.org/2026/881', lead: 7 }, { d: 'May 19', url: 'zksecurity.xyz/blog/folding', lead: 4 }, { d: 'May 09', url: 'geometry.xyz/notebook/recursion', lead: 5 }] },
  { handle: 'pluriverse.eth', wallet: '0x77...9b2e', grad: 2, coherence: 85, stake: 1320, peers: 24, raw: 33, score: 88, state: 'aligned', avail: 'quiet', pioneer30d: 6, avgLead: 7.1, themes: { gov: 93, pubgoods: 74, qf: 61, ai: 33, defi: 17, zk: 10, sec: 12, devtool: 9 }, pioneerThemes: ['gov', 'pubgoods'], timeline: [{ d: 'May 27', url: 'gov.gitcoin.co/t/futarchy-trial', lead: 9 }, { d: 'May 17', url: 'vitalik.eth/general/daos.html', lead: 6 }, { d: 'May 06', url: 'metagov.org/research/coord', lead: 6 }] },
  { handle: 'lena-zk', wallet: '0x2c...7f10', grad: 3, coherence: 81, stake: 970, peers: 18, raw: 31, score: 83, state: 'aligned', avail: 'active', pioneer30d: 5, avgLead: 4.8, themes: { zk: 90, ai: 64, devtool: 55, sec: 41, defi: 22, pubgoods: 14, gov: 11, qf: 8 }, pioneerThemes: ['zk', 'ai'], timeline: [{ d: 'May 29', url: 'github.com/0xPARC/circom-ml', lead: 5 }, { d: 'May 18', url: 'ethresear.ch/t/zkml-bench', lead: 4 }, { d: 'May 08', url: 'lambdaclass.com/zk-prover', lead: 5 }] },
  { handle: 'grants-ana', wallet: '0xab...44d9', grad: 8, coherence: 79, stake: 1110, peers: 21, raw: 36, score: 81, state: 'aligned', avail: 'active', pioneer30d: 5, avgLead: 5.9, themes: { pubgoods: 82, qf: 79, gov: 58, ai: 24, defi: 19, devtool: 16, zk: 7, sec: 6 }, pioneerThemes: ['qf', 'pubgoods'], timeline: [{ d: 'May 26', url: 'gitcoin.co/blog/gg24-design', lead: 7 }, { d: 'May 15', url: 'allo.gitcoin.co/docs/strategies', lead: 5 }, { d: 'May 04', url: 'ethresear.ch/t/connection-qf', lead: 6 }] },
  { handle: '0xsalt', wallet: '0x6d...1e88', grad: 5, coherence: 76, stake: 1490, peers: 19, raw: 44, score: 79, state: 'aligned', avail: 'quiet', pioneer30d: 4, avgLead: 4.2, themes: { defi: 88, sec: 67, zk: 39, gov: 33, ai: 18, pubgoods: 12, qf: 9, devtool: 21 }, pioneerThemes: ['defi', 'sec'], timeline: [{ d: 'May 25', url: 'defillama.com/research/lst-risk', lead: 5 }, { d: 'May 13', url: 'blog.uniswap.org/v4-hooks', lead: 3 }, { d: 'May 02', url: 'rekt.news/post-mortem-flux', lead: 4 }] },
  { handle: 'bytewitch', wallet: '0xf2...05ac', grad: 14, github: true, coherence: 73, stake: 640, peers: 15, raw: 28, score: 74, state: 'active', avail: 'active', pioneer30d: 3, avgLead: 3.6, themes: { devtool: 86, zk: 58, ai: 47, sec: 44, defi: 26, gov: 9, pubgoods: 11, qf: 7 }, pioneerThemes: ['devtool', 'zk'], timeline: [{ d: 'May 24', url: 'github.com/foundry-rs/foundry', lead: 4 }, { d: 'May 11', url: 'viem.sh/docs/actions', lead: 3 }] },
  { handle: 'MKultra', wallet: '0x8a...d3f7', grad: 6, coherence: 70, stake: 880, peers: 14, raw: 41, score: 71, state: 'active', avail: 'active', pioneer30d: 3, avgLead: 4.4, themes: { gov: 72, pubgoods: 55, defi: 48, ai: 31, qf: 27, sec: 14, zk: 8, devtool: 12 }, pioneerThemes: ['gov', 'defi'], timeline: [{ d: 'May 23', url: 'gov.gitcoin.co/t/treasury-diversif', lead: 6 }, { d: 'May 10', url: 'snapshot.org/#/gitcoindao.eth', lead: 3 }] },
  { handle: 'nadia.eth', wallet: '0x33...8c2b', grad: 4, coherence: 68, stake: 720, peers: 12, raw: 26, score: 69, state: 'active', avail: 'quiet', pioneer30d: 2, avgLead: 5.1, themes: { ai: 84, pubgoods: 46, gov: 38, zk: 29, defi: 17, qf: 19, sec: 10, devtool: 22 }, pioneerThemes: ['ai', 'pubgoods'], timeline: [{ d: 'May 22', url: 'huggingface.co/blog/agents-onchain', lead: 6 }, { d: 'May 07', url: 'ethresear.ch/t/ai-prediction-mkts', lead: 4 }] },
  { handle: 'fvngbill.eth', wallet: '0xc9...6a40', grad: 12, github: true, coherence: 64, stake: 510, peers: 9, raw: 34, score: 64, state: 'active', avail: 'active', pioneer30d: 2, avgLead: 3.2, themes: { defi: 71, gov: 52, sec: 33, devtool: 28, ai: 21, pubgoods: 18, zk: 11, qf: 13 }, pioneerThemes: ['defi', 'gov'], timeline: [{ d: 'May 20', url: 'blog.aave.com/v4-architecture', lead: 4 }, { d: 'May 05', url: 'docs.morpho.org/concepts', lead: 2 }] },
  { handle: 'alessandro.eth', wallet: '0x15...b7e3', grad: 9, coherence: 61, stake: 430, peers: 8, raw: 38, score: 60, state: 'active', avail: 'quiet', pioneer30d: 1, avgLead: 2.9, themes: { defi: 68, qf: 41, gov: 31, pubgoods: 22, ai: 14, sec: 19, zk: 6, devtool: 9 }, pioneerThemes: ['defi'], timeline: [{ d: 'May 16', url: 'curve.fi/blog/crvusd-update', lead: 3 }] },
  { handle: 'zet.box', wallet: '0x70...2d51', grad: 10, coherence: 57, stake: 360, peers: 7, raw: 22, score: 56, state: 'active', avail: 'inactive', pioneer30d: 1, avgLead: 3.8, themes: { ai: 59, pubgoods: 44, gov: 27, defi: 23, zk: 12, qf: 16, sec: 7, devtool: 10 }, pioneerThemes: ['ai'], timeline: [{ d: 'May 12', url: 'mirror.xyz/ai-coordination', lead: 4 }] },
  { handle: '0xBilly.eth', wallet: '0xe7...91fb', grad: 13, coherence: 24, stake: 90, peers: 2, raw: 118, score: 31, state: 'low', avail: 'active', pioneer30d: 0, avgLead: 0.4, themes: { defi: 38, ai: 35, pubgoods: 31, gov: 29, zk: 27, sec: 24, qf: 22, devtool: 19 }, pioneerThemes: [], timeline: [] },
  { handle: 'wieedze.eth', wallet: '0x52...0fa6', grad: 16, coherence: 29, stake: 140, peers: 3, raw: 96, score: 34, state: 'low', avail: 'active', pioneer30d: 0, avgLead: 0.7, themes: { ai: 41, defi: 33, pubgoods: 28, gov: 22, qf: 24, zk: 18, sec: 15, devtool: 20 }, pioneerThemes: [], timeline: [] },
  { handle: 'Passive-records.box', wallet: '0xbd...7c33', grad: 11, coherence: 33, stake: 210, peers: 4, raw: 81, score: 38, state: 'low', avail: 'quiet', pioneer30d: 0, avgLead: 1.1, themes: { defi: 44, gov: 31, pubgoods: 26, ai: 30, qf: 19, sec: 13, zk: 14, devtool: 11 }, pioneerThemes: [], timeline: [] },
  { handle: 'Saulo', wallet: '0x09...e2d8', grad: 15, coherence: 41, stake: 320, peers: 6, raw: 63, score: 47, state: 'low', avail: 'inactive', pioneer30d: 0, avgLead: 1.6, themes: { defi: 49, ai: 28, gov: 34, pubgoods: 21, sec: 17, qf: 12, zk: 9, devtool: 8 }, pioneerThemes: [], timeline: [] },
]

const STREAKS = [34, 28, 12, 19, 23, 9, 15, 11, 6, 8, 4, 0, 26, 17, 3, 0]
const CORE = new Set([
  'sejal.eth', '0xmara', 'pluriverse.eth', 'grants-ana', 'lena-zk',
  '0xBilly.eth', 'zet.box', 'wieedze.eth', 'fvngbill.eth', 'alessandro.eth', 'MKultra',
])

export const MEMBERS: Member[] = RAW_MEMBERS.map((m, i) => ({
  ...m,
  themes: collapseThemes(m.themes),
  pioneerThemes: [...new Set(m.pioneerThemes.map(remapKey))],
  streak: STREAKS[i] ?? 0,
  core: CORE.has(m.handle),
}))

const MEMBER_MAP: Record<string, Member> = Object.fromEntries(
  MEMBERS.map((m) => [m.handle, m]),
)
export const CORE_MEMBERS = MEMBERS.filter((m) => m.core)
export function memberByHandle(h: string): Member | undefined {
  return MEMBER_MAP[h]
}

/* ── Circle roll-up ───────────────────────────────────────────────────── */
export const CIRCLE: Circle = {
  name: 'Intuition Core Team',
  handle: 'acme.com',
  description:
    "Intuition Core Team's shared knowledge base — where every team saves, validates and finds the resources that actually matter, organized by topic.",
  totalMembers: 104,
  activeMembers: 71,
  kpi: {
    signalsWeek: 47,
    signalsDelta: '+11 vs last wk',
    trustWeek: 8420,
    trustDelta: '+1.2k vs last wk',
    budget: 240,
    budgetNote: 'available to stake',
  },
}

/* ── Intent palette (the "verb" on every bookmark) ────────────────────── */
export const INTENT_META: Record<string, { label: string; color: string }> = {
  work: { label: 'Work', color: 'var(--work)' },
  learning: { label: 'Learning', color: 'var(--learning)' },
  fun: { label: 'Fun', color: 'var(--fun)' },
  inspiration: { label: 'Inspiration', color: 'var(--inspiration)' },
  buying: { label: 'Buying', color: 'var(--buying)' },
}

/* ── Bookmarks, grouped by topic (the design's per-topic signals) ─────── */
interface RawBookmark {
  url: string
  title: string
  domain: string
  intent: IntentId
  n: number
  trust: number
  when: string
}

const RAW_BOOKMARKS: Record<string, RawBookmark[]> = {
  pubgoods: [
    { url: 'vitalik.eth/general/2026/05/qf-v3.html', title: 'Quadratic Funding v3: pairwise-bounded matching', domain: 'vitalik.eth', intent: 'learning', n: 14, trust: 920, when: '3d' },
    { url: 'gitcoin.co/blog/gg24-design-principles', title: 'GG24 design principles', domain: 'gitcoin.co', intent: 'work', n: 11, trust: 640, when: '6d' },
    { url: 'ethresear.ch/t/retro-pgf-mechanism', title: 'A cleaner retro-PGF mechanism', domain: 'ethresear.ch', intent: 'inspiration', n: 9, trust: 510, when: '1w' },
    { url: 'optimism.io/retropgf-round-5', title: 'RetroPGF Round 5 results', domain: 'optimism.io', intent: 'work', n: 7, trust: 380, when: '2w' },
  ],
  gov: [
    { url: 'gov.gitcoin.co/t/futarchy-trial-gg24', title: 'Futarchy trial for GG24 allocations', domain: 'gov.gitcoin.co', intent: 'work', n: 12, trust: 700, when: '4d' },
    { url: 'snapshot.org/#/gitcoindao.eth', title: 'Active proposals · gitcoindao.eth', domain: 'snapshot.org', intent: 'work', n: 8, trust: 420, when: '1w' },
    { url: 'metagov.org/research/coordination', title: 'Coordination mechanisms survey', domain: 'metagov.org', intent: 'learning', n: 6, trust: 300, when: '2w' },
  ],
  defi: [
    { url: 'blog.uniswap.org/v4-hooks-deep-dive', title: 'Uniswap v4 hooks, in depth', domain: 'blog.uniswap.org', intent: 'learning', n: 10, trust: 560, when: '5d' },
    { url: 'defillama.com/research/lst-risk', title: 'LST de-peg risk framework', domain: 'defillama.com', intent: 'learning', n: 9, trust: 480, when: '1w' },
    { url: 'rekt.news/flux-post-mortem', title: 'Flux exploit post-mortem', domain: 'rekt.news', intent: 'inspiration', n: 5, trust: 240, when: '2w' },
  ],
  zk: [
    { url: 'eprint.iacr.org/2026/881', title: 'Folding schemes without homomorphic commitments', domain: 'eprint.iacr.org', intent: 'learning', n: 8, trust: 470, when: '2d' },
    { url: 'github.com/0xPARC/circom-ml', title: 'circom-ml: ZK inference circuits', domain: 'github.com', intent: 'work', n: 7, trust: 390, when: '1w' },
    { url: 'zksecurity.xyz/blog/folding-schemes', title: 'Auditing folding-based provers', domain: 'zksecurity.xyz', intent: 'work', n: 5, trust: 260, when: '2w' },
  ],
  ai: [
    { url: 'huggingface.co/blog/agents-onchain', title: 'Onchain agents: a practical guide', domain: 'huggingface.co', intent: 'learning', n: 9, trust: 500, when: '3d' },
    { url: 'ethresear.ch/t/ai-prediction-markets', title: 'AI-resolved prediction markets', domain: 'ethresear.ch', intent: 'inspiration', n: 6, trust: 300, when: '1w' },
  ],
  sec: [
    { url: 'blog.trailofbits.com/audit-2026', title: 'What a 2026 audit actually checks', domain: 'trailofbits.com', intent: 'work', n: 7, trust: 410, when: '6d' },
    { url: 'samczsun.com/two-rights-one-wrong', title: 'Two rights, one wrong', domain: 'samczsun.com', intent: 'inspiration', n: 5, trust: 280, when: '2w' },
  ],
  qf: [
    { url: 'ethresear.ch/t/connection-oriented-qf', title: 'Connection-oriented quadratic funding', domain: 'ethresear.ch', intent: 'learning', n: 6, trust: 330, when: '1w' },
    { url: 'allo.gitcoin.co/docs/strategies', title: 'Allo allocation strategies', domain: 'allo.gitcoin.co', intent: 'work', n: 4, trust: 190, when: '2w' },
  ],
  devtool: [
    { url: 'github.com/foundry-rs/foundry', title: 'Foundry: toolkit for EVM development', domain: 'github.com', intent: 'work', n: 5, trust: 250, when: '1w' },
    { url: 'viem.sh/docs/actions/wallet', title: 'viem wallet actions reference', domain: 'viem.sh', intent: 'work', n: 3, trust: 150, when: '2w' },
  ],
}

export const BOOKMARKS_BY_TOPIC: Record<string, Bookmark[]> = {}
for (const [k, arr] of Object.entries(RAW_BOOKMARKS)) {
  const nk = remapKey(k)
  const mapped: Bookmark[] = arr.map((s) => ({
    url: s.url,
    title: s.title,
    domain: s.domain,
    intent: s.intent,
    curators: s.n,
    trust: s.trust,
    when: s.when,
  }))
  ;(BOOKMARKS_BY_TOPIC[nk] ??= []).push(...mapped)
}

/** Flat, recency-sorted helper used by the Activity feed. */
export function allBookmarks(): { b: Bookmark; topic: string }[] {
  return Object.entries(BOOKMARKS_BY_TOPIC).flatMap(([topic, arr]) =>
    arr.map((b) => ({ b, topic })),
  )
}

/* ── Topic experts + trust-backing (Members tab) ──────────────────────── */
export function expertsForTheme(themeId: string, limit = 5): Member[] {
  return MEMBERS.filter((m) => (m.themes[themeId] || 0) >= 25)
    .sort((a, b) => (b.themes[themeId] || 0) - (a.themes[themeId] || 0))
    .slice(0, limit)
}

export interface BackingRow {
  m: Member
  level: number
  stake: number
  backers: number
}

/** Peer-staked TRUST behind each candidate as a topic's top expert. */
export function votesFor(domain: string): BackingRow[] {
  return MEMBERS.filter((m) => (m.themes[domain] || 0) >= 40 && m.state !== 'low')
    .map((m) => {
      const level = m.themes[domain]
      const stake = Math.round(level * 5 + m.peers * 14 + m.coherence * 2)
      const backers = Math.round(stake / 120) + 2
      return { m, level, stake, backers }
    })
    .sort((a, b) => b.stake - a.stake)
}

/* ── Functional roles (what people DO) ────────────────────────────────── */
export const ROLES: Role[] = [
  { id: 'design', label: 'Design', color: '#ec4899', blurb: 'Product, brand & UX' },
  { id: 'dev', label: 'Dev', color: '#3b82f6', blurb: 'Protocol, apps & tooling' },
  { id: 'socials', label: 'Socials', color: '#f59e0b', blurb: 'Social channels & growth' },
  { id: 'video', label: 'Video', color: '#8b5cf6', blurb: 'Video, motion & content' },
  { id: 'writer', label: 'Writer', color: '#06b6d4', blurb: 'Docs, posts & narrative' },
  { id: 'community', label: 'Community', color: '#22c55e', blurb: 'Moderation & contributor care' },
]
export const ROLE_MAP: Record<string, Role> = Object.fromEntries(
  ROLES.map((r) => [r.id, r]),
)

/* ── Tool catalogue ───────────────────────────────────────────────────── */
export const TOOLS: Record<string, Tool> = {
  figma: { label: 'Figma', glyph: 'F', color: '#ec4899' },
  vscode: { label: 'VS Code', glyph: '{}', color: '#3b82f6' },
  cursor: { label: 'Cursor', glyph: '⌶', color: '#06b6d4' },
  github: { label: 'GitHub', glyph: '⎇', color: '#8b5cf6' },
  foundry: { label: 'Foundry', glyph: '⚒', color: '#ff5722' },
  notion: { label: 'Notion', glyph: 'N', color: '#e5e2f5' },
  linear: { label: 'Linear', glyph: 'L', color: '#7bade0' },
  discord: { label: 'Discord', glyph: '◈', color: '#8b5cf6' },
  framer: { label: 'Framer', glyph: '▲', color: '#06b6d4' },
  dune: { label: 'Dune', glyph: '≈', color: '#f59e0b' },
  snapshot: { label: 'Snapshot', glyph: '⌁', color: '#f59e0b' },
  premiere: { label: 'Premiere', glyph: '▶', color: '#a78bdb' },
  obsidian: { label: 'Obsidian', glyph: '◆', color: '#a78bdb' },
}

const ROLE_ASSIGN: Record<string, RoleId[]> = {
  'sejal.eth': ['writer', 'community'],
  '0xmara': ['dev'],
  'pluriverse.eth': ['writer', 'community'],
  'lena-zk': ['dev'],
  'grants-ana': ['community', 'socials'],
  '0xsalt': ['dev'],
  bytewitch: ['dev', 'design'],
  MKultra: ['socials', 'community'],
  'nadia.eth': ['design', 'writer'],
  'fvngbill.eth': ['dev'],
  'alessandro.eth': ['community'],
  'zet.box': ['video', 'socials'],
  '0xBilly.eth': ['dev'],
  'wieedze.eth': ['socials'],
  'Passive-records.box': ['writer'],
  Saulo: ['community'],
}

const MEMBER_TOOLS: Record<string, Person['tools']> = {
  'sejal.eth': [{ t: 'notion', last: '1h ago', hrs: 16, intensity: 0.85 }, { t: 'snapshot', last: '3h ago', hrs: 5, intensity: 0.5 }, { t: 'figma', last: 'yesterday', hrs: 4, intensity: 0.35 }],
  '0xmara': [{ t: 'vscode', last: '20m ago', hrs: 31, intensity: 0.98 }, { t: 'foundry', last: '1h ago', hrs: 18, intensity: 0.8 }, { t: 'github', last: '40m ago', hrs: 12, intensity: 0.7 }],
  'lena-zk': [{ t: 'cursor', last: '2h ago', hrs: 27, intensity: 0.92 }, { t: 'github', last: '2h ago', hrs: 14, intensity: 0.72 }],
  bytewitch: [{ t: 'vscode', last: '5m ago', hrs: 34, intensity: 1.0 }, { t: 'github', last: '15m ago', hrs: 20, intensity: 0.85 }, { t: 'foundry', last: '1h ago', hrs: 9, intensity: 0.55 }],
  'grants-ana': [{ t: 'notion', last: '1h ago', hrs: 19, intensity: 0.88 }, { t: 'discord', last: '30m ago', hrs: 11, intensity: 0.65 }, { t: 'dune', last: 'yesterday', hrs: 5, intensity: 0.4 }],
  '0xsalt': [{ t: 'dune', last: '3h ago', hrs: 15, intensity: 0.75 }, { t: 'vscode', last: '4h ago', hrs: 12, intensity: 0.6 }],
  'pluriverse.eth': [{ t: 'obsidian', last: '2h ago', hrs: 17, intensity: 0.8 }, { t: 'snapshot', last: '5h ago', hrs: 6, intensity: 0.45 }],
  MKultra: [{ t: 'snapshot', last: '1h ago', hrs: 10, intensity: 0.6 }, { t: 'notion', last: '3h ago', hrs: 8, intensity: 0.5 }],
  'nadia.eth': [{ t: 'figma', last: '4h ago', hrs: 13, intensity: 0.7 }, { t: 'obsidian', last: 'yesterday', hrs: 6, intensity: 0.45 }],
  'fvngbill.eth': [{ t: 'github', last: '2h ago', hrs: 22, intensity: 0.85 }, { t: 'linear', last: '3h ago', hrs: 9, intensity: 0.55 }],
}

interface ExtraPerson {
  handle: string
  grad: number
  roles: RoleId[]
  roleScore: number
  avail: 'active' | 'quiet'
  joined: string
  headline: string
  contributions: number
  topicsLight: Record<string, number>
  tools: Person['tools']
}

const EXTRA_PEOPLE: ExtraPerson[] = [
  { handle: 'remy.design', grad: 1, roles: ['design'], roleScore: 86, avail: 'active', joined: '8 mo', headline: 'Design systems & brand for grant programs', contributions: 142, topicsLight: { pubgoods: 41, gov: 22 }, tools: [{ t: 'figma', last: '1h ago', hrs: 22, intensity: 0.95 }, { t: 'framer', last: 'yesterday', hrs: 6, intensity: 0.5 }, { t: 'notion', last: '3h ago', hrs: 5, intensity: 0.45 }] },
  { handle: 'dana-dao', grad: 8, roles: ['community', 'socials'], roleScore: 79, avail: 'active', joined: '1 yr', headline: 'Community ops, moderation & contributor onboarding', contributions: 311, topicsLight: { gov: 38, pubgoods: 30 }, tools: [{ t: 'discord', last: '12m ago', hrs: 26, intensity: 0.98 }, { t: 'notion', last: '2h ago', hrs: 9, intensity: 0.6 }, { t: 'linear', last: 'yesterday', hrs: 4, intensity: 0.35 }] },
  { handle: 'motion.eth', grad: 5, roles: ['video'], roleScore: 72, avail: 'quiet', joined: '5 mo', headline: 'Explainer video & motion for protocol launches', contributions: 64, topicsLight: { ai: 28, zk: 18 }, tools: [{ t: 'premiere', last: '2d ago', hrs: 14, intensity: 0.7 }, { t: 'figma', last: '2d ago', hrs: 8, intensity: 0.55 }] },
  { handle: 'ria.ux', grad: 11, roles: ['design', 'writer'], roleScore: 68, avail: 'active', joined: '4 mo', headline: 'UX research & flows for the grants stack', contributions: 88, topicsLight: { pubgoods: 33, qf: 26 }, tools: [{ t: 'figma', last: '30m ago', hrs: 18, intensity: 0.88 }, { t: 'obsidian', last: '4h ago', hrs: 7, intensity: 0.5 }] },
]

export const PEOPLE: Person[] = [
  ...MEMBERS.map<Person>((m) => ({
    ...m,
    roles: ROLE_ASSIGN[m.handle] || ['community'],
    roleScore: m.score,
    tools: MEMBER_TOOLS[m.handle] || [],
    headline: null,
    contributions: m.raw + m.peers * 3,
    joined: 'core',
    extra: false,
  })),
  ...EXTRA_PEOPLE.map<Person>((p) => ({
    handle: p.handle,
    grad: p.grad,
    roles: p.roles,
    roleScore: p.roleScore,
    score: p.roleScore,
    tools: p.tools,
    headline: p.headline,
    contributions: p.contributions,
    joined: p.joined,
    extra: true,
    core: false,
    avail: p.avail,
    themes: collapseThemes(p.topicsLight),
    pioneerThemes: [],
    coherence: 0,
    stake: 0,
    peers: 0,
  })),
]

const PERSON_MAP: Record<string, Person> = Object.fromEntries(
  PEOPLE.map((p) => [p.handle, p]),
)
export function personByHandle(h: string): Person | undefined {
  return PERSON_MAP[h]
}
export function peopleByRole(roleId: string): Person[] {
  return PEOPLE.filter((p) => p.roles.includes(roleId as RoleId)).sort(
    (a, b) => b.roleScore - a.roleScore,
  )
}
export function roleCount(roleId: string): number {
  return PEOPLE.filter((p) => p.roles.includes(roleId as RoleId)).length
}
export function personTools(p: Person): (Person['tools'][number] & { meta: Tool })[] {
  return (p.tools || []).map((x) => ({ ...x, meta: TOOLS[x.t] }))
}

/* ── On-chain activity (recent, verifiable marks/stakes/votes/trusts) ─── */
const RAW_ONCHAIN: OnchainEvent[] = [
  { who: '0xmara', kind: 'stake', detail: 'Staked 120 TRUST on eprint.iacr.org/2026/881', theme: 'zk', amount: '120 TRUST', when: '12m', tx: '0x9c4a…1f0b' },
  { who: 'sejal.eth', kind: 'mark', detail: 'Marked ethresear.ch/t/quadratic-trust-graphs · Inspiration', theme: 'qf', when: '34m', tx: '0x71de…aa02' },
  { who: 'pluriverse.eth', kind: 'vote', detail: 'Voted Yes on "Adopt futarchy for GG24" · weight 3.1×', theme: 'gov', when: '1h', tx: '0x4f80…9b2e' },
  { who: 'MKultra', kind: 'trust', detail: 'Trusted grants-ana in Public Goods', theme: 'pubgoods', when: '2h', tx: '0x8a31…d3f7' },
  { who: 'bytewitch', kind: 'mark', detail: 'Marked github.com/foundry-rs/foundry · Work', theme: 'devtool', when: '2h', tx: '0xf205…05ac' },
  { who: 'grants-ana', kind: 'stake', detail: 'Staked 40 TRUST on allo.gitcoin.co/docs/strategies', theme: 'qf', amount: '40 TRUST', when: '3h', tx: '0xab44…44d9' },
  { who: 'lena-zk', kind: 'mark', detail: 'Marked github.com/0xPARC/circom-ml · Work', theme: 'zk', when: '5h', tx: '0x2c7f…7f10' },
  { who: '0xsalt', kind: 'vote', detail: 'Voted No on "Diversify treasury into LSTs" · weight 2.9×', theme: 'defi', when: '6h', tx: '0x6d1e…1e88' },
]
export const ONCHAIN: OnchainEvent[] = RAW_ONCHAIN.map((a) => ({
  ...a,
  theme: remapKey(a.theme),
}))
export const ONCHAIN_KIND: Record<OnchainKind, { label: string; color: string }> = {
  mark: { label: 'Mark', color: 'var(--learning)' },
  stake: { label: 'Stake', color: 'var(--ds-accent)' },
  vote: { label: 'Vote', color: 'var(--inspiration)' },
  trust: { label: 'Trust', color: 'var(--trusted)' },
}

/* ── Skills (demonstrated, peer-confirmed) ────────────────────────────── */
const RAW_SKILLS: Skill[] = [
  { skill: 'ZK proving systems', role: 'dev', who: ['0xmara', 'lena-zk'], signals: 38, confirmed: 21, trend: '+6', theme: 'zk' },
  { skill: 'Mechanism design', role: 'dev', who: ['pluriverse.eth', 'sejal.eth'], signals: 44, confirmed: 27, trend: '+9', theme: 'gov' },
  { skill: 'Grant program ops', role: 'community', who: ['grants-ana', 'sejal.eth'], signals: 31, confirmed: 18, trend: '+4', theme: 'pubgoods' },
  { skill: 'Solidity / EVM', role: 'dev', who: ['bytewitch', 'fvngbill.eth'], signals: 29, confirmed: 16, trend: '+3', theme: 'defi' },
  { skill: 'Design systems', role: 'design', who: ['remy.design', 'ria.ux'], signals: 22, confirmed: 12, trend: '+7', theme: 'pubgoods' },
  { skill: 'Community ops', role: 'community', who: ['dana-dao', 'MKultra'], signals: 26, confirmed: 14, trend: '+5', theme: 'gov' },
  { skill: 'Smart contract security', role: 'dev', who: ['bytewitch', '0xmara'], signals: 47, confirmed: 29, trend: '+11', theme: 'sec' },
  { skill: 'Account abstraction', role: 'dev', who: ['lena-zk', 'fvngbill.eth'], signals: 39, confirmed: 23, trend: '+8', theme: 'devtool' },
  { skill: 'Indexing & data pipelines', role: 'dev', who: ['0xsalt', 'bytewitch'], signals: 33, confirmed: 19, trend: '+6', theme: 'devtool' },
]
export const SKILLS: Skill[] = RAW_SKILLS.map((s) => ({ ...s, theme: remapKey(s.theme) }))

export interface SkillEvidence {
  tools: { t: string; meta: Tool; hrs: number; recLabel: string }[]
}
/** A skill's proof = the tools its members actually use (hours + recency). */
export function skillEvidence(s: Skill): SkillEvidence {
  const who = s.who.map((h) => personByHandle(h)).filter((p): p is Person => !!p)
  const agg: Record<string, { t: string; meta: Tool; hrs: number; rec: number; recLabel: string }> = {}
  who.forEach((p) =>
    (p.tools || []).forEach((x) => {
      if (!agg[x.t]) agg[x.t] = { t: x.t, meta: TOOLS[x.t], hrs: 0, rec: 1e9, recLabel: x.last }
      agg[x.t].hrs += x.hrs
      const r = parseRecency(x.last)
      if (r < agg[x.t].rec) {
        agg[x.t].rec = r
        agg[x.t].recLabel = x.last
      }
    }),
  )
  const tools = Object.values(agg)
    .sort((a, b) => b.hrs - a.hrs)
    .slice(0, 3)
    .map(({ t, meta, hrs, recLabel }) => ({ t, meta, hrs, recLabel }))
  return { tools }
}

/* ── Collective memory ────────────────────────────────────────────────── */
// Collective memory = the web3-enterprise topics the team actually debates in
// meetings, saved as living digests (in English).
const RAW_MEMORY: MemoryRecord[] = [
  { id: 'm-aivideo', kind: 'doc', title: 'Best AI tools for video editing', snippet: 'The stack the team uses for explainer & launch videos — Runway, Descript, CapCut and ElevenLabs — ranked by output quality vs turnaround.', topic: 'ai', who: ['zet.box', 'nadia.eth'], when: '2d ago', refs: 7 },
  { id: 'm-eth', kind: 'thread', title: 'Latest on Ethereum — Pectra, blobs & L1 scaling', snippet: 'Running digest of what actually shipped: the Pectra upgrade, blob throughput after EIP-4844, and what it means for our rollup costs.', topic: 'devtool', who: ['0xmara', 'lena-zk'], when: '5h ago', refs: 11 },
  { id: 'm-base', kind: 'thread', title: "What's shipping on Base right now", snippet: 'Weekly tracker of Base ecosystem launches, gas trends and the apps worth integrating. Pulled from the team feed.', topic: 'devtool', who: ['bytewitch', 'fvngbill.eth'], when: '1d ago', refs: 6 },
  { id: 'm-erc8004', kind: 'decision', title: 'ERC-8004 — agent identity, reputation & validation', snippet: 'Why we are tracking ERC-8004 for trustless agent interactions: portable identity plus onchain reputation. Notes on where it fits our stack.', topic: 'sec', who: ['0xmara', 'pluriverse.eth'], when: '3d ago', refs: 9 },
  { id: 'm-stable', kind: 'doc', title: 'Stablecoin rails for B2B payments', snippet: 'USDC vs PYUSD rails, settlement times and on/off-ramp partners for invoicing clients in crypto.', topic: 'funding', who: ['grants-ana', 'MKultra'], when: '1w ago', refs: 5 },
  { id: 'm-data', kind: 'doc', title: 'Best tools for onchain data & analytics', snippet: 'Dune vs Flipside vs a custom indexer — the team picks for dashboards, alerts and reporting.', topic: 'devtool', who: ['0xsalt', 'grants-ana'], when: '4d ago', refs: 8 },
  { id: 'm-aa', kind: 'thread', title: 'Account abstraction (ERC-4337) in production', snippet: 'Lessons from shipping smart accounts: paymasters, gas sponsorship UX and the wallets that support it today.', topic: 'sec', who: ['lena-zk', 'bytewitch'], when: '6d ago', refs: 4 },
  { id: 'm-airdrop', kind: 'decision', title: 'Token distribution & airdrop design that works', snippet: 'Sybil resistance, vesting and the mechanics behind airdrops that retained users instead of farmers. Archived for the next launch.', topic: 'gov', who: ['pluriverse.eth', 'sejal.eth'], when: '2w ago', refs: 6 },
]
export const MEMORY: MemoryRecord[] = RAW_MEMORY.map((m) => ({ ...m, topic: remapKey(m.topic) }))
export const MEMORY_KIND: Record<MemoryKind, { label: string; color: string }> = {
  decision: { label: 'Decision', color: 'var(--inspiration)' },
  thread: { label: 'Thread', color: 'var(--work)' },
  doc: { label: 'Doc', color: 'var(--learning)' },
  signal: { label: 'Signal', color: 'var(--ds-accent)' },
}
export const MEMORY_ASKS: MemoryAsk[] = [
  { q: 'video editing ai film', a: 'For video the team standardized on Runway + Descript for fast cuts and ElevenLabs for voice. The full ranked stack lives in "Best AI tools for video editing".', refs: ['m-aivideo'] },
  { q: 'ethereum eth pectra blob scaling l1', a: 'Latest Ethereum digest: Pectra shipped, blob throughput is up post-EIP-4844 and rollup data costs dropped — see the running thread.', refs: ['m-eth'] },
  { q: 'base coinbase l2', a: 'On Base: a weekly tracker of launches, gas trends and integration-worthy apps lives in "What\'s shipping on Base right now".', refs: ['m-base'] },
  { q: 'erc-8004 8004 agent identity reputation', a: 'ERC-8004 gives agents portable identity plus onchain reputation for trustless interactions. We are tracking it for the agent stack.', refs: ['m-erc8004'] },
  { q: 'stablecoin payments usdc pyusd invoice', a: 'For B2B payments we compared USDC/PYUSD rails and ramp partners — settlement and invoicing notes are in the stablecoin digest.', refs: ['m-stable'] },
  { q: 'account abstraction 4337 smart wallet paymaster', a: 'Account abstraction (ERC-4337) in production: paymasters, gas sponsorship UX and supported wallets — lessons archived in the thread.', refs: ['m-aa'] },
]

/* ── Onboarding: import classification + seed bookmarks ───────────────── */
export const INTENTS: Intent[] = [
  { id: 'trust', label: 'Trust', color: 'var(--trusted)' },
  { id: 'distrust', label: 'Distrust', color: 'var(--distrusted)' },
  { id: 'work', label: 'Work', color: 'var(--work)' },
  { id: 'learning', label: 'Learning', color: 'var(--learning)' },
  { id: 'fun', label: 'Fun', color: 'var(--fun)' },
  { id: 'inspiration', label: 'Inspiration', color: 'var(--inspiration)' },
]
export const CONTEXTS: Context[] = [
  { id: 'tech', label: 'Tech', color: 'var(--tech)' },
  { id: 'web3', label: 'Web3', color: 'var(--web3)' },
  { id: 'learning', label: 'Learning', color: 'var(--learning)' },
  { id: 'design', label: 'Design', color: 'var(--inspiration)' },
]

export interface SeedBookmark {
  title: string
  url: string
  glyph: string
  bg: string
}
/** Pages the user "already saved" — pre-filled in the import step. */
export const IMPORT_BOOKMARKS: SeedBookmark[] = [
  { title: 'Vitalik — Quadratic Funding v3', url: 'vitalik.eth/general/qf-v3', glyph: 'V', bg: '#8b5cf6' },
  { title: 'Foundry Book', url: 'book.getfoundry.sh', glyph: 'F', bg: '#1a1a1a' },
  { title: 'Lo-fi beats radio', url: 'youtube.com/watch?v=jfKfP', glyph: '▶', bg: '#FF0033' },
  { title: 'Excalidraw', url: 'excalidraw.com', glyph: 'E', bg: '#6b5bff' },
  { title: 'Are.na — design systems', url: 'are.na/design-systems', glyph: 'A', bg: '#111' },
]
