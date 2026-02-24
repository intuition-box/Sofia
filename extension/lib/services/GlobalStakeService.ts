/**
 * GlobalStakeService
 *
 * Singleton store for global stake position tracking + split calculation.
 * Uses useSyncExternalStore protocol (same pattern as DiscoveryScoreService).
 *
 * Two responsibilities:
 * 1. Split calculation (pure, used by TripleService for depositBatch)
 * 2. Position tracking via GraphQL (P&L, vault stats)
 *
 * Does NOT handle depositBatch execution — that stays in TripleService.
 */

import { createServiceLogger } from "../utils/logger"
import { GLOBAL_STAKE, SEASON_HISTORY } from "../config/chainConfig"
import { getWalletKey } from "../utils/storageKeyUtils"

import type {
  GlobalStakeConfig,
  GlobalStakePosition,
  GlobalVaultStats,
  SeasonPosition,
  GlobalStakeState
} from "~/types/globalStake"

const logger = createServiceLogger("GlobalStakeService")

const FEE_DENOMINATOR = 100000n

// ── Service ──

class GlobalStakeServiceClass {
  private state: GlobalStakeState = {
    loading: false,
    error: null,
    config: {
      enabled: GLOBAL_STAKE.ENABLED,
      percentage: GLOBAL_STAKE.PERCENTAGE,
      curveId: GLOBAL_STAKE.CURVE_ID,
      termId: GLOBAL_STAKE.TERM_ID,
      seasonName: GLOBAL_STAKE.SEASON_NAME,
      minGlobalDeposit: GLOBAL_STAKE.MIN_GLOBAL_DEPOSIT
    },
    position: null,
    vaultStats: null,
    historicalSeasons: []
  }

  private listeners = new Set<() => void>()
  private fetchInFlight = false
  private currentWallet: string | null = null
  private initialized = false
  private userPercentageOverride: number | null = null

  // ── Store protocol (useSyncExternalStore) ──

