import { useState, useCallback, Suspense, lazy } from 'react'
import {
  useWalletFromStorage,
  useQuestSystem,
  useTrustCircle,
  useDiscoveryScore,
  useGoldSystem,
  useSocialVerifier,
  useTrustedByCount,
  useAccountStats,
  useDiscordProfile,
  useIdentityResolution
} from '../../../hooks'
import StatsTab from './StatsTab'
import AchievementsTab from './AchievementsTab'
import SocialsTab from './SocialsTab'
import ProfileHeader from '../../ui/ProfileHeader'
import '../../styles/AccountTab.css'

const InterestTab = lazy(() => import('../core-tabs/InterestTab'))

type SubTab = 'socials' | 'stats' | 'achievements' | 'interest'

const AccountTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const [activeTab, setActiveTab] = useState<SubTab>('stats')

  // Data hooks
  const discordProfile = useDiscordProfile(walletAddress)
  const { signalsCreated } = useAccountStats(walletAddress ?? undefined)
  const { quests, claimableQuests, level, totalXP, loading: questsLoading, claimingQuestId, markQuestCompleted, claimQuestXP, refreshQuests } = useQuestSystem()
  useTrustCircle(walletAddress)
  const { count: trustedByCount } = useTrustedByCount(walletAddress)
  const { stats: discoveryStats } = useDiscoveryScore()
  const { totalGold } = useGoldSystem()
  const { isSocialVerified } = useSocialVerifier()
  const { displayLabel, displayAvatar } = useIdentityResolution({
    walletAddress,
    discordProfile,
    enableCache: true
  })

  const handleFullRefresh = useCallback(async () => {
    await refreshQuests()
  }, [refreshQuests])

  return (
    <div className="profile-section account-tab">

      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={displayAvatar}
        displayName={displayLabel}
        walletAddress={walletAddress}
        verified={isSocialVerified}
        verifiedLabel="Social Linked"
        totalGold={totalGold}
        signalsCreated={signalsCreated}
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
        <SocialsTab />
      )}

      {activeTab === 'stats' && (
          <StatsTab
            trustedByCount={trustedByCount}
            level={level}
            totalXP={totalXP}
            signalsCreated={signalsCreated}
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
            signalsCreated={signalsCreated}
          />
        </Suspense>
      )}
    </div>
  )
}

export default AccountTab
