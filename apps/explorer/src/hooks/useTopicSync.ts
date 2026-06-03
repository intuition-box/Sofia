/**
 * useTopicSync — on-chain topic position state + redeem.
 *
 * Interest selection was removed (#521): every user is interested in every
 * topic, so there is no longer any auto-staking of "selected" topics (the old
 * cart auto-add is gone). This hook now just exposes the wallet's on-chain
 * topic positions (for "owned" pills) and a redeem action for un-staking a
 * topic the user previously owned.
 */

import { useCallback, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useTopicSelection } from './useDomainSelection'
import { useTopicPositions } from './useTopicPositions'
import { useInterestsHydration } from './useInterestsHydration'
import { redeemAtom } from '@/services/redeemService'
import { clearOptimisticPosition } from '@/lib/realtime/derivations'
import { TOPIC_ATOM_IDS } from '@/config/atomIds'

export interface RedeemState {
  topicId: string
  loading: boolean
  error?: string
}

export function useTopicSync() {
  useInterestsHydration()

  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const qc = useQueryClient()

  const { selectedTopics, selectedCategories, toggleTopic } =
    useTopicSelection()
  const {
    positions,
    hasPosition,
    isPending,
    isLoading: positionsLoading,
    refetch,
  } = useTopicPositions(selectedTopics)

  const [redeemState, setRedeemState] = useState<RedeemState | null>(null)

  // ── Redeem a topic position ──
  const redeemTopic = useCallback(
    async (topicId: string) => {
      if (!wallet || !authenticated) return

      const termId = TOPIC_ATOM_IDS[topicId]
      if (!termId) return

      setRedeemState({ topicId, loading: true })

      try {
        const result = await redeemAtom(wallet, termId)
        if (!result.success) {
          setRedeemState({ topicId, loading: false, error: result.error })
          return
        }
        clearOptimisticPosition(qc, wallet.address, termId)
        toggleTopic()
        setRedeemState(null)
        refetch()
      } catch (err: any) {
        setRedeemState({
          topicId,
          loading: false,
          error: err?.message || 'Redeem failed',
        })
      }
    },
    [wallet, authenticated, toggleTopic, refetch, qc],
  )

  // ── Remove a topic (redeem if the user owns an on-chain position) ──
  const removeTopic = useCallback(
    (topicId: string) => {
      if (hasPosition(topicId)) redeemTopic(topicId)
      else toggleTopic()
    },
    [hasPosition, redeemTopic, toggleTopic],
  )

  return {
    selectedTopics,
    selectedCategories,
    toggleTopic,
    removeTopic,
    hasPosition,
    isPending,
    positions,
    positionsLoading,
    redeemState,
    clearRedeemError: () => setRedeemState(null),
    refetchPositions: refetch,
  }
}
