// `||` (not `??`) so an empty build-arg from Coolify (VITE_DOCS_URL="")
// still falls back to the default — `??` only catches null/undefined.
const DOCS_BASE =
  import.meta.env.VITE_DOCS_URL || 'https://doc.sofia.intuition.box'

const BLOG_BASE =
  import.meta.env.VITE_BLOG_URL || 'https://blog.sofia.intuition.box'

export const URLS = {
  docs: {
    home: DOCS_BASE,
    intro: `${DOCS_BASE}/docs/intro`,
    manifesto: `${DOCS_BASE}/docs/manifesto`,
    litepaper: `${DOCS_BASE}/docs/litepaper/introduction`,
    privacy: `${DOCS_BASE}/privacy`,
    terms: `${DOCS_BASE}/terms`,
  },
  blog: {
    index: BLOG_BASE,
  },
  external: {
    board: 'https://explorer.sofia.intuition.box/',
    discord: 'https://discord.gg/sofia3',
    github: 'https://github.com/intuition-box',
    x: 'https://x.com/0xsofia3',
  },
} as const
