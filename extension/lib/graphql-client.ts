// Configuration pour le testnet Intuition
export const INTUITION_GRAPHQL_ENDPOINT = 'https://testnet.intuition.sh/v1/graphql'

// Client GraphQL simple pour les requêtes
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

// Export des types et fonctions utiles du SDK
export * from '@0xintuition/graphql'