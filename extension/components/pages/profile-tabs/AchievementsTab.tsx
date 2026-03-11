/**
 * AchievementsTab Component
 * Unified quest view: achievement cards with progress circles, claim buttons, and glow
 * Merges quest actions into the achievement grid layout
 */

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Quest } from '../../../types/questTypes'
import { createHookLogger } from '../../../lib/utils/logger'
import WeightModal from '../../modals/WeightModal'
import SofiaLoader from '../../ui/SofiaLoader'

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
import streakFireImg from '../../ui/img/questssuccess/Streak/mid.png'
import streakNoFireImg from '../../ui/img/questssuccess/Streak/low.png'
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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const getWeekDates = (): string[] => {
  const now = new Date()
  const day = now.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + mondayOffset)
  monday.setUTCHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
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
  currentVoteStreak?: number
  certActivityDates?: string[]
  voteActivityDates?: string[]
}

const STREAK_MILESTONES = [7, 30, 100]

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
  currentStreak,
  currentVoteStreak,
  certActivityDates = [],
  voteActivityDates = [],
}: AchievementsTabProps) => {
  const [refreshing, setRefreshing] = useState(false)

  // Derive week-filtered activity days from on-chain props
  const weekDatesRef = useMemo(() => getWeekDates(), [])
  const certDays = useMemo(
    () => new Set(certActivityDates.filter(d => weekDatesRef.includes(d))),
    [certActivityDates, weekDatesRef]
  )
  const voteDays = useMemo(
    () => new Set(voteActivityDates.filter(d => weekDatesRef.includes(d))),
    [voteActivityDates, weekDatesRef]
  )

  // Quest claim modal state
  const [pendingClaim, setPendingClaim] = useState<{
    questId: string
    questTitle: string
    isDailyQuest: boolean
  } | null>(null)
  const [claimProcessing, setClaimProcessing] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const openClaimModal = (quest: Quest) => {
    const isDailyQuest = quest.id === 'daily-certification' || quest.id === 'daily-vote'
    setPendingClaim({ questId: quest.id, questTitle: quest.title, isDailyQuest })
    setClaimProcessing(false)
    setClaimSuccess(false)
    setClaimError(null)
  }

  const handleClaimSubmit = async () => {
    if (!pendingClaim) return
    setClaimProcessing(true)
    setClaimError(null)
    try {
      const result = await onClaimXP(pendingClaim.questId)
      if (result.success) {
        setClaimSuccess(true)
      } else {
        setClaimError(result.error || 'Claim failed')
      }
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Claim failed')
    } finally {
      setClaimProcessing(false)
    }
  }

  const handleClaimModalClose = () => {
    setPendingClaim(null)
    setClaimProcessing(false)
    setClaimSuccess(false)
    setClaimError(null)
  }

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
        <div className="achievements-loading"><SofiaLoader size={150} /></div>
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

  // Streak hub data
  const maxStreak = Math.max(currentStreak || 0, currentVoteStreak || 0)
  const prevMilestone = STREAK_MILESTONES.filter(m => m <= maxStreak).pop() || 0
  const nextMilestone = STREAK_MILESTONES.find(m => m > maxStreak) || 100
  const streakProgress = maxStreak >= 100
    ? 100
    : ((maxStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100

  const dailyVoteQuest = quests.find(q => q.id === "daily-vote")
  const dailyCertQuest = quests.find(q => q.id === "daily-certification")
  const weekDates = getWeekDates()

  const todayStr = new Date().toISOString().split("T")[0]

  const renderWeekRow = (days: Set<string>) => {
    // Group consecutive active days into pill runs
    const runs: { indices: number[]; active: boolean }[] = []
    let current: { indices: number[]; active: boolean } | null = null

    weekDates.forEach((date, i) => {
      const isActive = days.has(date)
      if (!current || current.active !== isActive) {
        current = { indices: [i], active: isActive }
        runs.push(current)
      } else {
        current.indices.push(i)
      }
    })

    const getDayContent = (i: number) => {
      const date = weekDates[i]
      const isActive = days.has(date)
      const isToday = date === todayStr
      const isPast = date < todayStr

      if (isActive) return { className: "streak-hub-day active", content: "\u2713" }
      if (isToday) return { className: "streak-hub-day today", content: "!" }
      if (isPast) return { className: "streak-hub-day missed", content: DAY_LABELS[i] }
      return { className: "streak-hub-day", content: DAY_LABELS[i] }
    }

    return (
      <div className="streak-hub-week">
        {runs.map((run, ri) =>
          run.active ? (
            <div key={ri} className="streak-hub-pill" style={{ flex: run.indices.length }}>
              {run.indices.map(i => {
                const day = getDayContent(i)
                return (
                  <div key={i} className={day.className}>
                    {day.content}
                  </div>
                )
              })}
            </div>
          ) : (
            run.indices.map(i => {
              const day = getDayContent(i)
              return (
                <div key={i} className={day.className}>
                  {day.content}
                </div>
              )
            })
          )
        )}
      </div>
    )
  }

  const renderDailyAction = (
    quest: Quest | undefined,
    title: string,
    subtitle: string,
    days: Set<string>
  ) => {
    if (!quest) return null
    return (
      <div className="streak-hub-action">
        <div className="streak-hub-action-title">{title}</div>
        {quest.status === "claimable_xp" ? (
          <button
            className={`streak-hub-claim-btn ${claimingQuestId === quest.id ? "claiming" : ""}`}
            onClick={() => openClaimModal(quest)}
            disabled={claimingQuestId !== null}
          >
            {claimingQuestId === quest.id ? "..." : "CLAIM XP"}
          </button>
        ) : (
          renderWeekRow(days)
        )}
        <div className="streak-hub-subtitle">{subtitle}</div>
      </div>
    )
  }

  return (
    <div className="achievements-tab-content">
      {onRefresh && (
        <button
          className="quest-refresh-btn-inline"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh quests"
        >
          {refreshing ? "..." : "\u21BB"}
        </button>
      )}
      {/* Streak Hub Card */}
      <div className="streak-hub-card">
        <div className="streak-hub-left">
          <img
            src={maxStreak >= 7 ? streakFireImg : streakNoFireImg}
            alt="Streak"
            className="streak-hub-logo"
          />
          <div className="streak-hub-days">{maxStreak} days</div>
          <div className="streak-hub-progress">
            <div
              className="streak-hub-progress-fill"
              style={{ width: `${Math.round(streakProgress)}%` }}
            />
          </div>
          <div className="streak-hub-progress-pct">
            {Math.round(streakProgress)}%
          </div>
        </div>
        <div className="streak-hub-right">
          {renderDailyAction(
            dailyVoteQuest,
            "DAILY VOTER",
            "Vote once today",
            voteDays
          )}
          {renderDailyAction(
            dailyCertQuest,
            "DAILY CERTIFICATION",
            "Certify a page today",
            certDays
          )}
        </div>
      </div>

      {(() => {
        const remaining = sorted.filter(
          q => q.id !== "daily-certification" && q.id !== "daily-vote"
        )

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
                    onClick={() => openClaimModal(quest)}
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

      {/* Quest claim confirmation modal */}
      {pendingClaim && createPortal(
        <WeightModal
          isOpen={!!pendingClaim}
          triplets={[{
            id: `claim-${pendingClaim.questId}`,
            triplet: {
              subject: 'I',
              predicate: 'has tag',
              object: pendingClaim.questTitle
            },
            description: '',
            url: ''
          }]}
          isProcessing={claimProcessing}
          transactionSuccess={claimSuccess}
          transactionError={claimError || undefined}
          fixedDeposit={pendingClaim.isDailyQuest ? 1.01 : 0.01}
          estimateOptions={{ isNewTriple: true, newAtomCount: 1 }}
          submitLabel="Claim"
          showXpAnimation={true}
          onClose={handleClaimModalClose}
          onSubmit={handleClaimSubmit}
        />,
        document.body
      )}
    </div>
  )
}

export default AchievementsTab
