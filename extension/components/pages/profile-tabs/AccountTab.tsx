import { useState, useEffect } from 'react'
import searchIcon from '../../../assets/Icon=Search.svg'
import connectButtonOn from '../../../assets/connectButtonOn.svg'
import connectButtonOff from '../../../assets/connectButtonOff.svg'

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
            backgroundImage: `url(${oauthTokens.youtube ? connectButtonOn : connectButtonOff})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            border: 'none',
            width: '271px',
            height: '67px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            marginBottom: '12px'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            marginRight: '12px',
            backgroundColor: '#ff0000',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            YT
          </div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            {oauthTokens.youtube ? 'Disconnect YouTube' : 'Connect YouTube'}
          </span>
        </button>

        <button 
          className="connect-button"
          onClick={() => oauthTokens.spotify ? disconnectOAuth('spotify') : connectOAuth('spotify')}
          style={{
            backgroundImage: `url(${oauthTokens.spotify ? connectButtonOn : connectButtonOff})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            border: 'none',
            width: '271px',
            height: '67px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            marginBottom: '12px'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            marginRight: '12px',
            backgroundColor: '#1db954',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            ♪
          </div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            {oauthTokens.spotify ? 'Disconnect Spotify' : 'Connect Spotify'}
          </span>
        </button>

        <button 
          className="connect-button"
          onClick={() => oauthTokens.twitch ? disconnectOAuth('twitch') : connectOAuth('twitch')}
          style={{
            backgroundImage: `url(${oauthTokens.twitch ? connectButtonOn : connectButtonOff})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            border: 'none',
            width: '271px',
            height: '67px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            marginBottom: '12px'
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            marginRight: '12px',
            backgroundColor: '#9146ff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            TV
          </div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
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
        <img src={searchIcon} alt="Search" className="search-icon" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(0.6)' }} />
      </div>

    </div>
  )
}

export default AccountTab