/**
 * Scoring Engine — Pure functions for behavioral reputation scoring
 * ZERO side effects, ZERO state.
 *
 * Formula: score_niche = (creation * 3) + (regularity * streak)
 *   + (community * 1.5) + (monetization * 4) + log(anciennete) * 0.5
 */

import type {
  BehavioralSignal,
  NicheScore,
  DomainScore,
  ScoreBreakdown,
  UserReputationProfile,
  SignalType,
} from "~/types/reputation"
import {
  SCORING_PRINCIPLES,
  FORMULA_BY_PLATFORM,
  DOMAIN_SCORING_MODELS,
} from "~/lib/config/signalMatrix"

/**
 * Normalise un signal brut (0-100) selon le type et la plateforme
 */
export function normalizeSignal(
  platformId: string,
  signalType: SignalType,
  rawValue: number
): number {
  const formula = FORMULA_BY_PLATFORM.get(platformId)
  if (!formula) return Math.min(rawValue, 100)

  const weight = formula.weights[signalType] || 1
  const normalized = Math.min((rawValue * weight) / 10, 100)
  return Math.max(0, Math.round(normalized * 100) / 100)
}

/**
 * Applique le malus burst : si toute l'activite est concentree
 * sur < 3 jours, applique un penalty de -20%
 */
export function calculateBurstPenalty(
  signals: BehavioralSignal[]
): number {
  if (signals.length === 0) return 0

  const timestamps = signals.map((s) => s.fetchedAt)
  const minTime = Math.min(...timestamps)
  const maxTime = Math.max(...timestamps)

  const daySpan =
    (maxTime - minTime) / (1000 * 60 * 60 * 24)

  if (daySpan < 3 && signals.length > 5) {
    return SCORING_PRINCIPLES.BURST_PENALTY_THRESHOLD
  }

  return 0
}

/**
 * Calcule le bonus d'anciennete : log(mois_actifs) * 0.5
 */
export function calculateAncienneteBonus(
  accountCreatedAt: number
): number {
  const now = Date.now()
  const monthsActive =
    (now - accountCreatedAt) / (1000 * 60 * 60 * 24 * 30)

  if (monthsActive <= 0) return 0

  return (
    Math.log(monthsActive) *
    SCORING_PRINCIPLES.ANCIENNETE_LOG_FACTOR
  )
}

/**
 * Calcule la coherence cross-plateforme pour un domaine
 * Score eleve sur 1 seule plateforme = suspect (penalty 0.5)
 * Score coherent sur 2+ plateformes = confiance maximale (bonus 1.5)
 */
export function calculateCrossSourceConfidence(
  signals: BehavioralSignal[]
): number {
  const platformIds = new Set(
    signals.map((s) => s.platformId)
  )
  const platformCount = platformIds.size

  if (platformCount === 0) return 0

  if (platformCount === 1) {
    return SCORING_PRINCIPLES.SINGLE_SOURCE_PENALTY
  }

  const confidenceBonus = Math.min(
    SCORING_PRINCIPLES.MULTI_SOURCE_BONUS,
    0.5 + platformCount * 0.25
  )

  return confidenceBonus
}

/**
 * Calcule le breakdown des scores par type de signal
 */
function computeBreakdown(
  signals: BehavioralSignal[]
): ScoreBreakdown {
  const byType: Record<SignalType, number[]> = {
    creation: [],
    regularity: [],
    community: [],
    monetization: [],
    consumption: [],
  }

  for (const signal of signals) {
    byType[signal.signalType].push(signal.normalizedValue)
  }

  const avg = (values: number[]): number =>
    values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0

  return {
    creation: avg(byType.creation),
    regularity: avg(byType.regularity),
    community: avg(byType.community),
    monetization: avg(byType.monetization),
    anciennete: avg(byType.consumption),
  }
}

/**
 * Calcule le score brut d'une niche a partir des signaux
 * Formula: (creation * 3) + (regularity * streak)
 *   + (community * 1.5) + (monetization * 4)
 *   + log(anciennete) * 0.5
 */
