/**
 * FollowSearchBox - Search input with autocomplete for global account search
 */

import { useState, useEffect } from 'react'
import { useGetAtomAccount, AccountAtom } from '../../../../hooks/useGetAtomAccount'
import { useCheckFollowStatus } from '../../../../hooks/useCheckFollowStatus'
import { debounce } from '../../../../lib/utils/refetchUtils'
import Avatar from '../../../ui/Avatar'
import UserAtomStats from '../../../ui/UserAtomStats'
import FollowButton from '../../../ui/FollowButton'
import TrustAccountButton from '../../../ui/TrustAccountButton'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface FollowSearchBoxProps {
  onSelectAccount: (account: AccountAtom) => void
  onFollowSuccess?: () => void
  onSearchChange?: (query: string) => void
  placeholder?: string
}

/**
 * Component to display the correct action button based on follow/trust status
 */
function AccountActionButton({ 
  account, 
  onFollowSuccess 
}: { 
  account: AccountAtom
  onFollowSuccess?: () => void 
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

  if (followStatus.isFollowing) {
    return (
      <TrustAccountButton
        accountTermId={account.termId}
        accountLabel={account.label}
        onSuccess={() => {
          followStatus.refetch()
          onFollowSuccess?.()
        }}
      />
    )
  }

  return (
    <FollowButton
      account={account}
      onFollowSuccess={() => {
        followStatus.refetch()
        onFollowSuccess?.()
      }}
    />
  )
}

export function FollowSearchBox({
  onSelectAccount,
  onFollowSuccess,
  onSearchChange,
  placeholder = 'Search all accounts on Intuition...'
}: FollowSearchBoxProps) {
  const [globalQuery, setGlobalQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AccountAtom[]>([])
  const [showResults, setShowResults] = useState(false)
  const { searchAccounts } = useGetAtomAccount()

  // Debounced search
  useEffect(() => {
    const debouncedSearch = debounce(async () => {
      if (globalQuery.trim()) {
        const results = await searchAccounts(globalQuery)
        setSearchResults(results)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    debouncedSearch()
    
    // Also notify parent for local filtering
    if (onSearchChange) {
      onSearchChange(globalQuery)
    }
  }, [globalQuery, searchAccounts, onSearchChange])

  const handleSelectAccount = (account: AccountAtom) => {
    setGlobalQuery('')
    setShowResults(false)
    onSelectAccount(account)
  }

  return (
    <div className="search-container">
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={globalQuery}
        onChange={(e) => setGlobalQuery(e.target.value)}
      />

      {showResults && searchResults.length > 0 && (
        <div className="search-results-dropdown">
          {searchResults.slice(0, 10).map((account, index) => (
            <div
              key={account.id}
              className="search-result-card"
              onClick={() => handleSelectAccount(account)}
            >
              <div className="account-left">
                <span className="account-number">{index + 1}</span>
                <Avatar
                  imgSrc={account.image}
                  name={account.label}
                  avatarClassName="account-avatar"
                  size="medium"
                />
                <div className="search-account-info">
                  <span className="account-label">{account.label}</span>
                  <UserAtomStats termId={account.id} accountAddress={account.data} compact={true} />
                </div>
              </div>
              <div className="account-right" onClick={(e) => e.stopPropagation()}>
                <AccountActionButton
                  account={account}
                  onFollowSuccess={onFollowSuccess}
                />
              </div>
            </div>
          ))}

          {searchResults.length > 10 && (
            <div className="search-results-more">
              +{searchResults.length - 10} more results
            </div>
          )}
        </div>
      )}
    </div>
  )
}
