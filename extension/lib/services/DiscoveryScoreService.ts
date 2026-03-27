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
import { txEventBus } from "./TxEventBus"
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
  TriplePositionsByObjectsDocument,
  type UserIntentionTriplesQuery,
  type TriplePositionsByObjectsQuery
} from "@0xsofia/graphql"

const logger = createServiceLogger("DiscoveryScoreService")

// Types extracted from generated query results
type UserTripleResult = UserIntentionTriplesQuery["triples"][number]
type PositionTripleResult = TriplePositionsByObjectsQuery["triples"][number]

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

      // Step 1: Fetch user's certifications
      const userTriples = await intuitionGraphqlClient.fetchAllPages<UserTripleResult>(
        UserIntentionTriplesDocument,
        { predicateLabels: CERTIFICATION_PREDICATE_LABELS, userAddress },
        "triples",
        100,
        100
      )

      if (userTriples.length === 0) {
        logger.debug("No user triples found")
        this.updateState({ stats: buildDiscoveryStats(
          { pioneerCount: 0, explorerCount: 0, contributorCount: 0, totalCertifications: 0,
            intentionBreakdown: { for_work: 0, for_learning: 0, for_fun: 0, for_inspiration: 0, for_buying: 0, for_music: 0 },
            trustBreakdown: { trusted: 0, distrusted: 0 } },
          { fromPioneer: 0, fromExplorer: 0, fromContributor: 0, total: 0 }
        ), loading: false })
        return
      }

      // Step 2: Extract unique object term_ids
      const objectTermIds = [...new Set(
        userTriples.map(t => t.object?.term_id).filter((id): id is string => !!id)
      )]

      // Step 3: Fetch positions only for user's certified pages
      const positionTriples = await intuitionGraphqlClient.fetchAllPages<PositionTripleResult>(
        TriplePositionsByObjectsDocument,
        { predicateLabels: CERTIFICATION_PREDICATE_LABELS, objectTermIds },
        "triples",
        100,
        100
      )

      logger.debug("Found triples", {
        userTriples: userTriples.length,
        scopedPages: objectTermIds.length,
        positionTriples: positionTriples.length
      })

      // Step 4: Calculate ranking from scoped data
      const pagePositionMap = buildPagePositionMap(positionTriples)
      const ranking = calculateDiscoveryRanking(userTriples, pagePositionMap)
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

    // Refetch on certification TX events
    txEventBus.on("certification", () => this.refetch())
    txEventBus.on("batch_certification", () => this.refetch())
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
