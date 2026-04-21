import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Share2, ExternalLink, Users, TrendingUp, TrendingDown } from 'lucide-react'
import IntentionTooltip from '../IntentionTooltip'
import PositionBoardDialog from './PositionBoardDialog'
import type { CircleItem } from '@/services/circleService'
import { INTENTION_COLORS, intentionBadgeStyle } from '@/config/intentions'
import { timeAgo } from '@/utils/formatting'
import { fetchVaultStats, formatEth } from '@/services/vaultTooltipService'

const INTENTION_VERB: Record<string, string> = {}

interface ActivityCardProps {
  item: CircleItem
  walletAddress?: string
}

export default function ActivityCard({ item, walletAddress }: ActivityCardProps) {
  const [boardOpen, setBoardOpen] = useState(false)

  // Get termId from first intention for position board
  const firstIntent = item.intentions.find((i) => item.intentionVaults[i]?.termId)
  const termId = firstIntent ? item.intentionVaults[firstIntent]?.termId : undefined

  const { data: stats } = useQuery({
    queryKey: ['vaultStats', termId],
    queryFn: () => fetchVaultStats(termId!, walletAddress || ''),
    enabled: !!termId,
    staleTime: 120_000,
  })

  const handleShare = useCallback(() => {
    const text = `${item.title} — ${item.intentions.join(', ')}`
    const url = item.url || ''
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
  }, [item])

  return (
    <>
      <Card
        className="ac-card"
        style={{ cursor: termId ? 'pointer' : undefined }}
        onClick={() => termId && setBoardOpen(true)}
      >
        {/* Header: favicon + title + time */}
        <div className="ac-header">
          <div className="ac-header-left">
            <img
              src={item.favicon}
              alt=""
              className="ac-favicon"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="ac-title">{item.title}</span>
          </div>
          <span className="ac-time">{timeAgo(item.timestamp)}</span>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="tc-stats-row">
            <div className="tc-stat-block">
              <span className="tc-stat-value">{formatEth(String(BigInt(stats.supportMarketCap) + BigInt(stats.opposeMarketCap)))} T</span>
            </div>
            <div className="tc-stat-block">
              <Users className="h-3 w-3" />
              <span className="tc-stat-value">{stats.supportCount + stats.opposeCount}</span>
            </div>
            {stats.userPnlPct !== null && (
              <div className={`tc-pnl ${stats.userPnlPct >= 0 ? 'tc-pnl--up' : 'tc-pnl--down'}`}>
                {stats.userPnlPct >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                <span className="tc-pnl-value">
                  {stats.userPnlPct >= 0 ? '+' : ''}{stats.userPnlPct}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions: badges + Add Value + Share + Link */}
        <div className="ac-actions">
          {item.intentions.map((intent) => {
            const verb = INTENTION_VERB[intent] ?? ''
            const color = INTENTION_COLORS[intent] ?? 'var(--foreground)'
            return (
              <IntentionTooltip key={intent} termId={item.intentionVaults[intent]?.termId} color={color}>
                <span className="ac-badge" style={intentionBadgeStyle(color)}>
                  {verb ? `${verb} ` : ''}{intent}
                </span>
              </IntentionTooltip>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            className="ac-btn-icon"
            onClick={(e) => { e.stopPropagation(); handleShare() }}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          {item.url && (
            <Button
              variant="ghost"
              size="sm"
              className="ac-btn-icon"
              style={{ marginLeft: 'auto' }}
              onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank', 'noopener,noreferrer') }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </Card>

      {/* Dialog — data prefetched on mount */}
      {termId && (
        <PositionBoardDialog
          open={boardOpen}
          onOpenChange={setBoardOpen}
          termId={termId}
          counterTermId={item.intentionVaults[firstIntent!]?.counterTermId}
          title={item.title}
          favicon={item.favicon}
          intention={firstIntent!}
          intentionColor={INTENTION_COLORS[firstIntent!] ?? 'var(--foreground)'}
          walletAddress={walletAddress}
        />
      )}
    </>
  )
}
