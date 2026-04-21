import { useState, useCallback } from 'react'
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
} from '../../../hooks'
import StatsTab from './StatsTab'
import AchievementsTab from './AchievementsTab'
import SocialsTab from './SocialsTab'
import ProfileHeader from '../../ui/ProfileHeader'
import { DAILY_VOTE_ATOM_ID } from '../../../lib/config/chainConfig'
import '../../styles/AccountTab.css'

type SubTab = 'socials' | 'stats' | 'achievements'

const AccountTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const [activeTab, setActiveTab] = useState<SubTab>('stats')

  // Data hooks
  const discordProfile = useDiscordProfile(walletAddress)
  const { signalsCreated } = useAccountStats(walletAddress ?? undefined)
  const { quests, claimableQuests, level, totalXP, userProgress, loading: questsLoading, claimingQuestId, markQuestCompleted, claimQuestXP, refreshQuests } = useQuestSystem()
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
          Quests
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
            walletAddress={walletAddress}
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
          walletAddress={walletAddress}
          streakProfit={streakProfitData}
          voteProfit={voteProfitData}
          currentStreak={userProgress.currentStreak}
          currentVoteStreak={userProgress.currentVoteStreak}
          certActivityDates={userProgress.certActivityDates}
          voteActivityDates={userProgress.voteActivityDates}
        />
      )}

    </div>
  )
}

export default AccountTab
