/**
 * FollowingPanel - Display accounts I follow
 */

import { useEffect, useState } from 'react'
import { useFollowing } from '../../../../hooks/useFollowing'
import { useRouter } from '../../../layout/RouterProvider'
import type { FollowAccountVM } from '../../../../types/follows'
import { refetchWithBackoff } from '../../../../lib/utils/refetchUtils'
import { intuitionGraphqlClient } from '../../../../lib/clients/graphql-client'
import { useCheckFollowStatus } from '../../../../hooks/useCheckFollowStatus'
import { useRedeemTriple } from '../../../../hooks/useRedeemTriple'
import TrustAccountButton from '../../../ui/TrustAccountButton'
import Avatar from '../../../ui/Avatar'
import UserAtomStats from '../../../ui/UserAtomStats'
import '../../../styles/CoreComponents.css'
import { createHookLogger } from '../../../../lib/utils/logger'
import '../../../styles/FollowTab.css'

const logger = createHookLogger('FollowingPanel')

interface FollowingPanelProps {
  walletAddress: string | undefined
}

/**
 * Component to display the correct action button based on follow/trust status
 */
function AccountActionButton({ 
  account,
  onSuccess 
}: { 
  account: FollowAccountVM
  onSuccess?: () => void 
}) {
  const followStatus = useCheckFollowStatus(account.termId)

  // Only show buttons if termId is valid (bytes32 - 66 chars)
  if (account.termId.length !== 66) {
    return null
  }

  if (followStatus.loading) {
    return (
      <button className="follow-button salmon-gradient-button" disabled>
        Loading...
      </button>
    )
  }

  if (followStatus.isTrusting) {
    return (
      <button className="follow-button salmon-gradient-button" disabled>
        Trusted ✓
      </button>
    )
  }

  // Since this is in FollowingPanel, we're already following, so show Trust button
  return (
    <TrustAccountButton
      accountTermId={account.termId}
      accountLabel={account.label}
      onSuccess={() => {
        followStatus.refetch()
        onSuccess?.()
      }}
    />
  )
}

export function FollowingPanel({ walletAddress }: FollowingPanelProps) {
  const { accounts, loading, error, refetch } = useFollowing(walletAddress)
  const { navigateTo } = useRouter()
  const { redeemPosition } = useRedeemTriple()
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  // Load data on mount
  useEffect(() => {
    refetch()
  }, [refetch])

  const handleUnfollow = async (account: FollowAccountVM) => {
    const confirmed = confirm(`Unfollow ${account.label}? This will redeem your position.`)
    if (!confirmed) return

    setProcessingIds(prev => new Set(prev).add(account.tripleId))
    try {
      const result = await redeemPosition(account.tripleId)
      if (!result.success) {
        alert(`Unfollow failed: ${result.error}`)
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

  if (!walletAddress) {
    return (
      <div className="follow-panel">
        <div className="empty-state">
          <p>Connect wallet to view following</p>
        </div>
      </div>
    )
  }

  return (
    <div className="follow-panel">
      {loading && (
        <div className="loading-state">
          <p>Loading following...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <h3>Error Loading Following</h3>
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
              <p>Not following anyone yet</p>
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
                  <AccountActionButton
                    account={account}
                    onSuccess={() => {
                      logger.info('Trust created for', account.label)
                      refetchWithBackoff(refetch, {
                        initialDelay: 1000,
                        maxDelay: 4000,
                        maxAttempts: 3,
                        onAttempt: (attempt) => logger.debug(`Refetch attempt ${attempt}`)
                      })
                    }}
                  />
                  <button
                    className="remove-btn"
                    onClick={() => handleUnfollow(account)}
                    disabled={processingIds.has(account.tripleId)}
                    title="Unfollow"
                  >
                    {processingIds.has(account.tripleId) ? '...' : '×'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
