// ── Debate / Vote Configuration ─────────────────────────────────────
// Curated claims and lists for the Vote page.
//
// HOW TO UPDATE:
// - Intuition featured: visit https://portal.intuition.systems/explore/featured
//   Copy the term_ids from claim/list URLs (~every 2 weeks)
// - Sofia claims: create triples on-chain first, then add term_ids here

// ── Types ───────────────────────────────────────────────────────────

export type ClaimCategory = 'tech' | 'web3' | 'culture' | 'geopolitics' | 'energy'

/** Map each interest topic to the claim category it feeds */
export const TOPIC_TO_CLAIM_CATEGORY: Record<string, ClaimCategory> = {
  'tech-dev': 'tech',
  'design-creative': 'tech',
  'science': 'tech',
  'entrepreneurship': 'tech',
  'web3-crypto': 'web3',
  'music-audio': 'culture',
  'gaming': 'culture',
  'video-cinema': 'culture',
  'performing-arts': 'culture',
  'food-lifestyle': 'culture',
  'literature': 'culture',
  'personal-dev': 'culture',
  'sport-health': 'culture',
  'nature-environment': 'energy',
}

export const CLAIM_CATEGORIES: { id: ClaimCategory; label: string; color: string }[] = [
  { id: 'tech', label: 'Tech', color: '#3B82F6' },
  { id: 'web3', label: 'Web3', color: '#8B5CF6' },
  { id: 'culture', label: 'Culture', color: '#F59E0B' },
  { id: 'geopolitics', label: 'Geopolitics', color: '#EF4444' },
  { id: 'energy', label: 'Energy', color: '#10B981' },
]

export interface ClaimConfig {
  tripleTermId: string
  subject: string
  predicate: string
  object: string
  category?: ClaimCategory
}

export interface FeaturedListConfig {
  predicateId: string
  objectId: string
  label: string
  description?: string
}

// ── Sofia Claims (triples created on-chain — term_ids TBD) ──────────

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
]

// ── Intuition Featured Claims (~every 2 weeks) ─────────────────────
// Source: https://portal.intuition.systems/explore/featured

