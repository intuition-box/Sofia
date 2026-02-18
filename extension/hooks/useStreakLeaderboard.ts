/**
 * useStreakLeaderboard
 * Two-step approach:
 * 1. Query has_tag triples to get verified wallets (subject.value.account.id)
 * 2. Query vault positions on the daily quest atom
 * 3. Cross-reference: only show verified wallets with their vault position
 */

import { useState, useEffect, useCallback } from "react"
import {
  type GetStreakLeaderboardQuery,
  type GetVerifiedWalletsQuery,
  GetStreakLeaderboardDocument,
  GetVerifiedWalletsDocument
} from "@0xsofia/graphql"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { PREDICATE_IDS } from "../lib/config/chainConfig"
import { createHookLogger } from "../lib/utils/logger"

const logger = createHookLogger("useStreakLeaderboard")

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
  atomId: string,
  tagLabel: string,
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
    if (!atomId) return

    setLoading(true)
    setError(null)

    try {
      // Execute both queries in parallel
      const [verifiedResponse, vaultResponse] = await Promise.all([
        intuitionGraphqlClient.request(
          GetVerifiedWalletsDocument,
          { predicateId: PREDICATE_IDS.HAS_TAG, tagLabel }
        ) as Promise<GetVerifiedWalletsQuery>,
        intuitionGraphqlClient.request(
          GetStreakLeaderboardDocument,
          { atomId, curveId: "1", limit }
        ) as Promise<GetStreakLeaderboardQuery>
      ])

      const vault = vaultResponse?.vaults?.[0]
      if (!vault) {
        setEntries([])
        return
      }

      // Build verified wallet set from has_tag triples
      // subject.value.account.id = full wallet address (from accounts table)
      const verifiedWallets = new Set(
        (verifiedResponse.triples || [])
          .map(t => t.subject?.value?.account?.id?.toLowerCase())
          .filter(Boolean) as string[]
      )

      const price = BigInt(vault.current_share_price || "0")
      setCurrentSharePrice(vault.current_share_price || "0")
      setTotalShares(vault.total_shares || "0")

      // Build leaderboard from vault positions
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

      // Cross-reference: only keep positions whose account is verified
      const verified = verifiedWallets.size > 0
        ? leaderboard.filter(entry => verifiedWallets.has(entry.address.toLowerCase()))
        : leaderboard // Fallback if no triples found

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
  }, [walletAddress, limit, atomId, tagLabel])

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
