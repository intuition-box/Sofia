/**
 * TopicPositionsService
 *
 * Singleton store for user's topic interest positions.
 * Fetches on-chain positions on topic atoms (from Sofia Explorer).
 * Uses useSyncExternalStore protocol for reactive UI.
 *
 * Related files:
 * - hooks/useTopicInterests.ts: React hook consumer
 * - lib/config/topicConfig.ts: Topic atom IDs and labels
 */

import { intuitionGraphqlClient } from "../clients/graphql-client"
import { createServiceLogger } from "../utils/logger"
import {
  TOPIC_TERM_IDS,
  TOPIC_LABELS,
  TOPIC_COLORS,
  ATOM_ID_TO_TOPIC,
} from "../config/topicConfig"

const logger = createServiceLogger("TopicPositionsService")

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface UserTopicPosition {
  topicSlug: string
  label: string
  color: string
  shares: string
  termId: string
}

export interface TopicPositionsState {
  positions: UserTopicPosition[]
  loading: boolean
  fetched: boolean
}

const GET_TOPIC_POSITIONS = `
  query GetTopicPositions($address: String!, $termIds: [String!]!) {
    positions(
      where: {
        account_id: { _ilike: $address }
        vault: { term_id: { _in: $termIds } }
        shares: { _gt: "0" }
      }
    ) {
      vault {
        term_id
      }
      shares
    }
  }
`

class TopicPositionsServiceClass {
  private state: TopicPositionsState = {
    positions: [],
    loading: false,
    fetched: false,
  }

  private listeners = new Set<() => void>()
  private currentWallet: string | null = null
  private lastFetchAt = 0

  // ── Store protocol (useSyncExternalStore) ──

  getSnapshot = (): TopicPositionsState => this.state

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private updateState(partial: Partial<TopicPositionsState>) {
    this.state = { ...this.state, ...partial }
    for (const listener of this.listeners) listener()
  }

  // ── Public API ──

  async fetchUserTopicPositions(walletAddress: string): Promise<void> {
    const wallet = walletAddress.toLowerCase()

    // Skip if same wallet and cache still fresh
    if (
      wallet === this.currentWallet &&
      this.state.fetched &&
      Date.now() - this.lastFetchAt < CACHE_TTL_MS
    ) {
      return
    }

    this.currentWallet = wallet
    this.updateState({ loading: true })

    try {
      const data = await intuitionGraphqlClient.request(
        GET_TOPIC_POSITIONS,
        { address: wallet, termIds: TOPIC_TERM_IDS }
      )

      const positions: UserTopicPosition[] = (data.positions || [])
        .map((p: { vault: { term_id: string }; shares: string }) => {
          const termId = p.vault.term_id
          const slug = ATOM_ID_TO_TOPIC.get(termId)
          if (!slug) return null
          return {
            topicSlug: slug,
            label: TOPIC_LABELS[slug] || slug,
            color: TOPIC_COLORS[slug] || "#888888",
            shares: p.shares,
            termId,
          }
        })
        .filter(Boolean) as UserTopicPosition[]

      // Sort by shares descending (biggest position first)
      positions.sort((a, b) => {
        const aShares = BigInt(a.shares)
        const bShares = BigInt(b.shares)
        if (bShares > aShares) return 1
        if (bShares < aShares) return -1
        return 0
      })

      this.lastFetchAt = Date.now()
      this.updateState({ positions, loading: false, fetched: true })
      logger.info("Topic positions fetched", {
        wallet: wallet.slice(0, 8),
        count: positions.length,
      })
    } catch (error) {
      logger.error("Failed to fetch topic positions", { error })
      this.updateState({ loading: false, fetched: true })
    }
  }

  getTopInterests(n: number): UserTopicPosition[] {
    return this.state.positions.slice(0, n)
  }

  reset() {
    this.currentWallet = null
    this.lastFetchAt = 0
    this.updateState({ positions: [], loading: false, fetched: false })
  }
}

export const topicPositionsService = new TopicPositionsServiceClass()
