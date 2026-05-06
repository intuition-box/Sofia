import { useWalletFromStorage, useTrustCircle } from '../../../hooks'
import Avatar from '../../ui/Avatar'
import SofiaLoader from '../../ui/SofiaLoader'
import { ExplorerPanel } from './follow/ExplorerPanel'
import '../../styles/CoreComponents.css'
import '../../styles/FollowTab.css'
import '../../styles/CommunityHomeView.css'

interface CommunityHomeViewProps {
  onOpenFeed: () => void
  onTrustAdded?: () => void
}

const MAX_AVATARS_IN_STACK = 4

const CommunityHomeView = ({ onOpenFeed, onTrustAdded }: CommunityHomeViewProps) => {
  const { walletAddress } = useWalletFromStorage()
  const { accounts, loading } = useTrustCircle(walletAddress)

  const memberCount = accounts.length
  const stack = accounts.slice(0, MAX_AVATARS_IN_STACK)
  const overflow = Math.max(0, memberCount - MAX_AVATARS_IN_STACK)

  if (!walletAddress) {
    return (
      <div className="community-home">
        <div className="empty-state">
          <p>Connect your wallet to view your trust circle</p>
        </div>
      </div>
    )
  }

  return (
    <div className="community-home">
      <button
        type="button"
        className="trust-circle-banner"
        onClick={onOpenFeed}
        aria-label="Open trust circle feed"
      >
        <div className="trust-circle-banner-main">
          <span className="trust-circle-banner-title">My Trust Circle</span>
          <span className="trust-circle-banner-count">
            {loading && memberCount === 0
              ? 'Loading…'
              : `${memberCount} member${memberCount === 1 ? '' : 's'}`}
          </span>
        </div>

        {memberCount > 0 && (
          <div className="trust-circle-banner-avatars" aria-hidden="true">
            {stack.map(acc => (
              <div key={acc.id} className="trust-circle-avatar-slot">
                <Avatar
                  imgSrc={acc.image}
                  name={acc.label}
                  avatarClassName="trust-circle-avatar"
                  size="small"
                />
              </div>
            ))}
            {overflow > 0 && (
              <div className="trust-circle-avatar-slot trust-circle-avatar-overflow">
                +{overflow}
              </div>
            )}
          </div>
        )}

        {loading && memberCount === 0 && (
          <div className="trust-circle-banner-loader" aria-hidden="true">
            <SofiaLoader size={32} />
          </div>
        )}

        <span className="trust-circle-banner-chevron" aria-hidden="true">
          ›
        </span>
      </button>

      <div className="community-explore-section">
        <ExplorerPanel walletAddress={walletAddress} onTrustAdded={onTrustAdded} />
      </div>
    </div>
  )
}

export default CommunityHomeView
