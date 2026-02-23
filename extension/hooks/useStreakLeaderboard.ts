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
import { createHookLogger, batchResolveEns, calculateStreaks } from "../lib/utils"

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
  streakDays: number
  termId?: string
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

      // Build verified wallet set + termId map from has_tag triples
      // subject.value.account.id = full wallet address (from accounts table)
      const verifiedWallets = new Set<string>()
      const termIdMap = new Map<string, string>()
      for (const t of verifiedResponse.triples || []) {
        const addr = t.subject?.value?.account?.id?.toLowerCase()
        const termId = t.subject?.term_id
        if (addr) {
          verifiedWallets.add(addr)
          if (termId) termIdMap.set(addr, termId)
        }
      }

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
          const addrLower = address.toLowerCase()
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
            streakDays: streakMap.get(addrLower) || 0,
            termId: termIdMap.get(addrLower)
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

      // Set entries immediately, then resolve ENS in background
      setEntries([...verified])
      setTotalParticipants(verified.length)

      // Batch resolve ENS names + avatars for entries missing label or image
      const addressesToResolve = verified
        .filter((e) => !e.image || !e.label || e.label.startsWith("0x") || e.label.includes("..."))
        .map((e) => e.address)

      if (addressesToResolve.length > 0) {
        batchResolveEns(addressesToResolve).then((ensResults) => {
          for (const entry of verified) {
            const ens = ensResults.get(entry.address.toLowerCase())
            if (ens?.name && (!entry.label || entry.label.startsWith("0x") || entry.label.includes("..."))) {
              entry.label = ens.name
            }
            if (ens?.avatar && !entry.image) {
              entry.image = ens.avatar
            }
          }
          setEntries([...verified])
        })
      }
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
