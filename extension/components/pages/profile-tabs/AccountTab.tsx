import { useState, useEffect } from 'react'
import { useStorage } from '@plasmohq/storage/hook'
import searchIcon from '../../ui/icons/Icon=Search.svg'
import connectButtonOn from '../../ui/icons/connectButtonOn.svg'
import connectButtonOff from '../../ui/icons/connectButtonOff.svg'
import '../../styles/AccountTab.css'

const X_CLIENT_ID = process.env.PLASMO_PUBLIC_X_CLIENT_ID || "votre_client_id_x"

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [xUser, setXUser] = useStorage<any>("x-user")
  const [xFollowing, setXFollowing] = useState<any[]>([])
  
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


  // Fonction pour récupérer les follows X
  const fetchXFollowing = async () => {
    if (!xUser) return
    
    try {
      const result = await chrome.storage.local.get('x-access-token')
      const accessToken = result['x-access-token']
      
      if (!accessToken) {
        console.error('X access token missing')
        return
      }

      const response = await fetch(`${process.env.PLASMO_PUBLIC_OAUTH_SERVER_URL || 'http://localhost:3001'}/auth/x/following`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: xUser.id, 
          access_token: accessToken 
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setXFollowing(data.following)
      } else {
        console.error('Error fetching follows:', data.error)
      }
    } catch (error) {
      console.error('Error during follows retrieval:', error)
    }
  }

  // Charger les follows automatiquement quand l'utilisateur X est connecté
  useEffect(() => {
    if (xUser) {
      fetchXFollowing()
    }
  }, [xUser])

  // Fonction de connexion X/Twitter
  const connectX = () => {
    chrome.runtime.sendMessage({
      type: 'CONNECT_X',
      clientId: X_CLIENT_ID
    }, async (response) => {
      if (response?.success) {
        setXUser(response.user)
        // Forcer un refresh depuis le storage pour être sûr
        const result = await chrome.storage.local.get('x-user')
        if (result['x-user']) {
          setXUser(result['x-user'])
        }
      } else {
        console.error('Erreur X:', response?.error)
      }
    })
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

  // Fonction de déconnexion X
  const disconnectAccount = async (platform: 'x') => {
    await setXUser(null)
    await chrome.storage.local.remove('x-access-token')
    setXFollowing([])
  }

  return (
    <div className="profile-section">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-photo">
          <img 
            src="https://via.placeholder.com/80x80/666/fff?text=IM" 
            alt="Profile" 
            className="profile-image"
          />
        </div>
        
        <div className="profile-info">
          <div className="profile-name-container">
            <span className="profile-name-text">Passive_Records</span>
            {/* <img src={checkIcon} alt="Verified" className="verified-badge" style={{ filter: 'brightness(0) invert(0.4) sepia(1) saturate(5) hue-rotate(175deg)' }} /> */}
          </div>
          <div className="profile-stats-container">
            <div className="profile-stat-item">
              <span className="profile-stat-number">78</span>
              <span className="profile-stat-label">SIGNALS</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-number">658</span>
              <span className="profile-stat-label">TRUSTED CIRCLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button
          className="connect-button"
          onClick={() => oauthTokens.youtube ? disconnectOAuth('youtube') : connectOAuth('youtube')}
          style={{
            backgroundImage: `url(${oauthTokens.youtube ? connectButtonOn : connectButtonOff})`
          }}
        >
          <div className="platform-icon youtube">
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
          <div className="platform-icon spotify">
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
          <div className="platform-icon twitch">
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