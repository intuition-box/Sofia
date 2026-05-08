/**
 * useGetAtomAccount — backwards-compatible wrapper around the shared
 * `searchAccounts` helper from `@0xsofia/graphql`. Kept so existing
 * extension consumers (FollowSearchBox, ExplorerPanel) don't need to be
 * touched in the same change. New consumers should import the shared
 * hook directly:
 *
 *   import { useSearchAccounts } from '@0xsofia/graphql'
 */

import { useCallback, useEffect, useState } from 'react'
import { searchAccounts as sharedSearchAccounts, type AccountAtom as SharedAccountAtom } from '@0xsofia/graphql'
import { API_CONFIG } from '../lib/config/chainConfig'

export type AccountAtom = SharedAccountAtom & {
  description?: string
  type: string
}

interface UseGetAtomAccountResult {
  accounts: AccountAtom[]
  searchAccounts: (query: string) => Promise<AccountAtom[]>
  refreshAccounts: () => Promise<void>
}

const decorate = (a: SharedAccountAtom): AccountAtom => ({
  ...a,
  description: `Account: ${a.label}`,
  type: 'Account',
})

/**
 * Hook for managing account atoms from Intuition blockchain.
 * Filters atoms by type "account" for user search functionality.
 */
export const useGetAtomAccount = (): UseGetAtomAccountResult => {
  const [accounts, setAccounts] = useState<AccountAtom[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // The "list" path stays local because it's only used by ExplorerPanel
  // for the seed list and isn't worth promoting to the shared package.
  const refreshAccounts = useCallback(async (): Promise<void> => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch(API_CONFIG.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetAccountAtoms {
              atoms(where: { type: { _eq: "Account" } }, limit: 50) {
                term_id
                label
                type
                created_at
                data
                image
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
      const mapped: AccountAtom[] = atoms.map((atom: any) =>
        decorate({
          id: atom.term_id,
          label: atom.label || 'Unknown',
          termId: atom.term_id,
          atomType: atom.type,
          createdAt: atom.created_at,
          creatorId: atom.creator_id || '',
          ipfsUri: atom.data,
          image: atom.image,
          data: atom.data,
        }),
      )
      setAccounts(mapped)
    } catch {
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  useEffect(() => {
    refreshAccounts()
  }, [])

  const searchAccounts = useCallback(async (query: string): Promise<AccountAtom[]> => {
    const results = await sharedSearchAccounts(query)
    return results.map(decorate)
  }, [])

  return { accounts, searchAccounts, refreshAccounts }
}
