/**
 * DiscoveryScoreService
 *
 * Singleton store for discovery score calculation.
 * Manages wallet-reactive state, paginated GraphQL fetches,
 * and Gold sync — extracted from useDiscoveryScore hook.
 *
 * Related files:
 * - hooks/useDiscoveryScore.ts: React hook consumer (useSyncExternalStore)
 * - lib/utils/discoveryUtils.ts: pure calculation functions
 * - lib/config/predicateConstants.ts: predicate label constants
 */

import { intuitionGraphqlClient } from "../clients/graphql-client"
import type { UserDiscoveryStats } from "../../types/discovery"
import { goldService } from "./GoldService"
import { createServiceLogger } from "../utils/logger"
import { CERTIFICATION_PREDICATE_LABELS } from "../config/predicateConstants"
import {
  buildPagePositionMap,
  calculateDiscoveryRanking,
  calculateDiscoveryGold,
  buildDiscoveryStats
} from "../utils/discoveryUtils"
import {
  UserIntentionTriplesDocument,
  AllIntentionTriplesDocument,
  type UserIntentionTriplesQuery,
  type AllIntentionTriplesQuery
} from "@0xsofia/graphql"

const logger = createServiceLogger("DiscoveryScoreService")

// Types extracted from generated query results
type UserTripleResult = UserIntentionTriplesQuery["triples"][number]
type AllTripleResult = AllIntentionTriplesQuery["triples"][number]

export interface DiscoveryState {
  stats: UserDiscoveryStats | null
  loading: boolean
  error: string | null
  claimedDiscoveryGold: number
}

class DiscoveryScoreServiceClass {
  private state: DiscoveryState = {
    stats: null,
    loading: false,
    error: null,
    claimedDiscoveryGold: 0
  }

  private listeners = new Set<() => void>()
  private fetchInFlight = false
  private currentWallet: string | null = null
  private initialized = false

  // ── Store protocol (useSyncExternalStore) ──

