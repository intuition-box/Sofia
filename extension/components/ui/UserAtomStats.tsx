import { useUserAtomStats } from '../../hooks/useUserAtomStats'
import '../styles/AccountStats.css'

interface UserAtomStatsProps {
  termId: string | undefined
  accountAddress?: string
  compact?: boolean
}

/**
 * Component to display user atom statistics using the correct GetAtomStats query
 * Shows: Signals Created (Position Count), Total Market Cap
 */
const UserAtomStats = ({ termId, accountAddress, compact = false }: UserAtomStatsProps) => {
  const atomStats = useUserAtomStats(termId, accountAddress)

  if (!termId) {
    return null
  }

  if (atomStats.loading) {
    return (
      <div className={`account-stats-container ${compact ? 'account-stats-compact' : ''}`}>
        <span className="account-stats-loading-text">Loading...</span>
      </div>
    )
  }

  if (atomStats.error) {
    return null
  }

  // Format market cap from Wei to readable format
  const formatMarketCap = (value: string): string => {
    const num = parseFloat(value) / 1e18
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(3)
  }

  const signalsCreated = atomStats.positionCount
  const totalMarketCap = formatMarketCap(atomStats.totalMarketCap)

  return (
    <div className={`account-stats-container ${compact ? 'account-stats-compact' : ''}`}>
      <span className="account-stats-item">
        <span className="account-stats-label">Signals:</span>
        <span className="account-stats-value">{signalsCreated}</span>
      </span>
      <span className="account-stats-separator">•</span>
      <span className="account-stats-item">
        <span className="account-stats-label">Market Cap:</span>
        <span className="account-stats-value">{totalMarketCap}</span>
      </span>
    </div>
  )
}

export default UserAtomStats
