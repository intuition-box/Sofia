import { useRouter } from '../layout/RouterProvider'
import Avatar from '../ui/Avatar'
import { useUserSignals } from '../../hooks/useUserSignals'
import { useUserLists } from '../../hooks/useUserLists'
import { useUserAtomStats } from '../../hooks/useUserAtomStats'
import FollowButton from '../ui/FollowButton'
import '../styles/UserProfile.css'

const UserProfilePage = () => {
  const { userProfileData, goBack } = useRouter()

  // Get detailed stats using the correct query
  const atomStats = useUserAtomStats(
    userProfileData?.termId,
    userProfileData?.walletAddress
  )

  const {
    signals,
    loading: signalsLoading,
    error: signalsError,
    hasMore: hasMoreSignals,
    loadMore: loadMoreSignals
  } = useUserSignals(userProfileData?.termId, userProfileData?.walletAddress)

  const {
    lists,
    loading: listsLoading,
    error: listsError,
    hasMore: hasMoreLists,
    loadMore: loadMoreLists
  } = useUserLists(userProfileData?.termId)

  if (!userProfileData) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-error">
          No user data available
        </div>
      </div>
    )
  }

  // Format market cap from Wei to readable format
  const formatMarketCap = (value: string): string => {
    const num = parseFloat(value) / 1e18
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  // Calculate signals created from atomStats position count
  const signalsCreated = atomStats.positionCount || 0
  const totalMarketCap = formatMarketCap(atomStats.totalMarketCap)

  return (
    <div className="user-profile-page">
      {/* Back Button */}
      <button className="user-profile-back-button" onClick={goBack}>
        ← Back
      </button>

      {/* Profile Header */}
      <div className="user-profile-header">
        <Avatar
          imgSrc={userProfileData.image}
          name={userProfileData.label}
          avatarClassName="user-profile-avatar"
          size="large"
        />
        <div className="user-profile-info">
          <h2 className="user-profile-name">{userProfileData.label}</h2>
          {userProfileData.walletAddress && (
            <p className="user-profile-wallet">
              {userProfileData.walletAddress.slice(0, 6)}...{userProfileData.walletAddress.slice(-4)}
            </p>
          )}
        </div>
        {userProfileData.termId && userProfileData.walletAddress && (
          <FollowButton
            account={{
              id: userProfileData.termId,
              label: userProfileData.label,
              termId: userProfileData.termId,
              type: 'Account',
              createdAt: new Date().toISOString(),
              creatorId: '',
              atomType: 'Account',
              image: userProfileData.image,
              data: userProfileData.walletAddress
            }}
          />
        )}
      </div>

      {/* Stats Section */}
      <div className="user-profile-stats-section">
        {atomStats.loading ? (
          <div className="user-profile-stats-loading">Loading stats...</div>
        ) : atomStats.error ? (
          <div className="user-profile-stats-error">{atomStats.error}</div>
        ) : (
          <div className="user-profile-stats-grid">
            <div className="user-profile-stat-item">
              <div className="user-profile-stat-value">{signalsCreated}</div>
              <div className="user-profile-stat-label">Signals Created</div>
            </div>
            <div className="user-profile-stat-item">
              <div className="user-profile-stat-value">{totalMarketCap}</div>
              <div className="user-profile-stat-label">Total Market Cap</div>
            </div>
            <div className="user-profile-stat-item">
              <div className="user-profile-stat-value">{atomStats.followersCount}</div>
              <div className="user-profile-stat-label">Followers</div>
            </div>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="user-profile-separator"></div>

      {/* Signals Section */}
      <div className="user-profile-section">
        <h3 className="user-profile-section-title">Signals Created</h3>

        {signalsLoading && signals.length === 0 && (
          <div className="user-profile-loading">Loading signals...</div>
        )}

        {signalsError && (
          <div className="user-profile-error">{signalsError}</div>
        )}

        {!signalsLoading && signals.length === 0 && !signalsError && (
          <div className="user-profile-empty">No signals created yet</div>
        )}

        {signals.length > 0 && (
          <div className="user-profile-signals-grid">
            {signals.map((signal) => (
              <a
                key={signal.termId}
                href={`https://portal.intuition.systems/explore/triple/${signal.triple.term_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="user-profile-signal-card"
              >
                {/* Triple representation */}
                <div className="user-profile-signal-triple">
                  <div className="user-profile-signal-atom">
                    {signal.triple.subject.image && (
                      <img
                        src={signal.triple.subject.image}
                        alt={signal.triple.subject.label}
                        className="user-profile-signal-atom-image"
                      />
                    )}
                    <span className="user-profile-signal-atom-label">
                      {signal.triple.subject.label}
                    </span>
                  </div>

                  <span className="user-profile-signal-predicate">
                    {signal.triple.predicate.label}
                  </span>

                  <div className="user-profile-signal-atom">
                    {signal.triple.object.image && (
                      <img
                        src={signal.triple.object.image}
                        alt={signal.triple.object.label}
                        className="user-profile-signal-atom-image"
                      />
                    )}
                    <span className="user-profile-signal-atom-label">
                      {signal.triple.object.label}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="user-profile-signal-stats">
                  <div className="user-profile-signal-stat">
                    <span className="user-profile-signal-stat-label">Market Cap</span>
                    <span className="user-profile-signal-stat-value">
                      {formatMarketCap(signal.totalMarketCap)}
                    </span>
                  </div>
                  <div className="user-profile-signal-stat">
                    <span className="user-profile-signal-stat-label">Positions</span>
                    <span className="user-profile-signal-stat-value">
                      {signal.positionCount}
                    </span>
                  </div>
                  <div className="user-profile-signal-stat">
                    <span className="user-profile-signal-stat-label">Created</span>
                    <span className="user-profile-signal-stat-value">
                      {new Date(signal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {hasMoreSignals && (
          <button
            className="user-profile-load-more"
            onClick={loadMoreSignals}
            disabled={signalsLoading}
          >
            {signalsLoading ? 'Loading...' : 'Load More Signals'}
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="user-profile-separator"></div>

      {/* Lists Section */}
      <div className="user-profile-section">
        <h3 className="user-profile-section-title">Lists Created</h3>

        {listsLoading && lists.length === 0 && (
          <div className="user-profile-loading">Loading lists...</div>
        )}

        {listsError && (
          <div className="user-profile-error">{listsError}</div>
        )}

        {!listsLoading && lists.length === 0 && !listsError && (
          <div className="user-profile-empty">No lists created yet</div>
        )}

        {lists.length > 0 && (
          <div className="user-profile-lists-grid">
            {lists.map((list) => (
              <a
                key={list.objectTermId}
                href={`https://portal.intuition.systems/explore/atom/${list.objectTermId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="user-profile-list-card"
              >
                {/* List Header */}
                <div className="user-profile-list-header">
                  {list.objectImage && (
                    <img
                      src={list.objectImage}
                      alt={list.objectLabel}
                      className="user-profile-list-image"
                    />
                  )}
                  <div className="user-profile-list-info">
                    <h4 className="user-profile-list-label">{list.objectLabel}</h4>
                    <p className="user-profile-list-predicate">{list.predicateLabel}</p>
                  </div>
                </div>

                {/* Preview of triplets */}
                {list.triplets.length > 0 && (
                  <div className="user-profile-list-preview">
                    {list.triplets.map((triplet, index) => (
                      <div key={triplet.subjectTermId} className="user-profile-list-preview-item">
                        {triplet.subjectImage && (
                          <img
                            src={triplet.subjectImage}
                            alt={triplet.subjectLabel}
                            className="user-profile-list-preview-image"
                          />
                        )}
                        <span className="user-profile-list-preview-label">
                          {triplet.subjectLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="user-profile-list-stats">
                  <div className="user-profile-list-stat">
                    <span className="user-profile-list-stat-label">Items</span>
                    <span className="user-profile-list-stat-value">
                      {list.tripleCount}
                    </span>
                  </div>
                  <div className="user-profile-list-stat">
                    <span className="user-profile-list-stat-label">Market Cap</span>
                    <span className="user-profile-list-stat-value">
                      {formatMarketCap(list.totalMarketCap)}
                    </span>
                  </div>
                  <div className="user-profile-list-stat">
                    <span className="user-profile-list-stat-label">Positions</span>
                    <span className="user-profile-list-stat-value">
                      {list.totalPositionCount}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {hasMoreLists && (
          <button
            className="user-profile-load-more"
            onClick={loadMoreLists}
            disabled={listsLoading}
          >
            {listsLoading ? 'Loading...' : 'Load More Lists'}
          </button>
        )}
      </div>
    </div>
  )
}

export default UserProfilePage
