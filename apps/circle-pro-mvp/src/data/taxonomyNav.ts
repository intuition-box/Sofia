/**
 * Topic-first navigation over the REAL Sofia taxonomy: Topic → Category →
 * Niche (e.g. Tech → Web Development → Frontend). The breadcrumb drills these
 * three levels. Each bookmark is classified into a (category, niche) within
 * its topic, deterministically per URL.
 */
import { SOFIA_TOPICS } from '@0xsofia/taxonomy'
import type { Topic } from '@0xsofia/taxonomy'

const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(
  SOFIA_TOPICS.map((t) => [t.id, t]),
)

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}
const step = (h: number) => (Math.imul(h, 1103515245) + 12345) >>> 0

/** The 3 drill levels, deepest-out. */
export const LEVEL_LABEL = ['Topics', 'Sub-topics', 'Niches'] as const

export interface NavChild {
  id: string
  label: string
}

/** Taxonomy children at the level the user is about to pick (path.length). */
export function childrenOf(path: string[]): NavChild[] {
  if (path.length === 0) return SOFIA_TOPICS.map((t) => ({ id: t.id, label: t.label }))
  const topic = TOPIC_BY_ID[path[0]]
  if (!topic) return []
  if (path.length === 1) return topic.categories.map((c) => ({ id: c.id, label: c.label }))
  const cat = topic.categories.find((c) => c.id === path[1])
  if (!cat) return []
  if (path.length === 2) return cat.niches.map((n) => ({ id: n.id, label: n.label }))
  return []
}

/** Human label of the value at a given breadcrumb depth. */
export function labelAt(path: string[], i: number): string {
  const topic = TOPIC_BY_ID[path[0]]
  if (i === 0) return topic?.label ?? path[0]
  if (i === 1) return topic?.categories.find((c) => c.id === path[1])?.label ?? path[1]
  if (i === 2) {
    const cat = topic?.categories.find((c) => c.id === path[1])
    return cat?.niches.find((n) => n.id === path[2])?.label ?? path[2]
  }
  return path[i] ?? ''
}

export function topicColorOf(topicId: string): string {
  return TOPIC_BY_ID[topicId]?.color ?? 'var(--ds-muted)'
}

/** Deterministic (category, niche) for a URL within its topic. */
export function classify(url: string, topicId: string): { categoryId: string; nicheId: string } {
  const topic = TOPIC_BY_ID[topicId]
  if (!topic || topic.categories.length === 0) return { categoryId: '', nicheId: '' }
  const h0 = hash(`${url}#cat`)
  const cat = topic.categories[h0 % topic.categories.length]
  const h1 = step(h0)
  const niche = cat.niches.length ? cat.niches[h1 % cat.niches.length] : null
  return { categoryId: cat.id, nicheId: niche?.id ?? '' }
}
