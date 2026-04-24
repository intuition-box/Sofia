/**
 * ComposePage — `/compose`.
 *
 * Proto-aligned layout: hero banner + "Compose your perspective" title
 * row with the four compile-action buttons (Merge / Intersect /
 * Subtract / Contrast) + search + two columns of select-cards —
 * Circles on the left, Topics on the right.
 *
 * Today there is exactly one real circle (the user's Trust Circle); the
 * other proto groups don't exist on-chain yet. Topics come from the
 * live taxonomy. Compile-action buttons are display-only until the
 * three.js compile animation + `/perspective` destination land (see
 * INTEGRATION.md §9 follow-up wave).
 */
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHero } from '@0xsofia/design-system'
import { ArrowUpRight, Search } from 'lucide-react'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { getTopicEmoji } from '@/config/topicEmoji'
import MemberAvatar from '@/components/circles/MemberAvatar'
import CompileActionButton from '@/components/CompileActionButton'
import type { CompareMode } from '@/lib/compileActionAnims'
import '@/components/styles/pages.css'
import '@/components/styles/compose.css'

const COMPARE_MODES: { id: CompareMode; label: string; hint: string }[] = [
  { id: 'merge',     label: 'Merge',     hint: 'Union — everything any selection certified.' },
  { id: 'intersect', label: 'Intersect', hint: 'Strict overlap — where selections agree.' },
  { id: 'subtract',  label: 'Subtract',  hint: 'Difference — in one, missing from others.' },
  { id: 'contrast',  label: 'Contrast',  hint: 'Divergence — where selections disagree most.' },
]

// The only real circle today is the user's Trust Circle. Kept in an
// array so the Circles column can add more when the product ships
// group creation on-chain.
const TRUST_CIRCLE_ID = 'trust'

function decodeCsv(raw: string | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function ComposePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addresses } = useLinkedWallets()
  const { accounts: trustMembers } = useTrustCircle(addresses)
  const { topics } = useTaxonomy()
  // Pre-fill from `?circles=&topics=` — lets PerspectivePage round-trip the
  // selection via the "Edit" button.
  const [selectedCircles, setSelectedCircles] = useState<Set<string>>(
    () => new Set(decodeCsv(searchParams.get('circles'))),
  )
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    () => new Set(decodeCsv(searchParams.get('topics'))),
  )
  const [query, setQuery] = useState('')

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const q = query.trim().toLowerCase()
  const matchesQuery = (label: string) => q.length === 0 || label.toLowerCase().includes(q)

  const circles = useMemo(
    () => [
      {
        id: TRUST_CIRCLE_ID,
        name: 'Trust Circle',
        size: trustMembers.length,
        members: trustMembers.slice(0, 4),
      },
    ],
    [trustMembers],
  )

  const visibleCircles = circles.filter((c) => matchesQuery(c.name))
  const visibleTopics = topics.filter((t) => matchesQuery(t.label))

  // Proto rule: need enough on both sides OR at least two on one side.
  const w = selectedCircles.size
  const t = selectedTopics.size
  const canCompile = (w >= 1 && t >= 1) || w >= 2 || t >= 2

  const handleCompile = (mode: CompareMode) => {
    if (!canCompile) return
    // Aggregation logic lives in a follow-up wave; for now we just
    // forward the selection to `/perspective/:mode` via query string.
    const params = new URLSearchParams()
    if (selectedCircles.size > 0) params.set('circles', Array.from(selectedCircles).join(','))
    if (selectedTopics.size > 0) params.set('topics', Array.from(selectedTopics).join(','))
    const suffix = params.toString() ? `?${params.toString()}` : ''
    navigate(`/perspective/${mode}${suffix}`)
  }

  return (
    <div className="page-content page-enter compose-page">
      <PageHero
        title="Compose"
        description="Mix circles and topics to compile a focused perspective of the network."
      />

      <div className="composer">
        <div className="composer-head">
          <div className="composer-head-row">
            <h2>
              Compose <em>your perspective</em>
            </h2>
            <div className="composer-head-actions">
              {COMPARE_MODES.map((m) => (
                <CompileActionButton
                  key={m.id}
                  mode={m.id}
                  label={m.label}
                  title={m.hint}
                  disabled={!canCompile}
                  onRun={handleCompile}
                />
              ))}
            </div>
          </div>
          <span className="composer-count">
            {w} circle{w === 1 ? '' : 's'} · {t} topic{t === 1 ? '' : 's'}
          </span>
        </div>

        <div className="cmp-search">
          <div style={{ position: 'relative' }}>
            <Search
              className="h-4 w-4"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ds-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="cmp-search-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search circles or topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="composer-grid">
          {/* Circles column */}
          <div className="compose-col">
            <div className="compose-col-head">
              Circles
              <span className="compose-col-count">{visibleCircles.length}</span>
            </div>
            {visibleCircles.length === 0 ? (
              <div className="composer-empty">No circle matches your search.</div>
            ) : (
              visibleCircles.map((c) => {
                const isSelected = selectedCircles.has(c.id)
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    className={`select-card who-card${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedCircles((prev) => toggle(prev, c.id))}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        setSelectedCircles((prev) => toggle(prev, c.id))
                      }
                    }}
                  >
                    <div className="check" aria-hidden="true" />
                    <div className="who-top">
                      <span className="who-name">{c.name}</span>
                      <button
                        type="button"
                        className="cmp-card-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/circles/trust')
                        }}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        View
                      </button>
                    </div>
                    <div className="who-stack">
                      {c.members.map((m) => (
                        <MemberAvatar key={m.termId} member={m} />
                      ))}
                      <span className="who-sub">
                        {c.size} member{c.size === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Topics column */}
          <div className="compose-col">
            <div className="compose-col-head">
              Topics
              <span className="compose-col-count">{visibleTopics.length}</span>
            </div>
            {visibleTopics.length === 0 ? (
              <div className="composer-empty">No topic matches your search.</div>
            ) : (
              visibleTopics.map((topic) => {
                const isSelected = selectedTopics.has(topic.id)
                return (
                  <div
                    key={topic.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    className={`select-card what-card${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedTopics((prev) => toggle(prev, topic.id))}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        setSelectedTopics((prev) => toggle(prev, topic.id))
                      }
                    }}
                  >
                    <div className="check" aria-hidden="true" />
                    <div className="what-head-row">
                      <span className="what-label">Topic</span>
                      <button
                        type="button"
                        className="cmp-card-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/profile/interest/${topic.id}`)
                        }}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        View
                      </button>
                    </div>
                    <div className="what-name">
                      <span className="what-emoji" aria-hidden="true">
                        {getTopicEmoji(topic.id) || '📌'}
                      </span>
                      {topic.label}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
