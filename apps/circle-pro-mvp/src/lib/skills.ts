/**
 * Skills store — a skill is an open container the team builds together: anyone
 * can open it, add URLs and tools, and vote on the links. Seeded skills come
 * from mock data (read-only); everything the user adds (created skills, URLs,
 * votes, tools) lives here. Event-based module store, like the gate store.
 */
import { useSyncExternalStore } from 'react'
import type { RoleId } from '../data/types'

export interface SkillUrl {
  id: string
  url: string
  title: string
  votes: number
  voted: boolean
}

export interface CreatedSkill {
  id: string
  name: string
  role: RoleId
}

/** View-model shared by the list (Activity) and the detail view (SkillView):
 * a seeded skill or a user-created one, flattened to what the UI renders. */
export interface SkillVM {
  id: string
  name: string
  who: string[]
  /** Taxonomy topic id → the Domain tag. Created skills have none. */
  theme?: string
  /** Owning role → the Role tag. */
  role?: RoleId
}

export interface SkillsState {
  /** Skills the user created (newest first), shown next to the seeded ones. */
  created: CreatedSkill[]
  /** URLs added to a skill, keyed by skill id. */
  urls: Record<string, SkillUrl[]>
  /** Tool ids attached to a skill, keyed by skill id. */
  tools: Record<string, string[]>
  /** "Why it's useful" blurb, keyed by skill id. */
  desc: Record<string, string>
  /** Ordered how-to steps, keyed by skill id. */
  steps: Record<string, string[]>
}

/** A seeded resource with a healthy vote tally so skills look lived-in. */
const u = (id: string, url: string, title: string, votes: number): SkillUrl => ({ id, url, title, votes, voted: false })

/* Pre-populate the engineering skills so they read as popular (resources +
   votes + the tools they lean on). Keyed by the seeded skill id (`seed:<name>`). */
const SEED_URLS: Record<string, SkillUrl[]> = {
  'seed:Smart contract security': [
    u('scs-1', 'https://github.com/crytic/slither', 'Slither — static analysis for Solidity', 41),
    u('scs-2', 'https://github.com/foundry-rs/foundry', 'Foundry — fuzzing & invariant testing', 35),
    u('scs-3', 'https://consensys.io/diligence/', 'ConsenSys Diligence — audit checklist', 27),
    u('scs-4', 'https://swcregistry.io', 'SWC registry — known vulnerability classes', 19),
  ],
  'seed:Account abstraction': [
    u('aa-1', 'https://eips.ethereum.org/EIPS/eip-4337', 'ERC-4337 — account abstraction spec', 33),
    u('aa-2', 'https://docs.stackup.sh', 'Stackup — bundler & paymaster docs', 21),
    u('aa-3', 'https://www.youtube.com/watch?v=account-abstraction', 'Smart accounts in production (talk)', 16),
  ],
  'seed:Indexing & data pipelines': [
    u('idx-1', 'https://thegraph.com/docs/', 'The Graph — subgraph development', 28),
    u('idx-2', 'https://dune.com', 'Dune — onchain analytics dashboards', 24),
    u('idx-3', 'https://ponder.sh', 'Ponder — typesafe EVM indexing', 15),
  ],
  'seed:Solidity / EVM': [
    u('sol-1', 'https://docs.soliditylang.org', 'Solidity language docs', 38),
    u('sol-2', 'https://www.evm.codes', 'evm.codes — interactive opcode reference', 26),
    u('sol-3', 'https://github.com/foundry-rs/foundry', 'Foundry — the dev toolkit', 31),
  ],
  'seed:ZK proving systems': [
    u('zk-1', 'https://github.com/0xPARC/circom-ml', 'circom-ml — circuits for ML', 29),
    u('zk-2', 'https://zkhack.dev', 'ZK Hack — puzzles & tutorials', 22),
    u('zk-3', 'https://github.com/privacy-scaling-explorations', 'PSE — proving system research', 18),
  ],
}

const SEED_TOOLS: Record<string, string[]> = {
  'seed:Smart contract security': ['foundry', 'github'],
  'seed:Account abstraction': ['vscode', 'github'],
  'seed:Indexing & data pipelines': ['dune', 'github'],
  'seed:Solidity / EVM': ['foundry', 'vscode'],
  'seed:ZK proving systems': ['github', 'vscode'],
}

let state: SkillsState = { created: [], urls: SEED_URLS, tools: SEED_TOOLS, desc: {}, steps: {} }
const listeners = new Set<() => void>()
const emit = () => {
  for (const l of listeners) l()
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

let seq = 0
const nextId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${seq++}`

export function createSkill(name: string, role: RoleId): string {
  const id = nextId('skill')
  state = { ...state, created: [{ id, name: name.trim(), role }, ...state.created] }
  emit()
  return id
}

export function addSkillUrl(skillId: string, url: string, title: string): void {
  const u = url.trim()
  if (!u) return
  const entry: SkillUrl = { id: nextId('url'), url: u, title: title.trim() || u, votes: 1, voted: true }
  state = { ...state, urls: { ...state.urls, [skillId]: [entry, ...(state.urls[skillId] || [])] } }
  emit()
}

export function voteSkillUrl(skillId: string, urlId: string): void {
  const list = (state.urls[skillId] || []).map((u) =>
    u.id === urlId ? { ...u, voted: !u.voted, votes: u.votes + (u.voted ? -1 : 1) } : u,
  )
  state = { ...state, urls: { ...state.urls, [skillId]: list } }
  emit()
}

export function addSkillTool(skillId: string, toolId: string): void {
  const cur = state.tools[skillId] || []
  if (cur.includes(toolId)) return
  state = { ...state, tools: { ...state.tools, [skillId]: [...cur, toolId] } }
  emit()
}

/** Rename a created skill (seeded skills are read-only). */
export function renameSkill(id: string, name: string): void {
  const n = name.trim()
  if (!n) return
  state = { ...state, created: state.created.map((c) => (c.id === id ? { ...c, name: n } : c)) }
  emit()
}

export function removeSkillUrl(skillId: string, urlId: string): void {
  state = { ...state, urls: { ...state.urls, [skillId]: (state.urls[skillId] || []).filter((u) => u.id !== urlId) } }
  emit()
}

export function removeSkillTool(skillId: string, toolId: string): void {
  state = { ...state, tools: { ...state.tools, [skillId]: (state.tools[skillId] || []).filter((t) => t !== toolId) } }
  emit()
}

/** Set the "why it's useful" blurb for a skill. */
export function setSkillDesc(skillId: string, desc: string): void {
  state = { ...state, desc: { ...state.desc, [skillId]: desc } }
  emit()
}

/** Replace the ordered step list for a skill. */
export function setSkillSteps(skillId: string, steps: string[]): void {
  state = { ...state, steps: { ...state.steps, [skillId]: steps } }
  emit()
}

export function useSkillsStore(): SkillsState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}
