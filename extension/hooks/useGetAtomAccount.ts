/**
 * useGetAtomAccount Hook
 * Integration with Intuition blockchain API to filter atoms by account type
 * Used for searching other users in the account tab
 */

import { useState, useEffect, useCallback } from 'react'

export interface AccountAtom {
  id: string
  label: string
  termId: string
  description?: string
  type: 'Account'
  createdAt: string
  creatorId: string
  atomType: string // Le vrai type de l'atom (Account, Thing, Caip10, etc.)
  tags?: string[] // Tags associés à cet utilisateur
  interests?: string[] // Intérêts de l'utilisateur
  subscriptions?: string[] // Abonnements de l'utilisateur
}

interface UseGetAtomAccountResult {
  // Data state
  accounts: AccountAtom[]

  // Methods
  searchAccounts: (query: string) => Promise<AccountAtom[]>
  refreshAccounts: () => Promise<void>
}

/**
 * Hook for managing account atoms from Intuition blockchain
 * Filters atoms by type "account" for user search functionality
 */
export const useGetAtomAccount = (): UseGetAtomAccountResult => {
  const [accounts, setAccounts] = useState<AccountAtom[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshAccounts = useCallback(async (): Promise<void> => {
    if (isLoading) return

    setIsLoading(true)

    try {
      console.log('🔄 [useGetAtomAccount] Fetching account atoms...')

      const response = await fetch('https://testnet.intuition.sh/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetAccountAtoms {
              atoms(where: {type: {_eq: "Account"}}, limit: 50) {
                term_id
                label
                type
                created_at
              }
            }
          `,
        }),
      })

      const jsonData = await response.json()

      if (jsonData.errors) {
        throw new Error(`GraphQL error: ${jsonData.errors[0].message}`)
      }

      const atoms = jsonData.data?.atoms || []
      console.log(`✅ [useGetAtomAccount] Loaded ${atoms.length} accounts`)

      const mappedAccounts: AccountAtom[] = atoms.map((atom: any) => ({
        id: atom.term_id,
        label: atom.label || 'Unknown',
        termId: atom.term_id,
        description: `Account: ${atom.label}`,
        type: 'account' as const,
      }))

      setAccounts(mappedAccounts)

    } catch (err) {
      console.error('❌ [useGetAtomAccount] Error:', err)
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // Load once on mount
  useEffect(() => {
    refreshAccounts()
  }, [])

  const searchAccounts = useCallback(async (query: string): Promise<AccountAtom[]> => {
    if (!query.trim()) return []

    try {
      console.log('🔍 [searchAccounts] Searching blockchain for:', query)

      // Recherche dans TOUTE la blockchain par label (case insensitive)
      const response = await fetch('https://testnet.intuition.sh/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query SearchAtoms($searchTerm: String!) {
              atoms(
                where: {
                  label: { _ilike: $searchTerm }
                }
                limit: 20
              ) {
                term_id
                label
                type
                created_at
                creator_id
              }
              triples(
                where: {
                  subject: { label: { _ilike: $searchTerm } }
                }
                limit: 50
              ) {
                subject { label }
                predicate { label }
                object { label }
                created_at
              }
            }
          `,
          variables: {
            searchTerm: `%${query}%`
          }
        }),
      })

      const jsonData = await response.json()

      if (jsonData.errors) {
        console.error('❌ [searchAccounts] GraphQL error:', jsonData.errors)
        return []
      }

      const atoms = jsonData.data?.atoms || []
      const triples = jsonData.data?.triples || []
      console.log(`🔍 [searchAccounts] Found ${atoms.length} matching atoms and ${triples.length} triples`)

      return atoms.map((atom: any) => {
        // Grouper les triplets par utilisateur
        const userTriples = triples.filter((triple: any) =>
          triple.subject.label.toLowerCase() === atom.label.toLowerCase()
        )

        // Extraire les tags (has tag)
        const tags = userTriples
          .filter((triple: any) => triple.predicate.label === 'has tag')
          .map((triple: any) => triple.object.label)

        // Extraire les intérêts (are interested by)
        const interests = userTriples
          .filter((triple: any) => triple.predicate.label === 'are interested by')
          .map((triple: any) => triple.object.label)

        // Extraire les abonnements (subscribes_to)
        const subscriptions = userTriples
          .filter((triple: any) => triple.predicate.label === 'subscribes_to')
          .map((triple: any) => triple.object.label)

        return {
          id: atom.term_id,
          label: atom.label || 'Unknown',
          termId: atom.term_id,
          description: `${atom.type}: ${atom.label}`,
          type: 'Account' as const,
          createdAt: atom.created_at,
          creatorId: atom.creator_id,
          atomType: atom.type,
          tags: tags.length > 0 ? tags : undefined,
          interests: interests.length > 0 ? interests : undefined,
          subscriptions: subscriptions.length > 0 ? subscriptions : undefined,
        }
      })

    } catch (err) {
      console.error('❌ [searchAccounts] Search error:', err)
      return []
    }
  }, [])

  return {
    accounts,
    searchAccounts,
    refreshAccounts
  }
}