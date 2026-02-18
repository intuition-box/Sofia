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
  type GetProxyDepositDaysQuery,
  GetStreakLeaderboardDocument,
  GetVerifiedWalletsDocument,
  GetProxyDepositDaysDocument
} from "@0xsofia/graphql"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { PREDICATE_IDS, SOFIA_PROXY_ADDRESS } from "../lib/config/chainConfig"
import { createHookLogger } from "../lib/utils/logger"

const logger = createHookLogger("useStreakLeaderboard")

/**
 * Calculate current streak (consecutive days) per user from deposit records.
 * Returns Map<lowercased address, streak days>.
 */
function calculateStreaks(
  deposits: { receiver_id: string; created_at: string }[]
): Map<string, number> {
  // Group unique deposit dates (YYYY-MM-DD) per user
  const userDates = new Map<string, Set<string>>()
  for (const d of deposits) {
    const addr = d.receiver_id.toLowerCase()
    if (!userDates.has(addr)) userDates.set(addr, new Set())
    const day = d.created_at.slice(0, 10) // "YYYY-MM-DD"
    userDates.get(addr)!.add(day)
  }

  const result = new Map<string, number>()
  const today = new Date()
  const todayStr = toDateStr(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  for (const [addr, dates] of userDates) {
    // Start from today or yesterday
    let streak = 0
    let checkDate: Date

    if (dates.has(todayStr)) {
      checkDate = new Date(today)
    } else if (dates.has(yesterdayStr)) {
      checkDate = new Date(yesterday)
    } else {
      result.set(addr, 0)
      continue
    }

    // Count consecutive days backward
    while (dates.has(toDateStr(checkDate))) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    result.set(addr, streak)
  }

  return result
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export interface LeaderboardEntry {
  rank: number
  address: string
  label: string
  image: string
  shares: string
  sharesFormatted: string
  value: number
  isCurrentUser: boolean
  streakDays: number
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
      // Execute all three queries in parallel
      const [verifiedResponse, vaultResponse, depositsResponse] = await Promise.all([
        intuitionGraphqlClient.request(
          GetVerifiedWalletsDocument,
          { predicateId: PREDICATE_IDS.HAS_TAG, tagLabel }
        ) as Promise<GetVerifiedWalletsQuery>,
        intuitionGraphqlClient.request(
          GetStreakLeaderboardDocument,
          { atomId, curveId: "1", limit }
        ) as Promise<GetStreakLeaderboardQuery>,
        SOFIA_PROXY_ADDRESS
          ? intuitionGraphqlClient.request(
              GetProxyDepositDaysDocument,
              { senderId: SOFIA_PROXY_ADDRESS, termId: atomId }
            ) as Promise<GetProxyDepositDaysQuery>
          : Promise.resolve({ deposits: [] } as GetProxyDepositDaysQuery)
      ])

      // Calculate streak days per user from proxy deposits
      const streakMap = calculateStreaks(depositsResponse.deposits || [])

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

          const address = pos.account?.id || pos.account_id
          return {
            rank: index + 1,
            address,
            label: pos.account?.label || `${pos.account_id.slice(0, 6)}...${pos.account_id.slice(-4)}`,
            image: pos.account?.image || "",
            shares: pos.shares,
            sharesFormatted: (Number(pos.shares) / 1e18).toFixed(2),
            value,
            isCurrentUser: walletAddress
              ? pos.account_id.toLowerCase() === walletAddress.toLowerCase()
              : false,
            streakDays: streakMap.get(address.toLowerCase()) || 0
          }
        }
      )

      // Cross-reference: only keep positions whose account is verified
      const verified = verifiedWallets.size > 0
        ? leaderboard.filter(entry => verifiedWallets.has(entry.address.toLowerCase()))
        : leaderboard // Fallback if no triples found

      // Sort by streak days desc, then shares desc as tiebreaker
      verified.sort((a, b) => {
        if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays
        return Number(BigInt(b.shares) - BigInt(a.shares))
      })

      // Re-rank after sorting
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
