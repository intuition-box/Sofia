/**
 * useReputationScore — Thin facade over scoring engine
 * Computes behavioral reputation from connected platform signals.
 */

import { useState, useEffect, useCallback } from "react"
import { signalNormalizationService } from "~/lib/services"
import {
  calculateReputationProfile,
  calculateDomainScore,
  calculateNicheScore,
  createHookLogger,
} from "~/lib/utils"
import type {
  BehavioralSignal,
  UserReputationProfile,
  DomainScore,
  NicheScore,
} from "~/types/reputation"
import { SOFIA_DOMAINS } from "~/lib/config/taxonomy"

const logger = createHookLogger("useReputationScore")

export interface ReputationScoreResult {
  profile: UserReputationProfile | null
  isLoading: boolean
  lastUpdated: number | null
  refresh: () => void
}

export function useReputationScore(
  walletAddress: string | undefined
): ReputationScoreResult {
  const [profile, setProfile] =
    useState<UserReputationProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] =
    useState<number | null>(null)

  const computeProfile = useCallback(async () => {
    if (!walletAddress) {
      setProfile(null)
      return
    }

    setIsLoading(true)

    try {
      const allSignals: BehavioralSignal[] = []
      const platforms = [
        "youtube",
        "spotify",
        "twitch",
        "discord",
        "twitter",
        "github",
        "reddit",
        "lastfm",
        "chess",
        "strava",
      ]

      for (const platform of platforms) {
        const key = `sync_data_${platform}_${walletAddress}`
        const result =
          await chrome.storage.local.get(key)
        const data = result[key]
        if (data) {
          const signals =
            signalNormalizationService.normalizePlatformData(
              platform,
              data
            )
          allSignals.push(...signals)
        }
      }

      const domainScores: DomainScore[] = []

      for (const domain of SOFIA_DOMAINS) {
        const domainSignals = allSignals.filter(
          (s) =>
            domain.primaryPlatforms.includes(
              s.platformId
            )
        )

        if (domainSignals.length === 0) continue

        const nicheScores: NicheScore[] = []
        for (const cat of domain.categories) {
          for (const niche of cat.niches) {
            const nicheScore = calculateNicheScore(
              niche.id,
              domain.id,
              domainSignals
            )
            if (nicheScore.score > 0) {
              nicheScores.push(nicheScore)
            }
          }
        }

        if (nicheScores.length > 0) {
          domainScores.push(
            calculateDomainScore(
              domain.id,
              nicheScores
            )
          )
        }
      }

      const hasEns = false // TODO: check ENS from wallet
      const reputationProfile =
        calculateReputationProfile(
          walletAddress,
          domainScores,
          hasEns
        )

      setProfile(reputationProfile)
      setLastUpdated(Date.now())
      logger.debug(
        "Profile computed:",
        domainScores.length,
        "domains"
      )
    } catch (err) {
      logger.debug("Error computing profile:", err)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    computeProfile()
  }, [computeProfile])

  return {
    profile,
    isLoading,
    lastUpdated,
    refresh: computeProfile,
  }
}

export function useDomainScore(
  walletAddress: string | undefined,
  domainId: string
): DomainScore | null {
  const { profile } = useReputationScore(walletAddress)

  if (!profile) return null

  return (
    profile.domains.find(
      (d) => d.domainId === domainId
    ) ?? null
  )
}

export function useNicheScore(
  walletAddress: string | undefined,
  domainId: string,
  nicheId: string
): NicheScore | null {
  const domainScore = useDomainScore(
    walletAddress,
    domainId
  )

  if (!domainScore) return null

  return (
    domainScore.topNiches.find(
      (n) => n.nicheId === nicheId
    ) ?? null
  )
}
