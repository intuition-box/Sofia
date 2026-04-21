/**
 * SubscriptionManager — single source of truth for real-time data.
 *
 * Opens one WebSocket connection (via the graphql-ws client in
 * @0xsofia/graphql) and subscribes to wallet-scoped queries. Each delta
 * is pushed into the React Query cache via setQueryData(), so components
 * consuming those keys re-render without fetching.
 *
 * Phase 1.B scope:
 * - Lifecycle: connect(wallet), disconnect(), shutdown()
 * - Status tracking via wsStatus (feeds Phase 5 offline badge)
 * - Logs payloads to prove the WS works — cache writes go through
 *   stub derivations (Phase 3 fills them in)
 *
 * Phase 5 will add:
 * - HTTP fallback after 30s offline grace period (needs a
 *   GetUserPositions HTTP query added to @0xsofia/graphql first)
 */

import { print, type DocumentNode } from "graphql"
import type { QueryClient } from "@tanstack/react-query"
import {
  getWsClient,
  disposeWsClient,
  WatchUserPositionsDocument,
  WatchUserTrackedPositionsDocument,
  type WatchUserPositionsSubscription,
  type WatchUserPositionsSubscriptionVariables,
  type WatchUserTrackedPositionsSubscription,
  type WatchUserTrackedPositionsSubscriptionVariables
} from "@0xsofia/graphql"
import {
  derivePositionsByTopic,
  derivePositionsByCategory,
  derivePositionsByPlatform,
  deriveVerifiedPlatforms,
  deriveUserProfile,
  deriveUserStats,
  // Sofia-specific (Phase 3.A)
  deriveTrustCircle,
  deriveFollowing,
  deriveDailyStreak,
  deriveVerifiedOAuthPlatforms,
  deriveIntentionGroups,
  deriveGlobalStakePosition,
  realtimeKeys
} from "./derivations"
import {
  DAILY_CERTIFICATION_ATOM_ID,
  DAILY_VOTE_ATOM_ID,
  GLOBAL_STAKE
} from "~/lib/config/chainConfig"
import {
  markConnecting,
  markConnected,
  markOffline,
  markError
} from "./wsStatus"

/**
 * Atom term_ids to subscribe to via WatchUserTrackedPositions (in addition
 * to the top-500 positions sub). These are atoms where the user's position
 * matters for live UI but might otherwise be missed if the user has >500
 * positions and this one sits below the cap (1 TRUST stake on a daily atom
 * is trivially buried under certification triples with larger shares).
 *
 * Contents:
 * - DAILY_CERTIFICATION_ATOM_ID → powers deriveDailyStreak.certifiedToday
 * - DAILY_VOTE_ATOM_ID → powers deriveDailyStreak.votedToday
 * - GLOBAL_STAKE.TERM_ID → powers deriveGlobalStakePosition (Beta pool)
 *
 * Future candidates (require dynamic resolution, not hardcoded):
 * - The user's Account atom term_id → drives followers count (requires an
 *   initial HTTP fetch via findAccountAtom(walletAddress) at connect time)
 */
const TRACKED_TERM_IDS: string[] = [
  DAILY_CERTIFICATION_ATOM_ID,
  DAILY_VOTE_ATOM_ID,
  GLOBAL_STAKE.TERM_ID
]

const toQueryString = (doc: unknown): string => {
  if (typeof doc === "string") return doc
  return print(doc as DocumentNode)
}

type Unsubscribe = () => void

