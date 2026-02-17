/**
 * useDailyStreakProfit
 * Queries the user's position in the shared "Daily Certification" atom vault
 * and calculates profit/loss from streak deposits.
 */

import { useState, useEffect, useCallback } from "react"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { DAILY_CERTIFICATION_ATOM_ID } from "../lib/config/chainConfig"
import { createHookLogger } from "../lib/utils/logger"

const logger = createHookLogger("useDailyStreakProfit")

const GET_ATOM_VAULT_DATA = `
  query GetAtomVaultData(
    $atomId: String!
    $curveId: numeric!
    $walletAddress: String!
  ) {
    vaults(where: {term_id: {_eq: $atomId}, curve_id: {_eq: $curveId}}) {
      current_share_price
      total_shares
      position_count
      positions(where: {account_id: {_ilike: $walletAddress}}) {
        shares
        total_deposit_assets_after_total_fees
        total_redeem_assets_for_receiver
      }
    }
  }
`

export interface DailyStreakProfitData {
  shares: string
  currentSharePrice: string
  totalDeposited: string
  currentValue: number
  profit: number
  totalShares: string
  sharesFormatted: string
  hasPosition: boolean
  participantCount: number
}

export interface UseDailyStreakProfitResult {
  data: DailyStreakProfitData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useDailyStreakProfit = (): UseDailyStreakProfitResult => {
  const { walletAddress } = useWalletFromStorage()
  const [data, setData] = useState<DailyStreakProfitData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!walletAddress || !DAILY_CERTIFICATION_ATOM_ID) return

    setLoading(true)
    setError(null)

    try {
      const response = await intuitionGraphqlClient.request(
        GET_ATOM_VAULT_DATA,
        {
          atomId: DAILY_CERTIFICATION_ATOM_ID,
          curveId: "1",
          walletAddress
        }
      ) as {
        vaults: Array<{
          current_share_price: string
          total_shares: string
          position_count: number
          positions: Array<{
            shares: string
            total_deposit_assets_after_total_fees: string
            total_redeem_assets_for_receiver: string
          }>
        }>
      }

      const vault = response?.vaults?.[0]
      if (!vault) {
        setData(null)
        return
      }

      const position = vault.positions?.[0]
      const shares = position?.shares || "0"
      const currentSharePrice = vault.current_share_price || "0"
      const totalDeposited = position?.total_deposit_assets_after_total_fees || "0"
      const totalRedeemed = position?.total_redeem_assets_for_receiver || "0"

      // Current value: shares * price / 1e18
      const currentValueWei = (BigInt(shares) * BigInt(currentSharePrice)) / BigInt(1e18)
      const currentValue = Number(currentValueWei) / 1e18

      // Profit = current value - (deposited - redeemed)
      const netDeposited = BigInt(totalDeposited) - BigInt(totalRedeemed)
      const profit = currentValue - Number(netDeposited) / 1e18

      const sharesFormatted = (Number(shares) / 1e18).toFixed(4)

      setData({
        shares,
        currentSharePrice,
        totalDeposited,
        currentValue,
        profit,
        totalShares: vault.total_shares || "0",
        sharesFormatted,
        hasPosition: BigInt(shares) > 0n,
        participantCount: vault.position_count || 0
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch streak data"
      logger.error("Failed to fetch streak profit", { error: msg })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
