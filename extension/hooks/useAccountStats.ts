import { useState, useEffect } from 'react'
import { getAddress } from 'viem'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../lib/config/constants'

export interface AccountStats {
  signalsCreated: number
  totalMarketCap: number
  loading: boolean
  error: string | null
}

/**
 * Hook to fetch statistics for any account address
 * Retrieves: signals created and total market cap
 */
export const useAccountStats = (accountAddress: string | undefined) => {
  const [stats, setStats] = useState<AccountStats>({
    signalsCreated: 0,
    totalMarketCap: 0,
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!accountAddress) {
      setStats({
        signalsCreated: 0,
        totalMarketCap: 0,
        loading: false,
        error: null
      })
      return
    }

    const loadAccountStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))

        const checksumAddress = getAddress(accountAddress)

        // Query 1: Get signals created and total market cap
        const statsQuery = `
          query GetUserStats($accountId: String!, $subjectId: String!) {
            triples: terms(
              where: {
                _and: [
                  { type: { _eq: Triple } },
                  { triple: { subject: { term_id: { _eq: $subjectId } } } },
                  { positions: { account: { id: { _eq: $accountId } } } }
                ]
              }
            ) {
              id
              vaults {
                total_shares
              }
            }
          }
        `

        const statsResponse = await intuitionGraphqlClient.request(statsQuery, {
          accountId: checksumAddress,
          subjectId: SUBJECT_IDS.I
        }) as { triples: Array<{ id: string; vaults?: Array<{ total_shares: string }> }> }

        // Calculate signals created
        const signalsCreated = statsResponse?.triples?.length || 0

        // Calculate total market cap
        let totalMarketCap = 0
        if (statsResponse?.triples) {
          statsResponse.triples.forEach((triple) => {
            if (triple.vaults) {
              triple.vaults.forEach((vault) => {
                totalMarketCap += Number(vault.total_shares || 0) / 1e18
              })
            }
          })
        }

        setStats({
          signalsCreated,
          totalMarketCap,
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error loading account stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats'
        }))
      }
    }

    loadAccountStats()
  }, [accountAddress])

  return stats
}
