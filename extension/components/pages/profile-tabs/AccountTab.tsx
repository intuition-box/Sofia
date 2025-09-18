import { useState, useEffect } from 'react'
import { useStorage } from '@plasmohq/storage/hook'
import xIcon from '../../../assets/X_logo.svg'
import searchIcon from '../../../assets/Icon=Search.svg'
import connectButtonOn from '../../../assets/connectButtonOn.svg'
import connectButtonOff from '../../../assets/connectButtonOff.svg'

const X_CLIENT_ID = process.env.PLASMO_PUBLIC_X_CLIENT_ID || "votre_client_id_x"

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [xUser, setXUser] = useStorage<any>("x-user")
  const [xFollowing, setXFollowing] = useState<any[]>([])

  const mockUsers = [
    { id: 1, name: 'Peggie', description: 'Web3 builder focused on decentralization and blockchain innovation', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', isOnline: true, isFromX: false, username: undefined },
    { id: 2, name: 'Eve', description: 'Crypto-economy specialist driving strategy and adoption', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', isOnline: false, isFromX: false, username: undefined },
    { id: 3, name: 'Betty', description: 'Solidity developer with expertise in DeFi, NFTs, and DAOs', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', isOnline: true, isFromX: false, username: undefined },
    { id: 4, name: 'Dianne', description: 'Web3 entrepreneur creating sustainable blockchain solutions', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', isOnline: false, isFromX: false, username: undefined },
    { id: 5, name: 'Sarah', description: 'Product manager in Web3, improving user experience and growth', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', isOnline: false, isFromX: false, username: undefined },
    { id: 6, name: 'Julie', description: 'NFT and metaverse strategist with strong community-building skills', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', isOnline: true, isFromX: false, username: undefined }
  ]

  // Combiner les utilisateurs mockés et les follows X
  const allUsers = [...mockUsers, ...xFollowing.map(follow => ({
    id: follow.id,
    name: follow.name,
    description: follow.description || 'Utilisateur X',
    avatar: follow.profile_image_url || 'https://via.placeholder.com/40x40/666/fff?text=' + follow.username.charAt(0).toUpperCase(),
    isOnline: Math.random() > 0.5, // Random pour l'exemple
    isFromX: true,
    username: follow.username
  }))]

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  )


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


  // Fonction de déconnexion
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
          onClick={() => chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform: 'youtube' })}
          style={{
            backgroundImage: `url(${connectButtonOff})`,
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
            YouTube
          </span>
        </button>

        <button 
          className="connect-button"
          onClick={() => chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform: 'spotify' })}
          style={{
            backgroundImage: `url(${connectButtonOff})`,
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
            Spotify
          </span>
        </button>

        <button 
          className="connect-button"
          onClick={() => chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform: 'twitch' })}
          style={{
            backgroundImage: `url(${connectButtonOff})`,
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
            Twitch
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

      {/* User List */}
      <div className="user-list-container">
        {filteredUsers.map((user) => (
          <div key={user.id} className="user-list-item">
            <div className="user-avatar-container">
              <div className="user-avatar-small">
                <img 
                  src={user.avatar}
                  alt={user.name}
                  className="profile-image"
                />
              </div>
              {user.isOnline && <div className="online-status-indicator"></div>}
            </div>
            <div className="user-details-container">
              <div className="user-left-content">
                <div className="user-name-text">
                  {user.name}
                  {user.isFromX && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#1da1f2' }}>X</span>}
                </div>
                <div className="user-description-text">
                  {user.username && `@${user.username} - `}{user.description}
                </div>
              </div>
              <div className="user-right-content">
                <button className="follow-button">Add to my Circle</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AccountTab