import { useState, useEffect } from 'react'
import { getAddress } from 'viem'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'

export interface UserAtomStats {
  termId: string
  label: string
  totalMarketCap: string
  positionCount: number
  currentSharePrice: string
  totalShares: string
  followingCount: number
  followersCount: number
  followersMarketCap: string
  loading: boolean
  error: string | null
}

const TERM_FRAGMENT = `
  fragment Term on terms {
    total_market_cap
    positions_aggregate {
      aggregate {
        count
      }
    }
  }
`

/**
 * Hook to fetch detailed atom statistics for a user
 * Uses the GetAtomStats query which provides accurate market cap data
 */
export const useUserAtomStats = (
  termId: string | undefined,
  accountAddress?: string
): UserAtomStats => {
  const [stats, setStats] = useState<UserAtomStats>({
    termId: termId || '',
    label: '',
    totalMarketCap: '0',
    positionCount: 0,
    currentSharePrice: '0',
    totalShares: '0',
    followingCount: 0,
    followersCount: 0,
    followersMarketCap: '0',
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!termId) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'No term ID provided'
      }))
      return
    }

    const loadAtomStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))

        // Use checksum address if provided
        const checksumAddress = accountAddress ? getAddress(accountAddress) : ''

        const query = `
          query GetAtomStats($termId: String!, $accountAddress: String!, $followSubjectId: String!, $followPredicateId: String!, $followObjectId: String!) {
            atom(term_id: $termId) {
              term_id
              label
              term {
                ...Term
                vaults(order_by: {curve_id: asc}) {
                  current_share_price
                  total_shares
                  position_count
                }
              }
            }
            following_count: triples_aggregate(
              where: {_and: [{subject_id: {_eq: $followSubjectId}}, {predicate_id: {_eq: $followPredicateId}}, {term: {vaults: {positions: {account_id: {_eq: $accountAddress}}}}}]}
            ) {
              aggregate {
                count
              }
            }
            followers_count: triples_aggregate(
              where: {_and: [{subject_id: {_eq: $followSubjectId}}, {predicate_id: {_eq: $followPredicateId}}, {object_id: {_eq: $followObjectId}}]}
            ) {
              nodes {
                term {
                  total_market_cap
                  vaults(where: {curve_id: {_eq: "1"}}, order_by: {curve_id: asc}) {
                    position_count
                  }
                }
              }
            }
          }

          ${TERM_FRAGMENT}
        `

        const variables = {
          termId: termId,
          accountAddress: checksumAddress || '',
          followSubjectId: SUBJECT_IDS.I,
          followPredicateId: PREDICATE_IDS.FOLLOW,
          followObjectId: termId
        }

        const response = await intuitionGraphqlClient.request(query, variables) as {
          atom: {
            term_id: string
            label: string
            term: {
              total_market_cap: string
              positions_aggregate: {
                aggregate: {
                  count: number
                }
              }
              vaults: Array<{
                current_share_price: string
                total_shares: string
                position_count: number
              }>
            }
          }
          following_count: {
            aggregate: {
              count: number
            }
          }
          followers_count: {
            nodes: Array<{
              term: {
                total_market_cap: string
                vaults: Array<{
                  position_count: number
                }>
              }
            }>
          }
        }

        // Extract data from response
        const atom = response.atom
        const vault = atom.term.vaults[0] // First vault (curve_id: 0)

        // Calculate followers market cap and count
        let followersMarketCap = '0'
        let followersCount = 0

        if (response.followers_count.nodes.length > 0) {
          const followerNode = response.followers_count.nodes[0]
          followersMarketCap = followerNode.term.total_market_cap || '0'

          // Get position count from the vault
          if (followerNode.term.vaults && followerNode.term.vaults.length > 0) {
            followersCount = followerNode.term.vaults[0].position_count || 0
          }
        }

        setStats({
          termId: atom.term_id,
          label: atom.label,
          totalMarketCap: atom.term.total_market_cap,
          positionCount: atom.term.positions_aggregate.aggregate.count,
          currentSharePrice: vault?.current_share_price || '0',
          totalShares: vault?.total_shares || '0',
          followingCount: response.following_count.aggregate.count,
          followersCount: followersCount,
          followersMarketCap: followersMarketCap,
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error loading atom stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats'
        }))
      }
    }

    loadAtomStats()
  }, [termId, accountAddress])

  return stats
}
