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
 * Returns all positions (all voters) for each vote triple,
 * counts unique accounts for likeCount/dislikeCount,
 * and detects if the current user has voted.
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
      limit: tripleTermIds.length
    },
    {
      enabled: tripleTermIds.length > 0,
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
      limit: tripleTermIds.length
    },
    {
      enabled: tripleTermIds.length > 0,
      refetchOnWindowFocus: false
    }
  )

  const votesMap = useMemo(() => {
    const map = new Map<string, TripleVoteData>()
    const userAddr = userAddress?.toLowerCase()

    // Initialize with defaults
    for (const id of tripleTermIds) {
      map.set(id, { userVote: null, likeCount: 0, dislikeCount: 0 })
    }

    // Process likes — count unique accounts, detect user vote
    if (likeData?.triples) {
      for (const triple of likeData.triples) {
        const entry = map.get(triple.object_id)
        if (!entry) continue

        const uniqueAccounts = new Set<string>()
        for (const pos of triple.positions || []) {
          const acct = pos.account_id?.toLowerCase()
          if (acct) {
            uniqueAccounts.add(acct)
            if (userAddr && acct === userAddr) {
              entry.userVote = "like"
            }
          }
        }
        entry.likeCount = uniqueAccounts.size
      }
    }

    // Process dislikes — count unique accounts, detect user vote
    if (dislikeData?.triples) {
      for (const triple of dislikeData.triples) {
        const entry = map.get(triple.object_id)
        if (!entry) continue

        const uniqueAccounts = new Set<string>()
        for (const pos of triple.positions || []) {
          const acct = pos.account_id?.toLowerCase()
          if (acct) {
            uniqueAccounts.add(acct)
            if (userAddr && acct === userAddr) {
              entry.userVote = "dislike"
            }
          }
        }
        entry.dislikeCount = uniqueAccounts.size
      }
    }

    return map
  }, [tripleTermIds, likeData, dislikeData, userAddress])

  const loading = likesLoading || dislikesLoading

  const refetch = () => {
    refetchLikes()
    refetchDislikes()
  }

  return { votesMap, loading, refetch }
}
