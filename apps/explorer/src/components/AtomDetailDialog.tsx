/**
 * AtomDetailDialog — platform market detail modal opened from the
 * `/platforms` grid. Proto-aligned: kicker + Fraunces title with the
 * platform favicon in a white rounded container, KPI tiles, compact
 * holders leaderboard, primary Invest CTA that drops the platform
 * into the cart.
 */

import { useClaimPositions } from '@/hooks/useClaimPositions'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/hooks/useCart'
import type { PlatformVaultData } from '@/services/platformMarketService'
import { DollarSign, TrendingUp, Users, Coins, BarChart3, Hash, Trophy } from 'lucide-react'
import { formatEther } from 'viem'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import '@/components/styles/atom-detail-dialog.css'

interface AtomDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  market: PlatformVaultData
  platformName: string
  favicon: string
  walletAddress?: string
}

function formatEth(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k'
  if (num >= 1) return num.toFixed(4)
  if (num >= 0.001) return num.toFixed(6)
  return '0'
}

function formatMCap(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k'
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.001) return num.toFixed(4)
  return '0'
}

/** Gold/silver/bronze colouring for the top 3 rows. */
function rankClass(rank: number): string {
  if (rank === 1) return 'add-lb-rank-gold'
  if (rank === 2) return 'add-lb-rank-silver'
  if (rank === 3) return 'add-lb-rank-bronze'
  return ''
}

export default function AtomDetailDialog({
  open,
  onOpenChange,
  market,
  platformName,
  favicon,
  walletAddress,
}: AtomDetailDialogProps) {
  const { positions, loading: posLoading } = useClaimPositions(market.termId, 100)
  const cart = useCart()

  const userRank = walletAddress
    ? positions.findIndex((p) => p.accountId.toLowerCase() === walletAddress.toLowerCase()) + 1
    : 0

  const inCart = cart.items.some((c) => c.termId === market.termId)

  const handleInvest = () => {
    const item: CartItem = {
      id: `invest-${market.termId}`,
      side: 'support',
      termId: market.termId,
      title: platformName,
      intention: 'Invest',
      intentionColor: 'var(--ds-accent)',
      favicon,
    }
    cart.addItem(item)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="add-content">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="add-title">
              <span className="add-favicon-wrap">
                <img
                  src={favicon}
                  alt=""
                  className="add-favicon"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              </span>
              <div className="add-title-block">
                <span className="add-kicker">Platform market</span>
                <span className="add-title-name">{platformName}</span>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Market details for {platformName}
          </DialogDescription>
        </DialogHeader>

        {/* Metrics grid */}
        <div className="add-metrics">
          <div className="add-metric">
            <div className="add-metric-head">
              <DollarSign className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
              <span className="add-metric-label">Market cap</span>
            </div>
            <span className="add-metric-value">{formatMCap(market.marketCap)} T</span>
          </div>
          <div className="add-metric">
            <div className="add-metric-head">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: '#3b82f6' }} />
              <span className="add-metric-label">Share price</span>
            </div>
            <span className="add-metric-value">{formatEth(market.sharePrice)} T</span>
          </div>
          <div className="add-metric">
            <div className="add-metric-head">
              <Coins className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
              <span className="add-metric-label">Total shares</span>
            </div>
            <span className="add-metric-value">{formatEth(market.totalShares)}</span>
          </div>
          <div className="add-metric">
            <div className="add-metric-head">
              <Users className="h-3.5 w-3.5" style={{ color: '#a78bdb' }} />
              <span className="add-metric-label">Holders</span>
            </div>
            <span className="add-metric-value">{market.positionCount}</span>
          </div>
          {market.userPnlPct !== null && (
            <div className="add-metric">
              <div className="add-metric-head">
                <BarChart3
                  className="h-3.5 w-3.5"
                  style={{ color: market.userPnlPct >= 0 ? '#22c55e' : '#ef4444' }}
                />
                <span className="add-metric-label">Your P&L</span>
              </div>
              <span
                className="add-metric-value"
                style={{ color: market.userPnlPct >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {market.userPnlPct >= 0 ? '+' : ''}
                {market.userPnlPct}%
              </span>
            </div>
          )}
          {userRank > 0 && (
            <div className="add-metric">
              <div className="add-metric-head">
                <Hash className="h-3.5 w-3.5" style={{ color: 'var(--ds-accent)' }} />
                <span className="add-metric-label">Your rank</span>
              </div>
              <span className="add-metric-value">#{userRank}</span>
            </div>
          )}
        </div>

        {/* Holders leaderboard */}
        <div className="add-leaderboard">
          <div className="add-lb-title">
            <Trophy className="h-3.5 w-3.5" />
            Top holders
          </div>
          <div className="add-lb-header">
            <span className="add-lb-col-rank">#</span>
            <span>User</span>
            <span className="add-lb-col-shares">Shares</span>
          </div>
          {posLoading ? (
            <div className="add-lb-empty">Loading holders…</div>
          ) : positions.length === 0 ? (
            <div className="add-lb-empty">No holders yet — be first.</div>
          ) : (
            <div className="add-lb-rows">
              {positions.map((pos, i) => {
                const rank = i + 1
                const isYou =
                  walletAddress &&
                  pos.accountId.toLowerCase() === walletAddress.toLowerCase()
                return (
                  <div
                    key={`${pos.accountId}-${pos.curveId}`}
                    className={`add-lb-row${isYou ? ' add-lb-row--you' : ''}`}
                  >
                    <span className={`add-lb-col-rank ${rankClass(rank)}`}>{rank}</span>
                    <span className="add-lb-col-user">
                      {pos.label}
                      {isYou ? <span className="add-you-tag">you</span> : null}
                    </span>
                    <span className="add-lb-col-shares">{formatEth(pos.shares)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Invest action */}
        <div className="add-actions">
          {!walletAddress ? (
            <div className="add-no-wallet">Connect a wallet to invest</div>
          ) : (
            <button
              type="button"
              className="add-btn-invest"
              onClick={handleInvest}
              disabled={inCart}
            >
              <TrendingUp className="h-4 w-4" />
              {inCart ? 'Added to cart' : `Invest in ${platformName}`}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
