import { useState, useEffect } from 'react'
import searchIcon from '../../ui/icons/Icon=Search.svg'
import youtubeIcon from '../../ui/social/youtube.svg'
import spotifyIcon from '../../ui/social/spotify.svg'
import twitchIcon from '../../ui/social/twitch.svg'
import { useGetAtomAccount, AccountAtom } from '../../../hooks/useGetAtomAccount'
import '../../styles/AccountTab.css'

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AccountAtom[]>([])
  const [showResults, setShowResults] = useState(false)

  // Use the account atoms hook
  const { accounts, searchAccounts } = useGetAtomAccount()

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
    const performAutoSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchAccounts(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }

    performAutoSearch()
  }, [searchQuery, searchAccounts])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle Enter key press to trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performSearch()
    }
  }

  // Perform search when Enter is pressed
  const performSearch = async () => {
    if (searchQuery.trim()) {
      console.log('🔍 Search triggered for:', searchQuery)
      console.log(`📊 Searching in ${accounts.length} total accounts`)
      const results = await searchAccounts(searchQuery)
      console.log('🔍 AccountTab - Search results:', results)
      setSearchResults(results)
      setShowResults(true)

      // If only one result, auto-select it
      if (results.length === 1) {
        handleAccountSelect(results[0])
      }
    }
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
    <div className="profile-section account-tab">

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button
          className="connect-button youtube"
          onClick={() => oauthTokens.youtube ? disconnectOAuth('youtube') : connectOAuth('youtube')}
        >
          <div className="platform-icon youtube-icon">
            <img
              src={youtubeIcon}
              alt="YouTube"
              className={oauthTokens.youtube ? 'platform-icon-connected' : 'platform-icon-disconnected'}
            />
          </div>
          <span className="connect-button-text">
            {oauthTokens.youtube ? 'Disconnect YouTube' : 'Connect YouTube'}
          </span>
        </button>

        <button
          className="connect-button spotify"
          onClick={() => oauthTokens.spotify ? disconnectOAuth('spotify') : connectOAuth('spotify')}
        >
          <div className="platform-icon spotify-icon">
            <img
              src={spotifyIcon}
              alt="Spotify"
              className={oauthTokens.spotify ? 'platform-icon-connected' : 'platform-icon-disconnected'}
            />
          </div>
          <span className="connect-button-text">
            {oauthTokens.spotify ? 'Disconnect Spotify' : 'Connect Spotify'}
          </span>
        </button>

        <button
          className="connect-button twitch"
          onClick={() => oauthTokens.twitch ? disconnectOAuth('twitch') : connectOAuth('twitch')}
        >
          <div className="platform-icon twitch-icon">
            <img
              src={twitchIcon}
              alt="Twitch"
              className={oauthTokens.twitch ? 'platform-icon-connected' : 'platform-icon-disconnected'}
            />
          </div>
          <span className="connect-button-text">
            {oauthTokens.twitch ? 'Disconnect Twitch' : 'Connect Twitch'}
          </span>
        </button>
        
      </div>
      

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-container">
          <img src={searchIcon} alt="Search" className="search-logo" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="search-input"
          />

        </div>

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
                    <div className="account-meta">
                      <span className="account-type">{account.atomType}</span>
                      {account.createdAt && (
                        <span className="account-date">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {account.tags && account.tags.length > 0 && (
                      <div className="account-tags">
                        <span className="tags-label">🏷️ Tags:</span>
                        <div className="tags-list">
                          {account.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="tag-item">{tag}</span>
                          ))}
                          {account.tags.length > 3 && (
                            <span className="tag-more">+{account.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {account.interests && account.interests.length > 0 && (
                      <div className="account-interests">
                        <span className="interests-label">💡 Interests:</span>
                        <div className="interests-list">
                          {account.interests.slice(0, 2).map((interest, idx) => (
                            <span key={idx} className="interest-item">{interest}</span>
                          ))}
                          {account.interests.length > 2 && (
                            <span className="interest-more">+{account.interests.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subscriptions */}
                    {account.subscriptions && account.subscriptions.length > 0 && (
                      <div className="account-subscriptions">
                        <span className="subscriptions-label">📺 Subscriptions:</span>
                        <div className="subscriptions-list">
                          {account.subscriptions.slice(0, 3).map((sub, idx) => (
                            <span key={idx} className="subscription-item">{sub}</span>
                          ))}
                          {account.subscriptions.length > 3 && (
                            <span className="subscription-more">+{account.subscriptions.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="account-details">
                      <span className="account-id">ID: {account.termId.slice(0, 8)}...</span>
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
      </div>

    </div>
  )
}

export default AccountTab