  getSnapshot = (): GlobalStakeState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    if (!this.initialized) this.initializeStore()
    return () => this.listeners.delete(listener)
  }

  private updateState(partial: Partial<GlobalStakeState>) {
    this.state = { ...this.state, ...partial }
    for (const listener of this.listeners) listener()
  }

  // ── Split calculation (used by TripleService) ──

  getConfig(): GlobalStakeConfig {
    return this.state.config
  }

  isEnabled(): boolean {
    const config = this.getConfig()
    return config.enabled && !!config.termId && config.termId !== "0x0000000000000000000000000000000000000000000000000000000000000000"
  }

  /** Returns effective percentage: user override > config default */
  getUserPercentage(): number {
    return this.userPercentageOverride ?? this.state.config.percentage
  }

  /** Set user's preferred GS percentage. Persists to chrome.storage.local. */
  async setUserPercentage(pct: number): Promise<void> {
    this.userPercentageOverride = pct
    if (this.currentWallet) {
      const key = getWalletKey("gs_user_percentage", this.currentWallet)
      await chrome.storage.local.set({ [key]: pct }).catch(() => {})
    }
  }

  /**
   * Calculate how much goes to main vault vs global stake vault.
   * Uses user's preferred percentage (override > config default).
   * Returns null if global stake is disabled, percentage is 0, or amount too small.
   */
  calculateSplit(depositAmount: bigint): {
    mainAmount: bigint
    globalAmount: bigint
  } | null {
    if (!this.isEnabled()) return null

    const effectivePercentage = this.getUserPercentage()
    if (effectivePercentage === 0) return null

    const config = this.getConfig()
    const globalAmount = (depositAmount * BigInt(effectivePercentage)) / FEE_DENOMINATOR
    if (globalAmount < config.minGlobalDeposit) return null

    return {
      mainAmount: depositAmount - globalAmount,
      globalAmount
    }
  }

  // ── Position tracking (GraphQL) ──

  async fetchGlobalStakeData(wallet: string): Promise<void> {
    if (!this.isEnabled()) return
    if (this.fetchInFlight) return
    this.fetchInFlight = true

    this.updateState({ loading: true, error: null })

    try {
      const config = this.getConfig()
      const { intuitionGraphqlClient } = await import("../clients/graphql-client")
      const { GetGlobalStakePositionDocument } = await import("@0xsofia/graphql")

      const result = await intuitionGraphqlClient.request(
        GetGlobalStakePositionDocument,
        {
          globalTermId: config.termId,
          curveId: Number(config.curveId),
          walletAddress: wallet.toLowerCase()
        }
      )

      const vault = result?.vaults?.[0]
      if (!vault) {
        this.updateState({
          loading: false,
          position: null,
          vaultStats: null
        })
        return
      }

      const vaultStats: GlobalVaultStats = {
        totalStakers: vault.position_count || 0,
        tvl: BigInt(vault.total_assets || "0"),
        sharePrice: BigInt(vault.current_share_price || "0")
      }

      const userPos = vault.positions?.[0]
      let position: GlobalStakePosition | null = null

      if (userPos && BigInt(userPos.shares || "0") > 0n) {
        const shares = BigInt(userPos.shares)
        const totalDeposited = BigInt(userPos.total_deposit_assets_after_total_fees || "0")
        const totalRedeemed = BigInt(userPos.total_redeem_assets_for_receiver || "0")
        const currentValue = (shares * vaultStats.sharePrice) / (10n ** 18n)
        const netDeposited = totalDeposited - totalRedeemed
        const profitLoss = currentValue - netDeposited

        position = {
          shares,
          currentValue,
          totalDeposited,
          totalRedeemed,
          profitLoss,
          profitPercent: netDeposited > 0n
            ? Number((profitLoss * 10000n) / netDeposited) / 100
            : 0
        }
      }

      // Cache position
      if (wallet) {
        const cacheKey = getWalletKey("global_stake_position", wallet.toLowerCase())
        const tsKey = getWalletKey("global_stake_cache_ts", wallet.toLowerCase())
        await chrome.storage.local.set({
          [cacheKey]: position ? JSON.stringify(position, (_, v) =>
            typeof v === "bigint" ? v.toString() : v
          ) : null,
          [tsKey]: Date.now()
        }).catch(() => {})
      }

      this.updateState({ loading: false, position, vaultStats })
      logger.info("Global stake data fetched", {
        shares: position?.shares?.toString(),
        profitPercent: position?.profitPercent,
        tvl: vaultStats.tvl.toString()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch global stake data"
      logger.error("Failed to fetch global stake data", err)
      this.updateState({ error: msg, loading: false })
    } finally {
      this.fetchInFlight = false
    }
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
        logger.error("Failed to read wallet", err)
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
      this.updateState({
        position: null,
        vaultStats: null,
        loading: false,
        error: null
      })
      return
    }

    this.loadUserPreference(wallet)
    this.loadCachedPosition(wallet)
    this.fetchGlobalStakeData(wallet)
  }

  private async loadUserPreference(wallet: string) {
    try {
      const key = getWalletKey("gs_user_percentage", wallet.toLowerCase())
      const result = await chrome.storage.local.get([key])
      this.userPercentageOverride = result[key] ?? null
    } catch (err) {
      logger.error("Failed to load GS user preference", err)
    }
  }

  private async loadCachedPosition(wallet: string) {
    try {
      const cacheKey = getWalletKey("global_stake_position", wallet.toLowerCase())
      const tsKey = getWalletKey("global_stake_cache_ts", wallet.toLowerCase())
      const result = await chrome.storage.local.get([cacheKey, tsKey])

      const CACHE_TTL = 120_000 // 2 min
      if (result[cacheKey] && Date.now() - (result[tsKey] || 0) < CACHE_TTL) {
        const cached = JSON.parse(result[cacheKey])
        if (cached) {
          const position: GlobalStakePosition = {
            shares: BigInt(cached.shares),
            currentValue: BigInt(cached.currentValue),
            totalDeposited: BigInt(cached.totalDeposited),
            totalRedeemed: BigInt(cached.totalRedeemed),
            profitLoss: BigInt(cached.profitLoss),
            profitPercent: cached.profitPercent
          }
          this.updateState({ position })
        }
      }
    } catch (err) {
      logger.error("Failed to load cached position", err)
    }
  }

  // ── Public API ──

  async refetch(): Promise<void> {
    if (!this.currentWallet) return
    await this.fetchGlobalStakeData(this.currentWallet)
  }

  getSeasonHistory(): SeasonPosition[] {
    return (SEASON_HISTORY as readonly { name: string; termId: string; startDate: number; curveId: bigint }[]).map(s => ({
      name: s.name,
      termId: s.termId,
      position: null // Will be populated when multi-season fetch is implemented
    }))
  }
}

export const globalStakeService = new GlobalStakeServiceClass()
export { GlobalStakeServiceClass }
