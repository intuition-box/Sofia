import { useState, useEffect, Suspense, lazy } from "react"

import { useRouter } from "../layout/RouterProvider"
import SofiaLoader from "../ui/SofiaLoader"
import {
  useCheckFollowStatus,
  useUserQuests,
  useIdentityResolution,
  useTrustedByCount,
  useAccountStats,
  useUserDiscoveryScore
} from "../../hooks"
import ProfileHeader from "../ui/ProfileHeader"
import FollowButton from "../ui/FollowButton"
import TrustAccountButton from "../ui/TrustAccountButton"
import "../styles/UserProfile.css"
import "../styles/ProfilePage.css"

// Lazy load tabs (same pattern as ProfilePage)
const UserStatsTab = lazy(() => import("./profile-tabs/UserStatsTab"))
const AchievementsTab = lazy(() => import("./profile-tabs/AchievementsTab"))
const CommunityTab = lazy(() => import("./profile-tabs/CommunityTab"))
const UserBookmarksTab = lazy(() => import("./profile-tabs/UserBookmarksTab"))

type SubTab = "stats" | "achievements" | "bookmarks" | "community"

const isValidTab = (tab?: string): tab is SubTab =>
  !!tab && ["stats", "achievements", "bookmarks", "community"].includes(tab)

const UserProfilePage = () => {
  const { userProfileData, goBack } = useRouter()
  const [activeTab, setActiveTab] = useState<SubTab>(
    isValidTab(userProfileData?.initialTab) ? userProfileData.initialTab : "stats"
  )

  // Check if we already follow/trust this account
  const followStatus = useCheckFollowStatus(userProfileData?.termId)

  // User quests for the profile being viewed (on-chain completed only + signals count)
  const {
    completedQuests,
    totalXP,
    level,
    signalsCreated,
    loading: questsLoading
  } = useUserQuests(userProfileData?.walletAddress)

  // Trusted-by count (people who trust this account)
  const {
    count: trustedByCount,
    refetch: fetchTrustedByCount
  } = useTrustedByCount(userProfileData?.walletAddress)

  // Signals created (from on-chain stats)
  const { signalsCreated: accountSignals } = useAccountStats(
    userProfileData?.walletAddress
  )

  // Discovery score for the viewed user
  const {
    stats: discoveryStats,
    loading: discoveryLoading,
    error: discoveryError,
    refetch: refetchDiscovery
  } = useUserDiscoveryScore(userProfileData?.walletAddress)

  // Identity resolution for the profile being viewed
  const { displayLabel, displayAvatar } = useIdentityResolution({
    walletAddress: userProfileData?.walletAddress,
    label: userProfileData?.label,
    image: userProfileData?.image,
    enableCache: true
  })

  // Fetch trusted-by count on mount
  useEffect(() => {
    if (userProfileData?.walletAddress) {
      fetchTrustedByCount()
    }
  }, [userProfileData?.walletAddress, fetchTrustedByCount])

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
          type: "Account",
          createdAt: new Date().toISOString(),
          creatorId: "",
          atomType: "Account",
          image: displayAvatar,
          data: userProfileData.walletAddress
        }}
        onFollowSuccess={() => {
          followStatus.refetch()
        }}
      />
    )
  }

  const effectiveSignals = accountSignals ?? signalsCreated

  return (
    <div className="page profile-page">
    <div className="profile-section account-tab">
      <div className="page-content">
      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={displayAvatar}
        displayName={displayLabel}
        walletAddress={userProfileData.walletAddress}
        signalsCreated={effectiveSignals}
        actions={renderActions()}
        backButton={
          <button className="user-profile-back-button" onClick={goBack}>
            ← Back
          </button>
        }
      />

      {/* Sub-tabs Navigation */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          Stats
        </button>
        <button
          className={`sub-tab ${activeTab === "achievements" ? "active" : ""}`}
          onClick={() => setActiveTab("achievements")}
        >
          Quests
        </button>
        <button
          className={`sub-tab ${activeTab === "bookmarks" ? "active" : ""}`}
          onClick={() => setActiveTab("bookmarks")}
        >
          Bookmarks
        </button>
        <button
          className={`sub-tab ${activeTab === "community" ? "active" : ""}`}
          onClick={() => setActiveTab("community")}
        >
          Community
        </button>
      </div>

      {/* Tab Content */}
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === "stats" && (
            <UserStatsTab
              walletAddress={userProfileData.walletAddress}
              trustedByCount={trustedByCount}
              level={level}
              totalXP={totalXP}
              signalsCreated={effectiveSignals}
              discoveryStats={discoveryStats}
              discoveryLoading={discoveryLoading}
              discoveryError={discoveryError}
              onRetry={refetchDiscovery}
            />
          )}

          {activeTab === "achievements" && (
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

          {activeTab === "bookmarks" && (
            <UserBookmarksTab walletAddress={userProfileData.walletAddress} />
          )}

          {activeTab === "community" && (
            <CommunityTab walletAddress={userProfileData.walletAddress} />
          )}
        </Suspense>
      </div>
    </div>
    </div>
  )
}

export default UserProfilePage
