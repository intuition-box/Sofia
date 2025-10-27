import { useState, useEffect } from 'react'
import youtubeIcon from '../../ui/social/youtube.svg'
import spotifyIcon from '../../ui/social/spotify.svg'
import twitchIcon from '../../ui/social/twitch.svg'
import leftSideIcon from '../../ui/icons/left side.svg'
import rightSideIcon from '../../ui/icons/right side.svg'
import { useStorage } from "@plasmohq/storage/hook"
import { getAddress } from 'viem'
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../../../lib/config/constants'
import Avatar from '../../ui/Avatar'
import { useQuestSystem } from '../../../hooks/useQuestSystem'
import '../../styles/AccountTab.css'

const AccountTab = () => {
  const [walletAddress] = useStorage<string>("metamask-account")
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined)

  // OAuth connection states
  const [oauthTokens, setOauthTokens] = useState({
    youtube: false,
    spotify: false,
    twitch: false,
  })

  // User stats state
  const [userStats, setUserStats] = useState({
    signalsCreated: 0,
    totalMarketCap: 0,
    loading: true
  })

  // Quest system hook - provides real quests based on user progress
  const { activeQuests, level, totalXP, loading: questsLoading } = useQuestSystem()

  // Load user avatar from GraphQL
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!walletAddress) return

      try {
        const checksumAddress = getAddress(walletAddress)

        // Try to load avatar using accounts query
        const avatarQuery = `
          query GetAccountProfile($id: String!) {
            accounts(where: { id: { _eq: $id } }) {
              label
              image
              atom {
                label
                image
              }
            }
          }
        `

        const avatarResponse = await intuitionGraphqlClient.request(avatarQuery, {
          id: checksumAddress
        }) as { accounts: Array<{ image?: string; atom?: { image?: string } }> }

        // Try to get image from account or atom
        if (avatarResponse?.accounts && avatarResponse.accounts.length > 0) {
          const avatarUrl = avatarResponse.accounts[0].image || avatarResponse.accounts[0].atom?.image
          setUserAvatar(avatarUrl)
        }
      } catch (error) {
        console.error('Error loading user avatar:', error)
      }
    }

    loadUserAvatar()
  }, [walletAddress])

  // Load user stats from GraphQL
  useEffect(() => {
    const loadUserStats = async () => {
      if (!walletAddress) {
        setUserStats(prev => ({ ...prev, signalsCreated: 0, totalMarketCap: 0, loading: false }))
        return
      }

      try {
        const checksumAddress = getAddress(walletAddress)

        // Load user stats: signals created and total market cap
        // Use terms table to get vaults data (like PageBlockchainCard)
        const statsQuery = `
          query GetUserStats($accountId: String!, $subjectId: String!) {
            triples: terms(
              where: {
                _and: [
                  { type: { _eq: Triple } },
                  { triple: { subject: { term_id: { _eq: $subjectId } } } },
                  { positions: { account: { id: { _eq: $accountId } } } }
                ]
              }
            ) {
              id
              vaults {
                total_shares
              }
            }
          }
        `

        const statsResponse = await intuitionGraphqlClient.request(statsQuery, {
          accountId: checksumAddress,
          subjectId: SUBJECT_IDS.I
        }) as { triples: Array<{ id: string; vaults?: Array<{ total_shares: string }> }> }

        console.log('📊 User stats response:', statsResponse)
        console.log('📊 Triples count:', statsResponse?.triples?.length)

        // Calculate signals created and total market cap
        const signalsCreated = statsResponse?.triples?.length || 0

        let totalMarketCap = 0
        if (statsResponse?.triples) {
          statsResponse.triples.forEach((triple) => {
            if (triple.vaults) {
              triple.vaults.forEach((vault) => {
                totalMarketCap += Number(vault.total_shares || 0) / 1e18
              })
            }
          })
        }

        console.log('📊 Signals created:', signalsCreated)
        console.log('📊 Total market cap:', totalMarketCap)

        setUserStats(prev => ({
          ...prev,
          signalsCreated,
          totalMarketCap,
          loading: false
        }))

      } catch (error) {
        console.error('Error loading user stats:', error)
        setUserStats(prev => ({ ...prev, loading: false }))
      }
    }

    loadUserStats()
  }, [walletAddress])

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
        <Avatar
          imgSrc={userAvatar}
          name={walletAddress}
          avatarClassName="profile-avatar"
          size="large"
        />
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
            <div className="stat-value">{questsLoading ? '...' : level}</div>
            <img src={rightSideIcon} alt="Right" className="stat-icon" />
          </div>
          <div className="stat-label">Level</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{questsLoading ? '...' : totalXP}</div>
          <div className="stat-label">Total XP</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{userStats.loading ? '...' : userStats.signalsCreated}</div>
          <div className="stat-label">Signals</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{userStats.loading ? '...' : userStats.totalMarketCap.toFixed(3)}</div>
          <div className="stat-label">Total Market Cap</div>
        </div>
      </div>

      {/* Separator */}
      <div className="section-separator"></div>

      {/* Quests/Goals Section */}
      <div className="quests-section">
        {questsLoading ? (
          <div className="quests-loading">Loading quests...</div>
        ) : activeQuests.length === 0 ? (
          <div className="quests-empty">
            <p>No active quests. Complete your first action to unlock quests!</p>
          </div>
        ) : (
          activeQuests.map((quest) => {
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
                    {quest.status === 'active' ? 'In Progress' : quest.status === 'completed' ? 'Completed' : 'Locked'} • +{quest.xpReward} XP
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AccountTab