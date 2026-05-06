import { useAccountStats } from '../../hooks'
import '../styles/AccountStats.css'

interface AccountSignalsBadgeProps {
  walletAddress: string | undefined
  compact?: boolean
}

const AccountSignalsBadge = ({ walletAddress, compact = false }: AccountSignalsBadgeProps) => {
  const { signalsCreated, loading } = useAccountStats(walletAddress)

  if (!walletAddress) return null
  if (loading) return null

  return (
    <div className={`account-stats-container ${compact ? 'account-stats-compact' : ''}`}>
      <span className="account-stats-item">
        <span className="account-stats-label">Signals:</span>
        <span className="account-stats-value">{signalsCreated}</span>
      </span>
    </div>
  )
}

export default AccountSignalsBadge
