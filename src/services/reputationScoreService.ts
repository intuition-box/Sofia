/**
 * Reputation Score Service — computes real scores using platform metrics + signalMatrix formulas.
 *
 * When real metrics are available (from signalFetcherWorkflow), the score is computed
 * using per-platform formulas and topic multipliers. When metrics are unavailable
 * (no_token, token_expired, no_fetcher), the platform is excluded — no fallback points.
 */

import { SOFIA_TOPICS } from '@/config/taxonomy'
import { PLATFORM_CATALOG } from '@/config/platformCatalog'
import {
  SIGNAL_FORMULAS,
  TOPIC_SCORING_MODELS,
  SCORING_PRINCIPLES,
} from '@/config/signalMatrix'
import type {
  ConnectionStatus,
  TopicScore,
  UserReputationProfile,
  SignalFormula,
  TopicScoringModel,
  ScoreBreakdown,
  PlatformContribution,
  TopicScoreExplanation,
} from '@/types/reputation'
import type { SignalResult } from '@/types/signals'

// ── Lookup table for formulas by platformId ──

const FORMULA_BY_PLATFORM = new Map<string, SignalFormula>(
  SIGNAL_FORMULAS.map((f) => [f.platformId, f]),
)

// ── Metric-to-component mapping per platform ──
// Maps each metric key to the scoring component it contributes to.
// Platforms not listed here use a weighted average fallback.

const METRIC_COMPONENTS: Record<string, Record<string, keyof SignalFormula['weights']>> = {
  github: {
    streak_jours: 'regularity',
    commits_moy_quotidien: 'creation',
    repos_actifs: 'creation',
    stars_recus: 'community',
    langages_distincts: 'creation',
    repos_total: 'creation',
    anciennete_mois: 'anciennete',
    followers: 'community',
    following: 'community',
    pull_requests_opened_30d: 'creation',
    issues_opened_30d: 'creation',
  },
  youtube: {
    videos_postees: 'creation',
    vues_totales: 'community',
    subscribers: 'community',
    videos_recentes_90j: 'regularity',
    anciennete_mois: 'anciennete',
    avg_views_per_video: 'community',
    avg_likes_per_video: 'community',
    avg_comments_per_video: 'community',
    playlists_count: 'creation',
    // subscribers_hidden: intentionally unmapped (flag, not a score input)
  },
  spotify: {
    diversite_genres: 'regularity',
    playlists_creees: 'creation',
    top_artists_count: 'community',
    followers: 'community',
    top_tracks_count: 'community',
    avg_track_popularity: 'community',
  },
  discord: {
    serveurs_specialises: 'community',
    roles_obtenus: 'community',
    moderator_guilds: 'community',
    owned_guilds: 'community',
    anciennete_mois: 'anciennete',
  },
  twitch: {
    heures_stream_mois: 'regularity',
    followers: 'community',
    anciennete_mois: 'anciennete',
    is_affiliate: 'monetization',
    is_partner: 'monetization',
    follows_count: 'community',
    subs_count: 'monetization',
  },
  reddit: {
    comment_karma: 'community',
    link_karma: 'creation',
    total_karma: 'community',
    subreddits_actifs: 'community',
    anciennete_mois: 'anciennete',
    trophies: 'community',
    is_gold: 'monetization',
    is_mod: 'community',
  },
  strava: {
    activites_mois: 'regularity',
    km_mois: 'regularity',
    total_km: 'creation',
    followers: 'community',
    friend_count: 'community',
    ytd_runs: 'creation',
    ytd_rides: 'creation',
    anciennete_mois: 'anciennete',
    is_premium: 'monetization',
  },
  soundcloud: {
    tracks_count: 'creation',
    playlist_count: 'creation',
    followers_count: 'community',
    followings_count: 'community',
    reposts_count: 'community',
    public_favorites_count: 'community',
    is_verified: 'monetization',
  },
  mixcloud: {
    cloudcast_count: 'creation',
    favorite_count: 'community',
    follower_count: 'community',
    following_count: 'community',
    listen_count_50: 'community',
    is_pro: 'monetization',
    is_premium: 'monetization',
    anciennete_mois: 'anciennete',
  },
  producthunt: {
    posts_made: 'creation',
    posts_voted: 'community',
    followers_count: 'community',
    followings_count: 'community',
    anciennete_mois: 'anciennete',
  },
  orcid: {
    works: 'creation',
    peer_reviews: 'creation',
    fundings: 'monetization',
    educations: 'creation',
    employments: 'creation',
    anciennete_mois: 'anciennete',
    is_verified_email: 'community',
    is_verified_primary_email: 'community',
  },
  coinbase: {
    assets_distinct: 'community',
    accounts_total: 'community',
    balance_usd: 'monetization',
    anciennete_mois: 'anciennete',
    has_legacy_id: 'anciennete',
  },
  ens: {
    has_primary_ens: 'community',
    domains_owned: 'community',
    wrapped_domains: 'community',
  },
  lido: {
    steth_balance_eth: 'monetization',
    wsteth_balance_eth: 'monetization',
    total_staked_eth: 'monetization',
    is_staker: 'community',
  },
  aave: {
    positions_count: 'community',
    active_deposits: 'monetization',
    active_borrows: 'monetization',
    borrowed_reserves_count: 'community',
    is_user: 'community',
  },
  uniswap: {
    positions_total: 'community',
    positions_active: 'monetization',
    swaps_total: 'regularity',
    swaps_30d: 'regularity',
    swap_volume_usd: 'monetization',
    is_lp: 'community',
    is_trader: 'community',
  },
  snapshot: {
    votes_total: 'community',
    proposals_created: 'creation',
    daos_active: 'community',
    votes_90d: 'regularity',
    proposals_90d: 'regularity',
    is_voter: 'community',
    is_proposer: 'creation',
  },
  'the-graph': {
    is_curator: 'monetization',
    is_delegator: 'monetization',
    is_indexer: 'monetization',
    signals_count: 'community',
    stakes_count: 'community',
  },
  'wallet-siwe': {
    eth_balance: 'monetization',
    tx_count: 'regularity',
    is_active: 'community',
  },
  lens: {
    has_profile: 'community',
    profile_count: 'community',
    posts: 'creation',
    comments: 'creation',
    mirrors: 'community',
    quotes: 'creation',
    publications: 'creation',
    followers: 'community',
    following: 'community',
    collects: 'monetization',
    reactions_received: 'community',
  },
  farcaster: {
    has_account: 'community',
    fid: 'anciennete',
    followers: 'community',
    following: 'community',
    verified_addresses: 'community',
    is_power_badge: 'monetization',
  },
  opensea: {
    nfts_owned: 'community',
    distinct_collections: 'community',
    is_verified: 'monetization',
    has_profile: 'community',
  },
}

