import { useUserAtomStats } from '../../hooks'
import { createHookLogger } from '../../lib/utils/logger'
import SofiaLoader from './SofiaLoader'
import '../styles/AccountStats.css'

const logger = createHookLogger('UserAtomStats')

interface UserAtomStatsProps {
  termId: string | undefined
  accountAddress?: string
  compact?: boolean
  signalsCount?: number
  totalMarketCap?: string
}

/**
 * Component to display user atom statistics
 * Shows: Signals Created (Position Count), Total Market Cap
 * Can use pre-loaded data or fetch from GetAtomStats query
 */
const UserAtomStats = ({ termId, accountAddress, compact = false, signalsCount: preloadedSignals, totalMarketCap: preloadedMarketCap }: UserAtomStatsProps) => {
  const atomStats = useUserAtomStats(termId, accountAddress)
  
  // Use pre-loaded data if available, otherwise use query data
  const hasPreloadedData = preloadedSignals !== undefined && preloadedMarketCap !== undefined
  const isLoading = hasPreloadedData ? false : atomStats.loading
  const hasError = hasPreloadedData ? false : atomStats.error

  // Debug log
  logger.debug('UserAtomStats render', {
    termId,
    hasPreloadedData,
    preloadedSignals,
    preloadedMarketCap,
    isLoading,
    atomStatsPositionCount: atomStats.positionCount,
    atomStatsMarketCap: atomStats.totalMarketCap
  })

  if (!termId) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`account-stats-container ${compact ? 'account-stats-compact' : ''}`}>
        <SofiaLoader size={24} />
      </div>
    )
  }

  if (hasError) {
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

  const signalsCreated = hasPreloadedData ? preloadedSignals : atomStats.positionCount
  const totalMarketCap = formatMarketCap(hasPreloadedData ? preloadedMarketCap : atomStats.totalMarketCap)

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
