/**
 * Domain model for the Intuition Pro MVP.
 *
 * The hero entity is the {@link Bookmark} — a URL someone marked, tagged with
 * a topic + an intent, optionally backed by trust. Everything else (members,
 * roles, activity, memory) hangs off that. These shapes intentionally mirror
 * what the Sofia explorer reads on-chain, so swapping `data/mock.ts` for a
 * GraphQL-backed `repository.ts` later is a data-source change, not a model
 * change.
 */

/** Topic taxonomy — the categories bookmarks get classified into. */
export type TopicId = 'funding' | 'gov' | 'sec' | 'ai' | 'devtool'

export interface Topic {
  id: TopicId
  label: string
  color: string
  /** Mark intensity over the last 30d — drives the treemap cell size. */
  signals: number
  members: number
  pioneers: number
  certs: number
}

/** Why a page matters to the curator — the Sofia "verb" palette. */
export type IntentId =
  | 'work'
  | 'learning'
  | 'fun'
  | 'inspiration'
  | 'buying'
  | 'trust'
  | 'distrust'

export interface Intent {
  id: IntentId
  label: string
  /** CSS custom-property reference, e.g. `var(--work)`. */
  color: string
}

/** A free-form classification chip shown during import (Tech / Web3 / …). */
export interface Context {
  id: string
  label: string
  color: string
}

export type MemberState = 'aligned' | 'active' | 'low'
export type Availability = 'active' | 'quiet' | 'inactive'

export interface TimelineEntry {
  d: string
  url: string
  lead: number
}

/** A person in the circle. `themes` maps a topic id → expertise 0–100. */
export interface Member {
  handle: string
  wallet: string
  /** Index into the avatar-gradient palette. */
  grad: number
  github?: boolean
  coherence: number
  stake: number
  peers: number
  raw: number
  score: number
  state: MemberState
  avail: Availability
  pioneer30d: number
  avgLead: number
  themes: Record<string, number>
  pioneerThemes: string[]
  timeline: TimelineEntry[]
  streak: number
  core: boolean
}

/** Roll-up shown in the header. */
export interface Circle {
  name: string
  handle: string
  description: string
  totalMembers: number
  activeMembers: number
  kpi: {
    signalsWeek: number
    signalsDelta: string
    trustWeek: number
    trustDelta: string
    budget: number
    budgetNote: string
  }
}

/** A marked URL — the bookmark. */
export interface Bookmark {
  url: string
  title: string
  domain: string
  intent: IntentId
  /** How many curators marked it. */
  curators: number
  /** TRUST backing the mark. */
  trust: number
  /** Relative timestamp label, e.g. "3d". */
  when: string
}

/** Functional roles — what people DO (≠ topics, which are what they KNOW). */
export type RoleId =
  | 'design'
  | 'dev'
  | 'socials'
  | 'video'
  | 'writer'
  | 'community'

export interface Role {
  id: RoleId
  label: string
  color: string
  blurb: string
}

export interface Tool {
  label: string
  /** Single-glyph mark for the tool tile. */
  glyph: string
  color: string
}

/** A member's use of one tool. */
export interface ToolUse {
  t: string
  last: string
  /** Hours per week. */
  hrs: number
  /** 0–1 intensity. */
  intensity: number
}

/** A contributor as surfaced on the Roles tab (core members + discovery). */
export interface Person extends Partial<Member> {
  handle: string
  grad: number
  roles: RoleId[]
  roleScore: number
  tools: ToolUse[]
  headline: string | null
  contributions: number
  joined: string
  extra: boolean
  core?: boolean
  themes: Record<string, number>
}

export type OnchainKind = 'mark' | 'stake' | 'vote' | 'trust'

export interface OnchainEvent {
  who: string
  kind: OnchainKind
  detail: string
  theme: string
  amount?: string
  when: string
  tx: string
}

export interface Skill {
  skill: string
  role: RoleId
  who: string[]
  signals: number
  confirmed: number
  trend: string
  theme: string
}

export type MemoryKind = 'decision' | 'thread' | 'doc' | 'signal'

export interface MemoryRecord {
  id: string
  kind: MemoryKind
  title: string
  snippet: string
  topic: string
  who: string[]
  when: string
  refs: number
}

/** Canned answer for the "recall the circle's memory" search. */
export interface MemoryAsk {
  q: string
  a: string
  refs: string[]
}
