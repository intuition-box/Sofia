/**
 * The real Sofia content tree.
 *
 * Ported 1:1 from the Docusaurus `apps/doc/sidebars.ts` — every one
 * of the 41 docs is represented, with its real route id (the docs
 * path, e.g. `core-concepts/atoms`). This is NOT the design mock's
 * fictional tree ("8 intentions", "install/first-attest"): the
 * design supplies the *visual language*, this file supplies the
 * *real structure*. Each top-level section carries a predicate
 * color so the motif makes the tree scannable at a glance.
 *
 * `id` doubles as the route path: `/docs/<id>`.
 */
import type { TreeSection } from '~/lib/types'

export const TREE: TreeSection[] = [
  {
    id: 'intro',
    title: 'Introduction',
    color: 'accent',
    items: [
      { id: 'intro', label: 'What is Sofia?' },
      { id: 'manifesto', label: 'Manifesto', badge: 'editorial' },
      { id: 'about', label: 'About us' },
      { id: 'features/getting-started', label: 'Getting Started' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    color: 'work',
    items: [
      { id: 'core-concepts/atoms', label: 'Atoms' },
      { id: 'core-concepts/triples', label: 'Triples' },
      { id: 'core-concepts/predicates', label: 'Predicates' },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    color: 'trusted',
    items: [
      { id: 'features/echoes', label: 'Echoes' },
      { id: 'features/intentions', label: 'Intentions' },
      { id: 'features/certifications', label: 'Certifications' },
      { id: 'features/bookmarks-signals', label: 'Bookmarks & Signals' },
    ],
  },
  {
    id: 'gamification',
    title: 'Gamification',
    color: 'fun',
    items: [
      { id: 'gamification/currencies-levels', label: 'Currencies & Levels' },
      { id: 'gamification/quests-discovery', label: 'Quests & Discovery' },
      { id: 'gamification/streaks-voting', label: 'Streaks & Voting' },
      { id: 'gamification/badges-rewards', label: 'Badges & Rewards' },
    ],
  },
  /* AI Features — intentionally hidden from the docs nav/search/
     pager (product decision). The source MDX is kept under
     src/content/docs/ai-features/ and the route is 404'd in
     lib/docs.ts, so this is fully reversible: re-add this section
     and drop the filter to bring it back. */
  {
    id: 'resonance',
    title: 'Resonance',
    color: 'learning',
    items: [
      { id: 'resonance/circle-feed', label: 'Circle Feed' },
      { id: 'resonance/trending', label: 'Trending' },
      { id: 'resonance/vote', label: 'Vote' },
      { id: 'resonance/featured-lists', label: 'Featured Lists' },
      { id: 'resonance/leaderboard', label: 'Leaderboard' },
    ],
  },
  {
    id: 'social',
    title: 'Social',
    color: 'music',
    items: [
      { id: 'social/verification', label: 'Verification' },
      { id: 'social/following-trust', label: 'Following & Trust' },
    ],
  },
  {
    id: 'litepaper',
    title: 'Litepaper',
    color: 'learning',
    items: [
      { id: 'litepaper/introduction', label: '§1 · Introduction' },
      { id: 'litepaper/network', label: '§2 · Network' },
      { id: 'litepaper/subscription', label: '§3 · Subscription' },
      { id: 'litepaper/dao', label: '§4 · DAO' },
      { id: 'litepaper/features', label: '§5 · Features' },
      { id: 'litepaper/privacy', label: '§6 · Privacy' },
      { id: 'litepaper/why-unique', label: '§7 · Why unique' },
      { id: 'litepaper/audience', label: '§8 · Audience' },
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    color: 'fun',
    items: [{ id: 'architecture/overview', label: 'System overview' }],
  },
  {
    id: 'ecosystem',
    title: 'Ecosystem',
    color: 'buying',
    items: [
      { id: 'ecosystem/phala', label: 'Phala' },
      { id: 'ecosystem/gaianet', label: 'GaiaNet' },
      { id: 'ecosystem/mastra', label: 'Mastra' },
      { id: 'ecosystem/intuition', label: 'Intuition' },
    ],
  },
  {
    id: 'known-issues',
    title: 'Known Issues',
    color: 'distrusted',
    items: [
      { id: 'known-issues/transactions', label: 'Transactions', badge: 'draft' },
      {
        id: 'known-issues/social-verification',
        label: 'Social verification',
        badge: 'draft',
      },
    ],
  },
]

/** Flat id → { sectionId, label, section } lookup for breadcrumbs,
 *  pager prev/next and active highlighting. */
export interface FlatDoc {
  id: string
  label: string
  sectionId: string
  sectionTitle: string
}

export const FLAT_DOCS: FlatDoc[] = TREE.flatMap((s) =>
  s.items.map((it) => ({
    id: it.id,
    label: it.label,
    sectionId: s.id,
    sectionTitle: s.title,
  })),
)

export const DOC_BY_ID: Record<string, FlatDoc> = Object.fromEntries(
  FLAT_DOCS.map((d) => [d.id, d]),
)

/** Prev / next neighbours in reading order (flattened tree order). */
export function neighbours(id: string): {
  prev?: FlatDoc
  next?: FlatDoc
} {
  const i = FLAT_DOCS.findIndex((d) => d.id === id)
  if (i === -1) return {}
  return {
    prev: i > 0 ? FLAT_DOCS[i - 1] : undefined,
    next: i < FLAT_DOCS.length - 1 ? FLAT_DOCS[i + 1] : undefined,
  }
}