// Flag metrics that are NOT score inputs (documented as unmapped)
const METRIC_IGNORE: Record<string, Set<string>> = {
  youtube: new Set(['subscribers_hidden']),
}

// ── Public API ──

export function computeReputationProfile(
  getStatus: (platformId: string) => ConnectionStatus,
  selectedTopics: string[],
  selectedCategories: string[],
  compositeScore?: number | null,
  signals?: Record<string, SignalResult>,
): UserReputationProfile | null {
  const connectedPlatforms = PLATFORM_CATALOG.filter(
    (p) => getStatus(p.id) === 'connected',
  )

  if (connectedPlatforms.length === 0 && selectedTopics.length === 0) {
    return null
  }

  const topicScores: TopicScore[] = SOFIA_TOPICS.filter(
    (d) => selectedTopics.includes(d.id),
  ).map((topic) => {
    const model = TOPIC_SCORING_MODELS[topic.id]
    const topicPlatforms = connectedPlatforms.filter((p) =>
      p.targetTopics.includes(topic.id),
    )

    let totalScore = 0
    let platformsWithSignals = 0
    const contributions: PlatformContribution[] = []

    // 1. Accumulate platform scores
    for (const platform of topicPlatforms) {
      const formula = FORMULA_BY_PLATFORM.get(platform.id)
      const signal = signals?.[platform.id]

      if (signal?.success && signal.metrics && formula) {
        const { score: platformScore, breakdown, topMetrics } =
          computePlatformScoreDetailed(formula, signal.metrics, model)
        totalScore += platformScore
        platformsWithSignals++
        contributions.push({
          platformId: platform.id,
          platformName: platform.name,
          rawContribution: platformScore,
          breakdown,
          topMetrics,
        })
      }
      // Platforms without real signals are excluded — no fallback points
    }

    const platformSubtotal = totalScore

    // 2. Add trust boost from composite score
    const trustBonus = compositeScore ? Math.round(compositeScore * 0.2) : 0
    totalScore += trustBonus

    // 3. Apply anti-fraud AFTER bonuses
    let multiSourceMultiplier = 1
    let multiSourceReason: string
    if (platformsWithSignals === 0) {
      totalScore = Math.min(totalScore, 15)
      multiSourceMultiplier = 0
      multiSourceReason = 'No platform connected — trust-only score capped at 15.'
    } else if (platformsWithSignals === 1) {
      multiSourceMultiplier = SCORING_PRINCIPLES.SINGLE_SOURCE_PENALTY
      totalScore *= multiSourceMultiplier
      multiSourceReason = 'Only 1 platform connected — single-source penalty (×0.5).'
    } else if (platformsWithSignals === 2) {
      multiSourceMultiplier = SCORING_PRINCIPLES.TWO_SOURCE_BONUS
      totalScore *= multiSourceMultiplier
      multiSourceReason = '2 platforms — cross-platform bonus (×1.2).'
    } else {
      multiSourceMultiplier = SCORING_PRINCIPLES.MULTI_SOURCE_BONUS
      totalScore *= multiSourceMultiplier
      multiSourceReason = `${platformsWithSignals} platforms — multi-source bonus (×1.5).`
    }

    // No cap — the score grows with activity so power users stay
    // differentiated. Multi-source multiplier and platform weights still
    // shape the curve; the ceiling is just whatever the user earns.
    const finalScore = Math.round(totalScore)

    const confidence = platformsWithSignals > 0
      ? Math.min(1, platformsWithSignals * SCORING_PRINCIPLES.CROSS_PLATFORM_MIN_CONFIDENCE)
      : 0

    const explanation: TopicScoreExplanation = {
      topicId: topic.id,
      finalScore,
      maxScore: finalScore,
      platformSubtotal: Math.round(platformSubtotal),
      platformContributions: contributions,
      trustBonus,
      platformCount: platformsWithSignals,
      multiSourceMultiplier,
      multiSourceReason,
      preCapScore: finalScore,
      capped: false,
    }

    return {
      topicId: topic.id,
      score: finalScore,
      confidence,
      topNiches: [],
      platformCount: platformsWithSignals,
      lastCalculated: Date.now(),
      explanation,
    }
  })

  return {
    walletAddress: '',
    topics: topicScores,
    globalConfidence: connectedPlatforms.length > 0
      ? Math.min(1, connectedPlatforms.length * 0.1)
      : 0,
    totalPlatforms: connectedPlatforms.length,
    ensName: undefined,
    lastUpdated: Date.now(),
  }
}

