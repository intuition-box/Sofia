import { useState } from 'react'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
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
  const [filterType, setFilterType] = useState<CommunityFilterType>('trust-circle')

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
      {/* Filter buttons / Tabs */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filterType === 'trust-circle' ? 'trustactive' : ''}`}
          onClick={() => setFilterType('trust-circle')}
        >
          Trust Circle
        </button>
        <button
          className={`filter-btn ${filterType === 'following' ? 'active' : ''}`}
          onClick={() => setFilterType('following')}
        >
          Following
        </button>
        <button
          className={`filter-btn ${filterType === 'followers' ? 'active' : ''}`}
          onClick={() => setFilterType('followers')}
        >
          Followers
        </button>
        <button
          className={`filter-btn ${filterType === 'explorer' ? 'active' : ''}`}
          onClick={() => setFilterType('explorer')}
        >
          Explore
        </button>
      </div>

      {/* Render active panel */}
      {filterType === 'trust-circle' && <TrustCirclePanel walletAddress={walletAddress} />}
      {filterType === 'following' && <FollowingPanel walletAddress={walletAddress} />}
      {filterType === 'followers' && <FollowersPanel walletAddress={walletAddress} />}
      {filterType === 'explorer' && <ExplorerPanel walletAddress={walletAddress} />}
    </div>
  )
}

export default CommunityTab
