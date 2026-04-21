import { useClaimPositions } from '@/hooks/useClaimPositions'
import { useVaultTooltip, formatEth } from '@/hooks/useVaultTooltip'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/hooks/useCart'
import { intentionBadgeStyle } from '@/config/intentions'
import { useEffect } from 'react'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import '@/components/styles/position-board-dialog.css'

interface PositionBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  termId: string
  counterTermId?: string
  title: string
  favicon: string
  intention: string
  intentionColor: string
  walletAddress?: string
}

export default function PositionBoardDialog({
  open,
  onOpenChange,
  termId,
  counterTermId,
  title,
  favicon,
  intention,
  intentionColor,
  walletAddress,
}: PositionBoardDialogProps) {
  // Prefetch data on mount — no need to wait for open
  const { positions: supportPositions, loading: supportPosLoading } = useClaimPositions(termId, 100)
  const { positions: opposePositions, loading: opposePosLoading } = useClaimPositions(counterTermId, 100)
  const { stats, loading: statsLoading, fetchStats } = useVaultTooltip()

  useEffect(() => {
    if (termId) fetchStats(termId)
  }, [termId, fetchStats])

  const cart = useCart()

  const userRank = walletAddress
    ? supportPositions.findIndex((p) => p.accountId.toLowerCase() === walletAddress.toLowerCase()) + 1
    : 0

  // On-chain position
  const hasOnChainSupport = userRank > 0
  // In cart
  const inCartSupport = cart.items.some((c) => c.termId === termId && c.side === 'support')
  const inCartOppose = !!(counterTermId && cart.items.some((c) => c.termId === counterTermId && c.side === 'oppose'))

  // Determine which side the user is on (on-chain or cart)
  const userSide = (hasOnChainSupport || inCartSupport) ? 'support' as const
    : inCartOppose ? 'oppose' as const
    : null

  const handleDeposit = (side: 'support' | 'oppose') => {
    const id = side === 'support' ? termId : counterTermId
    if (!id) return
    const item: CartItem = {
      id: `${id}-${side}`,
      side,
      termId: id,
      intention,
      title,
      favicon,
      intentionColor,
    }
    cart.addItem(item)
  }

  const isLoading = supportPosLoading || opposePosLoading || (statsLoading && !stats)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pbd-content">
        <DialogHeader>
          <DialogTitle className="pbd-title">
            <img
              src={favicon}
              alt=""
              className="pbd-favicon"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            {title}
            <span className="pbd-badge" style={intentionBadgeStyle(intentionColor)}>
              {intention}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">Position leaderboard for {title}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          /* ── Skeleton ── */
          <div className="pbd-skeleton">
            <div className="pbd-sk-metrics">
              <div className="pbd-sk-box pbd-sk-metric" />
              <div className="pbd-sk-box pbd-sk-metric" />
            </div>
            <div className="pbd-sk-table">
              <div className="pbd-sk-box pbd-sk-table-header" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="pbd-sk-row">
                  <div className="pbd-sk-box pbd-sk-rank" />
                  <div className="pbd-sk-box pbd-sk-user" />
                  <div className="pbd-sk-box pbd-sk-shares" />
                </div>
              ))}
            </div>
            <div className="pbd-sk-actions">
              <div className="pbd-sk-box pbd-sk-btn" />
              <div className="pbd-sk-box pbd-sk-btn" />
            </div>
          </div>
        ) : (
          <>
            {/* Metrics */}
            {stats && (
              <div className="pbd-metrics">
                <div className="pbd-metric">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="pbd-metric-label">Support</span>
                  <span className="pbd-metric-value">
                    <Users className="h-3 w-3" /> {stats.supportCount}
                  </span>
                  <span className="pbd-metric-value">{formatEth(stats.supportMarketCap)} T</span>
                </div>
                <div className="pbd-metric">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  <span className="pbd-metric-label">Oppose</span>
                  <span className="pbd-metric-value">
                    <Users className="h-3 w-3" /> {stats.opposeCount}
                  </span>
                  <span className="pbd-metric-value">{formatEth(stats.opposeMarketCap)} T</span>
                </div>
                {stats.userPnlPct !== null && (
                  <div className="pbd-metric pbd-metric--pnl">
                    <span className="pbd-metric-label">Your P&L</span>
                    <span
                      className="pbd-pnl-value"
                      style={{ color: stats.userPnlPct >= 0 ? '#22C55E' : '#EF4444' }}
                    >
                      {stats.userPnlPct >= 0 ? '+' : ''}{stats.userPnlPct}%
                    </span>
                  </div>
                )}
                {userRank > 0 && (
                  <div className="pbd-metric pbd-metric--rank">
                    <span className="pbd-metric-label">Your Rank</span>
                    <span className="pbd-rank-value">#{userRank}</span>
                  </div>
                )}
              </div>
            )}

            {/* Dual Leaderboards */}
            <div className="pbd-dual-boards">
              {/* Support leaderboard */}
              <div className="pbd-leaderboard">
                <div className="pbd-lb-section-title" style={{ color: '#86EFAC' }}>
                  <TrendingUp className="h-3.5 w-3.5" /> Support
                </div>
                <div className="pbd-lb-header">
                  <span className="pbd-lb-col-rank">#</span>
                  <span className="pbd-lb-col-user">User</span>
                  <span className="pbd-lb-col-shares">Shares</span>
                </div>
                {supportPositions.length === 0 ? (
                  <div className="pbd-lb-empty">No positions yet</div>
                ) : (
                  <div className="pbd-lb-rows">
                    {supportPositions.map((pos, i) => {
                      const isYou = walletAddress && pos.accountId.toLowerCase() === walletAddress.toLowerCase()
                      return (
                        <div key={`${pos.accountId}-${pos.curveId}`} className={`pbd-lb-row ${isYou ? 'pbd-lb-row--you' : ''}`}>
                          <span className={`pbd-lb-col-rank ${i === 0 ? 'pbd-lb-rank-gold' : ''}`}>{i + 1}</span>
                          <span className="pbd-lb-col-user">
                            {pos.label}
                                                        <span className={`pbd-curve-badge ${pos.curveId === 2 ? 'pbd-curve-badge--exp' : ''}`}>
                              {pos.curveId === 1 ? 'Linear' : 'Expo'}
                            </span>
                          </span>
                          <span className="pbd-lb-col-shares">{formatEth(pos.shares)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Oppose leaderboard */}
              <div className="pbd-leaderboard">
                <div className="pbd-lb-section-title" style={{ color: '#FCA5A5' }}>
                  <TrendingDown className="h-3.5 w-3.5" /> Oppose
                </div>
                <div className="pbd-lb-header">
                  <span className="pbd-lb-col-rank">#</span>
                  <span className="pbd-lb-col-user">User</span>
                  <span className="pbd-lb-col-shares">Shares</span>
                </div>
                {opposePositions.length === 0 ? (
                  <div className="pbd-lb-empty">No positions yet</div>
                ) : (
                  <div className="pbd-lb-rows">
                    {opposePositions.map((pos, i) => {
                      const isYou = walletAddress && pos.accountId.toLowerCase() === walletAddress.toLowerCase()
                      return (
                        <div key={`${pos.accountId}-${pos.curveId}`} className={`pbd-lb-row ${isYou ? 'pbd-lb-row--you' : ''}`}>
                          <span className={`pbd-lb-col-rank ${i === 0 ? 'pbd-lb-rank-gold' : ''}`}>{i + 1}</span>
                          <span className="pbd-lb-col-user">
                            {pos.label}
                                                        <span className={`pbd-curve-badge ${pos.curveId === 2 ? 'pbd-curve-badge--exp' : ''}`}>
                              {pos.curveId === 1 ? 'Linear' : 'Expo'}
                            </span>
                          </span>
                          <span className="pbd-lb-col-shares">{formatEth(pos.shares)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Support / Oppose actions */}
            <div className="pbd-actions">
              {!walletAddress ? (
                <div className="pbd-no-wallet">Connect a wallet to interact</div>
              ) : (
                <>
                  <Button
                    className="pbd-btn-support"
                    disabled={userSide === 'oppose'}
                    onClick={() => handleDeposit('support')}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {inCartSupport ? 'Support added' : hasOnChainSupport ? 'Supported' : 'Support'}
                  </Button>
                  <Button
                    className="pbd-btn-oppose"
                    disabled={!counterTermId || userSide === 'support'}
                    onClick={() => handleDeposit('oppose')}
                  >
                    <TrendingDown className="h-4 w-4" />
                    {inCartOppose ? 'Oppose added' : 'Oppose'}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
