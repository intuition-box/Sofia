import { usePrivy } from '@privy-io/react-auth'
import { PageHero, SectionTitle } from '@0xsofia/design-system'
import { PAGE_COLORS } from '@/config/pageColors'
import { getTopicEmoji } from '@/config/topicEmoji'
import { getIntentionColor } from '@/config/intentions'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useTrustScore } from '@/hooks/useTrustScore'
import { useDiscoveryScore } from '@/hooks/useDiscoveryScore'
import { useSignals } from '@/hooks/useSignals'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import '@/components/styles/pages.css'
import '@/components/styles/scores-page.css'

// ── Pie chart ─────────────────────────────────────────────────────────

interface PieSlice {
  id: string
  label: string
  emoji: string
  color: string
  score: number
}

function TopicScorePie({ slices }: { slices: PieSlice[] }) {
  const realTotal = slices.reduce((a, s) => a + s.score, 0)
  const equalFallback = realTotal === 0 && slices.length > 0
  const denom = equalFallback ? slices.length : realTotal
  const r = 70
  const C = 2 * Math.PI * r
  let cursor = 0

  return (
    <div className="sc-pie-wrap">
      <svg className="sc-pie" viewBox="0 0 180 180" aria-hidden="true">
        {slices.map((t) => {
          const value = equalFallback ? 1 : t.score
          const pct = denom > 0 ? value / denom : 0
          const sliceLen = pct * C
          const rest = C - sliceLen
          const startDeg = -90 + (denom > 0 ? (cursor / denom) * 360 : 0)
          cursor += value
          return (
            <circle
              key={t.id}
              cx={90}
              cy={90}
              r={r}
              fill="none"
              stroke={t.color}
              strokeWidth={20}
              strokeDasharray={`${sliceLen.toFixed(2)} ${rest.toFixed(2)}`}
              strokeOpacity={equalFallback ? 0.35 : 1}
              transform={`rotate(${startDeg.toFixed(2)} 90 90)`}
            />
          )
        })}
        <circle cx={90} cy={90} r={52} fill="var(--ds-card)" />
      </svg>
      <div className="sc-pie-center">
        <span className="sc-pie-value">{Math.round(realTotal)}</span>
        <span className="sc-pie-label">
          {equalFallback ? 'build it up' : 'total score'}
        </span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────

export default function ScoresPage() {
  const pc = PAGE_COLORS['/scores']
  const { user } = usePrivy()
  const address = user?.wallet?.address
  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus, connectedCount } = usePlatformConnections()
  const { score: trustScore, loading: trustLoading } = useTrustScore(address || undefined)
  const { signals } = useSignals(address || undefined)
  const scores = useReputationScores(getStatus, selectedTopics, selectedCategories, trustScore, signals)
  const { stats } = useDiscoveryScore(address || undefined)
  const { topicById } = useTaxonomy()

  const topicScores = scores?.topics ?? []

  const pieSlices: PieSlice[] = selectedTopics
    .map((id) => {
      const topic = topicById(id)
      if (!topic) return null
      const entry = topicScores.find((s) => s.topicId === id)
      return {
        id,
        label: topic.label,
        emoji: getTopicEmoji(id) || '📌',
        color: topic.color ?? getIntentionColor('inspiration'),
        score: Math.round(entry?.score ?? 0),
      }
    })
    .filter((x): x is PieSlice => x !== null)

  const totalScore = pieSlices.reduce((a, s) => a + s.score, 0)
  const totalCategories = selectedCategories.length
  const totalSignals = stats?.totalCertifications ?? 0

  // Derive a loose "rank" from trust score: higher = better.
  const percentileLabel = trustScore != null
    ? `Top ${Math.max(1, Math.round(100 - trustScore))}%`
    : '—'

  const maxTopicScore = Math.max(...pieSlices.map((s) => s.score), 1)

  return (
    <div className="pf-view page-enter">
      <PageHero background={pc.color} title={pc.title} description={pc.subtitle} />

      {/* ── Overview: big pie + totals row ── */}
      <section className="sc-section">
        <div className="sc-overview">
          <TopicScorePie slices={pieSlices} />
          <div className="sc-overview-stats">
            <div className="sc-stat">
              <span className="sc-stat-value">{percentileLabel}</span>
              <span className="sc-stat-label">Percentile</span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-value">{selectedTopics.length}</span>
              <span className="sc-stat-label">Topics</span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-value">{totalCategories}</span>
              <span className="sc-stat-label">Categories</span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-value">{connectedCount}</span>
              <span className="sc-stat-label">Platforms</span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-value">{totalSignals}</span>
              <span className="sc-stat-label">Signals</span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-value">
                {trustLoading ? '…' : trustScore != null ? trustScore.toFixed(0) : '—'}
              </span>
              <span className="sc-stat-label">Trust</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Formula explainer ── */}
      <section className="sc-section">
        <SectionTitle>How it's calculated</SectionTitle>
        <div className="sc-formula-card">
          <div className="sc-formula-row">
            <span className="sc-formula-dot" style={{ background: 'var(--work, #7bade0)' }} />
            <span className="sc-formula-label">Categories × 5</span>
            <span className="sc-formula-value">{totalCategories * 5}</span>
          </div>
          <div className="sc-formula-row">
            <span className="sc-formula-dot" style={{ background: 'var(--learning, #5cc4d6)' }} />
            <span className="sc-formula-label">Platforms × 10</span>
            <span className="sc-formula-value">{connectedCount * 10}</span>
          </div>
          <div className="sc-formula-row">
            <span className="sc-formula-dot" style={{ background: 'var(--inspiration, #a78bdb)' }} />
            <span className="sc-formula-label">Signals × 1</span>
            <span className="sc-formula-value">{totalSignals}</span>
          </div>
          <div className="sc-formula-divider" />
          <div className="sc-formula-row sc-formula-total">
            <span className="sc-formula-label">Total</span>
            <span className="sc-formula-value">{totalScore}</span>
          </div>
          <p className="sc-formula-hint">
            Topic scores factor in trust-weighted platform signals and a multi-source bonus
            (+20% for 2+ platforms, +50% for 3+). View a topic to see its per-platform breakdown.
          </p>
        </div>
      </section>

      {/* ── Per-topic breakdown ── */}
      {pieSlices.length > 0 && (
        <section className="sc-section">
          <SectionTitle>Topic breakdown</SectionTitle>
          <div className="sc-topic-list">
            {pieSlices.map((t) => {
              const pct = (t.score / maxTopicScore) * 100
              const topic = topicById(t.id)
              const entry = topicScores.find((s) => s.topicId === t.id)
              const topicCategoryCount = topic
                ? topic.categories.filter((c) => selectedCategories.includes(c.id)).length
                : 0
              return (
                <div
                  key={t.id}
                  className="sc-topic-row"
                  style={{ ['--topic-color' as string]: t.color }}
                >
                  <div className="sc-topic-head">
                    <span className="sc-topic-emoji">{t.emoji}</span>
                    <span className="sc-topic-label">{t.label}</span>
                    <span className="sc-topic-score">{t.score}</span>
                  </div>
                  <div className="sc-topic-bar">
                    <div className="sc-topic-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="sc-topic-sub">
                    <span>{topicCategoryCount} categor{topicCategoryCount === 1 ? 'y' : 'ies'}</span>
                    <span>·</span>
                    <span>{entry?.platformCount ?? 0} platforms</span>
                    {entry?.confidence != null && (
                      <>
                        <span>·</span>
                        <span>{Math.round(entry.confidence * 100)}% confidence</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Discovery badges ── */}
      {stats && (
        <section className="sc-section">
          <SectionTitle>Discovery</SectionTitle>
          <div className="sc-badges">
            {[
              { label: 'Pioneer', value: stats.pioneerCount, icon: '/badges/pioneer.png', color: '#e4b95a' },
              { label: 'Explorer', value: stats.explorerCount, icon: '/badges/explorer.png', color: '#5cc4d6' },
              { label: 'Contributor', value: stats.contributorCount, icon: '/badges/contributor.png', color: '#a78bdb' },
              { label: 'Trusted', value: stats.trustedCount, icon: '/badges/trust.png', color: '#6dd4a0' },
            ].map((b) => (
              <div
                key={b.label}
                className="sc-badge-card"
                style={{ ['--badge-color' as string]: b.color }}
              >
                <img src={b.icon} alt={b.label} className="sc-badge-icon" />
                <span className="sc-badge-value">{b.value}</span>
                <span className="sc-badge-label">{b.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Trust score bar ── */}
      {trustScore != null && (
        <section className="sc-section">
          <SectionTitle>Trust score</SectionTitle>
          <div className="sc-trust">
            <div className="sc-trust-head">
              <span className="sc-trust-label">Composite</span>
              <span className="sc-trust-value">{trustScore.toFixed(1)}</span>
            </div>
            <div className="sc-trust-bar">
              <div
                className="sc-trust-fill"
                style={{ width: `${Math.min(trustScore, 100)}%` }}
              />
            </div>
            <p className="sc-trust-hint">
              {percentileLabel} across certified users — updated on every new signal.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
