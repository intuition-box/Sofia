import { useState, useEffect } from 'react'
import searchIcon from '../../ui/icons/Icon=Search.svg'
import connectButtonOn from '../../ui/icons/connectButtonOn.svg'
import connectButtonOff from '../../ui/icons/connectButtonOff.svg'
import '../../styles/AccountTab.css'

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')
  
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
        <input
          type="text"
          placeholder="0x11s...6ca86"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="alias-input search-input-with-icon"
        />
        <img src={searchIcon} alt="Search" className="search-icon" />
      </div>

    </div>
  )
}

export default AccountTab