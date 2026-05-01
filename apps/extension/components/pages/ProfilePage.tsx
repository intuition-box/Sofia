import { useState, useEffect, useTransition, Suspense, lazy, useCallback } from 'react'
import { useRouter } from '../layout/RouterProvider'
import SofiaLoader from '../ui/SofiaLoader'
import ProfileHeader from '../ui/ProfileHeader'
import {
  useWalletFromStorage,
  useQuestSystem,
  useTrustCircle,
  useGoldSystem,
  useSocialVerifier,
  useTrustedByCount,
  useAccountStats,
  useDiscordProfile,
  useIdentityResolution,
  useDailyStreakProfit
} from '../../hooks'
import { DAILY_VOTE_ATOM_ID } from '../../lib/config/chainConfig'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/ProfilePage.css'
import '../styles/AccountTab.css'

const StatsTab = lazy(() => import('./score-tabs/ScoreTab'))
const AchievementsTab = lazy(() => import('./score-tabs/AchievementsTab'))
const CommunityTab = lazy(() => import('./circles-tabs/CommunityTab'))
const SocialsTab = lazy(() => import('./my-profile-tabs/SocialsTab'))

type ProfileTab = 'stats' | 'community' | 'socials'
type StatsSubTab = 'stats' | 'quests'

const ProfilePage = () => {
  const { activeProfileTab, setActiveProfileTab } = useRouter()
  const initialTab: ProfileTab =
    activeProfileTab === 'community' || activeProfileTab === 'socials'
      ? activeProfileTab
      : 'stats'
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)
  const [statsSubTab, setStatsSubTab] = useState<StatsSubTab>('stats')
  const [, startTransition] = useTransition()

  const { walletAddress } = useWalletFromStorage()

  // Profile-wide data
  const discordProfile = useDiscordProfile(walletAddress)
  const { signalsCreated } = useAccountStats(walletAddress ?? undefined)
  const {
    quests,
    claimableQuests,
    level,
    totalXP,
    userProgress,
    loading: questsLoading,
    claimingQuestId,
    markQuestCompleted,
    claimQuestXP,
    refreshQuests
  } = useQuestSystem()
  useTrustCircle(walletAddress)
  const { count: trustedByCount } = useTrustedByCount(walletAddress)
  const { totalGold } = useGoldSystem()
  const { isSocialVerified } = useSocialVerifier()
  const { data: streakProfitData } = useDailyStreakProfit()
  const { data: voteProfitData } = useDailyStreakProfit(DAILY_VOTE_ATOM_ID)
  const { displayLabel, displayAvatar } = useIdentityResolution({
    walletAddress,
    discordProfile,
    enableCache: true
  })

  const handleTabChange = (tab: ProfileTab) => {
    startTransition(() => {
      setActiveTab(tab)
      setActiveProfileTab(tab)
    })
  }

  const handleFullRefresh = useCallback(async () => {
    await refreshQuests()
  }, [refreshQuests])

  // Restore active tab when coming back from user profile
  useEffect(() => {
    if (
      activeProfileTab === 'stats' ||
      activeProfileTab === 'community' ||
      activeProfileTab === 'socials'
    ) {
      setActiveTab(activeProfileTab)
    }
  }, [activeProfileTab])

  const renderStats = () => (
    <div className="stats-panel">
      <div className="scope-toggle scope-toggle--lg stats-subtab-row" role="group" aria-label="Stats / Quests">
        <button
          type="button"
          className={`scope-btn ${statsSubTab === 'stats' ? 'active' : ''}`}
          aria-pressed={statsSubTab === 'stats'}
          onClick={() => setStatsSubTab('stats')}
        >
          Stats
        </button>
        <button
          type="button"
          className={`scope-btn ${statsSubTab === 'quests' ? 'active' : ''} ${claimableQuests.length > 0 ? 'has-claimable' : ''}`}
          aria-pressed={statsSubTab === 'quests'}
          onClick={() => setStatsSubTab('quests')}
        >
          Quests
        </button>
      </div>

      <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
        {statsSubTab === 'stats' ? (
          <StatsTab
            walletAddress={walletAddress}
            trustedByCount={trustedByCount}
            level={level}
            totalXP={totalXP}
            signalsCreated={signalsCreated}
          />
        ) : (
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
            walletAddress={walletAddress}
            streakProfit={streakProfitData}
            voteProfit={voteProfitData}
            currentStreak={userProgress.currentStreak}
            currentVoteStreak={userProgress.currentVoteStreak}
            certActivityDates={userProgress.certActivityDates}
            voteActivityDates={userProgress.voteActivityDates}
          />
        )}
      </Suspense>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return renderStats()
      case 'community':
        return (
          <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
            <CommunityTab />
          </Suspense>
        )
      case 'socials':
        return (
          <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
            <SocialsTab />
          </Suspense>
        )
      default:
        return null
    }
  }

  return (
    <div className="page profile-page">
      <ProfileHeader
        avatarUrl={displayAvatar}
        displayName={displayLabel}
        walletAddress={walletAddress}
        verified={isSocialVerified}
        verifiedLabel="Social Linked"
        totalGold={totalGold}
        signalsCreated={signalsCreated}
      />

      <div className="pf-echoes-sort core-page-tabs" role="group" aria-label="Profile sections">
        <button
          type="button"
          className={`pf-sort-btn ${activeTab === 'stats' ? 'active' : ''} ${activeTab !== 'stats' && claimableQuests.length > 0 ? 'has-claimable' : ''}`}
          aria-pressed={activeTab === 'stats'}
          onClick={() => handleTabChange('stats')}
        >
          Stats
        </button>
        <button
          type="button"
          className={`pf-sort-btn ${activeTab === 'community' ? 'active' : ''}`}
          aria-pressed={activeTab === 'community'}
          onClick={() => handleTabChange('community')}
        >
          Community
        </button>
        <button
          type="button"
          className={`pf-sort-btn ${activeTab === 'socials' ? 'active' : ''}`}
          aria-pressed={activeTab === 'socials'}
          onClick={() => handleTabChange('socials')}
        >
          Socials
        </button>
      </div>

      <div className="page-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default ProfilePage
