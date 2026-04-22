import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useEnsNames } from '../hooks/useEnsNames'
import { useDiscoveryScore } from '../hooks/useDiscoveryScore'
import { useTopicSelection } from '../hooks/useDomainSelection'
import { usePlatformConnections } from '../hooks/usePlatformConnections'
import { useReputationScores } from '../hooks/useReputationScores'
import { useSignals } from '../hooks/useSignals'
import { useShareProfile } from '../hooks/useShareProfile'
import { useTrustScore } from '../hooks/useTrustScore'
import { useTaxonomy } from '../hooks/useTaxonomy'
import { useUserActivity } from '../hooks/useUserActivity'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import ShareProfileModal from './profile/ShareProfileModal'
import { getTopicEmoji } from '@/config/topicEmoji'
import { getIntentionColor } from '@/config/intentions'
import { timeAgo, extractDomain } from '@/utils/formatting'
import type { Address } from 'viem'
import './styles/profile-drawer.css'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// ── Pie chart helper ───────────────────────────────────────────────────
// Proto renderTopicPie ported to React (profileDrawer.ts:57-86).

interface TopicPieSlice {
  id: string
  label: string
  emoji: string
  color: string
  score: number
}

function TopicScorePie({ slices }: { slices: TopicPieSlice[] }) {
  const total = slices.reduce((a, s) => a + s.score, 0)
  const r = 50
  const C = 2 * Math.PI * r
  let cursor = 0

  return (
    <div className="pd-ts-pie-wrap">
      <svg className="pd-ts-pie" viewBox="0 0 120 120" aria-hidden="true">
        {slices.map((t) => {
          const pct = total > 0 ? t.score / total : 0
          const sliceLen = pct * C
          const rest = C - sliceLen
          const startDeg = -90 + (total > 0 ? (cursor / total) * 360 : 0)
          cursor += t.score
          return (
            <circle
              key={t.id}
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={t.color}
              strokeWidth={14}
              strokeDasharray={`${sliceLen.toFixed(2)} ${rest.toFixed(2)}`}
              transform={`rotate(${startDeg.toFixed(2)} 60 60)`}
            />
          )
        })}
        <circle cx={60} cy={60} r={36} fill="var(--ds-card)" />
      </svg>
      <div className="pd-ts-pie-center">
        <span className="pd-ts-pie-value">{Math.round(total)}</span>
        <span className="pd-ts-pie-label">total</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function ProfileDrawer({ isOpen }: ProfileDrawerProps) {
  const navigate = useNavigate()
  const { authenticated, user } = usePrivy()
  const address = user?.wallet?.address ?? ''
  const { getDisplay, getAvatar } = useEnsNames(address ? [address as Address] : [])
  const { stats } = useDiscoveryScore(address || undefined)
  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus, connectedCount } = usePlatformConnections()
  const { score: trustScore } = useTrustScore(address || undefined)
  const { signals } = useSignals(address || undefined)
  const scores = useReputationScores(getStatus, selectedTopics, selectedCategories, trustScore, signals)
  const topicScores = scores?.topics ?? []
  const { topicById } = useTaxonomy()
  const { items: activityItems } = useUserActivity(address || undefined)

  // Last Activity — restrict to support/oppose events for now (items whose
  // predicate resolved to Trusted or Distrusted). Sorted newest-first, top 10.
  const lastActivity = activityItems
    .filter((it) =>
      it.intentions.some((i) => i === 'Trusted' || i === 'Distrusted'),
    )
    .slice(0, 10)

  const {
    isModalOpen,
    openShareModal,
    closeShareModal,
    shareUrl,
    ogImageUrl,
    isLoading: shareLoading,
    error: shareError,
    handleCopyLink,
    handleShareOnX,
    copied,
  } = useShareProfile({
    walletAddress: address,
    topicScores,
    connectedCount,
    totalCertifications: stats?.totalCertifications ?? 0,
  })

  if (!authenticated) return null

  const displayName = address ? getDisplay(address as Address) : ''
  const avatar = address ? getAvatar(address as Address) : ''
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const initials = (displayName || address).slice(0, 2).toUpperCase()

  const pieSlices: TopicPieSlice[] = selectedTopics
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const scoreEntry = topicScores.find((s) => s.topicId === id)
      return {
        id,
        label: topic.label,
        emoji: getTopicEmoji(id) || '📌',
        color: topic.color ?? getIntentionColor('inspiration'),
        score: Math.round(scoreEntry?.score ?? 0),
      }
    })
    .filter((x): x is TopicPieSlice => x !== null && x.score > 0)

  // Rough percentile from trustScore (0-100). Falls back to 'Top 50%' when unknown.
  const percentileLabel = trustScore != null
    ? `Top ${Math.max(1, Math.round(100 - trustScore))}% · View details`
    : 'View details'

  return (
    <>
      <aside className={`fixed right-0 overflow-hidden pd-aside ${isOpen ? 'pd-open' : ''}`}>
        <div className="flex flex-col h-full overflow-y-auto">

          {/* Banner — avatar + name + share */}
          <div className="pd-banner">
            <Avatar className="pd-avatar border-2 border-border shadow-lg">
              {avatar && <AvatarImage src={avatar} alt={displayName} />}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="pd-name-wrap">
              <p className="pd-name">{displayName}</p>
              <p className="pd-address">{shortAddr}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={openShareModal}
              disabled={shareLoading}
              className="pd-share-btn"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {shareLoading ? 'Sharing...' : 'Share on X'}
            </Button>
          </div>

          {/* Topic Score pie chart */}
          <div className="pd-topic-score">
            <span className="pd-section-title">Score</span>
            {pieSlices.length > 0 ? (
              <>
                <TopicScorePie slices={pieSlices} />
                <div className="pd-ts-legend">
                  {pieSlices.map((t) => (
                    <span
                      key={t.id}
                      className="pd-ts-legend-item"
                      style={{ ['--slice-color' as string]: t.color }}
                    >
                      <span className="pd-ts-legend-dot" />
                      <span className="pd-ts-legend-label">{t.emoji} {t.label}</span>
                      <span className="pd-ts-legend-val">{t.score}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="pd-ts-empty">Pick topics to see your score breakdown.</p>
            )}
          </div>

          <button
            type="button"
            className="pd-ts-view-btn"
            onClick={() => navigate('/profile/scores')}
          >
            <span>{percentileLabel}</span>
            <span className="pd-ts-view-arrow">→</span>
          </button>

          {/* Discovery badges */}
          {stats && (
            <div className="pd-section">
              <p className="pd-section-title">Discovery</p>
              <div className="pd-badge-row">
                {[
                  { label: 'Pioneer', value: stats.pioneerCount, icon: '/badges/pioneer.png', color: '#e4b95a' },
                  { label: 'Explorer', value: stats.explorerCount, icon: '/badges/explorer.png', color: '#5cc4d6' },
                  { label: 'Contributor', value: stats.contributorCount, icon: '/badges/contributor.png', color: '#a78bdb' },
                  { label: 'Trusted', value: stats.trustedCount, icon: '/badges/trust.png', color: '#6dd4a0' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="pd-badge-card"
                    style={{ ['--badge-color' as string]: b.color }}
                  >
                    <img src={b.icon} alt={b.label} className="pd-badge-icon" />
                    <span className="pd-badge-label">{b.label}</span>
                    <span className="pd-badge-value">{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Activity — support/oppose only for now */}
          {lastActivity.length > 0 && (
            <div className="pd-section">
              <p className="pd-section-title">Last activity</p>
              <div className="pd-la-list">
                {lastActivity.map((a) => {
                  const isOppose = a.intentions.includes('Distrusted')
                  const actionLabel = isOppose ? 'Opposed' : 'Supported'
                  const root = extractDomain(a.url || '') || a.domain
                  return (
                    <a
                      key={a.id}
                      className="pd-la-row"
                      href={a.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="pd-la-anchor">
                        <span className="favicon" style={{ ['--fav-size' as string]: '32px' }}>
                          {a.favicon ? (
                            <img
                              src={a.favicon}
                              alt=""
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : null}
                        </span>
                        <span
                          className={`pd-la-badge ${isOppose ? 'oppose' : 'support'}`}
                          aria-hidden="true"
                        >
                          {isOppose ? (
                            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18" />
                              <path d="M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </span>
                      <span className="pd-la-text">
                        <span className="pd-la-title">
                          {actionLabel} <strong>{a.title}</strong>
                        </span>
                        <span className="pd-la-sub">
                          {root}{root ? ' · ' : ''}{timeAgo(a.timestamp)}
                        </span>
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filler so the CTA sits at the bottom of the drawer. */}
          <div className="pd-section pd-section--grow" />

          {/* CTA — Start your journey */}
          <div className="pd-section">
            <button
              type="button"
              className="pd-cta"
              onClick={() => navigate('/profile/topics')}
            >
              <span>Start your journey</span>
              <span className="pd-cta-arrow">→</span>
            </button>
          </div>

        </div>
      </aside>

      <ShareProfileModal
        isOpen={isModalOpen}
        onClose={closeShareModal}
        shareUrl={shareUrl}
        ogImageUrl={ogImageUrl}
        isLoading={shareLoading}
        error={shareError}
        onCopyLink={handleCopyLink}
        onShareOnX={handleShareOnX}
        copied={copied}
      />
    </>
  )
}
