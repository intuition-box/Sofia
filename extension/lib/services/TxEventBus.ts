/**
 * TxEventBus
 *
 * Lightweight in-memory pub/sub for post-transaction invalidation.
 * Services subscribe to TX types they care about and refetch when notified.
 * Hooks emit after TX success — synchronous dispatch guarantees
 * GraphQL cache is cleared BEFORE any service refetch.
 *
 * Complements MessageBus (inter-context chrome.runtime messaging)
 * by handling intra-context (sidepanel) state invalidation.
 */

import { createServiceLogger } from "../utils/logger"

const logger = createServiceLogger("TxEventBus")

export type TxEventType =
  | "certification"
  | "batch_certification"
  | "vote"
  | "deposit"
  | "redeem_triple"
  | "deposit_gs"
  | "redeem_gs"
  | "level_up"

export interface TxEvent {
  type: TxEventType
  txHash?: string
  timestamp: number
}

type TxEventListener = (event: TxEvent) => void

class TxEventBusClass {
  private listeners = new Map<string, Set<TxEventListener>>()

  /**
   * Subscribe to a TX event type. Use "*" for all events.
   * Returns an unsubscribe function (React cleanup friendly).
   */
  on(type: TxEventType | "*", listener: TxEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)

    return () => this.off(type, listener)
  }

  off(type: TxEventType | "*", listener: TxEventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  /**
   * Emit a TX event. Dispatches synchronously:
   * 1. Wildcard "*" listeners fire first (cache clear)
   * 2. Type-specific listeners fire second (refetch)
   */
  emit(type: TxEventType, txHash?: string): void {
    const event: TxEvent = { type, txHash, timestamp: Date.now() }

    logger.debug("TX event", { type, txHash })

    // Wildcard listeners first (GraphQL cache clear)
    const wildcardListeners = this.listeners.get("*")
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try { listener(event) } catch (err) {
          logger.error("Wildcard listener error", err)
        }
      }
    }

    // Type-specific listeners second (service refetch)
    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      for (const listener of typeListeners) {
        try { listener(event) } catch (err) {
          logger.error("Listener error", { type, error: err })
        }
      }
    }
  }
}

export const txEventBus = new TxEventBusClass()
