import { useState, Suspense, lazy } from "react"

import { useRouter } from "../layout/RouterProvider"
import Breadcrumb from "../ui/Breadcrumb"
import SofiaLoader from "../ui/SofiaLoader"
import {
  useCheckFollowStatus,
  useIdentityResolution,
  useAccountStats,
  useRedeemTriple
} from "../../hooks"
import ProfileHeader from "../ui/ProfileHeader"
import FollowButton from "../ui/FollowButton"
import TrustAccountButton from "../ui/TrustAccountButton"
import "../styles/UserProfile.css"
import "../styles/ProfilePage.css"
import "../styles/FollowTab.css"

// Lazy load tabs (same pattern as ProfilePage)
const TrustCirclePanel = lazy(() =>
  import("./circles-tabs/follow/TrustCirclePanel").then(m => ({
    default: m.TrustCirclePanel
  }))
)
const UserBookmarksTab = lazy(() => import("./user-profile-tabs/UserBookmarksTab"))

type SubTab = "bookmarks" | "trust-circle"

const isValidTab = (tab?: string): tab is SubTab =>
  !!tab && ["bookmarks", "trust-circle"].includes(tab)

// Label for the breadcrumb's parent crumb, derived from where the user came
// from (the router's previous page).
const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  circles: "Circles",
  "my-profile": "My Profile",
  score: "Score",
  recommendations: "For You",
  mark: "Mark",
  "discovery-profile": "Discovery"
}

const UserProfilePage = () => {
  const { userProfileData, goBack, history } = useRouter()
  const previousPage = history[history.length - 2]
  const parentLabel = PAGE_LABELS[previousPage] ?? "Circles"
  const [activeTab, setActiveTab] = useState<SubTab>(
    isValidTab(userProfileData?.initialTab) ? userProfileData.initialTab : "bookmarks"
  )

  // Check if we already follow/trust this account
  const followStatus = useCheckFollowStatus(userProfileData?.termId)
  const { redeemPosition } = useRedeemTriple()
  const [removingTrust, setRemovingTrust] = useState(false)

  const handleRemoveTrust = async () => {
    if (!followStatus.trustTripleId) return
    const confirmed = confirm(
      `Remove ${userProfileData?.label ?? "this user"} from your trust circle?`
    )
    if (!confirmed) return
    setRemovingTrust(true)
    try {
      const result = await redeemPosition(followStatus.trustTripleId)
      if (!result.success) {
        alert(`Remove failed: ${result.error}`)
        return
      }
      followStatus.refetch()
    } finally {
      setRemovingTrust(false)
    }
  }

  // Signals created (from on-chain stats)
  const { signalsCreated: accountSignals } = useAccountStats(
    userProfileData?.walletAddress
  )

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
        <div className="user-profile-trust-actions">
          <button className="follow-button salmon-gradient-button" disabled>
            Trusted ✓
          </button>
          <button
            type="button"
            className="trust-remove-btn"
            onClick={handleRemoveTrust}
            disabled={removingTrust || !followStatus.trustTripleId}
            title="Remove this user from your trust circle"
          >
            {removingTrust ? "Removing…" : "Remove"}
          </button>
        </div>
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

  return (
    <div className="page profile-page">
    <div className="profile-section account-tab">
      <div className="page-content">
      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={displayAvatar}
        displayName={displayLabel}
        walletAddress={userProfileData.walletAddress}
        signalsCreated={accountSignals}
        actions={renderActions()}
        backButton={
          <Breadcrumb
            crumbs={[
              { label: parentLabel, onClick: goBack },
              { label: displayLabel }
            ]}
          />
        }
      />

      {/* Sub-tabs Navigation */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeTab === "bookmarks" ? "active" : ""}`}
          onClick={() => setActiveTab("bookmarks")}
        >
          Bookmarks
        </button>
        <button
          className={`sub-tab ${activeTab === "trust-circle" ? "active" : ""}`}
          onClick={() => setActiveTab("trust-circle")}
        >
          Trust Circle
        </button>
      </div>

      {/* Tab Content */}
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === "bookmarks" && (
            <UserBookmarksTab walletAddress={userProfileData.walletAddress} />
          )}

          {activeTab === "trust-circle" && (
            <TrustCirclePanel walletAddress={userProfileData.walletAddress} />
          )}
        </Suspense>
      </div>
    </div>
    </div>
  )
}

export default UserProfilePage
