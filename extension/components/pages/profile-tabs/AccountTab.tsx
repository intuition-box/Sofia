import { useState, useCallback, Suspense, lazy } from 'react'
import SofiaLoader from '../../ui/SofiaLoader'
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
  useIdentityResolution,
  useDailyStreakProfit
} from '../../../hooks'
import StatsTab from './StatsTab'
import AchievementsTab from './AchievementsTab'
import SocialsTab from './SocialsTab'
import ProfileHeader from '../../ui/ProfileHeader'
import xIcon from '../../ui/social/x.svg'
import { DAILY_VOTE_ATOM_ID } from '../../../lib/config/chainConfig'
import { createHookLogger } from '../../../lib/utils/logger'
import '../../styles/AccountTab.css'

const InterestTab = lazy(() => import('../core-tabs/InterestTab'))

const logger = createHookLogger('AccountTab')

const OG_BASE_URL = 'https://sofia-og.vercel.app'
const INTEREST_CACHE_PREFIX = 'sofia_interest_'

type SubTab = 'socials' | 'stats' | 'achievements' | 'interest'

const AccountTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const [activeTab, setActiveTab] = useState<SubTab>('stats')
  const [isSharing, setIsSharing] = useState(false)

  // Data hooks
  const discordProfile = useDiscordProfile(walletAddress)
  const { signalsCreated } = useAccountStats(walletAddress ?? undefined)
  const { quests, claimableQuests, level, totalXP, userProgress, loading: questsLoading, claimingQuestId, markQuestCompleted, claimQuestXP, refreshQuests } = useQuestSystem()
  useTrustCircle(walletAddress)
  const { count: trustedByCount } = useTrustedByCount(walletAddress)
  const { stats: discoveryStats } = useDiscoveryScore()
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

  const handleShareOnX = useCallback(async () => {
    if (!walletAddress || isSharing) return

    // Read cached interests from localStorage
    const cacheKey = `${INTEREST_CACHE_PREFIX}${walletAddress.toLowerCase()}`
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return

    const { interests } = JSON.parse(cached)
    if (!interests || interests.length === 0) return

    const win = window.open('about:blank', '_blank')

    setIsSharing(true)
    try {
      const interestsParam = interests
        .slice(0, 8)
        .map((i: { name: string; level: number }) => `${i.name}:${i.level}`)
        .join(',')

      const res = await fetch(`${OG_BASE_URL}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          level: String(level || 1),
          trustCircle: String(trustedByCount || 0),
          pioneer: String(discoveryStats?.pioneerCount || 0),
          explorer: String(discoveryStats?.explorerCount || 0),
          signals: String(signalsCreated || 0),
          interests: interestsParam
        })
      })

      const { url: shareUrl } = await res.json()
      const tweetText = `Check out my Sofia profile!`
      const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`

      if (win) {
        win.location.href = intentUrl
      } else {
        window.open(intentUrl, '_blank')
      }
    } catch (err) {
      logger.error('Failed to create share link', err)
      if (win) win.close()
    } finally {
      setIsSharing(false)
    }
  }, [walletAddress, isSharing, level, trustedByCount, discoveryStats, signalsCreated])

  // Check if cached interests exist for share button visibility
  const hasCachedInterests = walletAddress
    ? !!localStorage.getItem(`${INTEREST_CACHE_PREFIX}${walletAddress.toLowerCase()}`)
    : false

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
        actions={hasCachedInterests ? (
          <button
            className="interest-share-btn"
            onClick={handleShareOnX}
            disabled={isSharing}
          >
            <img src={xIcon} alt="X" className="interest-share-icon" />
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        ) : null}
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
        />
      )}

      {activeTab === 'interest' && (
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={40} /></div>}>
          <InterestTab />
        </Suspense>
      )}
    </div>
  )
}

export default AccountTab
