/**
 * FollowingPanel - Display accounts I follow
 */

import { useEffect, useMemo, useState } from 'react'
import { useFollowing } from '../../../../hooks/useFollowing'
import { useRouter } from '../../../layout/RouterProvider'
import type { FollowAccountVM } from '../../../../types/follows'
import type { AccountAtom } from '../../../../hooks/useGetAtomAccount'
import { FollowSearchBox } from './FollowSearchBox'
import { refetchWithBackoff } from '../../../../lib/utils/refetchUtils'
import TrustAccountButton from '../../../ui/TrustAccountButton'
import Avatar from '../../../ui/Avatar'
import UserAtomStats from '../../../ui/UserAtomStats'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface FollowingPanelProps {
  walletAddress: string | undefined
}

export function FollowingPanel({ walletAddress }: FollowingPanelProps) {
  const { accounts, loading, error, refetch } = useFollowing(walletAddress)
  const { navigateTo } = useRouter()

  const [localFilter, setLocalFilter] = useState('')

  // Load data on mount
  useEffect(() => {
    refetch()
  }, [refetch])

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    if (!localFilter) {
      return accounts
    }

    return accounts.filter((acc) =>
      acc.label.toLowerCase().includes(localFilter.toLowerCase())
    )
  }, [accounts, localFilter])

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

  const handleSearchResultClick = (account: AccountAtom) => {
    navigateTo('user-profile', {
      termId: account.id,
      label: account.label,
      image: account.image,
      walletAddress: account.data,
      url: undefined,
      description: undefined
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
      <FollowSearchBox 
        onSelectAccount={handleSearchResultClick}
        onFollowSuccess={() => {
          console.log('✅ Follow successful from search')
          refetchWithBackoff(refetch, {
            initialDelay: 1000,
            maxDelay: 4000,
            maxAttempts: 3,
            onAttempt: (attempt) => console.log(`🔄 Refetch attempt ${attempt}`)
          })
        }}
        onSearchChange={setLocalFilter}
      />

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
          {filteredAccounts.length === 0 ? (
            <div className="empty-state">
              <p>Not following anyone yet</p>
            </div>
          ) : (
            filteredAccounts.map((account, index) => (
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
                  <TrustAccountButton
                    accountTermId={account.termId}
                    accountLabel={account.label}
                    onSuccess={() => {
                      console.log('✅ Trust created for', account.label)
                      refetchWithBackoff(refetch, {
                        initialDelay: 1000,
                        maxDelay: 4000,
                        maxAttempts: 3,
                        onAttempt: (attempt) => console.log(`🔄 Refetch attempt ${attempt}`)
                      })
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
