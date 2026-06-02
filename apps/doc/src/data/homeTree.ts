/**
 * Home-page content tree — presentation data for the docs index.
 *
 * Distinct (intentionally) from `~/data/tree`, which models the
 * complete sidebar / pager. The home only lists the most useful
 * landings per section, in five hand-tuned columns. Editing this
 * file doesn't touch any UI code.
 *
 * AI Features remains hidden (product decision), so the User Guide
 * column lists 6 entries instead of 7.
 */

export interface HomeTreeItem {
  t: string
  d: string
  to: string
}
export interface HomeTreeCol {
  g: string
  items: HomeTreeItem[]
}

export const HOME_TREE_COLS: HomeTreeCol[] = [
  {
    g: 'Getting started',
    items: [
      { t: 'What is Sofia', d: 'The pitch, in two paragraphs.', to: '/docs/intro' },
      { t: 'Manifesto', d: "Why we don't trust stars.", to: '/manifesto' },
      { t: 'About us', d: 'Samuel & Maxime.', to: '/docs/about' },
      { t: 'Getting started', d: 'Install, sign in, attest.', to: '/docs/features/getting-started' },
    ],
  },
  {
    g: 'User guide',
    items: [
      { t: 'Core concepts', d: 'Atoms, triples, predicates.', to: '/docs/core-concepts/atoms' },
      { t: 'Features', d: 'What the extension does today.', to: '/docs/features/echoes' },
      { t: 'Gamification', d: 'Currencies, levels, badges.', to: '/docs/gamification/currencies-levels' },
      { t: 'Resonance', d: 'Discover through the network.', to: '/docs/resonance/circle-feed' },
      { t: 'Social', d: 'Verification, following, trust.', to: '/docs/social/verification' },
      { t: 'Known issues', d: 'Open bugs, workarounds.', to: '/docs/known-issues/transactions' },
    ],
  },
  {
    g: 'Litepaper',
    items: [
      { t: '§1 · Introduction', d: '', to: '/docs/litepaper/introduction' },
      { t: '§2 · Network', d: '', to: '/docs/litepaper/network' },
      { t: '§3 · Subscription', d: '', to: '/docs/litepaper/subscription' },
      { t: '§4 · DAO', d: '', to: '/docs/litepaper/dao' },
      { t: '§5 · Features', d: '', to: '/docs/litepaper/features' },
      { t: '§6 · Privacy', d: '', to: '/docs/litepaper/privacy' },
      { t: '§7 · Why unique', d: '', to: '/docs/litepaper/why-unique' },
      { t: '§8 · Audience', d: '', to: '/docs/litepaper/audience' },
    ],
  },
  {
    g: 'Architecture',
    items: [
      { t: 'System overview', d: 'One certification, end to end.', to: '/architecture' },
    ],
  },
  {
    g: 'Ecosystem',
    items: [
      { t: 'Phala', d: 'Confidential compute partner.', to: '/docs/ecosystem/phala' },
      { t: 'Mastra', d: 'Agent framework.', to: '/docs/ecosystem/mastra' },
      { t: 'Intuition', d: 'The underlying protocol.', to: '/docs/ecosystem/intuition' },
    ],
  },
]
