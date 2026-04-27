/**
 * PerspectivePage — `/perspective/:mode` stub.
 *
 * Today this page only renders the selection that was compiled from
 * the Compose view: a hero tinted per mode + the picked circles and
 * topics as chips. The aggregation hook (`usePerspective`) and the
 * feed grid land in a follow-up wave — for now the page just proves
 * the routing path end-to-end.
 *
 * Mode + selection come from the URL: `/perspective/:mode?circles=…&topics=…`
 */
import { useMemo } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, PenSquare } from 'lucide-react'
import { PageHero } from '@0xsofia/design-system'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { getTopicEmoji } from '@/config/topicEmoji'
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

// Human-readable name for each circle id. Real metadata will come from
// a `useCircleById` hook once circle creation ships on-chain.
const CIRCLE_NAMES: Record<string, string> = {
  trust: 'Trust Circle',
}

function isCompareMode(v: string | undefined): v is CompareMode {
  return v === 'merge' || v === 'intersect' || v === 'subtract' || v === 'contrast'
}

export default function PerspectivePage() {
  const { mode } = useParams<{ mode: string }>()
  const [searchParams] = useSearchParams()
  const { topicById } = useTaxonomy()

  if (!isCompareMode(mode)) {
    return <Navigate to="/compose" replace />
  }

  const circleIds = useMemo(() => {
    const raw = searchParams.get('circles') ?? ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }, [searchParams])

  const topicIds = useMemo(() => {
    const raw = searchParams.get('topics') ?? ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }, [searchParams])

  const meta = MODE_META[mode]
  const editHref =
    `/compose?circles=${encodeURIComponent(circleIds.join(','))}` +
    `&topics=${encodeURIComponent(topicIds.join(','))}`

  return (
    <div className="page-content page-enter perspective-page">
      <div className="pf-ts-back-row">
        <Link to="/compose" className="pf-btn">
          <ArrowLeft className="h-4 w-4" />
          Back to Compose
        </Link>
      </div>

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
                  {CIRCLE_NAMES[id] ?? id}
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
                    style={topic ? { ['--topic-color' as string]: topic.color } : undefined}
                  >
                    <span aria-hidden="true">{getTopicEmoji(id) || '📌'}</span>
                    {topic?.label ?? id}
                  </span>
                )
              })
            )}
          </div>
        </div>
      </section>

      <div className="psp-empty">
        <p className="psp-empty-title">Compiled perspective coming soon.</p>
        <p className="psp-empty-sub">
          The aggregation pipeline (union / intersection / difference /
          divergence over circle certifications) lands in the next wave. For
          now this page confirms the routing and the payload.
        </p>
      </div>
    </div>
  )
}
