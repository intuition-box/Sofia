import { useState, useEffect } from 'react'
import searchIcon from '../../ui/icons/Icon=Search.svg'
import connectButtonOn from '../../ui/icons/connectButtonOn.svg'
import connectButtonOff from '../../ui/icons/connectButtonOff.svg'
import { useGetatomaccount, AccountAtom } from '../../../hooks/useGetatomaccount'
import '../../styles/AccountTab.css'

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AccountAtom[]>([])
  const [showResults, setShowResults] = useState(false)

  // Use the account atoms hook
  const { accounts, isLoading, error, searchAccounts } = useGetatomaccount()

  // OAuth connection states
  const [oauthTokens, setOauthTokens] = useState({
    youtube: false,
    spotify: false,
    twitch: false
  })

  // Check OAuth token status on component mount
  useEffect(() => {
    const checkOAuthTokens = async () => {
      const result = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify', 
        'oauth_token_twitch'
      ])
      
      setOauthTokens({
        youtube: !!result.oauth_token_youtube,
        spotify: !!result.oauth_token_spotify,
        twitch: !!result.oauth_token_twitch
      })
    }
    
    checkOAuthTokens()
    
    // Listen for storage changes to update connection states
    const handleStorageChange = (changes: any) => {
      if (changes.oauth_token_youtube || changes.oauth_token_spotify || changes.oauth_token_twitch) {
        checkOAuthTokens()
      }
    }
    
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  // Handle search input changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchAccounts(searchQuery)
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery, searchAccounts])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle account selection
  const handleAccountSelect = (account: AccountAtom) => {
    console.log('Selected account:', account)
    setSearchQuery(account.label)
    setShowResults(false)
    // TODO: Add navigation or further action logic here
  }

  // Fonction de connexion OAuth
  const connectOAuth = (platform: 'youtube' | 'spotify' | 'twitch') => {
    chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform })
  }

  // Fonction de déconnexion OAuth (soft - garde le sync)
  const disconnectOAuth = async (platform: 'youtube' | 'spotify' | 'twitch') => {
    await chrome.storage.local.remove(`oauth_token_${platform}`)
    // Note: On garde le sync_info pour éviter de re-télécharger les données
  }


  return (
    <div className="profile-section">

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button
          className="connect-button"
          onClick={() => oauthTokens.youtube ? disconnectOAuth('youtube') : connectOAuth('youtube')}
          style={{
            backgroundImage: `url(${oauthTokens.youtube ? connectButtonOn : connectButtonOff})`
          }}
        >
          <div className="platform-icon youtube-icon">
            YT
          </div>
          <span className="connect-button-text">
            {oauthTokens.youtube ? 'Disconnect YouTube' : 'Connect YouTube'}
          </span>
        </button>

        <button
          className="connect-button"
          onClick={() => oauthTokens.spotify ? disconnectOAuth('spotify') : connectOAuth('spotify')}
          style={{
            backgroundImage: `url(${oauthTokens.spotify ? connectButtonOn : connectButtonOff})`
          }}
        >
          <div className="platform-icon spotify-icon">
            ♪
          </div>
          <span className="connect-button-text">
            {oauthTokens.spotify ? 'Disconnect Spotify' : 'Connect Spotify'}
          </span>
        </button>

        <button
          className="connect-button"
          onClick={() => oauthTokens.twitch ? disconnectOAuth('twitch') : connectOAuth('twitch')}
          style={{
            backgroundImage: `url(${oauthTokens.twitch ? connectButtonOn : connectButtonOff})`
          }}
        >
          <div className="platform-icon twitch-icon">
            TV
          </div>
          <span className="connect-button-text">
            {oauthTokens.twitch ? 'Disconnect Twitch' : 'Connect Twitch'}
          </span>
        </button>
        
      </div>
      

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="alias-input search-input-with-icon"
          />
          <img src={searchIcon} alt="Search" className="search-icon" />

          {/* Loading indicator */}
          {isLoading && (
            <div className="search-loading">
              Loading accounts...
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="search-error">
              {error}
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.slice(0, 10).map((account) => (
                <div
                  key={account.id}
                  className="search-result-item"
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="account-info">
                    <div className="account-label">{account.label}</div>
                    <div className="account-details">
                      {account.termId && (
                        <span className="account-id">ID: {account.termId.slice(0, 8)}...</span>
                      )}
                      {account.createdAt && (
                        <span className="account-date">
                          Created: {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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

          {/* No results message */}
          {showResults && searchQuery.trim() && searchResults.length === 0 && !isLoading && (
            <div className="search-no-results">
              No accounts found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default AccountTab