export class SubscriptionManager {
  private queryClient: QueryClient
  private walletAddress: string | null = null
  private subscriptions = new Map<string, Unsubscribe>()
  private statusListenerUnsubs: Array<() => void> = []

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
    if (TRACKED_TERM_IDS.length > 0) {
      this.subscribeTrackedPositions()
    }
  }

  disconnect() {
    for (const unsub of this.subscriptions.values()) {
      try {
        unsub()
      } catch {
        /* ignore */
      }
    }
    this.subscriptions.clear()
    this.detachStatusListeners()
    this.walletAddress = null
  }

  /** Dispose the shared WS client. Use on full logout or offscreen unmount. */
  shutdown() {
    this.disconnect()
    disposeWsClient()
  }

  // ── Status listeners ──────────────────────────────────────────────────────

  private attachStatusListeners() {
    const client = getWsClient()
    markConnecting()

    this.statusListenerUnsubs.push(
      client.on("connecting", () => markConnecting()),
      client.on("connected", () => markConnected()),
      client.on("closed", (ev) => {
        const reason =
          typeof ev === "object" && ev && "reason" in ev
            ? String((ev as { reason?: unknown }).reason ?? "")
            : undefined
        markOffline(reason)
      }),
      client.on("error", (err) => {
        const reason =
          err instanceof Error ? err.message : String(err ?? "unknown")
        markError(reason)
      })
    )
  }

  private detachStatusListeners() {
    for (const unsub of this.statusListenerUnsubs) {
      try {
        unsub()
      } catch {
        /* ignore */
      }
    }
    this.statusListenerUnsubs = []
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  private subscribePositions() {
    if (!this.walletAddress) return

    const variables: WatchUserPositionsSubscriptionVariables = {
      accountId: this.walletAddress
    }

    const unsub = getWsClient().subscribe<WatchUserPositionsSubscription>(
      {
        query: toQueryString(WatchUserPositionsDocument),
        variables
      },
      {
        next: ({ data }) => {
          if (!data) return
          this.onPositionsUpdate(data)
        },
        error: (err) => {
          console.error("[WS positions] error", err)
        },
        complete: () => {
          console.log("[WS positions] complete")
        }
      }
    )

    this.subscriptions.set("positions", unsub)
  }

  /**
   * Narrower subscription filtered server-side by term_id. Used for
   * positions that would otherwise be truncated by Hasura's 500-row cap
   * on the main positions sub — ensures low-share positions on tracked
   * atoms always arrive.
   *
   * Phase 1.B: TRACKED_TERM_IDS is empty so this is never called. Phase 3
   * will wire it to Sofia's critical atom set.
   */
  private subscribeTrackedPositions() {
    if (!this.walletAddress) return

    const variables: WatchUserTrackedPositionsSubscriptionVariables = {
      accountId: this.walletAddress,
      termIds: TRACKED_TERM_IDS
    }

    const unsub =
      getWsClient().subscribe<WatchUserTrackedPositionsSubscription>(
        {
          query: toQueryString(WatchUserTrackedPositionsDocument),
          variables
        },
        {
          next: ({ data }) => {
            if (!data) return
            this.onTrackedPositionsUpdate(data)
          },
          error: (err) => {
            console.error("[WS tracked] error", err)
          },
          complete: () => {
            console.log("[WS tracked] complete")
          }
        }
      )

    this.subscriptions.set("tracked-positions", unsub)
  }

  // ── Cache writers (Phase 3.A: real derivations wired) ────────────────────

  private onPositionsUpdate(data: WatchUserPositionsSubscription) {
    const positions = data.positions ?? []
    const wallet = this.walletAddress
    if (!wallet) return

    const qc = this.queryClient
    try {
      // Raw payload — consumers that want the full list read this key.
      qc.setQueryData(realtimeKeys.positions(wallet), positions)

      // Sofia-specific derivations (Phase 3.A) — each one filters positions
      // by predicate / atom term_id and produces the shape the matching
      // hook consumes. Phase 3.B migrates those hooks to read from here.
      qc.setQueryData(
        realtimeKeys.trustCircle(wallet),
        deriveTrustCircle(positions)
      )
      qc.setQueryData(
        realtimeKeys.following(wallet),
        deriveFollowing(positions)
      )
      qc.setQueryData(
        realtimeKeys.dailyStreak(wallet),
        deriveDailyStreak(positions)
      )
      qc.setQueryData(
        realtimeKeys.verifiedOAuthPlatforms(wallet),
        deriveVerifiedOAuthPlatforms(positions)
      )
      qc.setQueryData(
        realtimeKeys.intentionGroups(wallet),
        deriveIntentionGroups(positions)
      )
      qc.setQueryData(
        realtimeKeys.globalStakePosition(wallet),
        deriveGlobalStakePosition(positions)
      )

      // Aggregate views — consumed by profile UI.
      qc.setQueryData(
        realtimeKeys.userProfileDerived(wallet),
        deriveUserProfile(positions)
      )
      qc.setQueryData(
        realtimeKeys.userStats(wallet),
        deriveUserStats(positions)
      )

      // Legacy alias — Sofia's "verified platforms" === OAuth platforms.
      qc.setQueryData(
        realtimeKeys.verifiedPlatforms(wallet),
        deriveVerifiedPlatforms(positions)
      )
    } catch (err) {
      console.error("[WS positions] derivation/setQueryData failed", err)
    }

    console.log(
      `[WS positions] ${positions.length} positions for ${wallet.slice(0, 8)}…`
    )
  }

  private onTrackedPositionsUpdate(
    data: WatchUserTrackedPositionsSubscription
  ) {
    const positions = data.positions ?? []
    const wallet = this.walletAddress
    if (!wallet) return

    const qc = this.queryClient
    try {
      qc.setQueryData(
        realtimeKeys.topicPositionsMap(wallet),
        derivePositionsByTopic(
          positions as unknown as Parameters<typeof derivePositionsByTopic>[0]
        )
      )
      qc.setQueryData(
        realtimeKeys.categoryPositionsMap(wallet),
        derivePositionsByCategory(
          positions as unknown as Parameters<
            typeof derivePositionsByCategory
          >[0]
        )
      )
      qc.setQueryData(
        realtimeKeys.platformPositionsMap(wallet),
        derivePositionsByPlatform(
          positions as unknown as Parameters<
            typeof derivePositionsByPlatform
          >[0]
        )
      )
    } catch (err) {
      console.error("[WS tracked] derivation/setQueryData failed", err)
    }

    console.log(
      `[WS tracked] ${positions.length} tracked positions for ${wallet.slice(0, 8)}…`
    )
  }
}
