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

let state: SkillsState = { created: [], urls: {}, tools: {}, desc: {}, steps: {} }
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
