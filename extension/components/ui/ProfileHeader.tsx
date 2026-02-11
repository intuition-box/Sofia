/**
 * ProfileHeader Component
 * 
 * Reusable profile header for AccountTab and UserProfilePage
 * Displays avatar, name, wallet address, and optional badges/actions
 */

import React from 'react'
import Avatar from './Avatar'
import goldPlaceholder from './img/gold/goldplaceholder.svg'
import '../styles/ProfileHeader.css'

interface ProfileHeaderProps {
  avatarUrl?: string
  displayName?: string
  walletAddress?: string
  badges?: JSX.Element | null
  actions?: JSX.Element | null
  avatarClassName?: string
  size?: 'small' | 'medium' | 'large'
  verified?: boolean // For social linked badge
  verifiedLabel?: string // Custom verified label
  totalGold?: number
  signalsCreated?: number
}

const ProfileHeader = ({
  avatarUrl,
  displayName,
  walletAddress,
  badges,
  actions,
  avatarClassName = '',
  size = 'large',
  verified = false,
  verifiedLabel = 'Social Linked',
  totalGold,
  signalsCreated
}: ProfileHeaderProps) => {
  // Check if display name is a real name (ENS) or just a truncated wallet address
  const isRealName = displayName && !displayName.startsWith('0x') && !displayName.includes('...')

  // Fallback display name if none provided
  const finalDisplayName = displayName || (walletAddress 
    ? `${walletAddress.toLowerCase().slice(0, 6)}...${walletAddress.toLowerCase().slice(-4)}` 
    : 'Connect Wallet')

  return (
    <div className="profile-header-container">
      <div className="profile-header">
        <Avatar
          imgSrc={avatarUrl}
          name={finalDisplayName}
          avatarClassName={`profile-avatar ${verified ? 'social-linked' : ''} ${avatarClassName}`}
          size={size as 'small' | 'medium' | 'large'}
        />
        <div className="profile-info">
          <h2 className="profile-name">
            {finalDisplayName}
          </h2>
          {/* Only show wallet below if we have a display name (Discord/ENS) */}
          {isRealName && walletAddress && (
            <p className="profile-wallet">
              {walletAddress.toLowerCase().slice(0, 6)}...{walletAddress.toLowerCase().slice(-4)}
            </p>
          )}
          {/* Verified badge */}
          {verified && (
            <span className="social-linked-badge">{verifiedLabel}</span>
          )}
          {/* Gold & Signals row */}
          {(totalGold !== undefined || signalsCreated !== undefined) && (
            <div className="profile-info-stats">
              {totalGold !== undefined && (
                <div className="groups-gold-badge">
                  <img src={goldPlaceholder} alt="" className="gold-badge-bg" />
                  <span className="gold-value">{totalGold}</span>
                </div>
              )}
              {signalsCreated !== undefined && (
                <div className="xp-signals-count">
                  <span className="xp-signals-value">{signalsCreated}</span>
                  <span className="xp-signals-label">Signals</span>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Actions slot (e.g., follow/trust buttons) */}
        {actions && (
          <div className="profile-actions">
            {actions}
          </div>
        )}
      </div>

      {/* Badges slot (e.g., completed quests) */}
      {badges && (
        <div className="badges-section">
          {badges}
        </div>
      )}
    </div>
  )
}

export default ProfileHeader
