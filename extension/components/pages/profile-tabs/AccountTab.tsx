import { useState, useEffect, useCallback } from 'react'
import youtubeIcon from '../../ui/social/youtube.svg'
import spotifyIcon from '../../ui/social/spotify.svg'
import twitchIcon from '../../ui/social/twitch.svg'
import discordIcon from '../../ui/social/discord.svg'
import xIcon from '../../ui/social/x.svg'
import leftSideIcon from '../../ui/icons/left side.svg'
import rightSideIcon from '../../ui/icons/right side.svg'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import { getAddress } from 'viem'
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../../../lib/config/constants'
import { useQuestSystem } from '../../../hooks/useQuestSystem'
import { useSocialVerifier } from '../../../hooks/useSocialVerifier'
import QuestsTab from './QuestsTab'
import StatsTab from './StatsTab'
import AchievementsTab from './AchievementsTab'
import { useIdentityResolution } from '../../../hooks/useIdentityResolution'
import ProfileHeader from '../../ui/ProfileHeader'
import '../../styles/AccountTab.css'

type SubTab = 'quests' | 'stats' | 'achievements'

const AccountTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const [activeTab, setActiveTab] = useState<SubTab>('stats')

  // OAuth connection states
  const [oauthTokens, setOauthTokens] = useState({
    youtube: false,
    spotify: false,
    twitch: false,
    discord: false,
    twitter: false,
  })

  // Discord profile for avatar fallback
  const [discordProfile, setDiscordProfile] = useState<{
    id: string
    username: string
    global_name?: string
    avatar?: string
    verified?: boolean
  } | null>(null)

  // User stats state
  const [userStats, setUserStats] = useState({
    signalsCreated: 0,
    loading: true
  })

  // Quest system hook - provides real quests based on user progress
  const { quests, activeQuests, completedQuests, claimableQuests, level, totalXP, loading: questsLoading, claimingQuestId, markQuestCompleted, claimQuestXP, refreshQuests } = useQuestSystem()

  // Social Verifier hook - handles Social Linked attestation
  const { isSocialVerified, canVerify, isVerifying, verifySocials } = useSocialVerifier()

  // Identity resolution hook - handles avatar/label with GraphQL, ENS, Discord fallback
  const { displayLabel, displayAvatar } = useIdentityResolution({
    walletAddress,
    discordProfile,
    enableCache: true
  })

  // Load user stats from GraphQL
  const loadUserStats = useCallback(async () => {
    if (!walletAddress) {
      setUserStats({ signalsCreated: 0, loading: false })
      return
    }

    try {
      const checksumAddress = getAddress(walletAddress)

      // Count user signals (no need for vaults data since totalMarketCap is not displayed)
      const statsQuery = `
        query GetUserStats($accountId: String!, $subjectId: String!, $limit: Int!, $offset: Int!) {
          triples: terms(
            where: {
              _and: [
                { type: { _eq: Triple } },
                { triple: { subject: { term_id: { _eq: $subjectId } } } },
                { positions: { account: { id: { _eq: $accountId } } } }
              ]
            }
            limit: $limit
            offset: $offset
          ) {
            id
          }
        }
      `

      const allTriples = await intuitionGraphqlClient.fetchAllPages<{ id: string }>(
        statsQuery,
        { accountId: checksumAddress, subjectId: SUBJECT_IDS.I },
        'triples',
        100,
        1000
      )

      console.log('📊 Signals created:', allTriples.length)

      setUserStats({ signalsCreated: allTriples.length, loading: false })

    } catch (error) {
      console.error('Error loading user stats:', error)
      setUserStats(prev => ({ ...prev, signalsCreated: 0, loading: false }))
    }
  }, [walletAddress])

  useEffect(() => {
    loadUserStats()
  }, [loadUserStats])

  // Combined refresh: quests + stats
  const handleFullRefresh = useCallback(async () => {
    await Promise.all([refreshQuests(), loadUserStats()])
  }, [refreshQuests, loadUserStats])

  // Check OAuth token status and load Discord profile on component mount
  useEffect(() => {
    const checkOAuthTokens = async () => {
      if (!walletAddress) {
        setOauthTokens({
          youtube: false,
          spotify: false,
          twitch: false,
          discord: false,
          twitter: false,
        })
        setDiscordProfile(null)
        return
      }

      const checksumAddr = getAddress(walletAddress)
      const youtubeKey = `oauth_token_youtube_${checksumAddr}`
      const spotifyKey = `oauth_token_spotify_${checksumAddr}`
      const twitchKey = `oauth_token_twitch_${checksumAddr}`
      const discordKey = `oauth_token_discord_${checksumAddr}`
      const twitterKey = `oauth_token_twitter_${checksumAddr}`
      const discordProfileKey = `discord_profile_${checksumAddr}`

      const result = await chrome.storage.local.get([
        youtubeKey, spotifyKey, twitchKey, discordKey, twitterKey, discordProfileKey
      ])

      setOauthTokens({
        youtube: !!result[youtubeKey],
        spotify: !!result[spotifyKey],
        twitch: !!result[twitchKey],
        discord: !!result[discordKey],
        twitter: !!result[twitterKey],
      })

      // Load Discord profile if available
      if (result[discordProfileKey]) {
        setDiscordProfile(result[discordProfileKey])
      } else {
        setDiscordProfile(null)
      }
    }

    checkOAuthTokens()

    // Listen for storage changes to update connection states
    const handleStorageChange = (changes: any) => {
      // Re-check when any OAuth token changes for current wallet
      const changedKeys = Object.keys(changes)
      const hasOAuthChange = changedKeys.some(key => key.startsWith('oauth_token_'))
      const hasDiscordProfileChange = changedKeys.some(key => key.startsWith('discord_profile_'))

      if (hasOAuthChange) {
        checkOAuthTokens()
      }
      if (hasDiscordProfileChange && walletAddress) {
        const checksumAddr = getAddress(walletAddress)
        const discordProfileKey = `discord_profile_${checksumAddr}`
        if (changes[discordProfileKey]) {
          setDiscordProfile(changes[discordProfileKey].newValue || null)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [walletAddress])

  // OAuth connect function
  const connectOAuth = (platform: 'youtube' | 'spotify' | 'twitch' | 'discord' | 'twitter') => {
    chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform })
  }

  // OAuth disconnect function (hard - clears token AND sync info for fresh re-connection)
  const disconnectOAuth = async (platform: 'youtube' | 'spotify' | 'twitch' | 'discord' | 'twitter') => {
    if (!walletAddress) return
    const checksumAddr = getAddress(walletAddress)

    // Remove OAuth token
    await chrome.storage.local.remove(`oauth_token_${platform}_${checksumAddr}`)

    // Remove sync info to allow fresh data fetch on re-connection
    await chrome.storage.local.remove(`sync_info_${platform}_${checksumAddr}`)

    // Clear Discord profile on disconnect
    if (platform === 'discord') {
      await chrome.storage.local.remove(`discord_profile_${checksumAddr}`)
      setDiscordProfile(null)
    }

    console.log(`🗑️ [OAuth] Disconnected ${platform} for wallet ${checksumAddr.slice(0, 8)}...`)
  }

  return (
    <div className="profile-section account-tab">

      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={displayAvatar}
        displayName={displayLabel}
        walletAddress={walletAddress}
        verified={isSocialVerified}
        verifiedLabel="Social Linked"
      />


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

        <button
          className={`connect-button discord ${oauthTokens.discord ? 'connected' : ''}`}
          onClick={() => oauthTokens.discord ? disconnectOAuth('discord') : connectOAuth('discord')}
        >
          <div className="platform-icon discord-icon">
            <img src={discordIcon} alt="Discord" />
          </div>
        </button>

        <button
          className={`connect-button twitter ${oauthTokens.twitter ? 'connected' : ''}`}
          onClick={() => oauthTokens.twitter ? disconnectOAuth('twitter') : connectOAuth('twitter')}
        >
          <div className="platform-icon twitter-icon">
            <img src={xIcon} alt="X" />
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
      </div>

      {/* Separator */}
      <div className="section-separator"></div>

      {/* Sub-tabs Navigation */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button
          className={`sub-tab ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          Quests
        </button>
        <button
          className={`sub-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Success
        </button>
      </div>

      {/* Tab Content - Lazy loaded */}
      {activeTab === 'quests' && (
        <QuestsTab
          quests={[...claimableQuests, ...activeQuests]}
          loading={questsLoading}
          claimingQuestId={claimingQuestId}
          isSocialVerified={isSocialVerified}
          canVerify={canVerify}
          isVerifying={isVerifying}
          onClaimXP={claimQuestXP}
          onVerifySocials={verifySocials}
          onMarkCompleted={markQuestCompleted}
          onRefresh={handleFullRefresh}
        />
      )}

      {activeTab === 'achievements' && (
        <AchievementsTab completedQuests={completedQuests} quests={quests} loading={questsLoading} />
      )}

      {activeTab === 'stats' && <StatsTab />}
    </div>
  )
}

export default AccountTab
