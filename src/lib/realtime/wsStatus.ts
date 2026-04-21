/**
 * wsStatus — tiny external store exposing the health of the realtime
 * WebSocket connection. Consumed by the offline badge and by the
 * SubscriptionManager's HTTP fallback.
 *
 * Uses the useSyncExternalStore pattern already used elsewhere in the
 * codebase (see useDomainSelection) — no Zustand dep needed.
 */

export type WsConnectionStatus =
  | 'idle'        // nothing mounted yet
  | 'connecting'  // first connection attempt
  | 'connected'   // happy path
  | 'offline'     // closed unexpectedly, graphql-ws is retrying
  | 'error'       // terminal error surfaced by graphql-ws

export interface WsStatusSnapshot {
  status: WsConnectionStatus
  /** Unix ms of the last 'connected' event (or 0) */
  lastConnectedAt: number
  /** Unix ms of the last 'closed'/'error' event (or 0) */
  lastDisconnectedAt: number
  /** Cumulative reconnect attempts within the current session */
  reconnectAttempts: number
  /** Last error message surfaced by graphql-ws */
  lastError: string | null
}

const INITIAL: WsStatusSnapshot = {
  status: 'idle',
  lastConnectedAt: 0,
  lastDisconnectedAt: 0,
  reconnectAttempts: 0,
  lastError: null,
}

let snapshot: WsStatusSnapshot = INITIAL
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function getWsStatus(): WsStatusSnapshot {
  return snapshot
}

export function subscribeWsStatus(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// ── Writers called by SubscriptionManager ───────────────────────────────────

export function markConnecting() {
  snapshot = { ...snapshot, status: 'connecting' }
  emit()
}

export function markConnected() {
  snapshot = {
    ...snapshot,
    status: 'connected',
    lastConnectedAt: Date.now(),
    lastError: null,
  }
  emit()
}

export function markOffline(reason?: string) {
  snapshot = {
    ...snapshot,
    status: 'offline',
    lastDisconnectedAt: Date.now(),
    reconnectAttempts: snapshot.reconnectAttempts + 1,
    lastError: reason ?? snapshot.lastError,
  }
  emit()
}

export function markError(reason: string) {
  snapshot = {
    ...snapshot,
    status: 'error',
    lastDisconnectedAt: Date.now(),
    lastError: reason,
  }
  emit()
}
