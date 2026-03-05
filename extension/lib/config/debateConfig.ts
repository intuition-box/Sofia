// ── Debate Tab Configuration ────────────────────────────────────────
// Curated claims and lists for the Debate tab in ResonancePage.
//
// HOW TO UPDATE:
// - Intuition featured: visit https://portal.intuition.systems/explore/featured
//   Copy the term_ids from claim/list URLs (~every 2 weeks)
// - Sofia claims: create triples on-chain first, then add term_ids here

// ── Types ───────────────────────────────────────────────────────────

export interface ClaimConfig {
  tripleTermId: string
  subject: string
  predicate: string
  object: string
  category?: string
}

export interface FeaturedListConfig {
  predicateId: string
  objectId: string
  label: string
  description?: string
}

// ── Sofia Claims (triples to create on-chain — term_ids TBD) ────────

export const SOFIA_CLAIMS: ClaimConfig[] = [
  // Top vs Top
  // { tripleTermId: "0x...", subject: "Spotify", predicate: "is better for music than", object: "YouTube" },
  // { tripleTermId: "0x...", subject: "ChatGPT", predicate: "is better for work than", object: "GitHub" },
  // { tripleTermId: "0x...", subject: "Medium", predicate: "is better for learning than", object: "Anthropic Courses" },
  // { tripleTermId: "0x...", subject: "X.com", predicate: "is more inspiring than", object: "YouTube" },
  // { tripleTermId: "0x...", subject: "Binance", predicate: "is better for buying than", object: "OpenSea" },
  // { tripleTermId: "0x...", subject: "YouTube", predicate: "is more entertaining than", object: "FIFA World Cup 2026" },
  // Sofia-specific
  // { tripleTermId: "0x...", subject: "Portal", predicate: "is better for exploration than", object: "Sofia" },
  // Trust
  // { tripleTermId: "0x...", subject: "Instagram", predicate: "is more trustworthy than", object: "X.com" },
  // Cross-category
  // { tripleTermId: "0x...", subject: "YouTube for fun", predicate: "is a better use case than", object: "YouTube for learning" },
  // { tripleTermId: "0x...", subject: "GitHub for work", predicate: "is a better use case than", object: "GitHub for learning" },
  // { tripleTermId: "0x...", subject: "X.com for inspiration", predicate: "is a better use case than", object: "X.com for work" },
]

// ── Intuition Featured Claims (~every 2 weeks) ─────────────────────
// Source: https://portal.intuition.systems/explore/featured

export const INTUITION_FEATURED_CLAIMS: ClaimConfig[] = [
  {
    tripleTermId:
      "0x2af3e7ce733d60c2b1b600eaf853c11f2b255c8e48c6ca04303b929a9ea4bfaf",
    subject: "Claude",
    predicate: "is better than",
    object: "ChatGPT"
  },
  {
    tripleTermId:
      "0x5017baa08fb90afeb8b9f7b3b965bc68d9cd6ec1aa830d611d2ab4b6d2076798",
    subject: "Perplexity",
    predicate: "is better than",
    object: "Google"
  },
  {
    tripleTermId:
      "0x9e8c586c15f0e2ba8b1ca772bdb2acde2fb1558c456aa52833f81ddfdc84c72a",
    subject: "Pineapple",
    predicate: "belongs on",
    object: "Pizza"
  },
  {
    tripleTermId:
      "0xeeba0e2d6de30006cb4a5ddb1e95748c1f65d2c7f59a2d8cf1832e043f53314c",
    subject: "Spotify",
    predicate: "is better than",
    object: "Apple Music"
  }
]

// ── Intuition Featured Lists (~every 2 weeks) ──────────────────────
// Source: https://portal.intuition.systems/explore/featured

export const INTUITION_FEATURED_LISTS: FeaturedListConfig[] = [
  {
    predicateId:
      "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
    objectId:
      "0xa8a4563563d323653974b17a19e919b3307dfff1b3ecb3226121953d5f70beab",
    label: "Top Agent Skills",
    description:
      "The top 50 most installed agent skills from skills.sh - The Open Agent Skills Ecosystem. Reusable capabilities for AI agents including Claude Code, Cursor, GitHub Copilot, and more."
  },
  {
    predicateId:
      "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
    objectId:
      "0x7b0507311976b16426473825f361987d12ee53e62f28f2502d8e9607ea801a2a",
    label: "Best AI Code Editors & IDEs",
    description:
      "Curated list of the best AI-powered code editors and IDEs in 2025. From VS Code with Copilot to purpose-built AI editors like Cursor and Windsurf — which tools are developers actually using to ship faster?"
  }
]