// ── Internal: per-platform score computation ──

/**
 * Extended version that returns both the raw score and a breakdown suitable
 * for the "why this score?" modal. The legacy computePlatformScore is kept
 * for backwards compat and delegates here.
 */
function computePlatformScoreDetailed(
  formula: SignalFormula,
  metrics: Record<string, number>,
  model?: TopicScoringModel,
): {
  score: number
  breakdown: ScoreBreakdown
  topMetrics: Array<{ key: string; value: number; component: keyof ScoreBreakdown }>
} {
  const w = formula.weights
  const componentMap = METRIC_COMPONENTS[formula.platformId]
  const ignore = METRIC_IGNORE[formula.platformId]

  const components: ScoreBreakdown = {
    creation: 0,
    regularity: 0,
    community: 0,
    monetization: 0,
    anciennete: 0,
  }
  const metricRows: Array<{ key: string; value: number; component: keyof ScoreBreakdown }> = []

  if (componentMap) {
    for (const [key, value] of Object.entries(metrics)) {
      if (!Number.isFinite(value)) continue
      if (ignore?.has(key)) continue
      const component = componentMap[key]
      if (component) {
        const added = component === 'anciennete'
          ? Math.log(1 + value) * w.anciennete
          : value
        components[component] += added
        metricRows.push({ key, value, component })
      }
    }
  } else {
    const values = Object.values(metrics).filter(Number.isFinite)
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
    components.creation = avg
    components.regularity = avg
    components.community = avg
  }

  let score: number
  if (model) {
    score =
      components.creation * w.creation * model.qualityMultiplier +
      components.regularity * w.regularity * model.regularityMultiplier +
      components.community * w.community +
      components.monetization * w.monetization * model.monetizationMultiplier +
      components.anciennete
  } else {
    score =
      components.creation * w.creation +
      components.regularity * w.regularity +
      components.community * w.community +
      components.monetization * w.monetization +
      components.anciennete
  }

  score *= 1 + formula.burstPenalty * 0.5
  const finalScore = Math.max(0, score)

  const topMetrics = metricRows
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  return { score: finalScore, breakdown: components, topMetrics }
}

function computePlatformScore(
  formula: SignalFormula,
  metrics: Record<string, number>,
  model?: TopicScoringModel,
): number {
  return computePlatformScoreDetailed(formula, metrics, model).score
}
