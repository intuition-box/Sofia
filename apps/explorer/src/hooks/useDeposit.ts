import { useState, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import {
  type DepositResult,
  type BatchDepositItem,
  executeSingleDeposit,
  executeBatchDeposit,
  fetchBalance,
  calculateFee,
} from '@/services/depositService'
import { applyOptimisticPosition } from '@/lib/realtime/derivations'

export type { DepositResult, BatchDepositItem }

export function useDeposit() {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const qc = useQueryClient()
  const [processing, setProcessing] = useState(false)
  const [txResult, setTxResult] = useState<DepositResult | null>(null)

  /** Resolve the acting wallet (the account's primary/login wallet) or throw.
   *  Anchored on `user.wallet` so linking another wallet never switches who
   *  signs; falls back to the first connected wallet. */
  const requireWallet = useCallback(() => {
    if (!authenticated || wallets.length === 0)
      throw new Error('No wallet connected')
    const primary = user?.wallet?.address?.toLowerCase()
    return (
      wallets.find((w) => w.address.toLowerCase() === primary) ?? wallets[0]
    )
  }, [authenticated, wallets, user])

  /** Single deposit */
  const deposit = useCallback(
    async (termId: string, amountTrust: number): Promise<DepositResult> => {
      setProcessing(true)
      setTxResult(null)
      try {
        const wallet = requireWallet()
        const result = await executeSingleDeposit(wallet, termId, amountTrust)
        setTxResult(result)
        if (result.success) {
          // Optimistic: flip the per-slug maps so "pending" UI clears
          // immediately. WS will overwrite with the true indexed shares
          // within a couple of seconds.
          applyOptimisticPosition(qc, wallet.address, termId, 1n)
          // Triples don't get a per-slug optimistic bump (no atom mapping),
          // so re-fetch any feed that exposes a server-derived
          // userSupported / userOpposed flag — the indexer catches up
          // quickly enough that the refetch lands the green thumb without
          // waiting on the WS push.
          qc.invalidateQueries({ queryKey: ['circle-feed'] })
          // A context-add ("+ Context") deposits on an "in context of"
          // triple — refresh the master profile so the new tag shows up in
          // the ProfileDrawer "Last activity" feed without waiting on
          // staleTime.
          qc.invalidateQueries({ queryKey: ['user-onchain-profile'] })
          // Endorsing a skill/tool deposits on its endorsement triple —
          // refresh the skills/tools panels so the endorser count reflects
          // the new position instead of the cached value (10 min staleTime).
          qc.invalidateQueries({ queryKey: ['userAttributes'] })
        }
        return result
      } catch (err: any) {
        const result: DepositResult = {
          success: false,
          error: err?.shortMessage || err?.message || 'Transaction failed',
        }
        setTxResult(result)
        return result
      } finally {
        setProcessing(false)
      }
    },
    [requireWallet, qc],
  )

  /** Batch deposit — multiple items in one TX */
  const depositBatch = useCallback(
    async (items: BatchDepositItem[]): Promise<DepositResult> => {
      if (items.length === 0) return { success: false, error: 'No items' }
      if (items.length === 1)
        return deposit(items[0].termId, items[0].amountTrust)

      setProcessing(true)
      setTxResult(null)
      try {
        const wallet = requireWallet()
        const result = await executeBatchDeposit(wallet, items)
        setTxResult(result)
        if (result.success) {
          for (const item of items) {
            applyOptimisticPosition(qc, wallet.address, item.termId, 1n)
          }
          qc.invalidateQueries({ queryKey: ['circle-feed'] })
          qc.invalidateQueries({ queryKey: ['user-onchain-profile'] })
          qc.invalidateQueries({ queryKey: ['userAttributes'] })
        }
        return result
      } catch (err: any) {
        const result: DepositResult = {
          success: false,
          error: err?.shortMessage || err?.message || 'Transaction failed',
        }
        setTxResult(result)
        return result
      } finally {
        setProcessing(false)
      }
    },
    [requireWallet, deposit, qc],
  )

  /** Get the acting wallet's balance on the Intuition chain */
  const getBalance = useCallback(async (): Promise<string> => {
    if (wallets.length === 0) return '0'
    const primary = user?.wallet?.address?.toLowerCase()
    const acting =
      wallets.find((w) => w.address.toLowerCase() === primary) ?? wallets[0]
    return fetchBalance(acting.address)
  }, [wallets, user])

  const reset = useCallback(() => setTxResult(null), [])

  return {
    deposit,
    depositBatch,
    processing,
    txResult,
    reset,
    getBalance,
    calculateFee,
  }
}
