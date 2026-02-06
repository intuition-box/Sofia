/**
 * AchievementsTab Component
 * Unified quest view: achievement cards with progress circles, claim buttons, and glow
 * Merges quest actions into the achievement grid layout
 */

import { useState } from 'react'
import type { Quest } from '../../../types/questTypes'

import bookmarkImg from '../../ui/img/questssuccess/bookmark.png'
import curatorImg from '../../ui/img/questssuccess/curator.png'
import discoveryImg from '../../ui/img/questssuccess/discovery.png'
import followImg from '../../ui/img/questssuccess/follow.png'
import oauthDiscordImg from '../../ui/img/questssuccess/Oauth/discord.png'
import oauthSpotifyImg from '../../ui/img/questssuccess/Oauth/Spotify.png'
import oauthTwitchImg from '../../ui/img/questssuccess/Oauth/twitch.png'
import oauthTwitterImg from '../../ui/img/questssuccess/Oauth/x.png'
import oauthYoutubeImg from '../../ui/img/questssuccess/Oauth/youtube.png'
import pulseImg from '../../ui/img/questssuccess/pulse.png'
import signalImg from '../../ui/img/questssuccess/Signal.png'
import socialImg from '../../ui/img/questssuccess/social.png'
import streakImg from '../../ui/img/questssuccess/streak.png'
import trustImg from '../../ui/img/questssuccess/trust.png'

const typeImages: Record<string, string> = {
  signal: signalImg,
  bookmark: bookmarkImg,
  oauth: oauthDiscordImg,
  'social-link': oauthDiscordImg,
  follow: followImg,
  trust: trustImg,
  streak: streakImg,
  pulse: pulseImg,
  curator: curatorImg,
  social: socialImg,
  discovery: discoveryImg,
}

const platformImages: Record<string, string> = {
  discord: oauthDiscordImg,
  youtube: oauthYoutubeImg,
  spotify: oauthSpotifyImg,
  twitch: oauthTwitchImg,
  twitter: oauthTwitterImg,
}

const getQuestImage = (quest: { type: string; platform?: string }) => {
  if (quest.platform && platformImages[quest.platform]) {
    return platformImages[quest.platform]
  }
  return typeImages[quest.type] || signalImg
}

const typeLabels: Record<string, string> = {
  signal: 'Signal',
  bookmark: 'Bookmark',
  oauth: 'OAuth',
  'social-link': 'Social',
  follow: 'Follow',
  trust: 'Trust',
  streak: 'Streak',
  pulse: 'Pulse',
  curator: 'Curator',
  social: 'Social',
  discovery: 'Discovery',
}

interface AchievementsTabProps {
  quests: Quest[]
  loading: boolean
  claimingQuestId: string | null
  isSocialVerified: boolean
  canVerify: boolean
  isVerifying: boolean
  onClaimXP: (questId: string) => Promise<{ success: boolean; error?: string }>
  onVerifySocials: () => Promise<{ success: boolean; error?: string }>
  onMarkCompleted: (questId: string) => void
  onRefresh?: () => Promise<void>
}

