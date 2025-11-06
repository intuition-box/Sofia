import { API_CONFIG } from '../config/chainConfig'

// GraphQL endpoint is now dynamically configured based on environment
// - pnpm dev → testnet
// - pnpm build → mainnet
export const INTUITION_GRAPHQL_ENDPOINT = API_CONFIG.GRAPHQL_ENDPOINT

// Simple GraphQL client for queries
export const intuitionGraphqlClient = {
  request: async (query: string, variables?: any) => {
    const response = await fetch(API_CONFIG.GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const json = await response.json()
    
    if (json.errors) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`)
    }

    return json.data
  }
}

// Export useful types and functions from SDK
export * from '@0xintuition/graphql'