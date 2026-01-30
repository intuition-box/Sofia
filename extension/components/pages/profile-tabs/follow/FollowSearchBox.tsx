/**
 * FollowSearchBox - Search input with autocomplete for global account search
 */

import { useState, useEffect } from 'react'
import { useGetAtomAccount, AccountAtom } from '../../../../hooks/useGetAtomAccount'
import { debounce } from '../../../../lib/utils/refetchUtils'
import Avatar from '../../../ui/Avatar'
import UserAtomStats from '../../../ui/UserAtomStats'
import FollowButton from '../../../ui/FollowButton'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface FollowSearchBoxProps {
  onSelectAccount: (account: AccountAtom) => void
  onFollowSuccess?: () => void
  onSearchChange?: (query: string) => void
  placeholder?: string
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
                <FollowButton
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
