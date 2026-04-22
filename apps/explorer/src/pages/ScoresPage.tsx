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

import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft } from 'lucide-react'
import { SectionTitle, FaviconWrapper } from '@0xsofia/design-system'
import { Button } from '@/components/ui/button'
import { getTopicEmoji } from '@/config/topicEmoji'
import {
  INTENTION_CONFIG,
  displayLabelToIntentionType,
  type IntentionType,
} from '@/config/intentions'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useUserActivity } from '@/hooks/useUserActivity'
import { useTopClaims } from '@/hooks/useTopClaims'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { deriveClaimBadge, type ClaimBadge } from '@/components/profile/ProfileClaimCard'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import '@/components/styles/pages.css'
import '@/components/styles/scores-page.css'

const VERBS: { id: IntentionType; label: string; emoji: string; color: string }[] = [
  { id: 'trusted',     label: INTENTION_CONFIG.trusted.label,     emoji: '🤝', color: INTENTION_CONFIG.trusted.color },
  { id: 'distrusted',  label: INTENTION_CONFIG.distrusted.label,  emoji: '⚠️', color: INTENTION_CONFIG.distrusted.color },
  { id: 'work',        label: INTENTION_CONFIG.work.label,        emoji: '💼', color: INTENTION_CONFIG.work.color },
  { id: 'learning',    label: INTENTION_CONFIG.learning.label,    emoji: '📚', color: INTENTION_CONFIG.learning.color },
  { id: 'inspiration', label: INTENTION_CONFIG.inspiration.label, emoji: '✨', color: INTENTION_CONFIG.inspiration.color },
  { id: 'fun',         label: INTENTION_CONFIG.fun.label,         emoji: '🎮', color: INTENTION_CONFIG.fun.color },
  { id: 'buying',      label: INTENTION_CONFIG.buying.label,      emoji: '🛍️', color: INTENTION_CONFIG.buying.color },
  { id: 'music',       label: INTENTION_CONFIG.music.label,       emoji: '🎵', color: INTENTION_CONFIG.music.color },
]

const BADGE_GROUPS: { id: ClaimBadge; label: string; description: string; icon: string }[] = [
  { id: 'pioneer', label: 'Pioneer',     description: 'First to certify the claim.',            icon: '/badges/pioneer.png' },
  { id: 'early',   label: 'Explorer',    description: 'Supported before consensus.',            icon: '/badges/explorer.png' },
  { id: 'viral',   label: 'Contributor', description: 'Your signal spread across the network.', icon: '/badges/contributor.png' },
]

export default function ScoresPage() {
  const navigate = useNavigate()
  const { user } = usePrivy()
  const address = user?.wallet?.address

  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { getPlatformsByTopic } = usePlatformCatalog()
  const { topicById } = useTaxonomy()
  const { items: activity } = useUserActivity(address || undefined)
  const { claims: topClaims } = useTopClaims(address || undefined)

  // Reputation by topic — proto formula: categories × 5 + platforms × 10.
  const topicScores = selectedTopics
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const catCount = topic.categories.filter((c) => selectedCategories.includes(c.id)).length
      const platformsOfTopic = getPlatformsByTopic(id) ?? []
      const platCount = platformsOfTopic.filter((p) => getStatus(p.id) === 'connected').length
      return {
        id,
        label: topic.label,
        emoji: getTopicEmoji(id) || '📌',
        color: topic.color ?? '#888888',
        score: catCount * 5 + platCount * 10,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const totalTopicScore = topicScores.reduce((a, t) => a + t.score, 0)
  const maxTopicScore = Math.max(...topicScores.map((t) => t.score), 1)

  // Reputation by verb — count intentions across the user's activity.
  const verbCounts = VERBS.map((v) => {
    let count = 0
    for (const item of activity) {
      if (
        item.intentions.some(
          (intentLabel) => displayLabelToIntentionType(intentLabel) === v.id,
        )
      ) {
        count++
      }
    }
    return { ...v, count, score: count * 10 }
  }).filter((v) => v.count > 0)

  // Badges earned on URLs — bucket top claims by derived badge.
  // All 3 groups are always rendered (empty state shown when no claim
  // qualifies) so the user always sees Pioneer / Explorer / Contributor
  // side by side.
  const perBadgeUrls = BADGE_GROUPS.map((g) => {
    const urls = topClaims
      .filter((c) => {
        const position =
          c.predicateLabel.toLowerCase().includes('distrust') ? 'oppose' : 'support'
        const derived = deriveClaimBadge({
          supportCount: c.stats.supportCount,
          opposeCount: c.stats.opposeCount,
          pnlPct: c.stats.userPnlPct ?? 0,
          position,
        })
        return derived === g.id
      })
      .slice(0, 3)
    return { group: g, urls }
  })

  // Engagement on your URLs — top 5 by total position count.
  const engagement = [...topClaims]
    .sort((a, b) =>
      (b.stats.supportCount + b.stats.opposeCount) -
      (a.stats.supportCount + a.stats.opposeCount),
    )
    .slice(0, 5)

  return (
    <div className="pf-view page-enter">
      <div className="pf-ts-back-row">
        <button type="button" className="pf-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4" />
          Back to my profile
        </button>
      </div>

      <div className="pf-ts-header">
        <div className="pf-ts-header-title-block">
          <span className="pf-ts-header-kicker">Profile · Score</span>
          <h1 className="pf-ts-header-title">Score</h1>
          <p className="pf-ts-header-desc">
            Your score across the topics you anchor in, the URLs that made it, and how the network
            reacted to your signals.
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
                    <span className="pf-trust-topic-score">{v.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pp-section">
          <SectionTitle>Badges earned on URLs</SectionTitle>
          <div className="pf-badge-grid">
            {perBadgeUrls.map(({ group, urls }) => (
              <div key={group.id} className="pf-badge-block">
                <div className="pf-badge-head">
                  <img className="pf-badge-head-icon" src={group.icon} alt={group.label} />
                  <div className="pf-badge-head-text">
                    <span className="pf-badge-head-label">{group.label}</span>
                    <span className="pf-badge-head-desc">{group.description}</span>
                  </div>
                </div>
                {urls.length > 0 ? (
                  <div className="pf-badge-urls">
                    {urls.map((c) => {
                      const domain = c.objectUrl ? extractDomain(c.objectUrl) : ''
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
                            <span className="pf-ts-url-title">{c.objectLabel}</span>
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
              </div>
            ))}
          </div>
        </section>

        {engagement.length > 0 && (
          <section className="pp-section">
            <SectionTitle>Engagement on your URLs</SectionTitle>
            <div className="pf-engage-list">
              {engagement.map((c) => {
                const total = c.stats.supportCount + c.stats.opposeCount
                const supPct = total > 0 ? Math.round((c.stats.supportCount / total) * 100) : 50
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
                      <span className="pf-engage-sup">▲ {c.stats.supportCount}</span>
                      <span className="pf-engage-opp">▼ {c.stats.opposeCount}</span>
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
