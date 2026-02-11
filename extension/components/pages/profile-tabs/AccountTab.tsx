import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import { getAddress } from 'viem'
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../../../lib/config/constants'
import { useQuestSystem } from '../../../hooks/useQuestSystem'
import { useTrustCircle } from '../../../hooks/useTrustCircle'
import { useDiscoveryScore } from '../../../hooks/useDiscoveryScore'
import { useGoldSystem } from '../../../hooks/useGoldSystem'
import { useSocialVerifier } from '../../../hooks/useSocialVerifier'
import { useTrustedByCount } from '../../../hooks/useTrustedByCount'
import StatsTab from './StatsTab'
import AchievementsTab from './AchievementsTab'
import SocialsTab from './SocialsTab'
import { useIdentityResolution } from '../../../hooks/useIdentityResolution'
import ProfileHeader from '../../ui/ProfileHeader'
import { createHookLogger } from '../../../lib/utils/logger'
import '../../styles/AccountTab.css'

const logger = createHookLogger('AccountTab')

const InterestTab = lazy(() => import('../core-tabs/InterestTab'))

type SubTab = 'socials' | 'stats' | 'achievements' | 'interest'

const AccountTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const [activeTab, setActiveTab] = useState<SubTab>('stats')

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
  const { quests, claimableQuests, level, totalXP, loading: questsLoading, claimingQuestId, markQuestCompleted, claimQuestXP, refreshQuests } = useQuestSystem()

  // Trust circle hook (people I trust - outgoing)
  const { refetch: fetchTrustCircle } = useTrustCircle(walletAddress)

  // Trusted-by count hook (people who trust ME - incoming)
  const { count: trustedByCount, loading: trustedByLoading, refetch: fetchTrustedByCount } = useTrustedByCount(walletAddress)

  // Discovery stats hook (pioneer, explorer, certified counts)
  const { stats: discoveryStats } = useDiscoveryScore()

  // Gold system hook (private currency for level-ups)
  const { totalGold, loading: goldLoading } = useGoldSystem()

  // Social Verifier hook - handles Social Linked attestation
  const { isSocialVerified } = useSocialVerifier()

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

      logger.info('Signals created', allTriples.length)

      setUserStats({ signalsCreated: allTriples.length, loading: false })

    } catch (error) {
      logger.error('Error loading user stats', error)
      setUserStats(prev => ({ ...prev, signalsCreated: 0, loading: false }))
    }
  }, [walletAddress])

  useEffect(() => {
    loadUserStats()
  }, [loadUserStats])

  // Fetch trust circle and trusted-by count on mount
  useEffect(() => {
    if (walletAddress) {
      fetchTrustCircle()
      fetchTrustedByCount()
    }
  }, [walletAddress, fetchTrustCircle, fetchTrustedByCount])

  // Combined refresh: quests + stats
  const handleFullRefresh = useCallback(async () => {
    await Promise.all([refreshQuests(), loadUserStats()])
  }, [refreshQuests, loadUserStats])

  // Load Discord profile from storage on mount
  useEffect(() => {
    const loadDiscordProfile = async () => {
      if (!walletAddress) {
        setDiscordProfile(null)
        return
      }
      const checksumAddr = getAddress(walletAddress)
      const discordProfileKey = `discord_profile_${checksumAddr}`
      const result = await chrome.storage.local.get([discordProfileKey])
      if (result[discordProfileKey]) {
        setDiscordProfile(result[discordProfileKey])
      }
    }
    loadDiscordProfile()

    const handleStorageChange = (changes: any) => {
      const changedKeys = Object.keys(changes)
      if (changedKeys.some(key => key.startsWith('discord_profile_')) && walletAddress) {
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


      {/* Sub-tabs Navigation */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button
          className={`sub-tab ${activeTab === 'achievements' ? 'active' : ''} ${claimableQuests.length > 0 ? 'has-claimable' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Success
        </button>
        <button
          className={`sub-tab ${activeTab === 'interest' ? 'active' : ''}`}
          onClick={() => setActiveTab('interest')}
        >
          Interest
        </button>
        <button
          className={`sub-tab ${activeTab === 'socials' ? 'active' : ''}`}
          onClick={() => setActiveTab('socials')}
        >
          Socials
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'socials' && (
        <SocialsTab onDiscordProfileChange={setDiscordProfile} />
      )}

      {activeTab === 'stats' && (
          <StatsTab
            trustedByCount={trustedByCount}
            level={level}
            totalXP={totalXP}
            signalsCreated={userStats.signalsCreated}
          />
        )}

      {activeTab === 'achievements' && (
        <AchievementsTab
          quests={quests}
          loading={questsLoading}
          claimingQuestId={claimingQuestId}
          isSocialVerified={isSocialVerified}
          canVerify={false}
          isVerifying={false}
          onClaimXP={claimQuestXP}
          onVerifySocials={async () => ({ success: false })}
          onMarkCompleted={markQuestCompleted}
          onRefresh={handleFullRefresh}
        />
      )}

      {activeTab === 'interest' && (
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          <InterestTab
            level={level}
            trustCircleCount={trustedByCount}
            pioneerCount={discoveryStats?.pioneerCount || 0}
            explorerCount={discoveryStats?.explorerCount || 0}
            signalsCreated={userStats.signalsCreated}
          />
        </Suspense>
      )}
    </div>
  )
}

export default AccountTab