export function calculateNicheScore(
  nicheId: string,
  domainId: string,
  signals: BehavioralSignal[]
): NicheScore {
  if (signals.length === 0) {
    return {
      nicheId,
      domainId,
      score: 0,
      confidence: 0,
      breakdown: {
        creation: 0,
        regularity: 0,
        community: 0,
        monetization: 0,
        anciennete: 0,
      },
      sources: [],
      lastCalculated: Date.now(),
    }
  }

  const breakdown = computeBreakdown(signals)
  const burstPenalty = calculateBurstPenalty(signals)
  const confidence =
    calculateCrossSourceConfidence(signals)

  const rawScore =
    breakdown.creation * 3 +
    breakdown.regularity * 1.5 +
    breakdown.community * 1.5 +
    breakdown.monetization * 4 +
    breakdown.anciennete * 0.5

  const penalizedScore =
    rawScore * (1 - burstPenalty)

  const score = Math.min(
    100,
    Math.max(0, Math.round(penalizedScore * 100) / 100)
  )

  const sources = [
    ...new Set(signals.map((s) => s.platformId)),
  ]

  return {
    nicheId,
    domainId,
    score,
    confidence,
    breakdown,
    sources,
    lastCalculated: Date.now(),
  }
}

/**
 * Calcule le score d'un domaine (moyenne ponderee des niches)
 */
export function calculateDomainScore(
  domainId: string,
  nicheScores: NicheScore[]
): DomainScore {
  if (nicheScores.length === 0) {
    return {
      domainId,
      score: 0,
      confidence: 0,
      topNiches: [],
      platformCount: 0,
      lastCalculated: Date.now(),
    }
  }

  const model = DOMAIN_SCORING_MODELS[domainId]

  const sorted = [...nicheScores].sort(
    (a, b) => b.score - a.score
  )
  const topNiches = sorted.slice(0, 3)

  const totalWeight = nicheScores.reduce(
    (sum, ns) => sum + ns.confidence,
    0
  )
  const weightedScore =
    totalWeight > 0
      ? nicheScores.reduce(
          (sum, ns) => sum + ns.score * ns.confidence,
          0
        ) / totalWeight
      : nicheScores.reduce(
          (sum, ns) => sum + ns.score,
          0
        ) / nicheScores.length

  let finalScore = weightedScore
  if (model) {
    finalScore = Math.min(
      model.maxScore,
      finalScore * model.qualityMultiplier
    )
  }

  const allSources = new Set(
    nicheScores.flatMap((ns) => ns.sources)
  )

  const avgConfidence =
    nicheScores.reduce(
      (sum, ns) => sum + ns.confidence,
      0
    ) / nicheScores.length

  return {
    domainId,
    score: Math.round(finalScore * 100) / 100,
    confidence:
      Math.round(avgConfidence * 100) / 100,
    topNiches,
    platformCount: allSources.size,
    lastCalculated: Date.now(),
  }
}

/**
 * Calcule le profil de reputation complet
 */
export function calculateReputationProfile(
  walletAddress: string,
  domainScores: DomainScore[],
  hasEns: boolean
): UserReputationProfile {
  const allPlatforms = new Set(
    domainScores.flatMap((ds) =>
      ds.topNiches.flatMap((ns) => ns.sources)
    )
  )

  const globalConfidence =
    domainScores.length > 0
      ? domainScores.reduce(
          (sum, ds) => sum + ds.confidence,
          0
        ) / domainScores.length
      : 0

  const domains = domainScores.map((ds) => {
    if (hasEns) {
      return {
        ...ds,
        score: Math.min(
          100,
          ds.score + SCORING_PRINCIPLES.ENS_BONUS
        ),
      }
    }
    return ds
  })

  return {
    walletAddress,
    domains,
    globalConfidence:
      Math.round(globalConfidence * 100) / 100,
    totalPlatforms: allPlatforms.size,
    lastUpdated: Date.now(),
  }
}

/**
 * Determine le signal type dominant pour une plateforme
 */
export function getDominantSignalType(
  signals: BehavioralSignal[]
): SignalType {
  if (signals.length === 0) return "consumption"

  const totals: Record<SignalType, number> = {
    creation: 0,
    regularity: 0,
    community: 0,
    monetization: 0,
    consumption: 0,
  }

  for (const signal of signals) {
    totals[signal.signalType] += signal.normalizedValue
  }

  let dominant: SignalType = "consumption"
  let maxTotal = 0

  for (const [type, total] of Object.entries(totals)) {
    if (total > maxTotal) {
      maxTotal = total
      dominant = type as SignalType
    }
  }

  return dominant
}
