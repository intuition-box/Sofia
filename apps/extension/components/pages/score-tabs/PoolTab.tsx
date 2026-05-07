/**
 * PoolTab — Beta Season Pool view inside ScorePage.
 *
 * Shows the vault snapshot (TVL, stakers, share price) and the connected
 * wallet's position (rank, current value, net deposited, P&L, P&L%).
 */

import SofiaLoader from '../../ui/SofiaLoader'
import { useSeasonPool, formatPoolEther } from '../../../hooks/useSeasonPool'
import '../../styles/PoolTab.css'

interface PoolTabProps {
  walletAddress: string | null | undefined
}

const PoolTab = ({ walletAddress }: PoolTabProps) => {
  const { vaultStats, userStanding, loading, error } = useSeasonPool(
    walletAddress,
    Boolean(walletAddress),
  )

  if (loading && !vaultStats) {
    return (
      <div className="pool-tab loading-state">
        <SofiaLoader size={120} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="pool-tab pool-tab-empty">
        <div className="pool-tab-empty-title">Couldn't load the pool</div>
        <div className="pool-tab-empty-sub">{error}</div>
      </div>
    )
  }

  return (
    <div className="pool-tab">
      {vaultStats && (
        <div className="pool-snapshot">
          <div className="pool-stat">
            <span className="pool-stat-label">TVL</span>
            <span className="pool-stat-value">
              {formatPoolEther(vaultStats.tvl, 2)} T
            </span>
          </div>
          <div className="pool-stat">
            <span className="pool-stat-label">Stakers</span>
            <span className="pool-stat-value">
              {vaultStats.totalStakers.toLocaleString()}
            </span>
          </div>
          <div className="pool-stat">
            <span className="pool-stat-label">Share price</span>
            <span className="pool-stat-value">
              {formatPoolEther(vaultStats.sharePrice, 4)}
            </span>
          </div>
        </div>
      )}

      {!walletAddress && (
        <div className="pool-tab-empty">
          Connect your wallet to view your pool position.
        </div>
      )}

      {walletAddress && !userStanding && !loading && (
        <div className="pool-tab-empty">
          <div className="pool-tab-empty-title">No position yet</div>
          <div className="pool-tab-empty-sub">
            Stake into the Beta Season Pool to appear here.
          </div>
        </div>
      )}

      {userStanding && (
        <div className="pool-card">
          <div className="pool-rank">
            <span className="pool-rank-hash">#</span>
            <span className="pool-rank-num">{userStanding.rank}</span>
            <span className="pool-rank-of">
              of {userStanding.total.toLocaleString()}
            </span>
          </div>
          <div className="pool-rows">
            <div className="pool-row">
              <span className="pool-row-label">Current value</span>
              <span className="pool-row-value">
                {formatPoolEther(userStanding.position.currentValue, 4)} T
              </span>
            </div>
            <div className="pool-row">
              <span className="pool-row-label">Net deposited</span>
              <span className="pool-row-value">
                {formatPoolEther(userStanding.position.netDeposited, 4)} T
              </span>
            </div>
            <div className="pool-row">
              <span className="pool-row-label">P&amp;L</span>
              <span
                className={
                  'pool-row-value ' +
                  (userStanding.position.pnl >= 0n
                    ? 'pool-pos'
                    : 'pool-neg')
                }
              >
                {userStanding.position.pnl >= 0n ? '+' : ''}
                {formatPoolEther(userStanding.position.pnl, 4)} T
              </span>
            </div>
            <div className="pool-row">
              <span className="pool-row-label">P&amp;L %</span>
              <span
                className={
                  'pool-row-value ' +
                  (userStanding.position.pnlPercent >= 0
                    ? 'pool-pos'
                    : 'pool-neg')
                }
              >
                {userStanding.position.pnlPercent >= 0 ? '+' : ''}
                {userStanding.position.pnlPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PoolTab
