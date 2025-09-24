/**
 * useGetatomaccount Hook
 * Integration with Intuition blockchain API to filter atoms by account type
 * Used for searching other users in the account tab
 */

import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'

export interface AccountAtom {
  id: string
  label: string
  termId: string
  createdAt: string
  creatorId: string
  txHash?: string
  description?: string
  type: 'account'
  // Blockchain fields
  atomVaultId?: string
  ipfsUri?: string
  status: 'on-chain' | 'pending'
}

interface UseGetAtomAccountResult {
  // Data state
  accounts: AccountAtom[]
  isLoading: boolean
  error: string | null

  // Methods
  searchAccounts: (query: string) => AccountAtom[]
  refreshAccounts: () => Promise<void>
}

/**
 * Hook for managing account atoms from Intuition blockchain
 * Filters atoms by type "account" for user search functionality
 */
export const useGetatomaccount = (): UseGetAtomAccountResult => {
  const [accounts, setAccounts] = useState<AccountAtom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshAccounts = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('= [useGetatomaccount] Fetching account atoms from API...')

      // Query pour r�cup�rer les atoms de type "account"
      const atomsQuery = `
        query GetAccountAtoms {
          atoms(where: {
            type: {
              _eq: "account"
            }
          }) {
            term_id
            label
            creator_id
            created_at
            transaction_hash
            type
            ipfs_hash
            description
          }
        }
      `

      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery)
      console.log('=� [useGetatomaccount] Raw atoms response:', atomsResponse)

      if (!atomsResponse?.atoms) {
        console.log('L [useGetatomaccount] No atoms found in response')
        setAccounts([])
        return
      }

      const atoms = atomsResponse.atoms
      console.log(`=� [useGetatomaccount] Found ${atoms.length} account atoms`)

      if (atoms.length === 0) {
        console.log('=� [useGetatomaccount] No account atoms found')
        setAccounts([])
        return
      }

      // Mapper les atoms de type account
      const mappedAccounts: AccountAtom[] = atoms.map((atom: any, index: number) => {
        console.log(`= [useGetatomaccount] Mapping account atom ${index + 1}:`, {
          termId: atom.term_id,
          label: atom.label,
          type: atom.type
        })

        // Convertir created_at en string ISO
        const createdAt = new Date(atom.created_at).toISOString()

        const accountAtom: AccountAtom = {
          id: atom.term_id,
          label: atom.label || 'Unknown Account',
          termId: atom.term_id,
          createdAt: createdAt,
          creatorId: atom.creator_id,
          txHash: atom.transaction_hash,
          description: atom.description || `Account: ${atom.label}`,
          type: 'account' as const,
          atomVaultId: atom.term_id,
          ipfsUri: atom.ipfs_hash,
          status: 'on-chain' as const
        }

        return accountAtom
      })

      console.log(` [useGetatomaccount] Successfully mapped ${mappedAccounts.length} account atoms`)
      setAccounts(mappedAccounts)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('L [useGetatomaccount] Error fetching account atoms:', err)
      setError(`Failed to fetch account atoms: ${errorMessage}`)
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch on mount
  useEffect(() => {
    refreshAccounts()
  }, [])

  const searchAccounts = (query: string): AccountAtom[] => {
    if (!query.trim()) return accounts

    const lowercaseQuery = query.toLowerCase()
    return accounts.filter(account =>
      account.label.toLowerCase().includes(lowercaseQuery) ||
      account.termId.toLowerCase().includes(lowercaseQuery) ||
      (account.description && account.description.toLowerCase().includes(lowercaseQuery)) ||
      (account.creatorId && account.creatorId.toLowerCase().includes(lowercaseQuery))
    )
  }

  return {
    accounts,
    isLoading,
    error,
    searchAccounts,
    refreshAccounts
  }
}