const DOCS_BASE =
  import.meta.env.VITE_DOCS_URL ?? 'https://doc.sofia.intuition.box'

export const URLS = {
  docs: {
    intro: DOCS_BASE,
    manifesto: `${DOCS_BASE}/docs/litepaper/introduction`,
    privacy: `${DOCS_BASE}/privacy`,
    terms: `${DOCS_BASE}/terms`,
  },
  blog: {
    index: `${DOCS_BASE}/blog`,
  },
  external: {
    board: 'https://explorer.sofia.intuition.box/',
    discord: 'https://discord.gg/sofia3',
    github: 'https://github.com/intuition-box',
    x: 'https://x.com/0xsofia3',
  },
} as const
