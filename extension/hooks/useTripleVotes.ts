import { useMemo } from "react"
import { useFindNestedTriplesQuery } from "@0xsofia/graphql"
import { SUBJECT_IDS } from "../lib/config/constants"

export type VoteState = "like" | "dislike" | null

export interface TripleVoteData {
  userVote: VoteState
  likeCount: number
  dislikeCount: number
}

/**
 * Query vote state for certification triples.
 *
 * Uses FindTriples which returns `object_id` directly (raw column)
 * instead of going through the `object` relationship. This is required
 * because the object of a vote triple is another TRIPLE (not an atom),
 * and the Hasura `object` relationship may not resolve for triple-objects.
 */
export const useTripleVotes = (
  tripleTermIds: string[],
  userAddress: string | null
) => {
  // Query like vote triples: I | like | <certificationTripleTermId>
  const {
    data: likeData,
    isLoading: likesLoading,
    refetch: refetchLikes
  } = useFindNestedTriplesQuery(
    {
      where: {
        _and: [
          { subject_id: { _eq: SUBJECT_IDS.I } },
          { predicate: { label: { _eq: "like" } } },
          { object_id: { _in: tripleTermIds } }
        ]
      },
      address: userAddress || "",
      limit: tripleTermIds.length
    },
    {
      enabled: !!userAddress && tripleTermIds.length > 0,
      refetchOnWindowFocus: false
    }
  )

  // Query dislike vote triples
  const {
    data: dislikeData,
    isLoading: dislikesLoading,
    refetch: refetchDislikes
  } = useFindNestedTriplesQuery(
    {
      where: {
        _and: [
          { subject_id: { _eq: SUBJECT_IDS.I } },
          { predicate: { label: { _eq: "dislike" } } },
          { object_id: { _in: tripleTermIds } }
        ]
      },
      address: userAddress || "",
      limit: tripleTermIds.length
    },
    {
      enabled: !!userAddress && tripleTermIds.length > 0,
      refetchOnWindowFocus: false
    }
  )

  const votesMap = useMemo(() => {
    const map = new Map<string, TripleVoteData>()

    // Initialize with defaults
    for (const id of tripleTermIds) {
      map.set(id, { userVote: null, likeCount: 0, dislikeCount: 0 })
    }

    // Process likes — match by object_id (direct column = certification tripleTermId)
    if (likeData?.triples) {
      for (const triple of likeData.triples) {
        const entry = map.get(triple.object_id)
        if (entry) {
          // User has shares on this like triple → they liked it
          const userShares = triple.positions?.[0]?.shares
          if (userShares && BigInt(userShares) > 0n) {
            entry.userVote = "like"
            entry.likeCount = 1
          }
        }
      }
    }

    // Process dislikes
    if (dislikeData?.triples) {
      for (const triple of dislikeData.triples) {
        const entry = map.get(triple.object_id)
        if (entry) {
          const userShares = triple.positions?.[0]?.shares
          if (userShares && BigInt(userShares) > 0n) {
            entry.userVote = "dislike"
            entry.dislikeCount = 1
          }
        }
      }
    }

    return map
  }, [tripleTermIds, likeData, dislikeData])

  const loading = likesLoading || dislikesLoading

  const refetch = () => {
    refetchLikes()
    refetchDislikes()
  }

  return { votesMap, loading, refetch }
}
