/**
 * Signal Matrix & Scoring Formulas
 * Converted from docs/prompt/sofia_signal_matrix.xlsx
 *
 * Contains per-platform scoring formulas, topic scoring models,
 * and global scoring principles/constants.
 */

import type {
  SignalFormula,
  TopicScoringModel,
} from "../types/reputation"

// === SIGNAL FORMULAS PER PLATFORM ===

export const SIGNAL_FORMULAS: SignalFormula[] = [
  // === DEVELOPPEMENT ===
  {
    platformId: "github",
    formula:
      "(streak_jours * 1.5) + (commits_moy_quotidien * 3)"
      + " + (repos_actifs * 2) - burst_malus",
    weights: {
      creation: 3,
      regularity: 1.5,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "gitlab",
    formula:
      "github_logic + (pipeline_ci * 2)"
      + " - burst_malus",
    weights: {
      creation: 3,
      regularity: 1.5,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "stackoverflow",
    formula:
      "(reputation / 100) + (reponses_acceptees * 5)"
      + " - ratio_ask_answer_faible",
    weights: {
      creation: 5,
      regularity: 1,
      community: 3,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "npm",
    formula:
      "(nb_packages * 10) + log(telechargements_hebdo)"
      + " - packages_inactifs",
    weights: {
      creation: 10,
      regularity: 1,
      community: 2,
      monetization: 3,
      anciennete: 1,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "pypi",
    formula:
      "(nb_packages * 10) + log(telechargements_hebdo)"
      + " - packages_inactifs",
    weights: {
      creation: 10,
      regularity: 1,
      community: 2,
      monetization: 3,
      anciennete: 1,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "replit",
    formula:
      "(projets_actifs * 2) + (forks_recus * 3)",
    weights: {
      creation: 2,
      regularity: 1,
      community: 3,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "huggingface",
    formula:
      "(modeles * 8) + (likes_recus / 10)"
      + " + (spaces_actifs * 5)",
    weights: {
      creation: 8,
      regularity: 1,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "vercel",
    formula:
      "(deploiements_mois * 2) + (projets_actifs * 3)",
    weights: {
      creation: 3,
      regularity: 2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "netlify",
    formula:
      "(deploiements_mois * 2) + (projets_actifs * 3)",
    weights: {
      creation: 3,
      regularity: 2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "kaggle",
    formula:
      "(medailles_or * 20) + (notebooks_votes * 3)"
      + " + (top_pct_inverse)",
    weights: {
      creation: 8,
      regularity: 1.5,
      community: 3,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "leetcode",
    formula:
      "(hard_resolus * 5) + (medium * 2)"
      + " + (easy * 0.5) + (streak * 1.5)",
    weights: {
      creation: 5,
      regularity: 1.5,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "hackerrank",
    formula:
      "(hard_resolus * 5) + (medium * 2)"
      + " + (easy * 0.5) + (streak * 1.5)",
    weights: {
      creation: 5,
      regularity: 1.5,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === DESIGN / CREATIF ===
  {
    platformId: "figma",
    formula:
      "(fichiers_actifs * 3) + (collaborateurs * 2)"
      + " + (commentaires * 0.5) - activite_recente * 1.5",
    weights: {
      creation: 3,
      regularity: 1.3,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "behance",
    formula:
      "(projets * 5) + (appreciations / 20)"
      + " + (featured * 20)",
    weights: {
      creation: 5,
      regularity: 1.3,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "dribbble",
    formula:
      "(shots * 4) + (likes_recus / 30)"
      + " + (followers / 50)",
    weights: {
      creation: 4,
      regularity: 1.3,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "unsplash",
    formula:
      "(photos * 5) + (telechargements / 100)"
      + " + (vues / 1000)",
    weights: {
      creation: 5,
      regularity: 1.3,
      community: 1,
      monetization: 2,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "500px",
    formula:
      "(pulse_moyen * 2) + (affections / 20)",
    weights: {
      creation: 3,
      regularity: 1.3,
      community: 2,
      monetization: 2,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "deviantart",
    formula:
      "(deviations * 4) + (favourites_recus / 30)"
      + " + (watchers / 50)",
    weights: {
      creation: 4,
      regularity: 1.3,
      community: 2,
      monetization: 2,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === MUSIQUE / AUDIO ===
  {
    platformId: "spotify",
    formula:
      "(diversite_genres * 2) + (playlists_creees * 3)"
      + " + (heures_semaine * 1)",
    weights: {
      creation: 1,
      regularity: 1.2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "soundcloud",
    formula:
      "(tracks * 8) + (plays_recus / 100)"
      + " + (reposts * 2)",
    weights: {
      creation: 8,
      regularity: 1.5,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "mixcloud",
    formula:
      "(mixes * 6) + (ecoutes / 200)"
      + " + (followers / 30)",
    weights: {
      creation: 6,
      regularity: 1.5,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "bandcamp",
    formula:
      "(albums * 10) + (ventes * 5)",
    weights: {
      creation: 10,
      regularity: 1,
      community: 1,
      monetization: 5,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "lastfm",
    formula:
      "(scrobbles_total / 1000) + (diversite_tags * 2)"
      + " + (anciennete_bonus)",
    weights: {
      creation: 0,
      regularity: 1.5,
      community: 1,
      monetization: 0,
      anciennete: 1,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "deezer",
    formula:
      "(playlists_creees * 3) + (heures_semaine * 1)"
      + " + (diversite_genres * 2)",
    weights: {
      creation: 1,
      regularity: 1.2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },

  // === VIDEO / STREAMING ===
  {
    platformId: "youtube",
    formula:
      "(videos_postees * 10) + (vues_totales / 1000)"
      + " + (commentaires_pertinents * 2)",
    weights: {
      creation: 10,
      regularity: 1.5,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "twitch",
    formula:
      "(heures_stream_mois * 2) + (followers / 100)"
      + " + (subs * 10)",
    weights: {
      creation: 5,
      regularity: 2,
      community: 2,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "vimeo",
    formula:
      "(videos * 5) + (vues / 500)",
    weights: {
      creation: 5,
      regularity: 1.3,
      community: 1.5,
      monetization: 2,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === WEB3 / CRYPTO ===
  {
    platformId: "wallet-siwe",
    formula:
      "(tx_uniques * 1) + (protocoles_distincts * 5)"
      + " + (anciennete_mois * 0.5) + (ens_possede * 15)",
    weights: {
      creation: 3,
      regularity: 1.4,
      community: 5,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "lens",
    formula:
      "(posts * 3) + (collects * 5)"
      + " + (follows * 0.2)",
    weights: {
      creation: 3,
      regularity: 1.4,
      community: 5,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "farcaster",
    formula:
      "(casts * 2) + (followers / 20)"
      + " + (anciennete_mois * 0.5)",
    weights: {
      creation: 2,
      regularity: 1.4,
      community: 3,
      monetization: 2,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "coinbase",
    formula:
      "(earn_quizzes * 3) + (assets_distincts * 2)"
      + " + (staking * 5)",
    weights: {
      creation: 2,
      regularity: 1.4,
      community: 1,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "opensea",
    formula:
      "(nfts_mintes * 10) + (volume_vendu_eth * 5)",
    weights: {
      creation: 10,
      regularity: 1,
      community: 2,
      monetization: 5,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "the-graph",
    formula:
      "(protocoles_utilises * 8)"
      + " + log(volume_total_usd)",
    weights: {
      creation: 3,
      regularity: 1.4,
      community: 5,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "snapshot",
    formula:
      "(votes * 2) + (proposals * 10)"
      + " + (daos_actifs * 3)",
    weights: {
      creation: 5,
      regularity: 1.4,
      community: 3,
      monetization: 2,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "ens",
    formula:
      "(has_primary_ens * 20) + (domains_owned * 5)"
      + " + (wrapped_domains * 3)",
    weights: {
      creation: 2,
      regularity: 1,
      community: 5,
      monetization: 1,
      anciennete: 1,
    },
    burstPenalty: -0.05,
  },
  {
    platformId: "lido",
    formula:
      "log(1 + total_staked_eth) * 10"
      + " + (is_staker * 15)",
    weights: {
      creation: 1,
      regularity: 1.2,
      community: 2,
      monetization: 5,
      anciennete: 0.5,
    },
    burstPenalty: -0.05,
  },
  {
    platformId: "aave",
    formula:
      "(active_deposits * 5) + (active_borrows * 8)"
      + " + (positions_count * 2)",
    weights: {
      creation: 2,
      regularity: 1.3,
      community: 3,
      monetization: 5,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "uniswap",
    formula:
      "(positions_active * 10) + log(1 + swap_volume_usd)"
      + " + (swaps_30d * 1)",
    weights: {
      creation: 3,
      regularity: 1.5,
      community: 2,
      monetization: 5,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === RESEAUX SOCIAUX ===
  {
    platformId: "reddit",
    formula:
      "(comment_karma / 100) + (subreddits_actifs * 3)",
    weights: {
      creation: 2,
      regularity: 1.5,
      community: 3,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "discord",
    formula:
      "(serveurs_specialises * 3)"
      + " + (roles_obtenus * 5)",
    weights: {
      creation: 1,
      regularity: 1.5,
      community: 5,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "mastodon",
    formula:
      "(posts * 2) + (followers / 20)"
      + " + (boosts_recus * 1)",
    weights: {
      creation: 2,
      regularity: 1.5,
      community: 3,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "bluesky",
    formula:
      "(posts * 2) + (followers / 20)"
      + " + (likes_recus * 0.5)",
    weights: {
      creation: 2,
      regularity: 1.5,
      community: 3,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === GAMING ===
  {
    platformId: "steam",
    formula:
      "(heures_top_jeu * 2) + (achievements_rare * 3)"
      + " + (reviews_ecrites * 4)",
    weights: {
      creation: 4,
      regularity: 1.2,
      community: 2,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "chess-com",
    formula:
      "(elo * 0.1) + (parties_mois * 1)"
      + " + (streak_jours * 2)",
    weights: {
      creation: 1,
      regularity: 2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "lichess",
    formula:
      "(elo * 0.1) + (parties_mois * 1)"
      + " + (streak_jours * 2)",
    weights: {
      creation: 1,
      regularity: 2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },

  // === EDUCATION / SAVOIR ===
  {
    platformId: "duolingo",
    formula:
      "(streak * 2) + (xp / 100)"
      + " + (langues_actives * 5)",
    weights: {
      creation: 1,
      regularity: 2,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
  {
    platformId: "khan-academy",
    formula:
      "(cours_completes * 3) + (badges * 2)"
      + " + (streak * 1.5)",
    weights: {
      creation: 2,
      regularity: 1.5,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === SCIENCE / RECHERCHE ===
  {
    platformId: "orcid",
    formula:
      "(publications * 10) + (citations / 10)"
      + " + (peer_reviews * 5)",
    weights: {
      creation: 10,
      regularity: 2,
      community: 3,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "semantic-scholar",
    formula:
      "(publications * 8) + (citations / 10)"
      + " + (h_index * 5)",
    weights: {
      creation: 8,
      regularity: 2,
      community: 3,
      monetization: 4,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },
  {
    platformId: "arxiv",
    formula:
      "(preprints * 8) + (categories_actives * 3)",
    weights: {
      creation: 8,
      regularity: 2,
      community: 2,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.1,
  },

  // === ENTREPRENEURIAT ===
  {
    platformId: "producthunt",
    formula:
      "(produits * 10) + (upvotes_total / 20)"
      + " + (featured * 30)",
    weights: {
      creation: 10,
      regularity: 1.5,
      community: 2,
      monetization: 5,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },

  // === SPORT / FITNESS ===
  {
    platformId: "strava",
    formula:
      "(activites_mois * 2) + (km_mois * 0.1)"
      + " + (defis_finis * 3)",
    weights: {
      creation: 2,
      regularity: 1.8,
      community: 1.5,
      monetization: 3,
      anciennete: 0.5,
    },
    burstPenalty: -0.2,
  },
  {
    platformId: "garmin",
    formula:
      "(jours_actifs / 30) * 10 + (vo2max * 1)",
    weights: {
      creation: 1,
      regularity: 1.8,
      community: 1,
      monetization: 0,
      anciennete: 0.5,
    },
    burstPenalty: -0.15,
  },
]

// === TOPIC SCORING MODELS ===

export const TOPIC_SCORING_MODELS: Record<string, TopicScoringModel> = {
  "tech-dev": {
    maxScore: 100,
    regularityMultiplier: 1.5,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 3.0,
  },
  "design-creative": {
    maxScore: 100,
    regularityMultiplier: 1.3,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 3.0,
  },
  "music-audio": {
    maxScore: 100,
    regularityMultiplier: 1.2,
    qualityMultiplier: 2.5,
    monetizationMultiplier: 4.0,
  },
  "video-cinema": {
    maxScore: 100,
    regularityMultiplier: 1.5,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 3.0,
  },
  "web3-crypto": {
    maxScore: 100,
    regularityMultiplier: 1.4,
    qualityMultiplier: 3.0,
    monetizationMultiplier: 4.0,
  },
  "gaming": {
    maxScore: 100,
    regularityMultiplier: 1.2,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 3.0,
  },
  "science": {
    maxScore: 100,
    regularityMultiplier: 2.0,
    qualityMultiplier: 3.0,
    monetizationMultiplier: 4.0,
  },
  "entrepreneurship": {
    maxScore: 100,
    regularityMultiplier: 1.5,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 5.0,
  },
  "sport-health": {
    maxScore: 100,
    regularityMultiplier: 1.8,
    qualityMultiplier: 1.5,
    monetizationMultiplier: 3.0,
  },
  "performing-arts": {
    maxScore: 100,
    regularityMultiplier: 1.3,
    qualityMultiplier: 2.5,
    monetizationMultiplier: 3.5,
  },
  "nature-environment": {
    maxScore: 100,
    regularityMultiplier: 1.5,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 2.0,
  },
  "food-lifestyle": {
    maxScore: 100,
    regularityMultiplier: 1.3,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 3.0,
  },
  "literature": {
    maxScore: 100,
    regularityMultiplier: 1.5,
    qualityMultiplier: 2.5,
    monetizationMultiplier: 3.0,
  },
  "personal-dev": {
    maxScore: 100,
    regularityMultiplier: 1.5,
    qualityMultiplier: 2.0,
    monetizationMultiplier: 3.0,
  },
}

// === SCORING PRINCIPLES (GLOBAL CONSTANTS) ===

export const SCORING_PRINCIPLES = {
  /** Regularite > Burst: 2x/jour pendant 30j = 3x mieux que 60x en 1 jour */
  BURST_PENALTY_THRESHOLD: 0.2,
  /** Creation > Consommation: uploader score 10x plus qu'ecouter */
  CREATION_OVER_CONSUMPTION_RATIO: 10,
  /** Monetisation = multiplicateur min */
  MONETIZATION_MULTIPLIER_MIN: 3,
  /** Monetisation = multiplicateur max */
  MONETIZATION_MULTIPLIER_MAX: 5,
  /** Anti-fraude: score eleve mono-source = suspect */
  SINGLE_SOURCE_PENALTY: 0.5,
  /** Two-source = mild positive signal, closes the 1→3 gap */
  TWO_SOURCE_BONUS: 1.2,
  /** Multi-source = confiance maximale */
  MULTI_SOURCE_BONUS: 1.5,
  /** Anciennete = bonus logarithmique: log(mois_actifs) * 0.5 */
  ANCIENNETE_LOG_FACTOR: 0.5,
  /** ENS = identite stable: bonus fixe +15 pts */
  ENS_BONUS: 15,
  /** Seuil minimum confiance cross-plateforme */
  CROSS_PLATFORM_MIN_CONFIDENCE: 0.3,
} as const

// === INTEGRATION ROADMAP ===

const INTEGRATION_PHASES = {
  0: {
    label: "Existant",
    platforms: [
      "youtube",
      "discord",
      "spotify",
      "twitch",
    ],
  },
  1: {
    label: "Quick Wins",
    platforms: [
      "github",
      "reddit",
      "soundcloud",
      "chess-com",
      "strava",
      "orcid",
      "lastfm",
      "mixcloud",
      "producthunt",
    ],
  },
  2: {
    label: "Domaines cles",
    platforms: [
      "figma",
      "huggingface",
      "kaggle",
      "steam",
      "duolingo",
      "vercel",
      "npm",
      "unsplash",
    ],
  },
  3: {
    label: "Web3 natif",
    platforms: [
      "wallet-siwe",
      "lens",
      "farcaster",
      "opensea",
      "coinbase",
      "the-graph",
    ],
  },
  4: {
    label: "Difficile mais fort",
    platforms: [
      "behance",
      "500px",
      "leetcode",
      "kaggle",
      "bandcamp",
    ],
  },
  5: {
    label: "Partenariats requis",
    platforms: [
      "blizzard",
      "riot-games",
    ],
  },
} as const

