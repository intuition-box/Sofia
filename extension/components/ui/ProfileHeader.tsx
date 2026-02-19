/**
 * ProfileHeader Component
 *
 * Reusable profile header for AccountTab and UserProfilePage
 * Displays avatar, name, wallet address, and optional badges/actions
 */

import React from "react"

import Avatar from "./Avatar"
import goldCoin from "./img/gold/goldcoin.png"
import socialLinkedBg from "./img/badges/sociallinkedpp.png"
import "../styles/ProfileHeader.css"

interface ProfileHeaderProps {
  avatarUrl?: string
  displayName?: string
  walletAddress?: string
  badges?: JSX.Element | null
  actions?: JSX.Element | null
  backButton?: JSX.Element | null
  avatarClassName?: string
  size?: "small" | "medium" | "large"
  verified?: boolean
  verifiedLabel?: string
  totalGold?: number
  signalsCreated?: number
  currentStreak?: number
}

const ProfileHeader = ({
  avatarUrl,
  displayName,
  walletAddress,
  badges,
  actions,
  backButton,
  avatarClassName = "",
  size = "large",
  verified = false,
  verifiedLabel = "Social Linked",
  totalGold,
  signalsCreated,
  currentStreak
}: ProfileHeaderProps) => {
  const isRealName =
    displayName &&
    !displayName.startsWith("0x") &&
    !displayName.includes("...")

  const finalDisplayName =
    displayName ||
    (walletAddress
      ? `${walletAddress.toLowerCase().slice(0, 6)}...${walletAddress.toLowerCase().slice(-4)}`
      : "Connect Wallet")

  const truncatedWallet = walletAddress
    ? `${walletAddress.toLowerCase().slice(0, 6)}...${walletAddress.toLowerCase().slice(-4)}`
    : null

  return (
    <div className="profile-header-container">
      {backButton}
      <div className="profile-header">
        <div className={`profile-avatar-wrapper ${verified ? "social-linked" : ""}`}>
          {verified && (
            <img
              src={socialLinkedBg}
              alt=""
              className="profile-avatar-bg"
            />
          )}
          <Avatar
            imgSrc={avatarUrl}
            name={finalDisplayName}
            avatarClassName={`profile-avatar ${avatarClassName}`}
            size={size as "small" | "medium" | "large"}
          />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{finalDisplayName}</h2>
          <div className="profile-meta-row">
            {isRealName && truncatedWallet && (
              <span className="profile-meta-address">
                {truncatedWallet}
              </span>
            )}
            {verified && (
              <span className="profile-meta-badge">
                <svg
                  className="profile-meta-check"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2 8.5L6 12.5L14 3.5"
                    stroke="#22C55E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {verifiedLabel}
              </span>
            )}
            {signalsCreated !== undefined && (
              <span className="profile-meta-signals">
                <svg
                  className="profile-meta-signal-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <polyline
                    points="1,12 4,8 7,10 10,4 14,7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                {signalsCreated} Signals
              </span>
            )}
            {totalGold !== undefined && (
              <span className="profile-meta-gold">
                <img
                  src={goldCoin}
                  alt=""
                  className="profile-meta-gold-icon"
                />
                {totalGold}
              </span>
            )}
            {currentStreak !== undefined && currentStreak > 0 && (
              <span className="profile-meta-streak">
                {"\uD83D\uDD25"} {currentStreak}
              </span>
            )}
          </div>
        </div>
        {actions && (
          <div className="profile-actions">
            {actions}
          </div>
        )}
      </div>

      {badges && (
        <div className="badges-section">
          {badges}
        </div>
      )}
    </div>
  )
}

export default ProfileHeader
