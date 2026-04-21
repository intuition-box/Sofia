/**
 * WebSocket client for Hasura GraphQL subscriptions.
 *
 * Managed as a singleton — one WS connection per tab, shared across all
 * subscriptions. The connection is lazy: we don't open the socket until
 * the first subscribe() call.
 *
 * Configure the WS URL via configureClient({ apiUrl, wsUrl }) from client.ts.
 */

import { createClient, type Client } from "graphql-ws"

const API_WS_LOCAL = "ws://localhost:8080/v1/graphql"
const API_WS_DEV = "wss://testnet.intuition.sh/v1/graphql"
const API_WS_PROD = "wss://mainnet.intuition.sh/v1/graphql"

export { API_WS_LOCAL, API_WS_DEV, API_WS_PROD }

let wsClient: Client | null = null
let globalWsUrl = API_WS_PROD

/**
 * Update the WebSocket URL. If a client already exists, it is disposed so
 * the next getWsClient() call reconnects to the new URL.
 */
export function configureWsClient(config: { wsUrl: string }): void {
  if (globalWsUrl === config.wsUrl) return
  globalWsUrl = config.wsUrl
  if (wsClient) {
    wsClient.dispose()
    wsClient = null
  }
}

/**
 * Get (and lazily create) the shared graphql-ws client.
 *
 * Features:
 * - Infinite retries with exponential backoff (built into graphql-ws)
 * - keepAlive ping every 10s so Hasura doesn't timeout connections
 * - connectionParams factory for future JWT auth (currently empty)
 */
export function getWsClient(): Client {
  if (!wsClient) {
    wsClient = createClient({
      url: globalWsUrl,
      retryAttempts: Number.POSITIVE_INFINITY,
      shouldRetry: () => true,
      keepAlive: 10_000,
      connectionParams: async () => ({
        // Placeholder: add a JWT here if Intuition activates subscription auth.
      }),
    })
  }
  return wsClient
}

/**
 * Close the WebSocket connection and reset the singleton.
 * Called on wallet change, logout, or when the app unmounts.
 */
export function disposeWsClient(): void {
  if (wsClient) {
    wsClient.dispose()
    wsClient = null
  }
}
