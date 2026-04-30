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

import { Link, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft } from 'lucide-react'
import { SectionTitle, FaviconWrapper } from '@0xsofia/design-system'
import { Button } from '@/components/ui/button'
import { getTopicEmoji } from '@/config/topicEmoji'
import {
  INTENTION_CONFIG,
  type IntentionType,
} from '@/config/intentions'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useTopClaims } from '@/hooks/useTopClaims'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { useUserCertCounts } from '@/hooks/useUserCertCountsByTopic'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useSignals } from '@/hooks/useSignals'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { POINTS_PER_CERT } from '@/services/reputationScoreService'
import { predicateLabelToIntentionType } from '@/config/intentions'
import { type ClaimBadge } from '@/components/profile/ProfileClaimCard'
import { extractDomain } from '@/utils/formatting'
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

export default function ScoresPage() {
  const navigate = useNavigate()
  const { user } = usePrivy()
  const address = user?.wallet?.address
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

  // Reputation by topic — same TopicScore shape used by /profile.
  const topicScores = selectedTopics
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const reputationScore = reputation?.topics.find(
        (t) => t.topicId === id,
      )?.score
      return {
        id,
        label: topic.label,
        emoji: getTopicEmoji(id) || '📌',
        color: topic.color ?? '#888888',
        score: Math.round(reputationScore ?? 0),
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const generalScore = certCounts.general * POINTS_PER_CERT
  const totalTopicScore =
    topicScores.reduce((a, t) => a + t.score, 0) + generalScore
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
  // Uses the same thresholds as the Discovery service so the numbers
  // here match the right-rail Pioneer/Explorer/Contributor counts:
  //   1 holder        → pioneer
  //   2-10 holders    → explorer
  //   11+ holders     → contributor
  const perBadgeUrlsAll = (() => {
    const buckets: Record<ClaimBadge, typeof topClaims> = {
      pioneer: [],
      early: [],
      viral: [],
      contrarian: [],
    }
    const seen = new Set<string>()
    for (const cert of profile.certs) {
      if (!cert.objectLabel) continue
      const key = `${cert.objectLabel}::${cert.objectUrl}`
      if (seen.has(key)) continue
      seen.add(key)
      const tier =
        cert.certifierCount <= 1
          ? 'pioneer'
          : cert.certifierCount <= 10
            ? 'early'
            : 'viral'
      buckets[tier].push({
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
    }
    return BADGE_GROUPS.map((g) => ({
      group: g,
      urls: buckets[g.id],
    }))
  })()
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
    <div className="pf-view page-enter">
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

      <div className="pp-sections">
        {topicScores.length > 0 && (
          <section className="pp-section">
            <SectionTitle>Reputation by topic</SectionTitle>
            <div className="pf-trust-topics">
              {topicScores.map((t) => {
                const pct = (t.score / maxTopicScore) * 100
                return (
                  <div
                    key={t.id}
                    className="pf-trust-topic"
                    style={{ ['--topic-color' as string]: t.color }}
                  >
                    <div className="pf-trust-topic-head">
                      <span className="pf-trust-topic-emoji">{t.emoji}</span>
                      <span className="pf-trust-topic-label">{t.label}</span>
                      <span className="pf-trust-topic-score">{t.score}</span>
                    </div>
                    <div className="pf-trust-topic-bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {verbCounts.length > 0 && (
          <section className="pp-section">
            <SectionTitle>Reputation by verb</SectionTitle>
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
                  <p className="pf-badge-empty">No claim in this tier yet.</p>
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
    </div>
  )
}
