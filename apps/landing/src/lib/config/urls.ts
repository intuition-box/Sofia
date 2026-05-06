const DOCS_BASE = import.meta.env.VITE_DOCS_URL ?? 'https://doc.sofia.intuition.box';

export const URLS = {
  docs: {
    intro: `${DOCS_BASE}/docs/intro`,
    manifesto: `${DOCS_BASE}/docs/manifesto`,
    gettingStarted: `${DOCS_BASE}/docs/features/getting-started`,
    certifications: `${DOCS_BASE}/docs/features/certifications`,
  },
  blog: {
    index: `${DOCS_BASE}/blog`,
    fromIdea: `${DOCS_BASE}/blog/From%20idea%20to%20reality`,
    logbook2003: `${DOCS_BASE}/blog/logbook-20-03`,
    logbook2403: `${DOCS_BASE}/blog/logbook-13-03`,
    logbook2303: `${DOCS_BASE}/blog/logbook-06-03`,
    logbook2202: `${DOCS_BASE}/blog/logbook-27-02`,
  },
  external: {
    board: 'https://board-sofia.intuition.box/',
    discord: 'https://discord.gg/sofia3',
    alpha: 'https://tally.so/r/7RdaeR',
    values: 'https://sofia.intuition.box/values/',
    github: 'https://github.com/intuition-box',
    x: 'https://x.com/0xsofia3',
    proxyDashboard: 'https://explorer.intuition.systems/address/0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c',
  },
} as const;
