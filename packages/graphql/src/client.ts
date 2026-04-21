import { API_URL_PROD } from './constants'
import { configureWsClient } from './wsClient'

export interface ClientConfig {
  headers: HeadersInit
  apiUrl?: string
}

let globalConfig: { apiUrl?: string } = {
  apiUrl: API_URL_PROD,
}

/**
 * Configure both the HTTP fetcher and the optional WebSocket client in one call.
 *
 * @param config.apiUrl — HTTPS GraphQL endpoint (required)
 * @param config.wsUrl — WSS GraphQL endpoint for subscriptions (optional).
 *                       If omitted, subscriptions will use the default mainnet URL.
 */
export function configureClient(config: { apiUrl: string; wsUrl?: string }) {
  globalConfig = { ...globalConfig, apiUrl: config.apiUrl }
  if (config.wsUrl) {
    configureWsClient({ wsUrl: config.wsUrl })
  }
}

export function fetcher<TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
) {
  return async () => {
    if (!globalConfig.apiUrl) {
      throw new Error(
        'GraphQL API URL not configured. Call configureClient first.',
      )
    }

    const res = await fetch(globalConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(options as Record<string, string>),
      },
      body: JSON.stringify({ query, variables }),
    })

    const json = await res.json()

    if (json.errors && (!json.data || Object.keys(json.data).length === 0)) {
      const { message } = json.errors[0]
      throw new Error(message)
    }

    return json.data as TData
  }
}
