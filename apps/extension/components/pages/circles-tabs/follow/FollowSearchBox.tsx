/**
 * FollowSearchBox - Search input with autocomplete for global account search
 */

import { useState, useEffect, useMemo } from 'react'
import { UserPlus } from 'lucide-react'
import { useGetAtomAccount, useCheckFollowStatus, useWalletFromStorage, type AccountAtom } from '../../../../hooks'
import { debounce } from '../../../../lib/utils'
import Avatar from '../../../ui/Avatar'
import AccountSignalsBadge from '../../../ui/AccountSignalsBadge'
import TrustAccountButton from '../../../ui/TrustAccountButton'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface FollowSearchBoxProps {
  onSelectAccount: (account: AccountAtom) => void
  onTrustSuccess?: () => void
  onSearchChange?: (query: string) => void
  placeholder?: string
}

/**
 * Add-to-circle button: opens WeightModal pre-filled with 0.01 TRUST
 * and creates the I → TRUSTS → account triple in one step.
 * Shows "Trusted ✓" if the account is already in the user's trust circle.
 */
function AccountActionButton({
  account,
  onTrustSuccess
}: {
  account: AccountAtom
  onTrustSuccess?: () => void
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

  return (
    <TrustAccountButton
      accountTermId={account.termId}
      accountLabel={account.label}
      label={<><UserPlus size={12} /> add</>}
      initialWeight="minimum"
      className="explorer-add-btn"
      onSuccess={() => {
        followStatus.refetch()
        onTrustSuccess?.()
      }}
    />
  )
}

export function FollowSearchBox({
  onSelectAccount,
  onTrustSuccess,
  onSearchChange,
  placeholder = 'Search all accounts on Intuition...'
}: FollowSearchBoxProps) {
  const [globalQuery, setGlobalQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AccountAtom[]>([])
  const [showResults, setShowResults] = useState(false)
  const { searchAccounts } = useGetAtomAccount()
  const { walletAddress: selfAddress } = useWalletFromStorage()

  // Hide the connected user from their own search results
  const visibleResults = useMemo(() => {
    const self = selfAddress?.toLowerCase()
    if (!self) return searchResults
    return searchResults.filter(a => a.data?.toLowerCase() !== self)
  }, [searchResults, selfAddress])

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

      {showResults && visibleResults.length > 0 && (
        <div className="search-results-dropdown">
          {visibleResults.slice(0, 10).map((account, index) => (
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
                  <AccountSignalsBadge
                    walletAddress={account.data}
                    compact={true}
                  />
                </div>
              </div>
              <div className="account-right" onClick={(e) => e.stopPropagation()}>
                <AccountActionButton
                  account={account}
                  onTrustSuccess={onTrustSuccess}
                />
              </div>
            </div>
          ))}

          {visibleResults.length > 10 && (
            <div className="search-results-more">
              +{visibleResults.length - 10} more results
            </div>
          )}
        </div>
      )}
    </div>
  )
}
