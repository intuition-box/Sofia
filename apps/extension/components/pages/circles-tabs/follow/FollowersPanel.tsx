/**
 * FollowersPanel - Display accounts that follow me
 */

import { useEffect } from 'react'
import { useFollowers, useCheckFollowStatus } from '../../../../hooks'
import { useRouter } from '../../../layout/RouterProvider'
import SofiaLoader from '../../../ui/SofiaLoader'
import TrustAccountButton from '../../../ui/TrustAccountButton'
import Avatar from '../../../ui/Avatar'
import UserAtomStats from '../../../ui/UserAtomStats'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface FollowersPanelProps {
  walletAddress: string | undefined
}

function FollowerActionButton({ account }: { account: { termId: string; label: string } }) {
  const followStatus = useCheckFollowStatus(account.termId)

  if (account.termId.length !== 66) return null
  if (followStatus.loading) {
    return <button className="follow-button salmon-gradient-button" disabled>Loading...</button>
  }
  if (followStatus.isTrusting) {
    return <button className="follow-button salmon-gradient-button" disabled>Trusted</button>
  }

  return (
    <TrustAccountButton
      accountTermId={account.termId}
      accountLabel={account.label}
      onSuccess={() => followStatus.refetch()}
    />
  )
}

export function FollowersPanel({ walletAddress }: FollowersPanelProps) {
  const { accounts, loading, error, refetch } = useFollowers(walletAddress)
  const { navigateTo } = useRouter()

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

  if (!walletAddress) {
    return (
      <div className="follow-panel">
        <div className="empty-state">
          <p>Connect wallet to view followers</p>
        </div>
      </div>
    )
  }

  return (
    <div className="follow-panel">
      {loading && (
        <div className="loading-state">
          <SofiaLoader size={150} />
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <h3>Error Loading Followers</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="followed-accounts">
          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>No followers yet</p>
            </div>
          ) : (
            accounts.map((account, index) => (
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
                  <FollowerActionButton account={account} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
