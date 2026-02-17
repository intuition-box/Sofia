/**
 * useStreakLeaderboard
 * Fetches ranked positions from the shared "Daily Certification" atom vault
 */

import { useState, useEffect, useCallback } from "react"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { DAILY_CERTIFICATION_ATOM_ID, PREDICATE_IDS } from "../lib/config/chainConfig"
import { createHookLogger } from "../lib/utils/logger"

const logger = createHookLogger("useStreakLeaderboard")

const GET_STREAK_LEADERBOARD = `
  query GetStreakLeaderboard(
    $atomId: String!
    $curveId: numeric!
    $limit: Int!
    $predicateId: String!
  ) {
    vaults(where: { term_id: { _eq: $atomId }, curve_id: { _eq: $curveId } }) {
      current_share_price
      total_shares
      position_count
      positions(
        limit: $limit
        order_by: { shares: desc }
      ) {
        account_id
        account {
          id
          label
          image
        }
        shares
      }
    }
    triples(where: {
      predicate_id: { _eq: $predicateId }
      object: { label: { _eq: "Daily Certification" } }
    }) {
      subject {
        wallet_id
      }
    }
  }
`

export interface LeaderboardEntry {
  rank: number
  address: string
  label: string
  image: string
  shares: string
  sharesFormatted: string
  value: number
  isCurrentUser: boolean
}

export interface UseStreakLeaderboardResult {
  entries: LeaderboardEntry[]
  totalParticipants: number
  totalShares: string
  currentSharePrice: string
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useStreakLeaderboard = (
  limit: number = 50
): UseStreakLeaderboardResult => {
  const { walletAddress } = useWalletFromStorage()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [totalShares, setTotalShares] = useState("0")
  const [currentSharePrice, setCurrentSharePrice] = useState("0")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!DAILY_CERTIFICATION_ATOM_ID) return

    setLoading(true)
    setError(null)

    try {
      const response = await intuitionGraphqlClient.request(
        GET_STREAK_LEADERBOARD,
        {
          atomId: DAILY_CERTIFICATION_ATOM_ID,
          curveId: "1",
          limit,
          predicateId: PREDICATE_IDS.HAS_TAG
        }
      ) as {
        vaults: Array<{
          current_share_price: string
          total_shares: string
          position_count: number
          positions: Array<{
            account_id: string
            account: { id: string; label: string; image: string }
            shares: string
          }>
        }>
        triples: Array<{
          subject: { wallet_id: string } | null
        }>
      }

      const vault = response?.vaults?.[0]
      if (!vault) {
        setEntries([])
        return
      }

      const price = BigInt(vault.current_share_price || "0")
      setCurrentSharePrice(vault.current_share_price || "0")
      setTotalShares(vault.total_shares || "0")

      const leaderboard: LeaderboardEntry[] = vault.positions.map(
        (pos, index) => {
          const sharesBI = BigInt(pos.shares || "0")
          const valueWei = (sharesBI * price) / BigInt(1e18)
          const value = Number(valueWei) / 1e18

          return {
            rank: index + 1,
            address: pos.account?.id || pos.account_id,
            label: pos.account?.label || `${pos.account_id.slice(0, 6)}...${pos.account_id.slice(-4)}`,
            image: pos.account?.image || "",
            shares: pos.shares,
            sharesFormatted: (Number(pos.shares) / 1e18).toFixed(2),
            value,
            isCurrentUser: walletAddress
              ? pos.account_id.toLowerCase() === walletAddress.toLowerCase()
              : false
          }
        }
      )

      // Build set of verified wallets (those with has_tag Daily Certification triple)
      const verifiedWallets = new Set(
        (response.triples || [])
          .map(t => t.subject?.wallet_id?.toLowerCase())
          .filter(Boolean)
      )

      // Filter: only show accounts that have the has_tag triple
      const verified = verifiedWallets.size > 0
        ? leaderboard.filter(entry => verifiedWallets.has(entry.address.toLowerCase()))
        : leaderboard // If no triples found, show all (graceful fallback)

      // Re-rank after filtering
      verified.forEach((entry, i) => { entry.rank = i + 1 })

      setEntries(verified)
      setTotalParticipants(verified.length)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch leaderboard"
      logger.error("Leaderboard fetch failed", { error: msg })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [walletAddress, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    entries,
    totalParticipants,
    totalShares,
    currentSharePrice,
    loading,
    error,
    refetch: fetchData
  }
}
