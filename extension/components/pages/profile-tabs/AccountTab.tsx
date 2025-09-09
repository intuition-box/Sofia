import { useState } from 'react'
import discordIcon from '../../../assets/Discord_Logo.svg'
import xIcon from '../../../assets/X_logo.svg'
import searchIcon from '../../../assets/Icon=Search.svg'
import checkIcon from '../../../assets/Icon=Check.svg'

const AccountTab = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const mockUsers = [
    { id: 1, name: 'Peggie', followers: '2.3k', description: 'Web3 builder focused on decentralization and blockchain innovation', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', isOnline: true },
    { id: 2, name: 'Eve', followers: '1.8k', description: 'Crypto-economy specialist driving strategy and adoption', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', isOnline: false },
    { id: 3, name: 'Betty', followers: '4.1k', description: 'Solidity developer with expertise in DeFi, NFTs, and DAOs', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', isOnline: true },
    { id: 4, name: 'Dianne', followers: '982', description: 'Web3 entrepreneur creating sustainable blockchain solutions', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', isOnline: false },
    { id: 5, name: 'Sarah', followers: '3.5k', description: 'Product manager in Web3, improving user experience and growth', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', isOnline: false },
    { id: 6, name: 'Julie', followers: '1.2k', description: 'NFT and metaverse strategist with strong community-building skills', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', isOnline: true }
  ]

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <span className="profile-stat-number">291</span>
              <span className="profile-stat-label">SIGNALS</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-number">658</span>
              <span className="profile-stat-label">FOLLOWERS</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-number">793</span>
              <span className="profile-stat-label">FOLLOWING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button className="following-button">
          <img src={checkIcon} alt="Check" className="button-icon" />
          Discord Account
        </button>
        <button className="message-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          X Account
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
                <div className="user-followers-count">{user.followers}</div>
                <button className="follow-button">Follow on Sofia</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AccountTab