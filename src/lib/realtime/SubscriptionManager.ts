/**
 * SubscriptionManager — single source of truth for real-time data.
 *
 * Opens one WebSocket connection (via the graphql-ws client in
 * @0xsofia/dashboard-graphql) and subscribes to wallet-scoped queries.
 * Each delta is pushed into the React Query cache via setQueryData(),
 * so components consuming those keys re-render without fetching.
 *
 * If the WS stays offline past FALLBACK_DELAY_MS, an HTTP polling loop
 * takes over using the same onPositionsUpdate pipeline. Connection
 * health flows through wsStatus so the UI can surface a badge.
 *
 * No GraphQL strings live here — DocumentNodes come from the package.
 */

import { print, type DocumentNode } from 'graphql'
import type { QueryClient } from '@tanstack/react-query'
import {
  getWsClient,
  disposeWsClient,
  WatchUserPositionsDocument,
  WatchUserTrackedPositionsDocument,
  useGetUserPositionsQuery,
  type WatchUserPositionsSubscription,
  type WatchUserPositionsSubscriptionVariables,
  type WatchUserTrackedPositionsSubscription,
  type WatchUserTrackedPositionsSubscriptionVariables,
} from '@0xsofia/dashboard-graphql'
import {
  TOPIC_ATOM_IDS,
  CATEGORY_ATOM_IDS,
  PLATFORM_ATOM_IDS,
} from '@/config/atomIds'
import {
  derivePositionsByTopic,
  derivePositionsByCategory,
  derivePositionsByPlatform,
  deriveVerifiedPlatforms,
  deriveUserProfile,
  deriveUserStats,
  realtimeKeys,
} from './derivations'

/** Term ids we always want a live view on, regardless of portfolio size. */
const TRACKED_TERM_IDS: string[] = [
  ...Object.values(TOPIC_ATOM_IDS),
  ...Object.values(CATEGORY_ATOM_IDS),
  ...Object.values(PLATFORM_ATOM_IDS),
]
import {
  markConnecting,
  markConnected,
  markOffline,
  markError,
  getWsStatus,
} from './wsStatus'

function toQueryString(doc: unknown): string {
  if (typeof doc === 'string') return doc
  return print(doc as DocumentNode)
}

/** Grace period before we assume a disconnect is persistent. */
const FALLBACK_DELAY_MS = 30_000
/** Cadence of HTTP polling once the fallback is active. */
const FALLBACK_INTERVAL_MS = 60_000

type Unsubscribe = () => void

export class SubscriptionManager {
  private queryClient: QueryClient
  private walletAddress: string | null = null
  private subscriptions = new Map<string, Unsubscribe>()
  private statusListenerUnsubs: Array<() => void> = []
  private fallbackInterval: ReturnType<typeof setInterval> | null = null
  private fallbackTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  connect(walletAddress: string) {
    const normalized = walletAddress.toLowerCase()
    if (this.walletAddress === normalized) return
    this.disconnect()
    this.walletAddress = normalized
    this.attachStatusListeners()
    this.subscribePositions()
    this.subscribeTrackedPositions()
  }

  disconnect() {
    for (const unsub of this.subscriptions.values()) {
      try { unsub() } catch { /* ignore */ }
    }
    this.subscriptions.clear()
    this.detachStatusListeners()
    this.stopHttpFallback()
    this.walletAddress = null
  }

  /** Dispose the shared WS client. Use on full logout. */
  shutdown() {
    this.disconnect()
    disposeWsClient()
  }

  // ── Status listeners ──────────────────────────────────────────────────────

  private attachStatusListeners() {
    const client = getWsClient()
    markConnecting()

    this.statusListenerUnsubs.push(
      client.on('connecting', () => markConnecting()),
      client.on('connected', () => {
        markConnected()
        this.stopHttpFallback()
      }),
      client.on('closed', (ev) => {
        const reason = typeof ev === 'object' && ev && 'reason' in ev
          ? String((ev as { reason?: unknown }).reason ?? '')
          : undefined
        markOffline(reason)
        this.scheduleHttpFallback()
      }),
      client.on('error', (err) => {
        const reason = err instanceof Error ? err.message : String(err ?? 'unknown')
        markError(reason)
        this.scheduleHttpFallback()
      }),
    )
  }

  private detachStatusListeners() {
    for (const unsub of this.statusListenerUnsubs) {
      try { unsub() } catch { /* ignore */ }
    }
    this.statusListenerUnsubs = []
  }

  // ── HTTP fallback ─────────────────────────────────────────────────────────

  private scheduleHttpFallback() {
    if (this.fallbackTimeout !== null || this.fallbackInterval !== null) return
    this.fallbackTimeout = setTimeout(() => {
      this.fallbackTimeout = null
      // If the WS came back during the grace period, don't start polling.
      if (getWsStatus().status === 'connected') return
      if (!this.walletAddress) return

      if (import.meta.env.DEV) {
        console.warn('[WS] offline for', FALLBACK_DELAY_MS, 'ms — starting HTTP fallback')
      }

      void this.httpFetch()
      this.fallbackInterval = setInterval(() => {
        void this.httpFetch()
      }, FALLBACK_INTERVAL_MS)
    }, FALLBACK_DELAY_MS)
  }

  private stopHttpFallback() {
    if (this.fallbackTimeout !== null) {
      clearTimeout(this.fallbackTimeout)
      this.fallbackTimeout = null
    }
    if (this.fallbackInterval !== null) {
      clearInterval(this.fallbackInterval)
      this.fallbackInterval = null
    }
  }

