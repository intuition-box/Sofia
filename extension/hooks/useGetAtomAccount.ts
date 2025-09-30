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
  type: string
  createdAt: string
  creatorId: string
  atomType: string // Le vrai type de l'atom (Account, Thing, Caip10, etc.)
  ipfsUri?: string // IPFS URI of the atom for triple creation
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
                data
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
        type: 'Account' as const,
        createdAt: atom.created_at,
        creatorId: atom.creator_id || '',
        atomType: atom.type,
        ipfsUri: atom.data // This is the IPFS URI we need!
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
                  _and: [
                    { label: { _ilike: $searchTerm } },
                    { type: { _eq: "Account" } }
                  ]
                }
                limit: 20
              ) {
                term_id
                label
                type
                created_at
                creator_id
                data
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
      console.log(`🔍 [searchAccounts] Found ${atoms.length} matching atoms`)

      return atoms.map((atom: any) => ({
        id: atom.term_id,
        label: atom.label || 'Unknown',
        termId: atom.term_id,
        description: `${atom.type}: ${atom.label}`,
        type: 'Account' as const,
        createdAt: atom.created_at,
        creatorId: atom.creator_id,
        atomType: atom.type,
        ipfsUri: atom.data
      }))

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