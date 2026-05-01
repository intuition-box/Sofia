import { useState, Suspense, lazy, useCallback } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import ProfileHeader from '../ui/ProfileHeader'
import {
  useWalletFromStorage,
  useQuestSystem,
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

const StatsTab = lazy(() => import('./score-tabs/StatsTab'))
const AchievementsTab = lazy(() => import('./score-tabs/AchievementsTab'))

type ScoreTab = 'stats' | 'quests'

const ScorePage = () => {
  const [activeTab, setActiveTab] = useState<ScoreTab>('stats')

  const { walletAddress } = useWalletFromStorage()

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

      <div className="stats-panel">
        <div className="scope-toggle scope-toggle--lg stats-subtab-row" role="group" aria-label="Stats / Quests">
          <button
            type="button"
            className={`scope-btn ${activeTab === 'stats' ? 'active' : ''}`}
            aria-pressed={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            type="button"
            className={`scope-btn ${activeTab === 'quests' ? 'active' : ''} ${claimableQuests.length > 0 ? 'has-claimable' : ''}`}
            aria-pressed={activeTab === 'quests'}
            onClick={() => setActiveTab('quests')}
          >
            Quests
          </button>
        </div>

        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === 'stats' ? (
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
    </div>
  )
}

export default ScorePage