export const INTUITION_FEATURED_CLAIMS: ClaimConfig[] = [
  // ── Tech ──
  { tripleTermId: "0xea977b59434a8ce095928c41063e0d891254aa69ecb6187461df5e2966d1104c", subject: "TikTok", predicate: "is better than", object: "Instagram", category: "culture" },
  { tripleTermId: "0x4df4347905a58880b5f2def324d5fc755441d297c1857bd4b1a09ac0912c6a4d", subject: "Privacy", predicate: "is more important than", object: "safety", category: "tech" },
  { tripleTermId: "0x8065d622d20acd7dc0f83ec6e3af39032c9b2aa8f2bb4092ea7324fc3a42d9bd", subject: "AI", predicate: "harms", object: "human cognition", category: "tech" },
  { tripleTermId: "0xfb16f96b190c4808b441a7263e25371978256a027ba0108334be2e57059c0986", subject: "Unchecked AI development", predicate: "threatens", object: "public safety", category: "tech" },
  { tripleTermId: "0xdcc0f0ea076e4d7ac81d768c591434d5c7b6faaefc19ed723467155126ec7b83", subject: "AI-generated content", predicate: "requires", object: "mandatory disclosure", category: "tech" },
  { tripleTermId: "0xfdeef36c2e763016e49394087ecc931472ff3decdd4384c2e073bf46b86966d3", subject: "Self-driving cars", predicate: "are more dangerous than", object: "human drivers", category: "tech" },
  { tripleTermId: "0xbc6ffffabb93295ee32bf6805ad858b9b5e13db4528fe3cf760ca29a5b2197cf", subject: "Robots", predicate: "will replace", object: "surgeons", category: "tech" },
  // ── Web3 ──
  { tripleTermId: "0xa67fdbdc8bef000273a9436e2fd2fb8a4b1f8a152734e5c6fc38a8e42ca92188", subject: "TradFi adoption", predicate: "benefits", object: "the crypto ecosystem", category: "web3" },
  { tripleTermId: "0xba4a755d736eac310aa2ea046b77213f3309487a863f5e3b6c0cdfc0d24a505e", subject: "Memecoins", predicate: "benefits", object: "the crypto ecosystem", category: "web3" },
  { tripleTermId: "0xd44532d46796c847beea77dcbf339bb0894d0e90cd94ef89cea6d9a8754cfd82", subject: "Bitcoin", predicate: "hedges against", object: "geopolitical risk", category: "web3" },
  { tripleTermId: "0xfd363d369f98be03013b4f4dbae3b2dc84fe9cf9c8512178319edb776f7f8ac6", subject: "Crypto", predicate: "will replace", object: "traditional banks", category: "web3" },
  // ── Culture ──
  { tripleTermId: "0x2b33fbc2778c2ec35c5f5b43c86ac2ccb6e2a6d394749297232cff88c8acbcec", subject: "College", predicate: "is essential for", object: "career success", category: "culture" },
  { tripleTermId: "0x937974c72204675d26b790696fc87448d79506dc7409d3cf916ed8749167d296", subject: "AI-generated music", predicate: "should be excluded from", object: "streaming platforms", category: "culture" },
  { tripleTermId: "0x392159a5f5c4dc5b82decf8dcdc4437e36da26a8e86bdc03ea0d7fc54fe50262", subject: "Sinners", predicate: "deserves", object: "Best Picture", category: "culture" },
  { tripleTermId: "0x6ab7ad5804e4aee49f6c779b979e312159ff57a1315b2bcda6d18260d19d0efa", subject: "The Oscars", predicate: "remain", object: "culturally relevant", category: "culture" },
  // ── Geopolitics ──
  { tripleTermId: "0x1048d893a4ad421fda6e0404a994d405e063797ccb3b950d6b2efb74945a6eca", subject: "China", predicate: "leads in", object: "the space race", category: "geopolitics" },
  { tripleTermId: "0x4297365d40f284f0fb65633d61caa65e6a1f7ec07d3747444ad7fb18a108a59e", subject: "The US", predicate: "leads in", object: "the space race", category: "geopolitics" },
  { tripleTermId: "0x8c91a05ec714b13098c5719a0a1e697434823ab50d134aaf66133e1de79031fc", subject: "The US", predicate: "should go to war with", object: "Iran", category: "geopolitics" },
  { tripleTermId: "0x80c046c2db63c6eb3ce6e800f1da0556574c69656bef8c084b3145628fe154d0", subject: "The Iranian regime", predicate: "threatens", object: "global stability", category: "geopolitics" },
  // ── Energy ──
  { tripleTermId: "0x751b783abd233d6879a84824d2259968ab85e2148005eb3bcbd4f325c5f2fa22", subject: "Oil", predicate: "is more important than", object: "all other natural resources", category: "energy" },
  { tripleTermId: "0x62b5baa5d59b7b39f3a3a5efde57233e8155c4294d7b5815b49f8c7e44935a7b", subject: "Nuclear energy", predicate: "solves", object: "the energy crisis", category: "energy" },
  { tripleTermId: "0x28b8b4480dea9326c88b3cedb694ce6bd6881376320d12fe32fdff0232859b09", subject: "Fossil fuel dependence", predicate: "threatens", object: "the planet", category: "energy" },
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
      "The top 50 most installed agent skills from skills.sh - The Open Agent Skills Ecosystem.",
  },
  {
    predicateId:
      "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
    objectId:
      "0x7b0507311976b16426473825f361987d12ee53e62f28f2502d8e9607ea801a2a",
    label: "Best AI Code Editors & IDEs",
    description:
      "Curated list of the best AI-powered code editors and IDEs in 2025.",
  },
]