  getSnapshot = (): DiscoveryState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    if (!this.initialized) this.initializeStore()
    return () => this.listeners.delete(listener)
  }

  private updateState(partial: Partial<DiscoveryState>) {
    this.state = { ...this.state, ...partial }
    for (const listener of this.listeners) listener()
  }

  // ── Core fetch logic ──

  private async fetchDiscoveryScore(walletAddress: string) {
    if (this.fetchInFlight) return
    this.fetchInFlight = true

    console.log("🔍 [DiscoveryScore] Starting fetch with:", {
      walletAddress,
      predicateLabels: CERTIFICATION_PREDICATE_LABELS
    })

    this.updateState({ loading: true, error: null })

    try {
      const userAddress = walletAddress.toLowerCase()

      logger.debug("Fetching discovery score", { userAddress })

      const [userTriples, allTriples] = await Promise.all([
        intuitionGraphqlClient.fetchAllPages<UserTripleResult>(
          UserIntentionTriplesDocument,
          { predicateLabels: CERTIFICATION_PREDICATE_LABELS, userAddress },
          "triples",
          100,
          100
        ),
        intuitionGraphqlClient.fetchAllPages<AllTripleResult>(
          AllIntentionTriplesDocument,
          { predicateLabels: CERTIFICATION_PREDICATE_LABELS },
          "triples",
          100,
          100
        )
      ])

      console.log("🔍 [DiscoveryScore] Paginated results:", {
        userTriples: userTriples.length,
        allTriples: allTriples.length
      })

      // Debug: show all predicate labels found vs what we're looking for
      const foundPredicateLabels = new Set<string>()
      for (const triple of allTriples) {
        if (triple.predicate?.label) foundPredicateLabels.add(triple.predicate.label)
      }
      console.log("🔍 [DiscoveryScore] Predicate labels we search for:", CERTIFICATION_PREDICATE_LABELS)
      console.log("🔍 [DiscoveryScore] Predicate labels found in results:", Array.from(foundPredicateLabels))

      // Debug: show all account_ids in positions to compare with userAddress
      const allAccountIds = new Set<string>()
      for (const triple of allTriples) {
        for (const pos of triple.positions || []) {
          if (pos.account_id) allAccountIds.add(pos.account_id)
        }
      }
      console.log("🔍 [DiscoveryScore] All position account_ids:", Array.from(allAccountIds))
      console.log("🔍 [DiscoveryScore] Looking for userAddress:", userAddress)

      console.log("🔍 [DiscoveryScore] Found triples:", {
        userTriples: userTriples.length,
        allTriples: allTriples.length,
        userTriplesData: userTriples
      })

      logger.debug("Found triples", {
        userTriples: userTriples.length,
        allTriples: allTriples.length
      })

      // Calculate discovery ranking using extracted utils
      const pagePositionMap = buildPagePositionMap(allTriples)
      const ranking = calculateDiscoveryRanking(userTriples, pagePositionMap, userAddress)
      const gold = calculateDiscoveryGold(ranking)
      const discoveryStats = buildDiscoveryStats(ranking, gold)

      // Sync computed discovery Gold total to storage so useGoldSystem reflects reality.
      // Only update if on-chain total >= stored value to preserve optimistic claims
      const computedTotal = discoveryStats.discoveryGold.total
      const storedGold = this.state.claimedDiscoveryGold
      if (computedTotal >= storedGold) {
        await goldService.setDiscoveryGold(walletAddress, computedTotal)
        this.updateState({ stats: discoveryStats, loading: false, claimedDiscoveryGold: computedTotal })
      } else {
        this.updateState({ stats: discoveryStats, loading: false })
      }

      logger.info("Discovery score calculated", {
        pioneerCount: ranking.pioneerCount,
        explorerCount: ranking.explorerCount,
        contributorCount: ranking.contributorCount,
        totalGold: discoveryStats.discoveryGold.total
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch discovery score"
      logger.error("Failed to fetch discovery score", err)
      this.updateState({ error: errorMessage, loading: false })
    } finally {
      this.fetchInFlight = false
    }
  }

  // ── Claimed Gold management ──

  private async loadClaimedGold(walletAddress: string) {
    try {
      const key = `discovery_gold_${walletAddress}`
      const result = await chrome.storage.local.get([key])
      const gold = result[key] || 0
      this.updateState({ claimedDiscoveryGold: gold })
      logger.debug("Loaded claimed discovery Gold from storage", { gold, walletAddress })
    } catch (err) {
      logger.error("Failed to load claimed discovery Gold", err)
    }
  }

  async claimGold(goldAmount: number): Promise<number> {
    if (!this.currentWallet) return this.state.claimedDiscoveryGold
    const key = `discovery_gold_${this.currentWallet}`
    const newTotal = this.state.claimedDiscoveryGold + goldAmount
    await chrome.storage.local.set({ [key]: newTotal })
    this.updateState({ claimedDiscoveryGold: newTotal })
    logger.info("Claimed discovery Gold", { goldAmount, newTotal, walletAddress: this.currentWallet })
    return newTotal
  }

  // ── Store initialization (wallet-reactive) ──

  private initializeStore() {
    if (this.initialized) return
    this.initialized = true

    chrome.storage.session
      .get(["walletAddress"])
      .then((result) => {
        const wallet = result.walletAddress || null
        this.handleWalletChange(wallet)
      })
      .catch((err) => {
        console.error("[DiscoveryScoreService] Failed to read wallet:", err)
      })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "session" && changes.walletAddress) {
        const wallet = changes.walletAddress.newValue || null
        this.handleWalletChange(wallet)
      }
    })
  }

  private handleWalletChange(wallet: string | null) {
    const normalized = wallet ? wallet.toLowerCase() : null
    if (normalized === this.currentWallet) return
    this.currentWallet = normalized

    if (!wallet) {
      this.updateState({ stats: null, loading: false, error: null, claimedDiscoveryGold: 0 })
      return
    }

    this.loadClaimedGold(wallet)
    this.fetchDiscoveryScore(wallet)
  }

  // ── Public API ──

  async refetch(): Promise<void> {
    if (!this.currentWallet) return
    await this.fetchDiscoveryScore(this.currentWallet)
  }
}

export const discoveryScoreService = new DiscoveryScoreServiceClass()
export { DiscoveryScoreServiceClass }
