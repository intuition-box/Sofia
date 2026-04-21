import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useSignals } from '@/hooks/useSignals'
import { useDomainTrending } from '@/hooks/useDomainTrending'
import { useDomainClaims } from '@/hooks/useDomainClaims'
import { useTopicCertifications } from '@/hooks/useTopicCertifications'
import { usePrefetchClaimDialogs } from '@/hooks/useClaimPositions'
import { useCart } from '@/hooks/useCart'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ThumbsUp, ThumbsDown, Plus, ExternalLink, Info } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import NicheDetailList from '@/components/profile/NicheDetailList'
import TrendingCard from '@/components/TrendingCard'
import PositionBoardDialog from '@/components/profile/PositionBoardDialog'
import ScoreExplanationDialog from '@/components/ScoreExplanationDialog'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/interest-page.css'

function formatMarketCap(value: bigint): string {
  const num = parseFloat(formatEther(value))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k T'
  if (num >= 1) return num.toFixed(2) + ' T'
  if (num >= 0.001) return num.toFixed(4) + ' T'
  return '0 ETH'
}

export default function InterestPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { user } = usePrivy()
  const { topicById } = useTaxonomy()
  const { getPlatformsByTopic } = usePlatformCatalog()
  const topic = topicId ? topicById(topicId) : undefined

  const { selectedTopics, selectedCategories, toggleCategory } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { signals, isFetching: signalsRefreshing } = useSignals(user?.wallet?.address)
  const scores = useReputationScores(getStatus, selectedTopics, selectedCategories, undefined, signals)
  const topicScore = scores?.topics.find((d) => d.topicId === topicId)

  const walletAddress = user?.wallet?.address
  const { items: trending, loading: trendingLoading } = useDomainTrending(topicId)
  const { claims, loading: claimsLoading } = useDomainClaims(topicId)
  const { certifications, loading: certsLoading } = useTopicCertifications(topicId, walletAddress)
  const cart = useCart()
  const [dialogClaim, setDialogClaim] = useState<typeof claims[number] | null>(null)
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)

  // Prefetch all claim dialog data so modals open instantly
  usePrefetchClaimDialogs(claims, walletAddress)

  const platforms = topicId ? getPlatformsByTopic(topicId) : []
  const connectedPlatforms = platforms.filter((p) => getStatus(p.id) === 'connected')

  const nicheCount = topic
    ? topic.categories.filter((c) => selectedCategories.includes(c.id)).length
    : 0

  if (!topic) {
    return (
      <div className="page-content page-enter">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
        </Button>
      </div>
    )
  }

  const color = topic.color
  const glow = `${color}66`

  return (
    <div>
      <PageHeader color={color} glow={glow} title={topic.label} subtitle="Interest overview" />
      <div className="ip-sections page-content page-enter">

        {/* Back */}
        <Button variant="ghost" size="sm" className="ip-back" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Button>

        {/* Stats */}
        <section className="ip-section">
          <h3 className="ip-section-title">Stats</h3>
          <div className="ip-stats-grid">
            <Card
              className="ip-stat-card ip-stat-card--clickable"
              role="button"
              tabIndex={0}
              onClick={() => setScoreDialogOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setScoreDialogOpen(true) }}
              aria-label="Explain score"
            >
              <span className="ip-stat-value" style={{ color }}>
                {topicScore?.score ?? 0}
                {signalsRefreshing && (
                  <span className="ip-stat-refresh" aria-label="Refreshing scores">&middot;&middot;&middot;</span>
                )}
              </span>
              <span className="ip-stat-label">
                Score
                <Info className="ip-stat-info" aria-hidden />
              </span>
            </Card>
            <Card className="ip-stat-card">
              <span className="ip-stat-value">{nicheCount}</span>
              <span className="ip-stat-label">Categories</span>
            </Card>
            <Card className="ip-stat-card">
              <span className="ip-stat-value">{connectedPlatforms.length}</span>
              <span className="ip-stat-label">Platforms</span>
            </Card>
            <Card className="ip-stat-card">
              <span className="ip-stat-value">{platforms.length}</span>
              <span className="ip-stat-label">Available</span>
            </Card>
          </div>
        </section>

        {/* Categories */}
        <section className="ip-section">
          <h3 className="ip-section-title">Categories ({nicheCount})</h3>
          <NicheDetailList
            topicId={topicId!}
            topicColor={color}
            selectedCategories={selectedCategories}
            nicheScores={topicScore?.topNiches ?? []}
            onToggleCategory={toggleCategory}
          />
        </section>

        {/* Trending Platforms */}
        <section className="ip-section">
          <h3 className="ip-section-title">Trending in {topic.label}</h3>
          {trendingLoading ? (
            <div className="ip-loader"><SofiaLoader size={48} /></div>
          ) : trending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trending platforms for this topic yet.</p>
          ) : (
            <div className="ip-trending-grid">
              {trending.map((platform) => (
                <TrendingCard
                  key={platform.platformDomain}
                  platform={platform}
                  domainLabel={topic.label}
                />
              ))}
            </div>
          )}
        </section>

        {/* Platforms */}
        <section className="ip-section">
          <h3 className="ip-section-title">Platforms ({connectedPlatforms.length}/{platforms.length})</h3>
          <div className="ip-platforms-grid">
            {connectedPlatforms.map((p) => (
              <Card key={p.id} className="ip-platform-card ip-platform-connected">
                <div className="ip-platform-header">
                  <img
                    src={`/favicons/${p.id}.png`}
                    alt=""
                    className="ip-platform-icon"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="ip-platform-name">{p.name}</span>
                </div>
                <span className="ip-platform-status ip-platform-on">Connected</span>
              </Card>
            ))}
            <Card className="ip-platform-add" onClick={() => navigate(`/profile/interest/${topicId}/platforms`)}>
              <Plus className="ip-platform-add-icon" />
              <span className="ip-platform-add-label">Connect</span>
            </Card>
            {Array.from({ length: Math.max(0, 11 - connectedPlatforms.length) }, (_, i) => (
              <div key={`skel-${i}`} className="ip-platform-skeleton">
                <span className="ip-skeleton-label">Connect platform</span>
              </div>
            ))}
          </div>
        </section>

        {/* Claims / Vote */}
        <section className="ip-section">
          <h3 className="ip-section-title">Claims</h3>
          {claimsLoading ? (
            <div className="ip-loader"><SofiaLoader size={48} /></div>
          ) : claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">No claims for this topic yet.</p>
          ) : (
            <div className="ip-claims-grid">
              {claims.map((c) => {
                const totalMcap = c.supportMarketCap + c.opposeMarketCap
                const totalPositions = c.supportCount + c.opposeCount
                const pct = totalMcap > 0n
                  ? Math.round(Number((c.supportMarketCap * 100n) / totalMcap))
                  : 50
                const title = `${c.subject} ${c.predicate} ${c.object}`
                const userVote = cart.items.find((ci) => ci.termId === c.termId)?.side
                  ?? cart.items.find((ci) => ci.termId === c.counterTermId)?.side
                const handleClaimVote = (type: 'support' | 'oppose') => {
                  const termId = type === 'support' ? c.termId : c.counterTermId
                  cart.addItem({
                    id: `${termId}-${type}`,
                    side: type,
                    termId,
                    intention: type === 'support' ? 'Support' : 'Oppose',
                    title,
                    favicon: '',
                    intentionColor: type === 'support' ? '#22C55E' : '#EF4444',
                  })
                }
                return (
                  <Card key={c.id} className="ip-claim-card" onClick={() => setDialogClaim(c)}>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{totalPositions} positions</Badge>
                      <span className="text-xs text-muted-foreground">{formatMarketCap(totalMcap)}</span>
                    </div>

                    <h2 className="ip-claim-title">{title}</h2>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: '#22C55E' }}>Support {pct}%</span>
                        <span style={{ color: '#EF4444' }}>Oppose {100 - pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        <div className="transition-all" style={{ width: `${pct}%`, backgroundColor: '#22C55E' }} />
                        <div style={{ backgroundColor: '#EF4444', flex: 1 }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatMarketCap(c.supportMarketCap)} · {c.supportCount}</span>
                        <span>{c.opposeCount} · {formatMarketCap(c.opposeMarketCap)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1"
                        variant="outline"
                        disabled={!!userVote && userVote !== 'support'}
                        style={userVote === 'support' ? { borderColor: '#22C55E', color: '#22C55E', background: 'rgba(34,197,94,0.1)' } : undefined}
                        onClick={(e) => { e.stopPropagation(); handleClaimVote('support') }}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {userVote === 'support' ? 'Supported' : 'Support'}
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        disabled={!!userVote && userVote !== 'oppose'}
                        style={userVote === 'oppose' ? { borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.1)' } : undefined}
                        onClick={(e) => { e.stopPropagation(); handleClaimVote('oppose') }}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        {userVote === 'oppose' ? 'Opposed' : 'Oppose'}
                      </Button>
                    </div>

                    {userVote && (
                      <p className="text-xs text-center text-muted-foreground">
                        Added to cart as {userVote}.
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* Claim detail dialog */}
          {dialogClaim && (
            <PositionBoardDialog
              open={!!dialogClaim}
              onOpenChange={(open) => { if (!open) setDialogClaim(null) }}
              termId={dialogClaim.termId}
              counterTermId={dialogClaim.counterTermId}
              title={`${dialogClaim.subject} ${dialogClaim.predicate} ${dialogClaim.object}`}
              favicon=""
              intention="Claim"
              intentionColor={topic?.color || '#8B5CF6'}
              walletAddress={walletAddress}
            />
          )}
        </section>

        {/* Certified in this topic */}
        <section className="ip-section">
          <h3 className="ip-section-title">Certified in {topic.label}</h3>
          {certsLoading ? (
            <div className="ip-loader"><SofiaLoader size={48} /></div>
          ) : certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certifications in this topic yet.</p>
          ) : (
            <div className="ip-certs-grid">
              {certifications.map((cert) => (
                <Card key={cert.termId} className="ip-cert-card">
                  <a href={`https://${cert.domain}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={cert.favicon}
                      alt=""
                      className="h-8 w-8 rounded-lg bg-muted hover:opacity-80 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cert.domain || cert.platformLabel}</p>
                    <p className="text-xs text-muted-foreground">{cert.intention}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">{cert.positionCount} holders</Badge>
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

      </div>

      <ScoreExplanationDialog
        open={scoreDialogOpen}
        onOpenChange={setScoreDialogOpen}
        topicLabel={topic.label}
        topicColor={color}
        explanation={topicScore?.explanation}
      />
    </div>
  )
}
