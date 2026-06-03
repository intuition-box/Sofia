/**
 * ScoresPage — `/scores`. 1:1 port of the proto's renderTrustPage
 * (proto-explorer/src/views/profile.ts:985-1142 + styles/profile-trust.css).
 *
 * Header is a custom white card (.pf-ts-header) with kicker + Fraunces
 * title + description on the left, and a big trusted-green total-score
 * stat on the right. Four sections follow:
 *   - Reputation by topic (bars)
 *   - Reputation by verb (same card shape, one per intention)
 *   - Badges earned on URLs (Pioneer / Explorer / Contributor groups)
 *   - Engagement on your URLs (support/oppose bar + counts)
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft } from 'lucide-react'
import { formatEther } from 'viem'
import { SectionTitle, FaviconWrapper } from '@0xsofia/design-system'
import { Button } from '@/components/ui/button'
import { getTopicEmoji } from '@/config/topicEmoji'
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useTopClaims } from '@/hooks/useTopClaims'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { computeDiscoveryBuckets } from '@/services/userOnChainProfileService'
import { useUserCertCounts } from '@/hooks/useUserCertCountsByTopic'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useDerivedReputation } from '@/hooks/useDerivedReputation'
import { useSignals } from '@/hooks/useSignals'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useSeasonPool } from '@/hooks/useSeasonPool'
import { POINTS_PER_CERT } from '@/services/reputationScoreService'
import { predicateLabelToIntentionType } from '@/config/intentions'
import { type ClaimBadge } from '@/components/profile/ProfileClaimCard'
import { extractDomain, formatTrust } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import '@/components/styles/pages.css'
import '@/components/styles/scores-page.css'

const VERBS: {
  id: IntentionType
  label: string
  emoji: string
  color: string
}[] = [
  {
    id: 'trusted',
    label: INTENTION_CONFIG.trusted.label,
    emoji: '🤝',
    color: INTENTION_CONFIG.trusted.color,
  },
  {
    id: 'distrusted',
    label: INTENTION_CONFIG.distrusted.label,
    emoji: '⚠️',
    color: INTENTION_CONFIG.distrusted.color,
  },
  {
    id: 'work',
    label: INTENTION_CONFIG.work.label,
    emoji: '💼',
    color: INTENTION_CONFIG.work.color,
  },
  {
    id: 'learning',
    label: INTENTION_CONFIG.learning.label,
    emoji: '📚',
    color: INTENTION_CONFIG.learning.color,
  },
  {
    id: 'inspiration',
    label: INTENTION_CONFIG.inspiration.label,
    emoji: '✨',
    color: INTENTION_CONFIG.inspiration.color,
  },
  {
    id: 'fun',
    label: INTENTION_CONFIG.fun.label,
    emoji: '🎮',
    color: INTENTION_CONFIG.fun.color,
  },
  {
    id: 'buying',
    label: INTENTION_CONFIG.buying.label,
    emoji: '🛍️',
    color: INTENTION_CONFIG.buying.color,
  },
  {
    id: 'music',
    label: INTENTION_CONFIG.music.label,
    emoji: '🎵',
    color: INTENTION_CONFIG.music.color,
  },
]

const BADGE_GROUPS: {
  id: ClaimBadge
  label: string
  description: string
  icon: string
}[] = [
  {
    id: 'pioneer',
    label: 'Pioneer',
    description: 'First to certify the claim.',
    icon: '/badges/pioneer.png',
  },
  {
    id: 'early',
    label: 'Explorer',
    description: 'Supported before consensus.',
    icon: '/badges/explorer.png',
  },
  {
    id: 'viral',
    label: 'Contributor',
    description: 'Your signal spread across the network.',
    icon: '/badges/contributor.png',
  },
]

type ScoreTab = 'score' | 'pool'

export default function ScoresPage() {
  const navigate = useNavigate()
  const { user, authenticated } = usePrivy()
  const address = user?.wallet?.address
  const [activeTab, setActiveTab] = useState<ScoreTab>('score')
  // Which topic card is expanded to show its base/boost breakdown.
  const [openTopic, setOpenTopic] = useState<string | null>(null)

  // Beta Season Pool — vault stats + the connected wallet's position.
  const {
    data: poolPositions,
    vaultStats,
    loading: poolLoading,
  } = useSeasonPool(authenticated && activeTab === 'pool')

  const userPool = useMemo(() => {
    if (!poolPositions || !address) return null
    const sorted = [...poolPositions].sort(
      (a, b) => b.pnlPercent - a.pnlPercent,
    )
    const idx = sorted.findIndex(
      (p) => p.address.toLowerCase() === address.toLowerCase(),
    )
    return idx >= 0
      ? { position: sorted[idx], rank: idx + 1, total: sorted.length }
      : null
  }, [poolPositions, address])
  const { addresses: linkedAddresses } = useLinkedWallets()
  const profileAddresses =
    linkedAddresses.length > 0
      ? linkedAddresses
      : address
        ? [address]
        : undefined

  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { topicById } = useTaxonomy()
  const { claims: topClaims } = useTopClaims(profileAddresses)

  // Master profile cache — every panel below derives from this snapshot
  // so /scores stays in sync with /profile (donut, panel, calendar).
  const { profile } = useUserOnChainProfile(profileAddresses)
  const certCounts = useUserCertCounts(profileAddresses)
  const { signals } = useSignals(address)
  const reputation = useReputationScores(
    getStatus,
    selectedTopics,
    selectedCategories,
    undefined,
    signals,
    certCounts.byTopic,
  )
  // Boost = credibility of users who positioned AFTER you on your claims,
  // added on top of the per-cert base. See docs/reputation-curation.md.
  const { scoreByTopic: derivedRep } = useDerivedReputation(
    profileAddresses ?? [],
  )

  // Reputation by topic, split into its two drivers so the detail view can
  // explain it: `base` = your own certifications (POINTS_PER_CERT each),
  // `boost` = the credibility of users who backed your claims after you.
  const topicScores = selectedTopics
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const base = Math.round(
        reputation?.topics.find((t) => t.topicId === id)?.score ?? 0,
      )
      const boost = Math.round(derivedRep.get(id) ?? 0)
      return {
        id,
        label: topic.label,
        emoji: getTopicEmoji(id) || '📌',
        color: topic.color ?? '#888888',
        base,
        boost,
        certCount: Math.round(base / POINTS_PER_CERT),
        score: base + boost,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Trust/distrust are no longer folded into `general` (they can't carry a
  // topic context) — count them explicitly so the total stays in sync with
  // the /profile donut, which renders them as their own circle slices.
  const generalScore = certCounts.general * POINTS_PER_CERT
  const trustDistrustScore =
    (certCounts.trusted + certCounts.distrusted) * POINTS_PER_CERT
  const totalTopicScore =
    topicScores.reduce((a, t) => a + t.score, 0) +
    generalScore +
    trustDistrustScore
  const maxTopicScore = Math.max(...topicScores.map((t) => t.score), 1)

  // Reputation by verb — derive directly from the master profile so the
  // counts cover every cert (not just the loaded 200-event window).
  const verbCounts = VERBS.map((v) => {
    let count = 0
    for (const cert of profile.certs) {
      if (predicateLabelToIntentionType(cert.intention) === v.id) count++
    }
    return { ...v, count }
  }).filter((v) => v.count > 0)

  // Badges earned on URLs — derive from EVERY cert the user owns,
  // not just `topClaims` (which only tracks the top-N by market cap).
  // Single source of truth: `computeDiscoveryBuckets` is the same
  // selector the right-rail Discovery badges consume.
  const discoveryBuckets = computeDiscoveryBuckets(profile.certs)
  const certToClaim = (cert: (typeof profile.certs)[number]) => ({
    termId: cert.termId,
    objectLabel: cert.objectLabel,
    objectUrl: cert.objectUrl || undefined,
    predicateLabel: cert.intention,
    stats: {
      supportCount: cert.certifierCount,
      opposeCount: 0,
      supportMarketCap: '0',
      opposeMarketCap: '0',
      userPnlPct: null,
    },
    totalMarketCap: 0n,
  })
  const bucketsByBadge: Record<ClaimBadge, typeof topClaims> = {
    pioneer: discoveryBuckets.pioneer
      .filter((c) => c.objectLabel)
      .map(certToClaim),
    early: discoveryBuckets.explorer
      .filter((c) => c.objectLabel)
      .map(certToClaim),
    viral: discoveryBuckets.contributor
      .filter((c) => c.objectLabel)
      .map(certToClaim),
    contrarian: [],
  }
  const perBadgeUrlsAll = BADGE_GROUPS.map((g) => ({
    group: g,
    urls: bucketsByBadge[g.id],
  }))
  const perBadgeUrls = perBadgeUrlsAll.map((entry) => ({
    ...entry,
    urls: entry.urls.slice(0, 3),
  }))

  // Engagement on your URLs — top 5 by total position count.
  const engagement = [...topClaims]
    .sort(
      (a, b) =>
        b.stats.supportCount +
        b.stats.opposeCount -
        (a.stats.supportCount + a.stats.opposeCount),
    )
    .slice(0, 5)

  return (
    <div className="pf-view sp-page page-enter">
      <div className="pf-ts-back-row">
        <button
          type="button"
          className="pf-btn"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my profile
        </button>
      </div>

      <div className="pf-ts-header">
        <div className="pf-ts-header-title-block">
          <h1 className="pf-ts-header-title">Score</h1>
          <p className="pf-ts-header-desc">
            Break down your reputation score across topics, intents, URLs and
            engagement.
          </p>
        </div>
        <div className="pf-ts-header-stat">
          <span className="pf-ts-header-stat-value">{totalTopicScore}</span>
          <span className="pf-ts-header-stat-label">Total score</span>
        </div>
      </div>

      <div className="sp-tabs">
        <Button
          size="sm"
          variant={activeTab === 'score' ? 'default' : 'ghost'}
          data-active={activeTab === 'score'}
          onClick={() => setActiveTab('score')}
        >
          Score
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'pool' ? 'default' : 'ghost'}
          data-active={activeTab === 'pool'}
          onClick={() => setActiveTab('pool')}
        >
          Pool
        </Button>
      </div>

      {activeTab === 'pool' && (
        <div className="pp-sections">
          <section className="pp-section">
            <SectionTitle>Beta Season Pool</SectionTitle>
            {vaultStats && (
              <div className="sp-pool-snapshot">
                <div className="sp-pool-stat">
                  <span className="sp-pool-stat-label">TVL</span>
                  <span className="sp-pool-stat-value">
                    {parseFloat(formatEther(vaultStats.tvl)).toFixed(2)} T
                  </span>
                </div>
                <div className="sp-pool-stat">
                  <span className="sp-pool-stat-label">Stakers</span>
                  <span className="sp-pool-stat-value">
                    {vaultStats.totalStakers.toLocaleString()}
                  </span>
                </div>
                <div className="sp-pool-stat">
                  <span className="sp-pool-stat-label">Share price</span>
                  <span className="sp-pool-stat-value">
                    {parseFloat(formatEther(vaultStats.sharePrice)).toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {!authenticated && (
              <div className="sp-pool-empty">
                Connect your wallet to view your pool position.
              </div>
            )}

            {authenticated && poolLoading && !userPool && (
              <div className="sp-pool-empty">Loading your position…</div>
            )}

            {authenticated && !poolLoading && !userPool && (
              <div className="sp-pool-empty">
                <div className="sp-pool-empty-title">No position yet</div>
                <div className="sp-pool-empty-sub">
                  Stake into the Beta Season Pool to appear here.
                </div>
              </div>
            )}

            {userPool && (
              <div className="sp-pool-card">
                <div className="sp-pool-rank">
                  <span className="sp-pool-rank-hash">#</span>
                  <span className="sp-pool-rank-num">{userPool.rank}</span>
                  <span className="sp-pool-rank-of">
                    of {userPool.total.toLocaleString()}
                  </span>
                </div>
                <div className="sp-pool-rows">
                  <div className="sp-pool-row">
                    <span className="sp-pool-row-label">Current value</span>
                    <span className="sp-pool-row-value">
                      {formatTrust(userPool.position.currentValue)}
                    </span>
                  </div>
                  <div className="sp-pool-row">
                    <span className="sp-pool-row-label">Net deposited</span>
                    <span className="sp-pool-row-value">
                      {formatTrust(userPool.position.netDeposited)}
                    </span>
                  </div>
                  <div className="sp-pool-row">
                    <span className="sp-pool-row-label">P&amp;L</span>
                    <span
                      className={
                        'sp-pool-row-value ' +
                        (userPool.position.pnl >= 0n
                          ? 'sp-pool-pos'
                          : 'sp-pool-neg')
                      }
                    >
                      {userPool.position.pnl >= 0n ? '+' : ''}
                      {formatTrust(userPool.position.pnl)}
                    </span>
                  </div>
                  <div className="sp-pool-row">
                    <span className="sp-pool-row-label">P&amp;L %</span>
                    <span
                      className={
                        'sp-pool-row-value ' +
                        (userPool.position.pnlPercent >= 0
                          ? 'sp-pool-pos'
                          : 'sp-pool-neg')
                      }
                    >
                      {userPool.position.pnlPercent >= 0 ? '+' : ''}
                      {userPool.position.pnlPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'score' && (
        <div className="pp-sections">
          {topicScores.length > 0 && (
            <section className="pp-section">
              <SectionTitle>Topic</SectionTitle>
              <p className="sp-explainer">
                Your score in a topic ={' '}
                <strong>your certifications</strong> (base) +{' '}
                <strong>the credibility of users who backed your claims</strong>{' '}
                after you (boost). Click a topic for the breakdown.
              </p>
              <div className="pf-trust-topics">
                {topicScores.map((t) => {
                  const pct = (t.score / maxTopicScore) * 100
                  const open = openTopic === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`pf-trust-topic${open ? ' is-open' : ''}`}
                      style={{ ['--topic-color' as string]: t.color }}
                      onClick={() => setOpenTopic(open ? null : t.id)}
                      aria-expanded={open}
                    >
                      <div className="pf-trust-topic-head">
                        <span className="pf-trust-topic-emoji">{t.emoji}</span>
                        <span className="pf-trust-topic-label">{t.label}</span>
                        <span className="pf-trust-topic-score">{t.score}</span>
                      </div>
                      <div className="pf-trust-topic-bar">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      {open && (
                        <div className="sp-topic-detail">
                          <div className="sp-topic-detail-row">
                            <span className="sp-topic-detail-k">
                              Base · {t.certCount} cert
                              {t.certCount === 1 ? '' : 's'} ×{' '}
                              {POINTS_PER_CERT}
                            </span>
                            <span className="sp-topic-detail-v">{t.base}</span>
                          </div>
                          <div className="sp-topic-detail-row">
                            <span className="sp-topic-detail-k">
                              Boost · credibility of your backers
                            </span>
                            <span className="sp-topic-detail-v">
                              +{t.boost}
                            </span>
                          </div>
                          <div className="sp-topic-detail-row sp-topic-detail-total">
                            <span className="sp-topic-detail-k">Total</span>
                            <span className="sp-topic-detail-v">{t.score}</span>
                          </div>
                          {t.boost === 0 && (
                            <p className="sp-topic-detail-hint">
                              No credible backer has positioned after you on
                              your {t.label} claims yet.
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {verbCounts.length > 0 && (
            <section className="pp-section">
              <SectionTitle>Intention</SectionTitle>
              <div className="pf-verb-grid">
                {verbCounts.map((v) => (
                  <div
                    key={v.id}
                    className="pf-trust-topic"
                    style={{ ['--topic-color' as string]: v.color }}
                  >
                    <div className="pf-trust-topic-head">
                      <span className="pf-trust-topic-emoji">{v.emoji}</span>
                      <span className="pf-trust-topic-label">{v.label}</span>
                      <span className="pf-trust-topic-score">{v.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pp-section">
            <SectionTitle>Badges earned on URLs</SectionTitle>
            <div className="pf-badge-grid">
              {perBadgeUrls.map(({ group, urls }) => {
                const totalCount =
                  perBadgeUrlsAll.find((e) => e.group.id === group.id)?.urls
                    .length ?? 0
                return (
                  <div key={group.id} className="pf-badge-block">
                    <div className="pf-badge-head">
                      <img
                        className="pf-badge-head-icon"
                        src={group.icon}
                        alt={group.label}
                      />
                      <div className="pf-badge-head-text">
                        <span className="pf-badge-head-label">
                          {group.label}
                          {totalCount > 0 ? ` · ${totalCount}` : ''}
                        </span>
                        <span className="pf-badge-head-desc">
                          {group.description}
                        </span>
                      </div>
                    </div>
                    {urls.length > 0 ? (
                      <div className="pf-badge-urls">
                        {urls.map((c) => {
                          const domain = c.objectUrl
                            ? extractDomain(c.objectUrl)
                            : ''
                          return (
                            <a
                              key={c.termId}
                              className="pf-ts-url-item"
                              href={c.objectUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaviconWrapper
                                size={22}
                                src={domain ? getFaviconUrl(domain) : undefined}
                                alt={domain}
                                className="pf-ts-url-fav"
                              />
                              <div className="pf-ts-url-meta">
                                <span className="pf-ts-url-title">
                                  {c.objectLabel}
                                </span>
                                <span className="pf-ts-url-host">
                                  {domain}
                                  {c.stats.userPnlPct != null
                                    ? ` · ${c.stats.userPnlPct >= 0 ? '+' : ''}${c.stats.userPnlPct}%`
                                    : ''}
                                </span>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="pf-badge-empty">
                        No claim in this tier yet.
                      </p>
                    )}
                    {totalCount > urls.length && (
                      <Link
                        className="pf-badge-view-all"
                        to={`/scores/badges/${
                          group.id === 'pioneer'
                            ? 'pioneer'
                            : group.id === 'early'
                              ? 'explorer'
                              : 'contributor'
                        }`}
                      >
                        View all {totalCount} →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {engagement.length > 0 && (
            <section className="pp-section">
              <SectionTitle>Engagement on your URLs</SectionTitle>
              <div className="pf-engage-list">
                {engagement.map((c) => {
                  const total = c.stats.supportCount + c.stats.opposeCount
                  const supPct =
                    total > 0
                      ? Math.round((c.stats.supportCount / total) * 100)
                      : 50
                  const domain = c.objectUrl ? extractDomain(c.objectUrl) : ''
                  return (
                    <div key={c.termId} className="pf-engage-row">
                      <FaviconWrapper
                        size={24}
                        src={domain ? getFaviconUrl(domain) : undefined}
                        alt={domain}
                        className="pf-engage-fav"
                      />
                      <div className="pf-engage-meta">
                        <span className="pf-engage-title">{c.objectLabel}</span>
                        <span className="pf-engage-sub">{domain}</span>
                      </div>
                      <div className="pf-engage-bar">
                        <span style={{ width: `${supPct}%` }} />
                      </div>
                      <div className="pf-engage-counts">
                        <span className="pf-engage-sup">
                          ▲ {c.stats.supportCount}
                        </span>
                        <span className="pf-engage-opp">
                          ▼ {c.stats.opposeCount}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
