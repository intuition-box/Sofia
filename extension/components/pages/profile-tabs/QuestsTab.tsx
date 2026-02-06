/**
 * QuestsTab Component
 * Displays the list of quests with progress indicators and claim buttons
 */

import { useState } from 'react'
import type { Quest } from '../../../hooks/useQuestSystem'

interface QuestsTabProps {
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

const QuestsTab = ({
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
}: QuestsTabProps) => {
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
  const calculateProgress = (current: number, total: number) => {
    return (current / total) * 100
  }

  if (loading) {
    return (
      <div className="quests-section">
        <div className="quests-loading">Loading quests...</div>
      </div>
    )
  }

  if (quests.length === 0) {
    return (
      <div className="quests-section">
        <div className="quests-empty">
          <p>No active quests. Complete your first action to unlock quests!</p>
          {onRefresh && (
            <button
              className="quest-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Reload quests'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="quests-section">
      {onRefresh && (
        <button
          className="quest-refresh-btn-inline"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh quests"
        >
          {refreshing ? '...' : '\u21BB'}
        </button>
      )}
      {quests.map((quest) => {
        const progress = calculateProgress(quest.current, quest.total)
        const radius = 28
        const circumference = 2 * Math.PI * radius
        const strokeDashoffset = circumference - (progress / 100) * circumference

        return (
          <div key={quest.id} className="quest-item">
            <div className="quest-progress">
              <svg width="70" height="70" viewBox="0 0 70 70">
                {/* Background circle */}
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  stroke="#2d2d2d"
                  strokeWidth="6"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  stroke={quest.statusColor}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 35 35)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                {/* Percentage text */}
                <text
                  x="35"
                  y="35"
                  textAnchor="middle"
                  dy="6"
                  fontSize="14"
                  fontWeight="600"
                  fill="#fff"
                >
                  {Math.round(progress)}%
                </text>
              </svg>
            </div>
            <div className="quest-details">
              <span className="quest-badge-name">{quest.title}</span>
              <h4 className="quest-title">{quest.description}</h4>
              <p className="quest-progress-text">{quest.current}/{quest.total}</p>
              <span className="quest-status" style={{ color: quest.statusColor }}>
                {quest.status === 'active' ? 'In Progress' :
                 quest.status === 'claimable_xp' ? 'Ready to Claim!' :
                 quest.status === 'completed' ? 'Claimed' : 'Locked'} • +{quest.xpReward} XP
              </span>

              {/* Claim XP button for completed quests */}
              {quest.status === 'claimable_xp' && quest.id !== 'social-linked' && (
                <button
                  className={`claim-xp-button ${claimingQuestId === quest.id ? 'claiming' : ''}`}
                  onClick={async () => {
                    const result = await onClaimXP(quest.id)
                    if (!result.success) {
                      console.error('Claim failed:', result.error)
                      alert(`Claim failed: ${result.error}`)
                    }
                  }}
                  disabled={claimingQuestId !== null}
                >
                  {claimingQuestId === quest.id ? 'Claiming...' : `Claim ${quest.xpReward} XP`}
                </button>
              )}

              {/* Social Linked button for social-linked quest (first verify on-chain, then XP) */}
              {quest.id === 'social-linked' && quest.status === 'claimable_xp' && !isSocialVerified && canVerify && (
                <button
                  className="social-link-button"
                  onClick={async () => {
                    const result = await onVerifySocials()
                    if (result.success) {
                      onMarkCompleted('social-linked')
                    } else {
                      console.error('Verification failed:', result.error)
                      alert(`Verification failed: ${result.error}`)
                    }
                  }}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Socials'}
                </button>
              )}

              {/* Claim XP button for social-linked after on-chain verification */}
              {quest.id === 'social-linked' && quest.status === 'claimable_xp' && isSocialVerified && (
                <button
                  className={`claim-xp-button ${claimingQuestId === quest.id ? 'claiming' : ''}`}
                  onClick={async () => {
                    const result = await onClaimXP(quest.id)
                    if (!result.success) {
                      console.error('Claim failed:', result.error)
                      alert(`Claim failed: ${result.error}`)
                    }
                  }}
                  disabled={claimingQuestId !== null}
                >
                  {claimingQuestId === quest.id ? 'Claiming...' : `Claim ${quest.xpReward} XP`}
                </button>
              )}

              {quest.id === 'social-linked' && quest.status === 'completed' && (
                <span className="social-linked-badge">Social Linked</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default QuestsTab
