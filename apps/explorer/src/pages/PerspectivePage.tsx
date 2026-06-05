/**
 * PerspectivePage — `/perspective/:mode`.
 *
 * Compiles the URL selection chosen on Compose into a ranked list of
 * URLs via `usePerspective`. The selection chips stay visible above
 * the grid so the user can read what they compiled at a glance.
 *
 * Mode + selection come from the URL: `/perspective/:mode?circles=…&topics=…`
 */
import { useMemo } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { PenSquare } from 'lucide-react'
import { PageHero } from '@0xsofia/design-system'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useGroups } from '@/hooks/useGroups'
import { usePerspective } from '@/hooks/usePerspective'
import { INTENTION_CONFIG } from '@/config/intentions'
import PerspectiveItemCard from '@/components/perspective/PerspectiveItemCard'
import TopicBadge from '@/components/profile/TopicBadge'
import type { CompareMode } from '@/lib/compileActionAnims'
import '@/components/styles/pages.css'
import '@/components/styles/perspective.css'

interface ModeMeta {
  label: string
  subtitle: string
  color: string
}

const MODE_META: Record<CompareMode, ModeMeta> = {
  merge: {
    label: 'Merge',
    subtitle: 'Every URL certified by any of your picks — the broadest union.',
    color: '#8ed1a8',
  },
  intersect: {
    label: 'Intersect',
    subtitle: 'Only the URLs every pick agrees on — the strict overlap.',
    color: '#7bade0',
  },
  subtract: {
    label: 'Subtract',
    subtitle: 'URLs in your first pick that the others missed.',
    color: '#e4b95a',
  },
  contrast: {
    label: 'Contrast',
    subtitle: 'URLs where your picks disagree the most.',
    color: '#e87c7c',
  },
}

// Hardcoded names for synthetic circles (Trust Circle is local, not
// indexed on-chain). On-chain circles fall through to `useGroups()`
// resolution below.
const SYNTHETIC_CIRCLE_NAMES: Record<string, string> = {
  trust: 'Trust Circle',
}

function isCompareMode(v: string | undefined): v is CompareMode {
  return (
    v === 'merge' || v === 'intersect' || v === 'subtract' || v === 'contrast'
  )
}

// Map intention LABEL → color for the result-card badges. Built once
// so PerspectiveItemCard stays free of `INTENTION_CONFIG`.
const INTENTION_COLORS: Record<string, string> = Object.fromEntries(
  Object.values(INTENTION_CONFIG).map((v) => [v.label, v.color]),
)

export default function PerspectivePage() {
  const { mode } = useParams<{ mode: string }>()
  const [searchParams] = useSearchParams()
  const { topicById } = useTaxonomy()
  const { groups } = useGroups()

  const circleIds = useMemo(() => {
    const raw = searchParams.get('circles') ?? ''
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [searchParams])

  const topicIds = useMemo(() => {
    const raw = searchParams.get('topics') ?? ''
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [searchParams])

  const aggregationMode = isCompareMode(mode) ? mode : 'merge'
  const { items, loading, error, hasPicks } = usePerspective(
    circleIds,
    topicIds,
    aggregationMode,
    isCompareMode(mode),
  )

  // term_id → label resolver. Falls back to a truncated id so the chip
  // never renders a 64-char bytes32 string. Kept above any early return
  // so hook order stays stable across mode states.
  const groupLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of groups) map.set(g.termId, g.label)
    return map
  }, [groups])

  if (!isCompareMode(mode)) {
    return <Navigate to="/compose" replace />
  }

  const meta = MODE_META[mode]
  const editHref =
    `/compose?circles=${encodeURIComponent(circleIds.join(','))}` +
    `&topics=${encodeURIComponent(topicIds.join(','))}`

  const resolveCircleName = (id: string): string =>
    SYNTHETIC_CIRCLE_NAMES[id] ??
    groupLabelById.get(id) ??
    `${id.slice(0, 6)}…${id.slice(-4)}`

  return (
    <div className="page-content page-enter perspective-page">
      <Breadcrumb
        items={[
          { label: 'Explore', to: '/' },
          { label: 'Compose', to: editHref },
          { label: `Perspective · ${meta.label}` },
        ]}
      />

      <PageHero
        background={meta.color}
        title={`Perspective · ${meta.label}`}
        description={meta.subtitle}
      />

      <section className="psp-selection">
        <div className="psp-selection-head">
          <span className="psp-kicker">Selection</span>
          <Link to={editHref} className="psp-edit">
            <PenSquare className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>

        <div className="psp-chip-group">
          <span className="psp-chip-label">Circles</span>
          <div className="psp-chips">
            {circleIds.length === 0 ? (
              <span className="psp-chip psp-chip--empty">none</span>
            ) : (
              circleIds.map((id) => (
                <span key={id} className="psp-chip psp-chip--circle">
                  {resolveCircleName(id)}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="psp-chip-group">
          <span className="psp-chip-label">Topics</span>
          <div className="psp-chips">
            {topicIds.length === 0 ? (
              <span className="psp-chip psp-chip--empty">none</span>
            ) : (
              topicIds.map((id) => {
                const topic = topicById(id)
                return (
                  <span
                    key={id}
                    className="psp-chip psp-chip--topic"
                    style={
                      topic
                        ? { ['--topic-color' as string]: topic.color }
                        : undefined
                    }
                  >
                    <TopicBadge
                      topicId={id}
                      color={topic?.color ?? 'var(--ds-muted)'}
                      size={18}
                      title={topic?.label}
                    />
                    {topic?.label ?? id}
                  </span>
                )
              })
            )}
          </div>
        </div>
      </section>

      <div className="psp-results-head">
        <span className="psp-kicker">Result</span>
        {!loading && (
          <span className="psp-results-count">
            {items.length} URL{items.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="psp-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="psp-skeleton-card" />
          ))}
        </div>
      ) : error ? (
        <div className="psp-empty">
          <p className="psp-empty-title">Couldn't compile this perspective.</p>
          <p className="psp-empty-sub">{error}</p>
        </div>
      ) : !hasPicks ? (
        <div className="psp-empty">
          <p className="psp-empty-title">Nothing to compile yet.</p>
          <p className="psp-empty-sub">
            {circleIds.length === 0
              ? 'Pick at least one circle on the Compose page — topics narrow the result but the circles supply the certifying members.'
              : 'The selected circles have no certifications matching the chosen topics. Try a broader topic set or a different circle.'}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="psp-empty">
          <p className="psp-empty-title">No URLs in this perspective.</p>
          <p className="psp-empty-sub">
            {mode === 'intersect'
              ? 'No URL is certified by every circle in your selection. Switch to Merge to see the union, or remove a circle to relax the constraint.'
              : mode === 'subtract'
                ? 'Every URL the first circle certified is also covered by the others. Reorder the circles to flip the base, or try Merge.'
                : mode === 'contrast'
                  ? 'The selected circles agree too much for a Contrast view. Add a circle with different signals to surface divergence.'
                  : 'No URLs found for this selection.'}
          </p>
        </div>
      ) : (
        <div className="psp-grid">
          {items.map((item) => (
            <PerspectiveItemCard
              key={item.objectTermId}
              item={item}
              intentionColors={INTENTION_COLORS}
              showContrastScore={mode === 'contrast'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
