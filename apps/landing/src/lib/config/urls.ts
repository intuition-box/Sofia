const DOCS_BASE =
  import.meta.env.VITE_DOCS_URL ?? 'https://doc.sofia.intuition.box'

export const URLS = {
  docs: {
    intro: `${DOCS_BASE}/docs/intro`,
    manifesto: `${DOCS_BASE}/docs/manifesto`,
    privacy: `${DOCS_BASE}/docs/litepaper/privacy`,
  },
  blog: {
    index: `${DOCS_BASE}/blog`,
  },
  external: {
    board: 'https://board-sofia.intuition.box/',
    discord: 'https://discord.gg/sofia3',
    github: 'https://github.com/intuition-box',
    x: 'https://x.com/0xsofia3',
  },
} as const
