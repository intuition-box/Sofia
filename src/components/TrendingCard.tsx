import { useState, useCallback } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import { useClaimPositions } from '@/hooks/useClaimPositions'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { useCart } from '@/hooks/useCart'
import AtomDetailDialog from './AtomDetailDialog'
import type { TrendingPlatform } from '@/types'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'

function formatMCap(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.001) return num.toFixed(4)
  return '0'
}

function formatPrice(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1) return num.toFixed(4)
  if (num >= 0.0001) return num.toFixed(6)
  return num.toExponential(2)
}

interface TrendingCardProps {
  platform: TrendingPlatform
  domainLabel: string
}

export default function TrendingCard({ platform, domainLabel }: TrendingCardProps) {
  const [boardOpen, setBoardOpen] = useState(false)
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address ?? ''
  const { getMarketBySlug } = usePlatformMarket()
  const cart = useCart()

  const market = platform.platformSlug ? getMarketBySlug(platform.platformSlug) : undefined
  const atomTermId = market?.termId

  // Position board for the platform ATOM vault
  const { positions } = useClaimPositions(atomTermId, 3)

  const handleInvest = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (market) {
      cart.addItem({
        id: `invest-${market.termId}`,
        side: 'support',
        termId: market.termId,
        title: platform.platformName,
        intention: 'Invest',
        intentionColor: '#10B981',
        favicon: platform.favicon,
      })
    }
  }, [market, cart, platform])

  return (
    <>
      <Card className="ip-trending-card" onClick={() => atomTermId && setBoardOpen(true)}>
        <div className="ip-trending-header">
          <img
            src={platform.favicon}
            alt=""
            className="ip-trending-favicon"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="ip-trending-label">{platform.platformName}</span>
          {market?.userPnlPct != null && (
            <span
              className="ip-trending-pnl"
              style={{ color: market.userPnlPct >= 0 ? '#10B981' : '#EF4444' }}
            >
              {market.userPnlPct >= 0 ? '+' : ''}{market.userPnlPct}%
            </span>
          )}
        </div>
        <div className="ip-trending-meta">
          {platform.intentions.map(({ category, count, color }) => (
            <Badge
              key={category}
              variant="secondary"
              className="ip-trending-badge"
              style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
            >
              {category} {count}
            </Badge>
          ))}
          <span className="ip-trending-stat"><Users className="h-3 w-3" /> {platform.totalCertifiers}</span>
        </div>

        {/* Mini position board */}
        {positions.length > 0 && (
          <div className="ac-positions">
            {positions.map((pos, i) => {
              const isYou = walletAddress && pos.accountId.toLowerCase() === walletAddress.toLowerCase()
              return (
                <div key={pos.accountId} className={`ac-pos-row ${isYou ? 'ac-pos-row--you' : ''}`}>
                  <span className="ac-pos-rank">#{i + 1}</span>
                  <span className="ac-pos-label">{pos.label}</span>
                  {isYou && <span className="ac-pos-you">You</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Market metrics */}
        {market && (
          <div className="ip-trending-market">
            <div className="ip-trending-market-stats">
              <span className="ip-trending-market-stat">
                <DollarSign className="h-3 w-3" /> {formatMCap(market.marketCap)}
              </span>
              <span className="ip-trending-market-stat">
                <TrendingUp className="h-3 w-3" /> {formatPrice(market.sharePrice)}
              </span>
              <span className="ip-trending-market-stat">
                <Users className="h-3 w-3" /> {market.positionCount}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ip-trending-invest-btn"
              onClick={handleInvest}
            >
              <ShoppingCart className="h-3 w-3" /> Invest
            </Button>
          </div>
        )}
      </Card>

      {/* Atom detail dialog */}
      {market && (
        <AtomDetailDialog
          open={boardOpen}
          onOpenChange={setBoardOpen}
          market={market}
          platformName={platform.platformName}
          favicon={platform.favicon}
          walletAddress={walletAddress}
        />
      )}
    </>
  )
}
