/**
 * PoolTab — Beta Season Pool view inside ScorePage.
 *
 * Single card with three metrics (Current value, TVL, P&L) and the
 * deposit / redeem actions. Uses the same useGlobalStake store +
 * GlobalStakeModal as the rest of the app so state stays consistent.
 */

import { useState } from 'react'
import { formatUnits } from 'viem'
import { useGlobalStake, useWalletFromStorage } from '../../../hooks'
import GlobalStakeModal from '../../modals/GlobalStakeModal'
import '../../styles/PoolTab.css'

const PoolTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const {
    config: gsConfig,
    position: gsPosition,
    vaultStats: gsVaultStats,
  } = useGlobalStake()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'deposit' | 'redeem'>('deposit')

  const hasPosition = !!(gsPosition && gsPosition.shares > 0n)
  const fmt = (wei: bigint, d = 4) =>
    parseFloat(formatUnits(wei, 18)).toFixed(d)

  if (!gsConfig.enabled) {
    return (
      <div className="pool-tab">
        <div className="pool-tab-empty">
          The Beta Season Pool isn't active in this build.
        </div>
      </div>
    )
  }

  return (
    <div className="pool-tab">
      <div className="pool-card">
        <div className="pool-rows">
          <div className="pool-row">
            <span className="pool-row-label">Current value</span>
            <span className="pool-row-value">
              {!walletAddress
                ? '—'
                : gsPosition
                  ? `${fmt(gsPosition.currentValue)} TRUST`
                  : '—'}
            </span>
          </div>

          <div className="pool-row">
            <span className="pool-row-label">TVL</span>
            <span className="pool-row-value">
              {gsVaultStats ? `${fmt(gsVaultStats.tvl, 2)} TRUST` : '—'}
            </span>
          </div>

          <div className="pool-row">
            <span className="pool-row-label">P&amp;L</span>
            {gsPosition ? (
              <span
                className={
                  'pool-row-value ' +
                  (gsPosition.profitLoss >= 0n ? 'pool-pos' : 'pool-neg')
                }
              >
                {gsPosition.profitLoss >= 0n ? '+' : ''}
                {fmt(gsPosition.profitLoss)} TRUST
                {' · '}
                {gsPosition.profitLoss >= 0n ? '+' : ''}
                {gsPosition.profitPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="pool-row-value">—</span>
            )}
          </div>
        </div>

        <div className="pool-actions">
          <button
            type="button"
            className="pool-action-btn"
            onClick={() => {
              setModalMode('deposit')
              setModalOpen(true)
            }}
          >
            Add position
          </button>
          {hasPosition && (
            <button
              type="button"
              className="pool-action-btn pool-action-btn--redeem"
              onClick={() => {
                setModalMode('redeem')
                setModalOpen(true)
              }}
            >
              Redeem
            </button>
          )}
        </div>
      </div>

      <p className="pool-explainer">
        A shared vault that pays out as the protocol earns. Your share
        price grows over time, and P&amp;L tracks your gains versus
        what you've deposited.
      </p>

      <GlobalStakeModal
        isOpen={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

export default PoolTab
