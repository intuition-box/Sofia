import { useAccountStats } from '../../hooks/useAccountStats'
import '../styles/AccountStats.css'

interface AccountStatsProps {
  accountAddress: string | undefined
  compact?: boolean
}

/**
 * Component to display account statistics
 * Shows: Signals Created, Total Market Cap
 */
const AccountStats = ({ accountAddress, compact = false }: AccountStatsProps) => {
  const { signalsCreated, totalMarketCap, loading } = useAccountStats(accountAddress)

  if (!accountAddress) {
    return null
  }

  if (loading) {
    return (
      <div className={`account-stats-container ${compact ? 'account-stats-compact' : ''}`}>
        <span className="account-stats-loading-text">Loading stats...</span>
      </div>
    )
  }

  return (
    <div className={`account-stats-container ${compact ? 'account-stats-compact' : ''}`}>
      <span className="account-stats-item">
        <span className="account-stats-label">Signals:</span>
        <span className="account-stats-value">{signalsCreated}</span>
      </span>
      <span className="account-stats-separator">•</span>
      <span className="account-stats-item">
        <span className="account-stats-label">Market Cap:</span>
        <span className="account-stats-value">{totalMarketCap.toFixed(3)}</span>
      </span>
    </div>
  )
}

export default AccountStats
