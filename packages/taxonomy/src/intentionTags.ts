/**
 * Intention tags — why someone recommends a page (work, learning, fun, …).
 *
 * Intentions used to be their own predicates (`I | visits for work | page`),
 * one market per intention. A page now has ONE market (`I | recommends |
 * page`) and the intention is an optional `in context of` tag on that claim,
 * like a topic (docs/plans/ONE_MARKET_PER_PAGE_SPEC.md §3).
 *
 * Labels are prefixed with "for " so they never collide with a taxonomy
 * label ("Music" is also a category). The atoms are minted on first use with
 * the frozen context payload, so every app lands on the same atom; readers
 * resolve them by label until their ids are registered here.
 */
import { contextAtomPayload, type ContextAtomRef } from './contextNodes'

export type IntentionTagKey =
  | 'work'
  | 'learning'
  | 'fun'
  | 'inspiration'
  | 'buying'
  | 'music'

export interface IntentionTag {
  key: IntentionTagKey
  /** Context slug, e.g. `intent:work` */
  slug: string
  /** On-chain atom label, e.g. `for work` */
  label: string
  /** Legacy predicate label this tag replaces */
  legacyPredicate: string
}

const tag = (key: IntentionTagKey): IntentionTag => ({
  key,
  slug: `intent:${key}`,
  label: `for ${key}`,
  legacyPredicate: `visits for ${key}`,
})

export const INTENTION_TAGS: readonly IntentionTag[] = [
  tag('work'),
  tag('learning'),
  tag('fun'),
  tag('inspiration'),
  tag('buying'),
  tag('music'),
]

/** Registered atom ids, filled in once minted (slug → term_id) */
export const INTENTION_TAG_ATOM_IDS: Partial<Record<string, string>> = {}

const BY_SLUG = new Map(INTENTION_TAGS.map((t) => [t.slug, t]))
const BY_LABEL = new Map(INTENTION_TAGS.map((t) => [t.label, t]))
const BY_LEGACY = new Map(
  INTENTION_TAGS.map((t) => [t.legacyPredicate, t] as const),
)
const BY_ATOM_ID = new Map(
  Object.entries(INTENTION_TAG_ATOM_IDS).map(([slug, id]) => [
    id!.toLowerCase(),
    BY_SLUG.get(slug)!,
  ]),
)

export const isIntentionTagSlug = (slug: string): boolean => BY_SLUG.has(slug)

export const intentionTagBySlug = (slug: string): IntentionTag | undefined =>
  BY_SLUG.get(slug)

/** Intention tag of an `in context of` object atom (by id, then label) */
export function intentionTagForAtom(atom: {
  term_id?: string | null
  label?: string | null
}): IntentionTag | undefined {
  const byId = atom.term_id
    ? BY_ATOM_ID.get(atom.term_id.toLowerCase())
    : undefined
  return byId ?? BY_LABEL.get((atom.label ?? '').trim().toLowerCase())
}

/** The tag that replaces a legacy intention predicate (trailing space ok) */
export const intentionTagForLegacyPredicate = (
  predicateLabel: string,
): IntentionTag | undefined => BY_LEGACY.get(predicateLabel.trim())

/** On-chain ref for an intention tag slug — same contract as
 *  contextAtomRefForSlug (`known` id, or `mint` with the frozen payload). */
export function intentionTagAtomRef(slug: string): ContextAtomRef | null {
  const t = BY_SLUG.get(slug)
  if (!t) return null
  const known = INTENTION_TAG_ATOM_IDS[slug]
  if (known) return { kind: 'known', slug, label: t.label, termId: known }
  return {
    kind: 'mint',
    slug,
    label: t.label,
    payload: contextAtomPayload(slug, t.label),
  }
}
