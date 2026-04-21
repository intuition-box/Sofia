/**
 * AtomDetailDialog — detail view for a platform atom vault.
 * Shows: Market Cap, Share Price, Total Shares, Holders leaderboard,
 * user PnL/Rank/Shares, and Invest button.
 */

import { useEffect } from 'react'
import { useClaimPositions } from '@/hooks/useClaimPositions'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/hooks/useCart'
import type { PlatformVaultData } from '@/services/platformMarketService'
import { DollarSign, TrendingUp, Users, Coins, BarChart3, Hash } from 'lucide-react'
import { Button } from './ui/button'
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
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k T'
  if (num >= 1) return num.toFixed(2) + ' T'
  if (num >= 0.001) return num.toFixed(4) + ' T'
  return '0 T'
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
      intentionColor: '#10B981',
      favicon,
    }
    cart.addItem(item)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="add-content">
        <DialogHeader>
          <DialogTitle className="add-title">
            <img
              src={favicon}
              alt=""
              className="add-favicon"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            {platformName}
          </DialogTitle>
          <DialogDescription className="sr-only">Market details for {platformName}</DialogDescription>
        </DialogHeader>

        {/* Metrics grid */}
        <div className="add-metrics">
          <div className="add-metric">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            <span className="add-metric-label">Market Cap</span>
            <span className="add-metric-value">{formatMCap(market.marketCap)}</span>
          </div>
          <div className="add-metric">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span className="add-metric-label">Share Price</span>
            <span className="add-metric-value">{formatEth(market.sharePrice)} T</span>
          </div>
          <div className="add-metric">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span className="add-metric-label">Total Shares</span>
            <span className="add-metric-value">{formatEth(market.totalShares)}</span>
          </div>
          <div className="add-metric">
            <Users className="h-3.5 w-3.5 text-purple-500" />
            <span className="add-metric-label">Holders</span>
            <span className="add-metric-value">{market.positionCount}</span>
          </div>
          {market.userPnlPct !== null && (
            <div className="add-metric">
              <BarChart3 className="h-3.5 w-3.5" style={{ color: market.userPnlPct >= 0 ? '#22C55E' : '#EF4444' }} />
              <span className="add-metric-label">Your P&L</span>
              <span className="add-metric-value" style={{ color: market.userPnlPct >= 0 ? '#22C55E' : '#EF4444' }}>
                {market.userPnlPct >= 0 ? '+' : ''}{market.userPnlPct}%
              </span>
            </div>
          )}
          {userRank > 0 && (
            <div className="add-metric">
              <Hash className="h-3.5 w-3.5 text-primary" />
              <span className="add-metric-label">Your Rank</span>
              <span className="add-metric-value add-rank-value">#{userRank}</span>
            </div>
          )}
        </div>

        {/* Holders leaderboard */}
        <div className="add-leaderboard">
          <div className="add-lb-title">
            <Users className="h-3.5 w-3.5" /> Holders
          </div>
          <div className="add-lb-header">
            <span className="add-lb-col-rank">#</span>
            <span className="add-lb-col-user">User</span>
            <span className="add-lb-col-shares">Shares</span>
          </div>
          {posLoading ? (
            <div className="add-lb-empty">Loading...</div>
          ) : positions.length === 0 ? (
            <div className="add-lb-empty">No holders yet</div>
          ) : (
            <div className="add-lb-rows">
              {positions.map((pos, i) => {
                const isYou = walletAddress && pos.accountId.toLowerCase() === walletAddress.toLowerCase()
                return (
                  <div key={`${pos.accountId}-${pos.curveId}`} className={`add-lb-row ${isYou ? 'add-lb-row--you' : ''}`}>
                    <span className={`add-lb-col-rank ${i === 0 ? 'add-lb-rank-gold' : ''}`}>{i + 1}</span>
                    <span className="add-lb-col-user">
                      {pos.label}
                      {isYou && <span className="add-you-tag">YOU</span>}
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
            <Button
              className="add-btn-invest"
              onClick={handleInvest}
              disabled={inCart}
            >
              <TrendingUp className="h-4 w-4" />
              {inCart ? 'Added to cart' : 'Invest in ' + platformName}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
