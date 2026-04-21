/**
 * FollowAccountCard - Reusable card component for displaying follow/trust accounts
 */

import { memo } from "react"
import Avatar from '../../../ui/Avatar'
import UserAtomStats from '../../../ui/UserAtomStats'
import type { FollowAccountVM } from '../../../../types/follows'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface FollowAccountCardProps {
  account: FollowAccountVM
  onClick?: () => void
  actions?: React.ReactNode
}

export const FollowAccountCard = memo(function FollowAccountCard({ account, onClick, actions }: FollowAccountCardProps) {
  return (
    <div
      className="followed-account-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="account-card-header">
        <Avatar
          imgSrc={account.image}
          name={account.label}
          size="medium"
        />
        <div className="account-card-info">
          <h4>{account.label}</h4>
          {account.meta?.url && (
            <p className="account-url">{account.meta.url}</p>
          )}
          {account.meta?.description && (
            <p className="account-description">{account.meta.description}</p>
          )}
        </div>
      </div>

      <div className="account-card-stats">
        {account.walletAddress && (
          <UserAtomStats termId={account.termId} accountAddress={account.walletAddress} />
        )}
      </div>

      <div className="account-card-meta">
        <div className="trust-info">
          <span className="trust-amount">
            {account.trustAmount.toFixed(3)} TRUST
          </span>
        </div>
        {actions && (
          <div className="account-card-actions" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
})
