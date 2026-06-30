/**
 * CirclesPage — `/circles` (list) and `/circles/:id` (detail).
 *
 * The page dispatches by route param into two thin sections so each
 * one owns only the hooks it actually needs (no detail queries fire
 * on the list view and vice versa). Detail rendering goes through
 * `<CircleDetailView>` which is agnostic of trust vs group.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft } from 'lucide-react'
import { INTENTION_PASTEL, PageHero } from '@0xsofia/design-system'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useGroups } from '@/hooks/useGroups'
import { useCircle } from '@/hooks/useCircle'
import { useJoinCircle } from '@/hooks/useJoinCircle'
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
  const { authenticated } = usePrivy()
  const { addresses } = useLinkedWallets()
  const { accounts: trustMembers, loading: trustLoading } =
    useTrustCircle(addresses)
  const { groups, isLoading: groupsLoading } = useGroups()
  const [createOpen, setCreateOpen] = useState(false)

  // Split the on-chain groups into "joined" (rendered as full-content
  // circle cards alongside Trust Circle) and "not joined" (rendered as
  // teasers in the Discover section). Membership = the user is the
  // subject of an `is_member_of` claim in this group.
  const { joinedGroups, discoverGroups } = useMemo(() => {
    const userWallets = new Set(addresses.map((a) => a.toLowerCase()))
    const joined: typeof groups = []
    const discover: typeof groups = []
    for (const g of groups) {
      const isMember = g.memberships.some((m) => {
        const w = m.member.walletAddress?.toLowerCase()
        return w !== undefined && userWallets.has(w)
      })
      if (isMember) joined.push(g)
      else discover.push(g)
    }
    return { joinedGroups: joined, discoverGroups: discover }
  }, [groups, addresses])

  return (
    <div className="pf-view cr-page">
      <PageHero
        background="#CDB4F6"
        title="Circles"
        description={
          authenticated
            ? 'Explore the circles whose signals shape your feed and dive into yours.'
            : 'Discover the circles shaping signal on Sofia — connect to join, create, or dive in.'
        }
      />

      <CirclesFilters />

      {authenticated && (
        <div className="cr-grid">
          <CreateCircleCard onClick={() => setCreateOpen(true)} />
          <TrustCircleCard members={trustMembers} loading={trustLoading} />
          {joinedGroups.map((g) => (
            <GroupCard key={g.termId} group={g} />
          ))}
        </div>
      )}

      <DiscoverGroupsSection
        groups={discoverGroups}
        isLoading={groupsLoading}
        totalCount={groups.length}
      />

      <CreateCircleDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}

interface DiscoverGroupsSectionProps {
  groups: ReturnType<typeof useGroups>['groups']
  isLoading: boolean
  /** Total group count across joined + not-joined. Kept on the prop
   *  so the empty-state copy can distinguish "0 groups exist" from
   *  "you've joined them all". */
  totalCount: number
}

function DiscoverGroupsSection({
  groups,
  isLoading,
  totalCount,
}: DiscoverGroupsSectionProps) {
  return (
    <>
      <div className="cr-section-head">
        <h2 className="cr-section-title">discover groups</h2>
      </div>
      {isLoading && groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading groups…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? 'No `is member of` claims found yet.'
            : 'You have joined every on-chain group. Nothing left to discover here.'}
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
  // Always called (rules-of-hooks safe). `circle` is null on a cold
  // cache; the hook returns disabled-by-default join state in that
  // case, which is what we want during the skeleton render.
  const joinCtl = useJoinCircle(circle)

  // Trust Circle keeps a local color override persisted to localStorage —
  // a UX nicety that pre-dates groups. Always called, only forwarded
  // to the view when the resolved circle is the Trust Circle.
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
        <Breadcrumb
          items={[{ label: 'Circles', to: '/circles' }, { label: 'Circle' }]}
        />
        <p className="text-sm text-muted-foreground" style={{ padding: 24 }}>
          {isLoading ? 'Loading circle…' : 'Circle not found.'}
        </p>
      </div>
    )
  }

  const isTrust = circle.kind === 'trust'
  const locked = !circle.isMember
  return (
    <CircleDetailView
      circle={circle}
      colorOverride={isTrust ? trustColor : undefined}
      onColorChange={isTrust ? setTrustColor : undefined}
      colorOptions={isTrust ? TRUST_CIRCLE_COLOR_OPTIONS : undefined}
      locked={locked}
      joinInCart={joinCtl.inCart}
      joinDisabled={joinCtl.disabledReason !== null}
      joinDisabledReason={joinCtl.disabledHint}
      onJoin={joinCtl.join}
    />
  )
}
