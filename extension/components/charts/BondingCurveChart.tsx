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

  const { currentPrice, priceChange, isLoading, error, userShares, marketCap, totalInvested, totalRedeemed } = useBondingCurveData(
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

  // P&L calculation: Total P&L = (current value + total redeemed) - total invested
  const totalInvestedNum = parseFloat(totalInvested || '0')
  const totalRedeemedNum = parseFloat(totalRedeemed || '0')
  const totalValue = positionValue + totalRedeemedNum
  const pnl = totalValue - totalInvestedNum

  return (
    <div className={`stake-chart-section ${className}`}>
      <div className="stake-chart-header">
        {/* Total Market Cap */}
        <div className="stake-chart-balance">
          <div className="stake-chart-balance-label">Total Market Cap</div>
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
            <span className="stake-chart-metric-label">Share Price</span>
            <span className="stake-chart-metric-value">{currentSharePrice.toFixed(4)}</span>
          </div>
          <div className="stake-chart-metric">
            <span className="stake-chart-metric-label">My Shares</span>
            <span className="stake-chart-metric-value">{userSharesNum.toFixed(2)}</span>
          </div>
          <div className="stake-chart-metric">
            <span className="stake-chart-metric-label">Current Value</span>
            <span className="stake-chart-metric-value">{positionValue.toFixed(4)}</span>
          </div>
          <div className="stake-chart-metric">
            <span className="stake-chart-metric-label">P&L</span>
            <span
              className="stake-chart-metric-value"
              style={{ color: pnl >= 0 ? '#10b981' : '#ef4444' }}
            >
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
