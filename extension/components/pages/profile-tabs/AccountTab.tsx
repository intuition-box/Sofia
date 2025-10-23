import { useState, useEffect } from 'react'
import youtubeIcon from '../../ui/social/youtube.svg'
import spotifyIcon from '../../ui/social/spotify.svg'
import twitchIcon from '../../ui/social/twitch.svg'
import leftSideIcon from '../../ui/icons/left side.svg'
import rightSideIcon from '../../ui/icons/right side.svg'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/AccountTab.css'

const AccountTab = () => {
  const [walletAddress] = useStorage<string>("metamask-account")

  // OAuth connection states
  const [oauthTokens, setOauthTokens] = useState({
    youtube: false,
    spotify: false,
    twitch: false,
  })

  // User avatar state - ENS avatar or fallback
  const [userAvatar, setUserAvatar] = useState<string>('')

  // Load ENS avatar
  useEffect(() => {
    const loadENSAvatar = async () => {
      if (!walletAddress) return

      const addressLower = walletAddress.toLowerCase()

      try {
        // Use metadata.ens.domains API to get ENS avatar (same as Intuition)
        const response = await fetch(`https://metadata.ens.domains/mainnet/avatar/${addressLower}`)
        if (response.ok && response.url && !response.url.includes('metadata.ens.domains')) {
          // Valid ENS avatar found
          setUserAvatar(response.url)
        } else {
          // Fallback to Ethereum Blockies style avatar (used by MetaMask, Intuition, etc)
          setUserAvatar(`https://effigy.im/a/${addressLower}.png`)
        }
      } catch (error) {
        console.error('Error loading ENS avatar:', error)
        // Fallback to Ethereum Blockies style avatar
        setUserAvatar(`https://effigy.im/a/${addressLower}.png`)
      }
    }

    loadENSAvatar()
  }, [walletAddress])

  // Mock data for user profile
  const userProfile = {
    level: 8,
    totalXP: 1250,
    dayStreak: 7,
    badges: 12
  }

  // Mock data for quests/goals
  const quests = [
    {
      id: 1,
      title: 'Post 50 Signals',
      current: 5,
      total: 50,
      status: 'On Progress',
      statusColor: '#9f7aea'
    },
    {
      id: 2,
      title: 'Create 10 Bookmarks',
      current: 2.4,
      total: 10,
      status: 'On progress',
      statusColor: '#718096'
    },
    {
      id: 3,
      title: 'Trust 50 Website',
      current: 10,
      total: 50,
      status: 'On progress',
      statusColor: '#718096'
    },
    {
      id: 4,
      title: 'Follow 50 users',
      current: 6,
      total: 50,
      status: 'Completed',
      statusColor: '#48bb78'
    }
  ]

  // Check OAuth token status on component mount
  useEffect(() => {
    const checkOAuthTokens = async () => {
      const result = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_twitch',
      ])

      setOauthTokens({
        youtube: !!result.oauth_token_youtube,
        spotify: !!result.oauth_token_spotify,
        twitch: !!result.oauth_token_twitch,
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
  const connectOAuth = (platform: 'youtube' | 'spotify' | 'twitch' ) => {
    chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform })
  }

  // Fonction de déconnexion OAuth (soft - garde le sync)
  const disconnectOAuth = async (platform: 'youtube' | 'spotify' | 'twitch') => {
    await chrome.storage.local.remove(`oauth_token_${platform}`)
    // Note: On garde le sync_info pour éviter de re-télécharger les données
  }

  // Calculate circular progress for quests
  const calculateProgress = (current: number, total: number) => {
    return (current / total) * 100
  }


  return (
    <div className="profile-section account-tab">

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={userAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress?.toLowerCase()}`} alt={walletAddress?.toLowerCase() || 'User'} />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">
            {walletAddress ? `${walletAddress.toLowerCase().slice(0, 6)}...${walletAddress.toLowerCase().slice(-4)}` : 'Connect Wallet'}
          </h2>
        </div>
      </div>

      {/* Platform Icons */}
      <div className="platform-icons-container">
        <button
          className={`connect-button youtube ${oauthTokens.youtube ? 'connected' : ''}`}
          onClick={() => oauthTokens.youtube ? disconnectOAuth('youtube') : connectOAuth('youtube')}
        >
          <div className="platform-icon youtube-icon">
            <img src={youtubeIcon} alt="YouTube" />
          </div>
        </button>

        <button
          className={`connect-button twitch ${oauthTokens.twitch ? 'connected' : ''}`}
          onClick={() => oauthTokens.twitch ? disconnectOAuth('twitch') : connectOAuth('twitch')}
        >
          <div className="platform-icon twitch-icon">
            <img src={twitchIcon} alt="Twitch" />
          </div>
        </button>

        <button
          className={`connect-button spotify ${oauthTokens.spotify ? 'connected' : ''}`}
          onClick={() => oauthTokens.spotify ? disconnectOAuth('spotify') : connectOAuth('spotify')}
        >
          <div className="platform-icon spotify-icon">
            <img src={spotifyIcon} alt="Spotify" />
          </div>
        </button>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-icons-with-value">
            <img src={leftSideIcon} alt="Left" className="stat-icon" />
            <div className="stat-value">{userProfile.level}</div>
            <img src={rightSideIcon} alt="Right" className="stat-icon" />
          </div>
          <div className="stat-label">Level</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{userProfile.totalXP}</div>
          <div className="stat-label">Total XP</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{userProfile.dayStreak}</div>
          <div className="stat-label">Signals Created</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{userProfile.badges}</div>
          <div className="stat-label">Total Market Cap</div>
        </div>
      </div>

      {/* Separator */}
      <div className="section-separator"></div>

      {/* Quests/Goals Section */}
      <div className="quests-section">
        {quests.map((quest) => {
          const progress = calculateProgress(quest.current, quest.total)
          const radius = 28
          const circumference = 2 * Math.PI * radius
          const strokeDashoffset = circumference - (progress / 100) * circumference

          return (
            <div key={quest.id} className="quest-item">
              <div className="quest-progress">
                <svg width="70" height="70" viewBox="0 0 70 70">
                  {/* Background circle */}
                  <circle
                    cx="35"
                    cy="35"
                    r={radius}
                    stroke="#2d2d2d"
                    strokeWidth="6"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="35"
                    cy="35"
                    r={radius}
                    stroke={quest.statusColor}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 35 35)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                  {/* Percentage text */}
                  <text
                    x="35"
                    y="35"
                    textAnchor="middle"
                    dy="6"
                    fontSize="14"
                    fontWeight="600"
                    fill="#fff"
                  >
                    {Math.round(progress)}%
                  </text>
                </svg>
              </div>
              <div className="quest-details">
                <h4 className="quest-title">{quest.title}</h4>
                <p className="quest-progress-text">{quest.current}/{quest.total}</p>
                <span className="quest-status" style={{ color: quest.statusColor }}>
                  {quest.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AccountTab