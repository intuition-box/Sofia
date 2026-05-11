/**
 * CirclesPage — `/circles` (list) and `/circles/:id` (detail).
 *
 * The page dispatches by route param into two thin sections so each
 * one owns only the hooks it actually needs (no detail queries fire
 * on the list view and vice versa). Detail rendering goes through
 * `<CircleDetailView>` which is agnostic of trust vs group.
 */
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { INTENTION_PASTEL, PageHero } from '@0xsofia/design-system'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useGroups } from '@/hooks/useGroups'
import { useCircle } from '@/hooks/useCircle'
import CirclesFilters from '@/components/circles/CirclesFilters'
import TrustCircleCard from '@/components/circles/TrustCircleCard'
import CreateCircleCard from '@/components/circles/CreateCircleCard'
import GroupCard from '@/components/circles/GroupCard'
import CreateCircleDrawer from '@/components/circles/CreateCircleDrawer'
import CircleDetailView from '@/components/circles/CircleDetailView'
import '@/components/styles/pages.css'
import '@/components/styles/circles.css'

const TRUST_CIRCLE_COLOR_KEY = 'sofia-trust-circle-color'
const TRUST_CIRCLE_COLOR_FALLBACK = 'var(--trusted, #6dd4a0)'

/** Palette surfaced by the Trust Circle color picker. */
const TRUST_CIRCLE_COLOR_OPTIONS: readonly string[] =
  Object.values(INTENTION_PASTEL)

export default function CirclesPage() {
  const { id } = useParams<{ id: string }>()
  if (id) return <CircleDetailSection id={id} />
  return <CirclesListSection />
}

// ── List view ────────────────────────────────────────────────────────

function CirclesListSection() {
  const { addresses } = useLinkedWallets()
  const { accounts: members, loading } = useTrustCircle(addresses)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="pf-view cr-page">
      <PageHero
        title="Circles"
        description="Explore the circles whose signals shape your feed and dive into yours."
      />

      <CirclesFilters />

      <div className="cr-grid">
        <TrustCircleCard members={members} loading={loading} />
        <CreateCircleCard onClick={() => setCreateOpen(true)} />
      </div>

      <DiscoverGroupsSection />

      <CreateCircleDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}

function DiscoverGroupsSection() {
  const { groups, isLoading } = useGroups()

  return (
    <>
      <div className="cr-section-head">
        <h2 className="cr-section-title">Discover groups</h2>
        <span className="cr-section-sub">
          {isLoading
            ? 'Loading…'
            : `${groups.length} group${groups.length === 1 ? '' : 's'} on-chain`}
        </span>
      </div>
      {isLoading && groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading groups…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No `is member of` claims found yet.
        </p>
      ) : (
        <div className="cr-grid">
          {groups.map((g) => (
            <GroupCard key={g.termId} group={g} />
          ))}
        </div>
      )}
    </>
  )
}

// ── Detail view ──────────────────────────────────────────────────────

function CircleDetailSection({ id }: { id: string }) {
  const { circle, isLoading, notFound } = useCircle(id)

  // Trust Circle keeps a local color override persisted to localStorage —
  // a UX nicety that pre-dates groups. Always called (rules-of-hooks
  // safe), only forwarded to the view when the resolved circle is the
  // Trust Circle. Groups render their topic-derived color untouched.
  const [trustColor, setTrustColor] = useState<string>(() => {
    if (typeof window === 'undefined') return TRUST_CIRCLE_COLOR_FALLBACK
    return (
      window.localStorage.getItem(TRUST_CIRCLE_COLOR_KEY) ||
      TRUST_CIRCLE_COLOR_FALLBACK
    )
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(TRUST_CIRCLE_COLOR_KEY, trustColor)
    } catch {
      // ignore — private mode / storage full
    }
  }, [trustColor])

  if (notFound) {
    // Bad id (deleted group, stale share link…) — bounce back to the list.
    return <Navigate to="/circles" replace />
  }

  if (!circle) {
    // Cache cold → skeleton. `<CircleDetailView>` itself doesn't have
    // an empty state and we don't want to flash a 404 while useGroups
    // is still warming up.
    return (
      <div className="pf-view crd-detail">
        <div className="pf-ts-back-row">
          <Link to="/circles" className="pf-btn">
            <ArrowLeft className="h-4 w-4" />
            Back to circles
          </Link>
        </div>
        <p className="text-sm text-muted-foreground" style={{ padding: 24 }}>
          {isLoading ? 'Loading circle…' : 'Circle not found.'}
        </p>
      </div>
    )
  }

  const isTrust = circle.kind === 'trust'
  return (
    <CircleDetailView
      circle={circle}
      colorOverride={isTrust ? trustColor : undefined}
      onColorChange={isTrust ? setTrustColor : undefined}
      colorOptions={isTrust ? TRUST_CIRCLE_COLOR_OPTIONS : undefined}
    />
  )
}
