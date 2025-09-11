// Configuration for Intuition testnet
export const INTUITION_GRAPHQL_ENDPOINT = 'https://testnet.intuition.sh/v1/graphql'

// Simple GraphQL client for queries
export const intuitionGraphqlClient = {
  request: async (query: string, variables?: any) => {
    const response = await fetch(INTUITION_GRAPHQL_ENDPOINT, {
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