const AchievementsTab = ({
  quests,
  loading,
  claimingQuestId,
  isSocialVerified,
  canVerify,
  isVerifying,
  onClaimXP,
  onVerifySocials,
  onMarkCompleted,
  onRefresh
}: AchievementsTabProps) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="achievements-tab-content">
        <div className="achievements-loading">Loading...</div>
      </div>
    )
  }

  if (quests.length === 0) {
    return (
      <div className="achievements-tab-content">
        <div className="achievements-empty">
          <h3>No quests yet</h3>
          <p>Complete your first action to unlock quests!</p>
        </div>
      </div>
    )
  }

  // Sort: claimable > active > completed > locked
  const sorted = [...quests].sort((a, b) => {
    const order: Record<string, number> = { claimable_xp: 0, completed: 1, active: 2, locked: 3 }
    return (order[a.status] ?? 4) - (order[b.status] ?? 4)
  })

  const getCardClass = (quest: Quest) => {
    if (quest.status === 'completed') return `achievement-card ${quest.type}`
    if (quest.status === 'claimable_xp') return `achievement-card claimable ${quest.type}`
    if (quest.status === 'active') return 'achievement-card in-progress'
    return 'achievement-card locked'
  }

  return (
    <div className="achievements-tab-content">
      {onRefresh && (
        <button
          className="quest-refresh-btn-inline"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          {refreshing ? '...' : '\u21BB'}
        </button>
      )}
      <div className="achievements-grid">
        {sorted.map((quest) => {
          const progress = quest.total > 0 ? (quest.current / quest.total) * 100 : 0
          const showProgress = quest.status === 'active' || quest.status === 'claimable_xp'
          const radius = 22
          const circumference = 2 * Math.PI * radius
          const strokeDashoffset = circumference - (progress / 100) * circumference

          return (
            <div key={quest.id} className={getCardClass(quest)}>
              <div className="achievement-card-visual">
                <img
                  src={getQuestImage(quest)}
                  alt={quest.title}
                  className="achievement-card-img"
                />
                {/* Progress circle overlay */}
                {showProgress && (
                  <div className="achievement-progress-overlay">
                    <svg width="54" height="54" viewBox="0 0 54 54">
                      <circle
                        cx="27" cy="27" r={radius}
                        stroke="rgba(0,0,0,0.5)" strokeWidth="4" fill="none"
                      />
                      <circle
                        cx="27" cy="27" r={radius}
                        stroke={quest.statusColor}
                        strokeWidth="4" fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 27 27)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                      <text
                        x="27" y="27"
                        textAnchor="middle" dy="5"
                        fontSize="12" fontWeight="700" fill="#fff"
                      >
                        {Math.round(progress)}%
                      </text>
                    </svg>
                  </div>
                )}
              </div>

              <div className="achievement-card-info">
                <div className="achievement-info-row">
                  <div className="achievement-title">{quest.title}</div>
                  <span className={`achievement-type-badge ${quest.status === 'locked' || quest.status === 'active' ? 'locked' : quest.type}`}>
                    {typeLabels[quest.type] || quest.type}
                  </span>
                </div>

                {/* Progress text for active quests */}
                {quest.status === 'active' && (
                  <div className="achievement-progress-text">
                    {quest.current}/{quest.total}
                  </div>
                )}

                <span className={`achievement-xp ${quest.status === 'locked' || quest.status === 'active' ? 'locked' : quest.type}`}>
                  {quest.xpReward} XP
                </span>

                {/* Claim XP button */}
                {quest.status === 'claimable_xp' && quest.id !== 'social-linked' && (
                  <button
                    className={`achievement-claim-btn ${claimingQuestId === quest.id ? 'claiming' : ''}`}
                    onClick={async () => {
                      const result = await onClaimXP(quest.id)
                      if (!result.success) {
                        console.error('Claim failed:', result.error)
                        alert(`Claim failed: ${result.error}`)
                      }
                    }}
                    disabled={claimingQuestId !== null}
                  >
                    {claimingQuestId === quest.id ? '...' : `Claim ${quest.xpReward} XP`}
                  </button>
                )}

                {/* Social Linked: verify first */}
                {quest.id === 'social-linked' && quest.status === 'claimable_xp' && !isSocialVerified && canVerify && (
                  <button
                    className="achievement-claim-btn verify"
                    onClick={async () => {
                      const result = await onVerifySocials()
                      if (result.success) {
                        onMarkCompleted('social-linked')
                      } else {
                        alert(`Verification failed: ${result.error}`)
                      }
                    }}
                    disabled={isVerifying}
                  >
                    {isVerifying ? '...' : 'Verify'}
                  </button>
                )}

                {/* Social Linked: claim after verify */}
                {quest.id === 'social-linked' && quest.status === 'claimable_xp' && isSocialVerified && (
                  <button
                    className={`achievement-claim-btn ${claimingQuestId === quest.id ? 'claiming' : ''}`}
                    onClick={async () => {
                      const result = await onClaimXP(quest.id)
                      if (!result.success) {
                        alert(`Claim failed: ${result.error}`)
                      }
                    }}
                    disabled={claimingQuestId !== null}
                  >
                    {claimingQuestId === quest.id ? '...' : `Claim ${quest.xpReward} XP`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AchievementsTab
