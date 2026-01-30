import { useState } from 'react'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import type { FollowFilterType } from '../../../types/follows'
import { FollowersPanel } from './follow/FollowersPanel'
import { FollowingPanel } from './follow/FollowingPanel'
import { TrustCirclePanel } from './follow/TrustCirclePanel'
import '../../styles/CoreComponents.css'
import '../../styles/FollowTab.css'

/**
 * FollowTab - Container component for follow/trust functionality
 * Orchestrates the three panels: Followers, Following, Trust Circle
 */
const FollowTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const [filterType, setFilterType] = useState<FollowFilterType>('followers')

  if (!walletAddress) {
    return (
      <div className="follow-tab">
        <div className="empty-state">
          <p>Connect your wallet to view your follows</p>
        </div>
      </div>
    )
  }

  return (
    <div className="follow-tab">
      {/* Filter buttons / Tabs */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filterType === 'followers' ? 'active' : ''}`}
          onClick={() => setFilterType('followers')}
        >
          Followers
        </button>
        <button
          className={`filter-btn ${filterType === 'following' ? 'active' : ''}`}
          onClick={() => setFilterType('following')}
        >
          Following
        </button>
        <button
          className={`filter-btn ${filterType === 'trust-circle' ? 'trustactive' : ''}`}
          onClick={() => setFilterType('trust-circle')}
        >
          Trust Circle
        </button>
      </div>

      {/* Render active panel */}
      {filterType === 'followers' && <FollowersPanel walletAddress={walletAddress} />}
      {filterType === 'following' && <FollowingPanel walletAddress={walletAddress} />}
      {filterType === 'trust-circle' && <TrustCirclePanel walletAddress={walletAddress} />}
    </div>
  )
}

export default FollowTab
