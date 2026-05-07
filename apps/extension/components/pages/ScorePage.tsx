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
import '../styles/CircleFeedTab.css'

const ScoreTab = lazy(() => import('./score-tabs/ScoreTab'))
const AchievementsTab = lazy(() => import('./score-tabs/AchievementsTab'))
const PoolTab = lazy(() => import('./score-tabs/PoolTab'))

type ScoreTab = 'stats' | 'quests' | 'pool'

const ScorePage = () => {
  const [activeTab, setActiveTab] = useState<ScoreTab>('stats')
  const [refreshing, setRefreshing] = useState(false)

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
    if (refreshing) return
    setRefreshing(true)
    try {
      await refreshQuests()
    } finally {
      setRefreshing(false)
    }
  }, [refreshQuests, refreshing])

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
        <div className="score-toolbar">
          <div className="sub-tabs" role="group" aria-label="Stats / Quests">
            <button
              type="button"
              className={`sub-tab ${activeTab === 'stats' ? 'active' : ''}`}
              aria-pressed={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
            >
              Stats
            </button>
            <button
              type="button"
              className={`sub-tab ${activeTab === 'quests' ? 'active' : ''} ${claimableQuests.length > 0 ? 'has-claimable' : ''}`}
              aria-pressed={activeTab === 'quests'}
              onClick={() => setActiveTab('quests')}
            >
              Quests
            </button>
            <button
              type="button"
              className={`sub-tab ${activeTab === 'pool' ? 'active' : ''}`}
              aria-pressed={activeTab === 'pool'}
              onClick={() => setActiveTab('pool')}
            >
              Pool
            </button>
          </div>
          <button
            type="button"
            className="circle-go-btn score-refresh-btn"
            onClick={handleFullRefresh}
            disabled={refreshing}
            title="Refresh"
            aria-label="Refresh stats and quests"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}
            >
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>

        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === 'stats' && (
            <ScoreTab
              walletAddress={walletAddress}
              trustedByCount={trustedByCount}
              level={level}
              totalXP={totalXP}
              signalsCreated={signalsCreated}
            />
          )}
          {activeTab === 'quests' && (
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
              walletAddress={walletAddress}
              streakProfit={streakProfitData}
              voteProfit={voteProfitData}
              currentStreak={userProgress.currentStreak}
              currentVoteStreak={userProgress.currentVoteStreak}
              certActivityDates={userProgress.certActivityDates}
              voteActivityDates={userProgress.voteActivityDates}
            />
          )}
          {activeTab === 'pool' && <PoolTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ScorePage
