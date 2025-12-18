import { useBondingCurveData } from '../../hooks/useBondingCurveData'
import type { CurveType, TimeRange } from '../../types/bonding-curve'

interface BondingCurveChartProps {
  tripleId: string
  curveId: CurveType
  walletAddress?: string
  className?: string
}

function formatPrice(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M TRUST`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K TRUST`
  }
  return `${value.toFixed(2)} TRUST`
}

export function BondingCurveChart({
  tripleId,
  curveId,
  walletAddress = '',
  className = ''
}: BondingCurveChartProps) {
  const timeRange: TimeRange = 'all'

  const { currentPrice, priceChange, isLoading, error, userShares, marketCap } = useBondingCurveData(
    tripleId,
    curveId,
    walletAddress,
    timeRange
  )

  if (isLoading) {
    return (
      <div className={`stake-chart-section ${className}`}>
        <div className="stake-chart-loading">Loading data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`stake-chart-section ${className}`}>
        <div className="stake-chart-error">Error loading data</div>
      </div>
    )
  }

  // Calculate metrics for display
  const totalBalanceWei = BigInt(marketCap || '0')
  const totalBalance = totalBalanceWei > 0n
    ? parseFloat((Number(totalBalanceWei) / 1e18).toFixed(4))
    : 0

  const currentSharePrice = parseFloat(currentPrice || '0')
  const userSharesNum = parseFloat(userShares || '0')
  const positionValue = userSharesNum * currentSharePrice

  const totalEarned = positionValue - (userSharesNum * 1.0) // Assuming initial price was 1.0
  const profitPercentage = userSharesNum > 0 ? ((totalEarned / (userSharesNum * 1.0)) * 100) : 0

  return (
    <div className={`stake-chart-section ${className}`}>
      <div className="stake-chart-header">
        {/* Total Balance comme dans l'exemple */}
        <div className="stake-chart-balance">
          <div className="stake-chart-balance-label">Total balance</div>
          <div className="stake-chart-balance-value">
            {formatPrice(totalBalance)}
            <span className={`stake-chart-balance-change ${priceChange?.isPositive ? 'positive' : 'negative'}`}>
              {priceChange?.percentage || '+0%'}
            </span>
          </div>
        </div>

        {/* Métriques détaillées en ligne */}
        <div className="stake-chart-metrics">
          <div className="stake-chart-metric">
            <span className="stake-chart-metric-label">Total Invested</span>
            <span className="stake-chart-metric-value">{(userSharesNum * 1.0).toFixed(2)}</span>
          </div>
          <div className="stake-chart-metric">
            <span className="stake-chart-metric-label">Total Earned</span>
            <span className="stake-chart-metric-value">{totalEarned.toFixed(2)}</span>
          </div>
          <div className="stake-chart-metric">
            <span className="stake-chart-metric-label">24h profit</span>
            <span className="stake-chart-metric-value">{profitPercentage.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
