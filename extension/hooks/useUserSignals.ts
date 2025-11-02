import { useState, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'

interface AtomValue {
  person?: {
    name: string
    image?: string
    description?: string
    url?: string
  }
  thing?: {
    name: string
    image?: string
    description?: string
    url?: string
  }
  organization?: {
    name: string
    image?: string
    description?: string
    url?: string
  }
  account?: {
    id: string
    label: string
    image?: string
  }
}

interface Triple {
  term_id: string
  counter_term_id: string
  created_at: string
  subject_id: string
  predicate_id: string
  object_id: string
  subject: {
    term_id: string
    wallet_id?: string
    label: string
    image?: string
    data?: string
    type: string
    value?: AtomValue
  }
  predicate: {
    term_id: string
    wallet_id?: string
    label: string
    image?: string
    data?: string
    type: string
    value?: AtomValue
  }
  object: {
    term_id: string
    wallet_id?: string
    label: string
    image?: string
    data?: string
    type: string
    value?: AtomValue
  }
  creator?: {
    id: string
    label: string
    image?: string
  }
}

interface TripleTerm {
  term_id: string
  counter_term_id: string
  total_assets: string
  total_market_cap: string
  total_position_count: number
  term: {
    id: string
    total_market_cap: string
    total_assets: string
    vaults: Array<{
      current_share_price: string
      total_shares: string
      total_assets: string
      position_count: number
      market_cap: string
      userPosition?: Array<{
        shares: string
        account_id: string
      }>
    }>
    positions_aggregate: {
      aggregate: {
        count: number
      }
    }
    triple: Triple
  }
  counter_term?: {
    id: string
    total_market_cap: string
    total_assets: string
    vaults: Array<{
      current_share_price: string
      total_shares: string
      total_assets: string
      position_count: number
      market_cap: string
      userPosition?: Array<{
        shares: string
        account_id: string
      }>
    }>
    positions_aggregate: {
      aggregate: {
        count: number
      }
    }
  }
}

export interface UserSignal {
  termId: string
  counterTermId: string
  totalMarketCap: string
  totalAssets: string
  positionCount: number
  triple: Triple
  createdAt: string
}

export interface UseUserSignalsResult {
  signals: UserSignal[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

const ATOM_VALUE_FRAGMENT = `
  fragment AtomValue on atom_values {
    person {
      name
      image
      description
      url
    }
    thing {
      name
      image
      description
      url
    }
    organization {
      name
      image
      description
      url
    }
    account {
      id
      label
      image
    }
  }
`

/**
 * Hook to fetch signals created by a specific user
 * Uses the GetAtomClaimsView query to retrieve triples where the user is involved
 */
export const useUserSignals = (
  userTermId: string | undefined,
  userWalletAddress?: string,
  initialLimit: number = 20
): UseUserSignalsResult => {
  const [signals, setSignals] = useState<UserSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!userTermId) {
      setSignals([])
      setLoading(false)
      return
    }

    loadSignals(0)
  }, [userTermId, userWalletAddress])

  const loadSignals = async (currentOffset: number) => {
    try {
      setLoading(true)
      setError(null)

      const query = `
        query GetAtomClaimsView($where: triple_term_bool_exp, $orderBy: [triple_term_order_by!], $address: String, $limit: Int, $offset: Int) {
          triple_terms(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
            term_id
            counter_term_id
            total_assets
            total_market_cap
            total_position_count
            term {
              id
              total_market_cap
              total_assets
              vaults(order_by: {curve_id: asc}) {
                current_share_price
                total_shares
                total_assets
                position_count
                market_cap
                userPosition: positions(limit: 1, where: {account_id: {_eq: $address}}) {
                  shares
                  account_id
                }
              }
              positions_aggregate {
                aggregate {
                  count
                }
              }
              triple {
                term_id
                counter_term_id
                created_at
                subject_id
                predicate_id
                object_id
                subject {
                  term_id
                  wallet_id
                  label
                  image
                  data
                  type
                  value {
                    ...AtomValue
                  }
                }
                predicate {
                  term_id
                  wallet_id
                  label
                  image
                  data
                  type
                  value {
                    ...AtomValue
                  }
                }
                object {
                  term_id
                  wallet_id
                  label
                  image
                  data
                  type
                  value {
                    ...AtomValue
                  }
                }
                creator {
                  id
                  label
                  image
                }
              }
            }
            counter_term {
              id
              total_market_cap
              total_assets
              vaults(order_by: {curve_id: asc}) {
                current_share_price
                total_shares
                total_assets
                position_count
                market_cap
                userPosition: positions(limit: 1, where: {account_id: {_eq: $address}}) {
                  shares
                  account_id
                }
              }
              positions_aggregate {
                aggregate {
                  count
                }
              }
            }
          }
        }

        ${ATOM_VALUE_FRAGMENT}
      `

      const variables = {
        address: userWalletAddress || '',
        where: {
          _and: [
            {
              term: {
                triple: {
                  _or: [
                    {
                      subject_id: {
                        _eq: userTermId
                      }
                    },
                    {
                      predicate_id: {
                        _eq: userTermId
                      }
                    },
                    {
                      object_id: {
                        _eq: userTermId
                      }
                    }
                  ]
                }
              }
            }
          ]
        },
        orderBy: [
          {
            total_market_cap: 'desc'
          }
        ],
        offset: currentOffset,
        limit: initialLimit
      }

      const response = await intuitionGraphqlClient.request(query, variables) as {
        triple_terms: TripleTerm[]
      }

      const fetchedSignals: UserSignal[] = response.triple_terms.map((term) => ({
        termId: term.term_id,
        counterTermId: term.counter_term_id,
        totalMarketCap: term.total_market_cap,
        totalAssets: term.total_assets,
        positionCount: term.total_position_count,
        triple: term.term.triple,
        createdAt: term.term.triple.created_at
      }))

      if (currentOffset === 0) {
        setSignals(fetchedSignals)
      } else {
        setSignals((prev) => [...prev, ...fetchedSignals])
      }

      setHasMore(fetchedSignals.length === initialLimit)
      setOffset(currentOffset + initialLimit)

    } catch (err) {
      console.error('Error loading user signals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadSignals(offset)
    }
  }

  return {
    signals,
    loading,
    error,
    hasMore,
    loadMore
  }
}
