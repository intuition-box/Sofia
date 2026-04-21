/**
 * PlatformPoolService
 *
 * Singleton store for platform pool deposit split.
 * Mirrors GlobalStakeService pattern exactly.
 * When user certifies a URL, a % of deposit goes to the platform atom vault.
 *
 * Related files:
 * - hooks/usePlatformPool.ts: React hook consumer
 * - lib/config/platformAtomConfig.ts: Platform atom IDs + domain mapping
 */

import { createServiceLogger } from "../utils/logger"
import { getWalletKey } from "../utils/storageKeyUtils"
import {
  PLATFORM_ATOM_IDS,
  DOMAIN_TO_PLATFORM_SLUG,
  PLATFORM_LABELS
} from "../config/platformAtomConfig"
import { extractDomain } from "../utils/domainUtils"

const logger = createServiceLogger("PlatformPoolService")

const FEE_DENOMINATOR = 100000n
const DEFAULT_PERCENTAGE = 10000 // 10%
const MIN_PLATFORM_DEPOSIT = 10000000000000000n // 0.01 TRUST

export interface PlatformPoolState {
  enabled: boolean
  percentage: number
}

class PlatformPoolServiceClass {
  private state: PlatformPoolState = {
    enabled: true,
    percentage: DEFAULT_PERCENTAGE,
  }

  private listeners = new Set<() => void>()
  private currentWallet: string | null = null
  private userPercentageOverride: number | null = null
  private initialized = false

  // ── Store protocol (useSyncExternalStore) ──

  getSnapshot = (): PlatformPoolState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    if (!this.initialized) this.initializeStore()
    return () => this.listeners.delete(listener)
  }

  private emitChange() {
    for (const listener of this.listeners) listener()
  }

  // ── Split calculation ──

  isEnabled(): boolean {
    return this.state.enabled
  }

  getUserPercentage(): number {
    return this.userPercentageOverride ?? DEFAULT_PERCENTAGE
  }

  async setUserPercentage(pct: number): Promise<void> {
    this.userPercentageOverride = pct
    if (this.currentWallet) {
      const key = getWalletKey("pp_user_percentage", this.currentWallet)
      await chrome.storage.local.set({ [key]: pct }).catch(() => {})
    }
  }

  calculateSplit(depositAmount: bigint): {
    mainAmount: bigint
    platformAmount: bigint
  } | null {
    if (!this.isEnabled()) return null

    const pct = this.getUserPercentage()
    if (pct === 0) return null

    const platformAmount =
      (depositAmount * BigInt(pct)) / FEE_DENOMINATOR
    if (platformAmount < MIN_PLATFORM_DEPOSIT) return null

    return {
      mainAmount: depositAmount - platformAmount,
      platformAmount,
    }
  }

  // ── Platform detection ──

  detectPlatformFromUrl(
    url: string
  ): { slug: string; termId: string; label: string } | null {
    const domain = extractDomain(url)
    if (!domain) return null
    return this.getPlatformForDomain(domain)
  }

  getPlatformForDomain(
    domain: string
  ): { slug: string; termId: string; label: string } | null {
    const normalized = domain.toLowerCase()
    const slug = DOMAIN_TO_PLATFORM_SLUG[normalized]
    if (!slug) return null
    const termId = PLATFORM_ATOM_IDS[slug]
    if (!termId) return null
    return { slug, termId, label: PLATFORM_LABELS[slug] || slug }
  }

  // ── Initialization ──

  private initializeStore() {
    if (this.initialized) return
    this.initialized = true

    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "session" && changes.walletAddress) {
          const newWallet =
            changes.walletAddress.newValue?.toLowerCase()
          if (newWallet && newWallet !== this.currentWallet) {
            this.currentWallet = newWallet
            this.loadUserPreference(newWallet)
          }
        }
      })

      // Load initial wallet
      chrome.storage.session
        .get("walletAddress")
        .then((result) => {
          const wallet = result.walletAddress?.toLowerCase()
          if (wallet) {
            this.currentWallet = wallet
            this.loadUserPreference(wallet)
          }
        })
        .catch(() => {})
    } catch {
      // Not in extension context
    }
  }

  private async loadUserPreference(wallet: string) {
    try {
      const key = getWalletKey("pp_user_percentage", wallet)
      const result = await chrome.storage.local.get(key)
      if (result[key] != null) {
        this.userPercentageOverride = result[key]
        logger.debug("Loaded PP user preference", {
          percentage: this.userPercentageOverride,
        })
      }
    } catch {
      // Not in extension context
    }
  }
}

export const platformPoolService = new PlatformPoolServiceClass()
