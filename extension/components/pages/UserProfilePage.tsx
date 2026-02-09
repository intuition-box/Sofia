import { useState, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useCheckFollowStatus } from '../../hooks/useCheckFollowStatus'
import { useUserQuests } from '../../hooks/useUserQuests'
import { useIdentityResolution } from '../../hooks/useIdentityResolution'
import ProfileHeader from '../ui/ProfileHeader'
import FollowButton from '../ui/FollowButton'
import TrustAccountButton from '../ui/TrustAccountButton'
import leftSideIcon from '../ui/icons/left side.svg'
import rightSideIcon from '../ui/icons/right side.svg'
import '../styles/UserProfile.css'
import '../styles/ProfilePage.css'

// Lazy load tabs (same pattern as ProfilePage)
const UserInterestTab = lazy(() => import('./profile-tabs/UserInterestTab'))
const AchievementsTab = lazy(() => import('./profile-tabs/AchievementsTab'))
const CommunityTab = lazy(() => import('./profile-tabs/CommunityTab'))

type SubTab = 'interest' | 'achievements' | 'community'

const UserProfilePage = () => {
  const { userProfileData, goBack } = useRouter()
  const [activeTab, setActiveTab] = useState<SubTab>('interest')

  // Check if we already follow/trust this account
  const followStatus = useCheckFollowStatus(userProfileData?.termId)

  // User quests for the profile being viewed (on-chain completed only + signals count)
  const { completedQuests, totalXP, level, signalsCreated, loading: questsLoading } = useUserQuests(userProfileData?.walletAddress)

  // Identity resolution for the profile being viewed
  const { displayLabel, displayAvatar } = useIdentityResolution({
    walletAddress: userProfileData?.walletAddress,
    label: userProfileData?.label,
    image: userProfileData?.image,
    enableCache: true
  })

  if (!userProfileData) {
    return (
      <div className="page profile-page">
        <div className="profile-section account-tab">
          <div className="user-profile-error">
            No user data available
          </div>
        </div>
      </div>
    )
  }

  // Render follow/trust actions
  const renderActions = () => {
    if (!userProfileData.termId || !userProfileData.walletAddress) return null

    // Only show follow/trust buttons if termId is valid (bytes32 - 66 chars)
    if (userProfileData.termId.length !== 66) {
      return (
        <div className="user-profile-status-note">
          Follow/Trust unavailable (invalid ID format)
        </div>
      )
    }

    if (followStatus.loading) {
      return (
        <button className="follow-button salmon-gradient-button" disabled>
          Loading...
        </button>
      )
    }

    if (followStatus.isTrusting) {
      return (
        <button className="follow-button salmon-gradient-button" disabled>
          Trusted
        </button>
      )
    }

    if (followStatus.isFollowing) {
      return (
        <TrustAccountButton
          accountTermId={userProfileData.termId}
          accountLabel={userProfileData.label}
          onSuccess={() => {
            followStatus.refetch()
          }}
        />
      )
    }

    return (
      <FollowButton
        account={{
          id: userProfileData.termId,
          label: userProfileData.label,
          termId: userProfileData.termId,
          type: 'Account',
          createdAt: new Date().toISOString(),
          creatorId: '',
          atomType: 'Account',
          image: displayAvatar,
          data: userProfileData.walletAddress
        }}
        onFollowSuccess={() => {
          followStatus.refetch()
        }}
      />
    )
  }

  return (
    <div className="page profile-page">
    <div className="profile-section account-tab">
      {/* Back Button */}
      <button className="user-profile-back-button" onClick={goBack}>
        ← Back
      </button>

      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={displayAvatar}
        displayName={displayLabel}
        walletAddress={userProfileData.walletAddress}
        actions={renderActions()}
      />

      {/* Stats Section - same design as AccountTab */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-icons-with-value">
            <img src={leftSideIcon} alt="Left" className="stat-icon" />
            <div className="stat-value">{questsLoading ? '...' : level}</div>
            <img src={rightSideIcon} alt="Right" className="stat-icon" />
          </div>
          <div className="stat-label">Level</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{questsLoading ? '...' : totalXP}</div>
          <div className="stat-label">Total XP</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{questsLoading ? '...' : signalsCreated}</div>
          <div className="stat-label">Signals</div>
        </div>
      </div>

      {/* Separator */}
      <div className="section-separator"></div>

      {/* Sub-tabs Navigation */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeTab === 'interest' ? 'active' : ''}`}
          onClick={() => setActiveTab('interest')}
        >
          Interest
        </button>
        <button
          className={`sub-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Success
        </button>
        <button
          className={`sub-tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Community
        </button>
      </div>

      {/* Tab Content */}
      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeTab === 'interest' && (
            <UserInterestTab walletAddress={userProfileData.walletAddress} />
          )}

          {activeTab === 'achievements' && (
            <AchievementsTab
              quests={completedQuests}
              loading={questsLoading}
              claimingQuestId={null}
              isSocialVerified={false}
              canVerify={false}
              isVerifying={false}
              onClaimXP={async () => ({ success: false })}
              onVerifySocials={async () => ({ success: false })}
              onMarkCompleted={() => {}}
            />
          )}

          {activeTab === 'community' && (
            <CommunityTab walletAddress={userProfileData.walletAddress} />
          )}
        </Suspense>
      </div>
    </div>
    </div>
  )
}

export default UserProfilePage
