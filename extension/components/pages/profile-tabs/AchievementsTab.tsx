/**
 * AchievementsTab Component
 * Unified quest view: achievement cards with progress circles, claim buttons, and glow
 * Merges quest actions into the achievement grid layout
 */

import { useState, useEffect } from 'react'
import { getAddress } from 'viem'
import type { Quest } from '../../../types/questTypes'
import { createHookLogger } from '../../../lib/utils/logger'

const logger = createHookLogger('AchievementsTab')

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
import goldImg from '../../ui/img/questssuccess/gold.png'

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
  gold: goldImg,
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
  gold: 'Gold',
}

interface VaultProfitData {
  hasPosition: boolean
  sharesFormatted: string
  currentValue: number
  profit: number
  participantCount: number
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const getWeekDates = (): string[] => {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
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
  walletAddress?: string | null
  streakProfit?: VaultProfitData | null
  voteProfit?: VaultProfitData | null
  currentStreak?: number
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
  onRefresh,
  walletAddress,
  streakProfit,
  voteProfit,
  currentStreak
}: AchievementsTabProps) => {
  const [refreshing, setRefreshing] = useState(false)
  const [certDays, setCertDays] = useState<Set<string>>(new Set())
  const [voteDays, setVoteDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!walletAddress) return
    try {
      const checksummed = getAddress(walletAddress)
      const certKey = `certification_activity_dates_${checksummed}`
      const voteKey = `vote_activity_dates_${checksummed}`
      const weekDates = getWeekDates()

      chrome.storage.local.get([certKey, voteKey]).then(result => {
        setCertDays(new Set<string>(
          ((result[certKey] || []) as string[]).filter(d => weekDates.includes(d))
        ))
        setVoteDays(new Set<string>(
          ((result[voteKey] || []) as string[]).filter(d => weekDates.includes(d))
        ))
      })
    } catch {
      // invalid address
    }
  }, [walletAddress])

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
      {/* Vault Cards */}
      {streakProfit?.hasPosition && (
        <div className="streak-vault-card">
          <div className="streak-vault-header-top">
            {currentStreak !== undefined && currentStreak > 0 && (
              <span className="streak-vault-badge">{"\uD83D\uDD25"} {currentStreak} day streak</span>
            )}
            <span className="streak-vault-participants">{streakProfit.participantCount} streakers</span>
          </div>
          <div className="streak-vault-title-row">
            <span className="streak-vault-title">Certification Vault</span>
          </div>
          <div className="streak-week-bubbles">
            {getWeekDates().map((date, i) => (
              <div key={date} className={`streak-bubble ${certDays.has(date) ? 'validated' : ''}`}>
                {certDays.has(date) ? '✓' : DAY_LABELS[i]}
              </div>
            ))}
          </div>
          <div className="streak-vault-stats">
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Shares</span>
              <span className="streak-vault-value">{streakProfit.sharesFormatted}</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Value</span>
              <span className="streak-vault-value">{streakProfit.currentValue.toFixed(4)} TRUST</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Profit</span>
              <span className={`streak-vault-value ${streakProfit.profit >= 0 ? 'positive' : 'negative'}`}>
                {streakProfit.profit >= 0 ? '+' : ''}{streakProfit.profit.toFixed(4)} TRUST
              </span>
            </div>
          </div>
        </div>
      )}
      {voteProfit?.hasPosition && (
        <div className="streak-vault-card">
          <div className="streak-vault-header">
            <span className="streak-vault-title">Vote Vault</span>
            <span className="streak-vault-participants">{voteProfit.participantCount} voters</span>
          </div>
          <div className="streak-week-bubbles">
            {getWeekDates().map((date, i) => (
              <div key={date} className={`streak-bubble ${voteDays.has(date) ? 'validated' : ''}`}>
                {voteDays.has(date) ? '✓' : DAY_LABELS[i]}
              </div>
            ))}
          </div>
          <div className="streak-vault-stats">
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Shares</span>
              <span className="streak-vault-value">{voteProfit.sharesFormatted}</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Value</span>
              <span className="streak-vault-value">{voteProfit.currentValue.toFixed(4)} TRUST</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Profit</span>
              <span className={`streak-vault-value ${voteProfit.profit >= 0 ? 'positive' : 'negative'}`}>
                {voteProfit.profit >= 0 ? '+' : ''}{voteProfit.profit.toFixed(4)} TRUST
              </span>
            </div>
          </div>
        </div>
      )}

      {(() => {
        // Section "Task" : daily-certification + daily-vote
        const taskQuests = sorted.filter(q => q.id === 'daily-certification' || q.id === 'daily-vote')
        const remaining = sorted.filter(q => q.id !== 'daily-certification' && q.id !== 'daily-vote')

        // Group remaining quests by type
        const SECTION_ORDER = ['streak', 'vote', 'signal', 'discovery', 'bookmark', 'social-link', 'follow', 'trust', 'pulse', 'gold']
        const groupedByType = new Map<string, Quest[]>()
        for (const q of remaining) {
          const group = groupedByType.get(q.type) || []
          group.push(q)
          groupedByType.set(q.type, group)
        }

        const renderCard = (quest: Quest) => {
          const progress = quest.total > 0 ? (quest.current / quest.total) * 100 : 0
          const showProgress = quest.status === 'active' || quest.status === 'claimable_xp' || quest.type === 'streak'
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

                <div className="achievement-description">{quest.description}</div>

                {(quest.status === 'active' || quest.type === 'streak') && (
                  <div className="achievement-progress-text">
                    {quest.current}/{quest.total}
                  </div>
                )}

                <span className={`achievement-xp ${quest.status === 'locked' || quest.status === 'active' ? 'locked' : quest.type}`}>
                  {quest.xpReward} XP
                </span>

                {quest.status === 'claimable_xp' && quest.id !== 'social-linked' && (
                  <button
                    className={`achievement-claim-btn ${claimingQuestId === quest.id ? 'claiming' : ''}`}
                    onClick={async () => {
                      const result = await onClaimXP(quest.id)
                      if (!result.success) {
                        logger.error('Claim failed', result.error)
                        alert(`Claim failed: ${result.error}`)
                      }
                    }}
                    disabled={claimingQuestId !== null}
                  >
                    {claimingQuestId === quest.id ? '...' : `Claim ${quest.xpReward} XP`}
                  </button>
                )}

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
        }

        return (
          <>
            {taskQuests.length > 0 && (
              <>
                <div className="achievements-section-header">
                  <div className="achievements-section-label">Task</div>
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
                </div>
                <div className="achievements-grid">
                  {taskQuests.map(renderCard)}
                </div>
              </>
            )}
            {SECTION_ORDER.map(type => {
              const quests = groupedByType.get(type)
              if (!quests || quests.length === 0) return null
              return (
                <div key={type}>
                  <div className="achievements-separator" />
                  <div className="achievements-section-header">
                    <div className="achievements-section-label">{typeLabels[type] || type}</div>
                  </div>
                  <div className="achievements-grid">
                    {quests.map(renderCard)}
                  </div>
                </div>
              )
            })}
          </>
        )
      })()}
    </div>
  )
}

export default AchievementsTab
