import { useState, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'

export interface UserList {
  predicateTermId: string
  predicateLabel: string
  predicateImage?: string
  objectTermId: string
  objectLabel: string
  objectImage?: string
  triplets: Array<{
    subjectTermId: string
    subjectLabel: string
    subjectImage?: string
  }>
  tripleCount: number
  totalMarketCap: string
  totalPositionCount: number
}

export interface UseUserListsResult {
  lists: UserList[]
  totalCount: number
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

/**
 * Hook to fetch lists/bookmarks created by a specific user
 * Uses the SavedLists query (predicate_objects) to retrieve lists where user is involved
 */
export const useUserLists = (
  userTermId: string | undefined,
  initialLimit: number = 18
): UseUserListsResult => {
  const [lists, setLists] = useState<UserList[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Predicate ID for "has tag" - used to find lists
  const HAS_TAG_PREDICATE_ID = '0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5'

  useEffect(() => {
    if (!userTermId) {
      setLists([])
      setLoading(false)
      return
    }

    loadLists(0)
  }, [userTermId])

  const loadLists = async (currentOffset: number) => {
    try {
      setLoading(true)
      setError(null)

      // Step 1: Query predicate_objects (without predicate/object fields which don't exist on mainnet)
      const predicateObjectsQuery = `
        query SavedLists($where: predicate_objects_bool_exp, $limit: Int, $offset: Int, $orderBy: [predicate_objects_order_by!]) {
          predicate_objects_aggregate(where: $where) {
            aggregate {
              count
            }
          }
          predicate_objects(
            where: $where
            limit: $limit
            offset: $offset
            order_by: $orderBy
          ) {
            predicate_id
            object_id
            triples(limit: 6, order_by: {triple_term: {total_market_cap: desc}}) {
              subject {
                term_id
                label
                image
              }
            }
            triple_count
            total_market_cap
            total_position_count
          }
        }
      `

      const variables = {
        where: {
          _and: [
            {
              predicate_id: {
                _eq: HAS_TAG_PREDICATE_ID
              }
            },
            {
              triples: {
                _or: [
                  {
                    subject_id: {
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
          ]
        },
        limit: initialLimit,
        offset: currentOffset,
        orderBy: [
          {
            triple_count: 'desc'
          }
        ]
      }

      const response = await intuitionGraphqlClient.request(predicateObjectsQuery, variables) as {
        predicate_objects_aggregate: {
          aggregate: {
            count: number
          }
        }
        predicate_objects: Array<{
          predicate_id: string
          object_id: string
          triples: Array<{
            subject: {
              term_id: string
              label: string
              image?: string
            }
          }>
          triple_count: number
          total_market_cap: string
          total_position_count: number
        }>
      }

      // Step 2: Fetch atom details for predicates and objects
      const termIds = new Set<string>()
      response.predicate_objects.forEach((po) => {
        termIds.add(po.predicate_id)
        termIds.add(po.object_id)
      })

      const atomsQuery = `
        query GetAtoms($termIds: [String!]!) {
          atoms(where: { term_id: { _in: $termIds } }) {
            term_id
            label
            image
          }
        }
      `

      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, {
        termIds: Array.from(termIds)
      }) as {
        atoms: Array<{
          term_id: string
          label: string
          image?: string
        }>
      }

      // Create a map for quick lookups
      const atomsMap = new Map<string, { label: string; image?: string }>()
      atomsResponse.atoms.forEach((atom) => {
        atomsMap.set(atom.term_id, {
          label: atom.label,
          image: atom.image
        })
      })

      // Step 3: Map the results with atom details
      const fetchedLists: UserList[] = response.predicate_objects.map((po) => {
        const predicateAtom = atomsMap.get(po.predicate_id)
        const objectAtom = atomsMap.get(po.object_id)

        return {
          predicateTermId: po.predicate_id,
          predicateLabel: predicateAtom?.label || 'Unknown',
          predicateImage: predicateAtom?.image,
          objectTermId: po.object_id,
          objectLabel: objectAtom?.label || 'Unknown',
          objectImage: objectAtom?.image,
          triplets: po.triples.map((t) => ({
            subjectTermId: t.subject.term_id,
            subjectLabel: t.subject.label,
            subjectImage: t.subject.image
          })),
          tripleCount: po.triple_count,
          totalMarketCap: po.total_market_cap,
          totalPositionCount: po.total_position_count
        }
      })

      if (currentOffset === 0) {
        setLists(fetchedLists)
      } else {
        setLists((prev) => [...prev, ...fetchedLists])
      }

      setTotalCount(response.predicate_objects_aggregate.aggregate.count)
      setHasMore(fetchedLists.length === initialLimit)
      setOffset(currentOffset + initialLimit)

    } catch (err) {
      console.error('Error loading user lists:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lists')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLists(offset)
    }
  }

  return {
    lists,
    totalCount,
    loading,
    error,
    hasMore,
    loadMore
  }
}