  private async httpFetch() {
    const wallet = this.walletAddress
    if (!wallet) return
    try {
      const data = await useGetUserPositionsQuery.fetcher({ accountId: wallet })()
      // Same shape as the subscription payload (same fragment).
      this.onPositionsUpdate({ positions: data.positions } as unknown as WatchUserPositionsSubscription)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[WS fallback] HTTP fetch failed', err)
      }
    }
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  private subscribePositions() {
    if (!this.walletAddress) return

    const variables: WatchUserPositionsSubscriptionVariables = {
      accountId: this.walletAddress,
    }

    const unsub = getWsClient().subscribe<WatchUserPositionsSubscription>(
      {
        query: toQueryString(WatchUserPositionsDocument),
        variables,
      },
      {
        next: ({ data }) => {
          if (!data) return
          this.onPositionsUpdate(data)
        },
        error: (err) => {
          console.error('[WS positions] error', err)
        },
        complete: () => {
          console.log('[WS positions] complete')
        },
      },
    )

    this.subscriptions.set('positions', unsub)
  }

  /**
   * Narrower subscription filtered by the ~312 atom term_ids we track
   * (topics + categories + platforms). Hasura caps the generic positions
   * query at 100 rows, which silently drops low-share positions like a
   * 1.5 TRUST stake on a topic. By asking only for the term_ids that feed
   * our per-slug maps, we stay well under the cap and get authoritative
   * real-time updates for those views.
   */
  private subscribeTrackedPositions() {
    if (!this.walletAddress) return

    const variables: WatchUserTrackedPositionsSubscriptionVariables = {
      accountId: this.walletAddress,
      termIds: TRACKED_TERM_IDS,
    }

    const unsub = getWsClient().subscribe<WatchUserTrackedPositionsSubscription>(
      {
        query: toQueryString(WatchUserTrackedPositionsDocument),
        variables,
      },
      {
        next: ({ data }) => {
          if (!data) return
          this.onTrackedPositionsUpdate(data)
        },
        error: (err) => {
          console.error('[WS tracked] error', err)
        },
        complete: () => {
          console.log('[WS tracked] complete')
        },
      },
    )

    this.subscriptions.set('tracked-positions', unsub)
  }

  // ── Cache writers ─────────────────────────────────────────────────────────

  private onPositionsUpdate(data: WatchUserPositionsSubscription) {
    const positions = data.positions ?? []
    const count = positions.length
    const wallet = this.walletAddress
    if (!wallet) return

    const qc = this.queryClient

    // Hasura's anonymous role caps position reads at 100 per query, so a
    // WS push only sees the user's top 100 positions sorted by shares. If
    // we derive and overwrite the per-slug maps from that truncated list,
    // any topic/category/platform whose position has low shares silently
    // disappears from the UI — even after the RPC seed correctly fetched
    // all 14 topic termIds directly.
    //
    // Fix: the WS no longer writes the per-slug maps. Those keys stay
    // authoritative from their own RPC-backed queryFn (useTopicPositions,
    // etc.), which reads the specific termIds regardless of portfolio size.
    // The WS still drives keys that are safe to derive from the top-N
    // payload (profile aggregate, user stats, verified platforms — a user
    // with >100 verified platforms is vanishingly rare).
    try {
      qc.setQueryData(realtimeKeys.positions(wallet), positions)
      qc.setQueryData(realtimeKeys.verifiedPlatforms(wallet), deriveVerifiedPlatforms(positions))
      qc.setQueryData(realtimeKeys.userProfileDerived(wallet), deriveUserProfile(positions))
      qc.setQueryData(realtimeKeys.userStats(wallet), deriveUserStats(positions))
    } catch (err) {
      console.error('[WS positions] derivation/setQueryData failed', err)
    }

    if (import.meta.env.DEV) {
      console.log(`[WS positions] ${count} positions for ${wallet.slice(0, 8)}…`)
    }
  }

  /**
   * Tracked-positions subscription payload. Filtered server-side to the
   * term_ids in TRACKED_TERM_IDS, so the full list fits under Hasura's
   * anonymous-role cap. Derivations here are authoritative for the per-
   * slug maps regardless of the user's total portfolio size.
   */
  private onTrackedPositionsUpdate(data: WatchUserTrackedPositionsSubscription) {
    const positions = data.positions ?? []
    const wallet = this.walletAddress
    if (!wallet) return

    const qc = this.queryClient
    try {
      qc.setQueryData(
        realtimeKeys.topicPositionsMap(wallet),
        derivePositionsByTopic(positions as unknown as Parameters<typeof derivePositionsByTopic>[0]),
      )
      qc.setQueryData(
        realtimeKeys.categoryPositionsMap(wallet),
        derivePositionsByCategory(positions as unknown as Parameters<typeof derivePositionsByCategory>[0]),
      )
      qc.setQueryData(
        ['platform-positions-map', wallet],
        derivePositionsByPlatform(positions as unknown as Parameters<typeof derivePositionsByPlatform>[0]),
      )
    } catch (err) {
      console.error('[WS tracked] derivation/setQueryData failed', err)
    }

    if (import.meta.env.DEV) {
      console.log(`[WS tracked] ${positions.length} tracked positions for ${wallet.slice(0, 8)}…`)
    }
  }
}
