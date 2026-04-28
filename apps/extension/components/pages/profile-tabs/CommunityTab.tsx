import { useState } from 'react'
import { useWalletFromStorage } from '../../../hooks'
import type { CommunityFilterType } from '../../../types/follows'
import { FollowersPanel } from './follow/FollowersPanel'
import { FollowingPanel } from './follow/FollowingPanel'
import { TrustCirclePanel } from './follow/TrustCirclePanel'
import { ExplorerPanel } from './follow/ExplorerPanel'
import '../../styles/CoreComponents.css'
import '../../styles/FollowTab.css'

/**
 * CommunityTab - Container component for follow/trust functionality
 * Orchestrates the four panels: Trust Circle, Following, Followers, Explorer
 */
interface CommunityTabProps {
  walletAddress?: string
}

const CommunityTab = (props: CommunityTabProps) => {
  const { walletAddress: storageWallet } = useWalletFromStorage()
  const walletAddress = props.walletAddress || storageWallet
  const isExternalProfile = !!props.walletAddress
  const [filterType, setFilterType] = useState<CommunityFilterType>(isExternalProfile ? 'trust-circle' : 'explorer')

  if (!walletAddress) {
    return (
      <div className="community-tab">
        <div className="empty-state">
          <p>Connect your wallet to view your follows</p>
        </div>
      </div>
    )
  }

  return (
    <div className="community-tab">
      {/* Filter buttons — DS pf-echoes-sort segmented control */}
      <div className="pf-echoes-sort core-page-tabs" role="group" aria-label="Community filter">
        <button
          type="button"
          className={`pf-sort-btn ${filterType === 'trust-circle' ? 'active' : ''}`}
          aria-pressed={filterType === 'trust-circle'}
          onClick={() => setFilterType('trust-circle')}
        >
          Trust Circle
        </button>
        <button
          type="button"
          className={`pf-sort-btn ${filterType === 'following' ? 'active' : ''}`}
          aria-pressed={filterType === 'following'}
          onClick={() => setFilterType('following')}
        >
          Following
        </button>
        <button
          type="button"
          className={`pf-sort-btn ${filterType === 'followers' ? 'active' : ''}`}
          aria-pressed={filterType === 'followers'}
          onClick={() => setFilterType('followers')}
        >
          Followers
        </button>
        {!isExternalProfile && (
          <button
            type="button"
            className={`pf-sort-btn ${filterType === 'explorer' ? 'active' : ''}`}
            aria-pressed={filterType === 'explorer'}
            onClick={() => setFilterType('explorer')}
          >
            Explore
          </button>
        )}
      </div>

      {/* Render active panel */}
      {filterType === 'trust-circle' && <TrustCirclePanel walletAddress={walletAddress} />}
      {filterType === 'following' && <FollowingPanel walletAddress={walletAddress} />}
      {filterType === 'followers' && <FollowersPanel walletAddress={walletAddress} />}
      {filterType === 'explorer' && !isExternalProfile && <ExplorerPanel walletAddress={walletAddress} />}
    </div>
  )
}

export default CommunityTab
