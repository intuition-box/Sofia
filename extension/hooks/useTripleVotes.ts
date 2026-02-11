import { useMemo } from "react"
import { useFindTriplesQuery } from "@0xsofia/graphql"
import { SUBJECT_IDS } from "../lib/config/constants"

export type VoteState = "like" | "dislike" | null

export interface TripleVoteData {
  userVote: VoteState
  likeCount: number
  dislikeCount: number
}

export const useTripleVotes = (
  tripleTermIds: string[],
  userAddress: string | null
) => {
  // Query like triples where object_id matches any of our certification triples
  const {
    data: likeData,
    isLoading: likesLoading,
    refetch: refetchLikes
  } = useFindTriplesQuery(
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

  // Query dislike triples
  const {
    data: dislikeData,
    isLoading: dislikesLoading,
    refetch: refetchDislikes
  } = useFindTriplesQuery(
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

    // Process likes
    if (likeData?.triples) {
      for (const triple of likeData.triples) {
        const entry = map.get(triple.object_id)
        if (entry) {
          entry.likeCount = 1 // Triple exists = at least 1 like
          const userShares = triple.positions?.[0]?.shares
          if (userShares && BigInt(userShares) > 0n) {
            entry.userVote = "like"
          }
        }
      }
    }

    // Process dislikes
    if (dislikeData?.triples) {
      for (const triple of dislikeData.triples) {
        const entry = map.get(triple.object_id)
        if (entry) {
          entry.dislikeCount = 1
          const userShares = triple.positions?.[0]?.shares
          if (userShares && BigInt(userShares) > 0n) {
            // Dislike overrides like if user has both (edge case)
            entry.userVote = "dislike"
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
