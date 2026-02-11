/**
 * TrustCirclePanel - Display accounts in my trust circle (with trust amounts)
 */

import { useEffect, useState } from 'react'
import { useTrustCircle } from '../../../../hooks/useTrustCircle'
import { useWeightOnChain } from '../../../../hooks/useWeightOnChain'
import { useRedeemTriple } from '../../../../hooks/useRedeemTriple'
import { useRouter } from '../../../layout/RouterProvider'
import type { FollowAccountVM } from '../../../../types/follows'
import { refetchWithBackoff } from '../../../../lib/utils/refetchUtils'
import { intuitionGraphqlClient } from '../../../../lib/clients/graphql-client'
import StakeModal from '../../../modals/StakeModal'
import  Avatar  from '../../../ui/Avatar'
import  UserAtomStats  from '../../../ui/UserAtomStats'
import '../../../styles/CoreComponents.css'
import { createHookLogger } from '../../../../lib/utils/logger'
import '../../../styles/FollowTab.css'

const logger = createHookLogger('TrustCirclePanel')

interface TrustCirclePanelProps {
  walletAddress: string | undefined
}

export function TrustCirclePanel({ walletAddress }: TrustCirclePanelProps) {
  const { accounts, loading, error, refetch } = useTrustCircle(walletAddress)
  const { addWeight, removeWeight } = useWeightOnChain()
  const { redeemPosition } = useRedeemTriple()
  const { navigateTo } = useRouter()

  // Stake modal state
  const [selectedAccount, setSelectedAccount] = useState<FollowAccountVM | null>(null)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessingStake, setIsProcessingStake] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  // Load data on mount
  useEffect(() => {
    refetch()
  }, [refetch])

  const handleNavigateToProfile = (account: typeof accounts[0]) => {
    navigateTo('user-profile', {
      termId: account.termId,
      label: account.label,
      image: account.image,
      walletAddress: account.walletAddress,
      url: account.meta?.url,
      description: account.meta?.description
    })
  }

  const handleCloseStakeModal = () => {
    setIsStakeModalOpen(false)
    setSelectedAccount(null)
    setIsProcessingStake(false)
  }

  const handleRemoveTrust = async (account: FollowAccountVM) => {
    const confirmed = confirm(`Remove ${account.label} from trust circle? This will redeem your position.`)
    if (!confirmed) return

    setProcessingIds(prev => new Set(prev).add(account.tripleId))
    try {
      const result = await redeemPosition(account.tripleId)
      if (!result.success) {
        alert(`Remove failed: ${result.error}`)
        return
      }
      // Optimistic: hide account immediately
      setRemovedIds(prev => new Set(prev).add(account.tripleId))
      // Clear GraphQL cache so refetch gets fresh data from indexer
      intuitionGraphqlClient.clearCache()
      // Background refetch for eventual consistency
      refetchWithBackoff(refetch, {
        initialDelay: 5000,
        maxDelay: 10000,
        maxAttempts: 3
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(account.tripleId)
        return newSet
      })
    }
  }

  const handleStakeSubmit = async (amount: bigint, curveId: 1 | 2) => {
    if (!selectedAccount || !walletAddress) {
      return {
        success: false,
        error: 'Missing required data'
      }
    }

    try {
      setIsProcessingStake(true)

      // Convert bigint Wei to number TRUST
      const trustAmount = Number(amount) / 1e18
      const newUpvotes = Math.round(trustAmount * 1000)

      const currentUpvotes = Math.round(selectedAccount.trustAmount * 1000)
      const difference = newUpvotes - currentUpvotes

      if (difference === 0) {
        handleCloseStakeModal()
        return { success: true }
      }

      // Convert upvotes to Wei (1 upvote = 0.001 TRUST = 10^15 Wei)
      const weightChange = BigInt(Math.abs(difference)) * BigInt(1e15)

      let result
      if (difference > 0) {
        // Adding trust
        result = await addWeight(selectedAccount.tripleId, weightChange)
      } else {
        // Removing trust
        result = await removeWeight(selectedAccount.tripleId, weightChange)
      }

      if (result.success) {
        logger.info('Trust adjustment successful, refetching with backoff')

        // Refetch with backoff
        refetchWithBackoff(refetch, {
          initialDelay: 1000,
          maxDelay: 4000,
          maxAttempts: 3,
          onAttempt: (attempt) => logger.debug(`Refetch attempt ${attempt}`)
        })

        handleCloseStakeModal()
      }

      return result
    } catch (error) {
      setIsProcessingStake(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
    }
  }

  if (!walletAddress) {
    return (
      <div className="follow-panel">
        <div className="empty-state">
          <p>Connect wallet to view trust circle</p>
        </div>
      </div>
    )
  }

  return (
    <div className="follow-panel">
      {loading && (
        <div className="loading-state">
          <p>Loading trust circle...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <h3>Error Loading Trust Circle</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="followed-accounts">
          {accounts.filter(a => !removedIds.has(a.tripleId)).length === 0 ? (
            <div className="empty-state">
              <p>No accounts in trust circle yet</p>
            </div>
          ) : (
            accounts.filter(a => !removedIds.has(a.tripleId)).map((account, index) => (
              <div
                key={account.id}
                className="followed-account-card"
                onClick={() => handleNavigateToProfile(account)}
                style={{ cursor: 'pointer' }}
              >
                <div className="account-left">
                  <span className="account-number">{index + 1}</span>
                  <Avatar
                    imgSrc={account.image}
                    name={account.label}
                    avatarClassName="account-avatar"
                    size="medium"
                  />
                  <div className="account-info">
                    <span className="account-label">{account.label}</span>
                    <UserAtomStats termId={account.termId} accountAddress={account.walletAddress} compact={true} />
                    <span className="trust-amount">{account.trustAmount.toFixed(8)} TRUST</span>
                  </div>
                </div>
                <div className="account-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveTrust(account)}
                    disabled={processingIds.has(account.tripleId)}
                    title="Remove from trust circle"
                  >
                    {processingIds.has(account.tripleId) ? '...' : '×'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stake Modal */}
      {selectedAccount && (
        <StakeModal
          isOpen={isStakeModalOpen}
          subjectName="I"
          predicateName="trust"
          objectName={selectedAccount.label}
          tripleId={selectedAccount.tripleId}
          defaultCurve={1}
          onClose={handleCloseStakeModal}
          onSubmit={handleStakeSubmit}
          isProcessing={isProcessingStake}
        />
      )}
    </div>
  )
}
