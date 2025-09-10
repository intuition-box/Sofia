import { useState } from 'react'
import { useStorage } from '@plasmohq/storage/hook'
import discordIcon from '../../../assets/Discord_Logo.svg'
import xIcon from '../../../assets/X_logo.svg'
import searchIcon from '../../../assets/Icon=Search.svg'
import checkIcon from '../../../assets/Icon=Check.svg'
import connectButtonOn from '../../../assets/connectButtonOn.svg'
import connectButtonOff from '../../../assets/connectButtonOff.svg'

const DISCORD_CLIENT_ID = "1415320283161559132"
const X_CLIENT_ID = process.env.PLASMO_PUBLIC_X_CLIENT_ID || "votre_client_id_x"

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [discordUser, setDiscordUser] = useStorage<any>("discord-user")
  const [xUser, setXUser] = useStorage<any>("x-user")

  const mockUsers = [
    { id: 1, name: 'Peggie', description: 'Web3 builder focused on decentralization and blockchain innovation', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', isOnline: true },
    { id: 2, name: 'Eve', description: 'Crypto-economy specialist driving strategy and adoption', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', isOnline: false },
    { id: 3, name: 'Betty', description: 'Solidity developer with expertise in DeFi, NFTs, and DAOs', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', isOnline: true },
    { id: 4, name: 'Dianne', description: 'Web3 entrepreneur creating sustainable blockchain solutions', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', isOnline: false },
    { id: 5, name: 'Sarah', description: 'Product manager in Web3, improving user experience and growth', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', isOnline: false },
    { id: 6, name: 'Julie', description: 'NFT and metaverse strategist with strong community-building skills', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', isOnline: true }
  ]

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.description.toLowerCase().includes(searchQuery.toLowerCase())
  )


  // Fonction de connexion Discord
  const connectDiscord = () => {
    chrome.runtime.sendMessage({
      type: 'CONNECT_DISCORD',
      clientId: DISCORD_CLIENT_ID
    }, async (response) => {
      if (response?.success) {
        setDiscordUser(response.user)
        // Forcer un refresh depuis le storage pour être sûr
        const result = await chrome.storage.local.get('discord-user')
        if (result['discord-user']) {
          setDiscordUser(result['discord-user'])
        }
      } else {
        console.error('Erreur Discord:', response?.error)
      }
    })
  }

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
  const disconnectAccount = async (platform: 'discord' | 'x') => {
    if (platform === 'discord') {
      await setDiscordUser(null)
    } else {
      await setXUser(null)
    }
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
          onClick={discordUser ? () => disconnectAccount('discord') : connectDiscord}
          style={{
            backgroundImage: `url(${discordUser ? connectButtonOn : connectButtonOff})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            border: 'none',
            width: '271px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent'
          }}
        >
          <img 
            src={discordIcon} 
            alt="Discord" 
            className="button-icon"
            style={{ width: '24px', height: '24px', marginRight: '12px' }}
          />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            {discordUser ? discordUser.username : 'Discord'}
          </span>
        </button>
        
        <button 
          className="connect-button"
          onClick={xUser ? () => disconnectAccount('x') : connectX}
          style={{
            backgroundImage: `url(${xUser ? connectButtonOn : connectButtonOff})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            border: 'none',
            width: '271px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent'
          }}
        >
          <img 
            src={xIcon} 
            alt="X" 
            className="button-icon"
            style={{ width: '24px', height: '24px', marginRight: '12px' }}
          />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            {xUser ? `@${xUser.username}` : 'X'}
          </span>
        </button>
      </div>
      

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search"
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
                <div className="user-name-text">{user.name}</div>
                <div className="user-description-text">{user.description}</div>
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