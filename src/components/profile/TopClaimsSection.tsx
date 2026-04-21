import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Share2, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import type { TopClaim } from '@/hooks/useTopClaims'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { INTENTION_COLORS, intentionBadgeStyle } from '@/config/intentions'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import { formatEth } from '@/services/vaultTooltipService'
import type { PlatformVaultData } from '@/services/platformMarketService'
import IntentionTooltip from '../IntentionTooltip'
import PositionBoardDialog from './PositionBoardDialog'
import AtomDetailDialog from '../AtomDetailDialog'
import { TopClaimSkeleton } from './ProfileSkeletons'
import { useState } from 'react'
import { formatEther } from 'viem'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'

interface TopClaimsSectionProps {
  claims: TopClaim[]
  loading: boolean
  walletAddress?: string
  /** When true, skip platform positions (used for public profiles where we can't fetch other user's market data) */
  hideplatformPositions?: boolean
}

/** Map predicate label to intention display name */
function predicateToIntention(predLabel: string): string {
  const lower = predLabel.toLowerCase()
  if (lower.includes('work')) return 'Work'
  if (lower.includes('learning')) return 'Learning'
  if (lower.includes('fun')) return 'Fun'
  if (lower.includes('inspiration')) return 'Inspiration'
  if (lower.includes('buying')) return 'Buying'
  if (lower.includes('music')) return 'Music'
  if (lower === 'trusts') return 'Trusted'
  if (lower === 'distrust') return 'Distrust'
  return predLabel
}

function TopClaimCard({ claim, walletAddress }: { claim: TopClaim; walletAddress?: string }) {
  const intention = predicateToIntention(claim.predicateLabel)
  const color = INTENTION_COLORS[intention] ?? '#888'
  const totalMcap = formatEth(String(claim.totalMarketCap))
  const posCount = claim.stats.supportCount + claim.stats.opposeCount
  const [boardOpen, setBoardOpen] = useState(false)
  const domain = claim.objectUrl ? extractDomain(claim.objectUrl) : ''
  const favicon = domain ? getFaviconUrl(domain) : undefined

  return (
    <>
      <Card className="tc-card" style={{ cursor: 'pointer' }} onClick={() => setBoardOpen(true)}>
        <div className="tc-header">
          {favicon && (
            <img
              src={favicon}
              alt=""
              className="tc-favicon"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <span className="tc-title">{claim.objectLabel}</span>
        </div>

        <div className="tc-stats-row">
          <div className="tc-stat-block">
            <span className="tc-stat-value">{totalMcap} T</span>
          </div>
          <div className="tc-stat-block">
            <Users className="h-3 w-3" />
            <span className="tc-stat-value">{posCount}</span>
          </div>
          {claim.stats.userPnlPct !== null && (
            <div className={`tc-pnl ${claim.stats.userPnlPct >= 0 ? 'tc-pnl--up' : 'tc-pnl--down'}`}>
              {claim.stats.userPnlPct >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              <span className="tc-pnl-value">
                {claim.stats.userPnlPct >= 0 ? '+' : ''}{claim.stats.userPnlPct}%
              </span>
            </div>
          )}
        </div>

        <div className="tc-actions">
          <IntentionTooltip termId={claim.termId} color={color}>
            <span className="tc-badge" style={intentionBadgeStyle(color)}>
              {intention}
            </span>
          </IntentionTooltip>
          <Button
            variant="ghost"
            size="sm"
            className="ac-btn-icon"
            onClick={(e) => {
              e.stopPropagation()
              const text = `${claim.objectLabel} — ${intention}`
              const url = claim.objectUrl || ''
              const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
              window.open(tweetUrl, '_blank', 'noopener,noreferrer')
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      <PositionBoardDialog
        open={boardOpen}
        onOpenChange={setBoardOpen}
        termId={claim.termId}
        title={claim.objectLabel}
        favicon={favicon}
        intention={intention}
        intentionColor={color}
        walletAddress={walletAddress}
      />
    </>
  )
}

function formatMCap(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k T'
  if (num >= 1) return num.toFixed(2) + ' T'
  return '0 T'
}

function PlatformPositionCard({ market, walletAddress }: { market: PlatformVaultData; walletAddress?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const slug = ATOM_ID_TO_PLATFORM.get(market.termId) || ''

  return (
    <>
      <Card className="tc-card" style={{ cursor: 'pointer' }} onClick={() => setDialogOpen(true)}>
        <div className="tc-header">
          <img
            src={`/favicons/${slug}.png`}
            alt=""
            className="tc-favicon"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="tc-title">{market.label}</span>
        </div>

        <div className="tc-stats-row">
          <div className="tc-stat-block">
            <span className="tc-stat-value">{formatMCap(market.marketCap)}</span>
          </div>
          <div className="tc-stat-block">
            <Users className="h-3 w-3" />
            <span className="tc-stat-value">{market.positionCount}</span>
          </div>
          {market.userPnlPct !== null && (
            <div className={`tc-pnl ${market.userPnlPct >= 0 ? 'tc-pnl--up' : 'tc-pnl--down'}`}>
              {market.userPnlPct >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              <span className="tc-pnl-value">
                {market.userPnlPct >= 0 ? '+' : ''}{market.userPnlPct}%
              </span>
            </div>
          )}
        </div>

        <div className="tc-actions">
          <span className="tc-badge" style={intentionBadgeStyle('#10B981')}>
            Platform
          </span>
        </div>
      </Card>

      <AtomDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        market={market}
        platformName={market.label}
        favicon={`/favicons/${slug}.png`}
        walletAddress={walletAddress}
      />
    </>
  )
}

export default function TopClaimsSection({ claims, loading, walletAddress, hideplatformPositions }: TopClaimsSectionProps) {
  const { markets } = usePlatformMarket()

  // Get platforms where user has a position, sorted by PnL desc
  // Only shown for own profile (not public profiles)
  const topPlatforms = hideplatformPositions ? [] : markets
    .filter((m) => m.userPnlPct !== null)
    .sort((a, b) => (b.userPnlPct ?? 0) - (a.userPnlPct ?? 0))
    .slice(0, 4)

  if (loading) {
    return (
      <div className="tc-grid">
        {Array.from({ length: 4 }).map((_, i) => <TopClaimSkeleton key={i} />)}
      </div>
    )
  }

  const hasContent = claims.length > 0 || topPlatforms.length > 0
  if (!hasContent) return null

  return (
    <div className="tc-grid">
      {topPlatforms.map((market) => (
        <PlatformPositionCard key={market.termId} market={market} walletAddress={walletAddress} />
      ))}
      {claims.map((claim) => (
        <TopClaimCard key={claim.termId} claim={claim} walletAddress={walletAddress} />
      ))}
    </div>
  )
}
