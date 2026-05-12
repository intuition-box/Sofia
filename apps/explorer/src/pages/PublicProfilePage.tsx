/**
 * PublicProfilePage — read-only profile view for any wallet address or
 * ENS name. Accessible via `/profile/:address` (public, no auth gate).
 *
 * Mirrors the personal `ProfilePage` skeleton — same hero, interests
 * grid, ProfileCharts (radar + calendar + top platforms + top claim)
 * and Echoes section — so a visitor sees the same layout regardless
 * of whose wallet they're looking at. The only structural difference
 * is that the interests grid is rendered read-only (no add/remove)
 * and the topic selection is derived from the user's on-chain
 * positions instead of a local taxonomy preference.
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isAddress } from 'viem'
import type { Address } from 'viem'
import {
  PageHero,
  SectionH2,
  EchoesSortTabs,
  type EchoesSortKey,
} from '@0xsofia/design-system'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { userCertsToActivityInputs } from '@/hooks/useIntentionGroups'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useTopClaims } from '@/hooks/useTopClaims'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useTrustScore } from '@/hooks/useTrustScore'
import { resolveEnsToAddress } from '@/services/ensService'
import {
  ATOM_ID_TO_TOPIC,
  ATOM_ID_TO_CATEGORY,
} from '@/config/atomIds'
import InterestsGrid, {
  MAX_INTERESTS,
} from '@/components/profile/InterestsGrid'
import ProfileCharts from '@/components/profile/ProfileCharts'
import LastActivitySection from '@/components/profile/LastActivitySection'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/pages.css'
import '@/components/styles/profile-sections.css'

const PUBLIC_HERO_COLOR = '#627EEA'

export default function PublicProfilePage() {
  const { address: rawAddress } = useParams<{ address: string }>()
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [echoesSort, setEchoesSort] = useState<EchoesSortKey>('platform')

  // Resolve ENS (`.eth` / `.box`) or validate the raw address. The
  // page renders only once `resolvedAddress` is set so downstream
  // hooks always see a stable canonical address.
  useEffect(() => {
    if (!rawAddress) return
    setResolvedAddress(null)
    setResolveError(null)

    if (isAddress(rawAddress)) {
      setResolvedAddress(rawAddress)
      return
    }

    if (rawAddress.endsWith('.eth') || rawAddress.endsWith('.box')) {
      setResolving(true)
      resolveEnsToAddress(rawAddress)
        .then((addr) => {
          if (addr) setResolvedAddress(addr)
          else setResolveError(`Could not resolve "${rawAddress}"`)
        })
        .catch(() => setResolveError(`Could not resolve "${rawAddress}"`))
        .finally(() => setResolving(false))
    } else {
      setResolveError('Invalid address or ENS name')
    }
  }, [rawAddress])

  const walletAddress = resolvedAddress || undefined
  const addresses = useMemo<Address[]>(
    () => (walletAddress ? [walletAddress as Address] : []),
    [walletAddress],
  )
  const { getDisplay } = useEnsNames(addresses)

  // ── On-chain data — single round of fetches the rest of the page reads.
  const { profile: userProfile } = useUserProfile(addresses)
  const { profile: onChainProfile, isLoading: onChainLoading } =
    useUserOnChainProfile(addresses.length > 0 ? addresses : undefined)
  const { claims: topClaims, loading: claimsLoading } = useTopClaims(
    addresses.length > 0 ? addresses : undefined,
  )
  const { score: trustScore } = useTrustScore(walletAddress)

  // Topic selection for the charts. The personal profile pulls this
  // from `useTopicSync` (the user's saved preferences); a visitor has
  // no access to that store, so we derive the top N topics from the
  // viewed user's on-chain footprint instead.
  const selectedTopics = useMemo<string[]>(() => {
    if (!userProfile) return []
    const counts = new Map<string, number>()
    for (const pos of userProfile.positions) {
      const slug = ATOM_ID_TO_TOPIC.get(pos.termId)
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1)
      if (pos.tripleSubjectId) {
        const subSlug = ATOM_ID_TO_TOPIC.get(pos.tripleSubjectId)
        if (subSlug) counts.set(subSlug, (counts.get(subSlug) ?? 0) + 1)
      }
      if (pos.tripleObjectId) {
        const objSlug = ATOM_ID_TO_TOPIC.get(pos.tripleObjectId)
        if (objSlug) counts.set(objSlug, (counts.get(objSlug) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_INTERESTS)
      .map(([slug]) => slug)
  }, [userProfile])

  const selectedCategories = useMemo<string[]>(() => {
    if (!userProfile) return []
    const counts = new Map<string, number>()
    for (const pos of userProfile.positions) {
      const slug = ATOM_ID_TO_CATEGORY.get(pos.termId)
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug]) => slug)
  }, [userProfile])

  // Echoes activities feed the bento grid — same source the personal
  // profile uses so the section stays visually identical.
  const echoesActivities = useMemo(
    () => userCertsToActivityInputs(onChainProfile.certs),
    [onChainProfile.certs],
  )

  // Topic scores aren't available without the viewed user's platform
  // connections, but ProfileCharts gracefully falls back when the
  // array is empty — radar axes still render, the details panel
  // shows zeroes. Pass the trust score so the badge can surface.
  const topicScores = useMemo(
    () =>
      trustScore != null
        ? selectedTopics.map((id) => ({ topicId: id, score: trustScore }))
        : [],
    [selectedTopics, trustScore],
  )

  // ── Hero copy
  const displayName = walletAddress
    ? getDisplay(walletAddress as Address)
    : rawAddress || ''
  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
    : ''
  const heroDescription =
    shortAddress && shortAddress !== displayName
      ? shortAddress
      : 'Public profile'

  // ── Resolution states
  if (resolving) {
    return (
      <div className="pf-view page-enter" style={{ textAlign: 'center' }}>
        <SofiaLoader size={48} />
        <p className="text-sm text-muted-foreground mt-4">
          Resolving {rawAddress}...
        </p>
      </div>
    )
  }

  if (resolveError) {
    return (
      <div className="pf-view page-enter" style={{ textAlign: 'center' }}>
        <p className="text-sm text-muted-foreground">{resolveError}</p>
      </div>
    )
  }

  return (
    <div className="pf-view pf-home page-enter">
      <PageHero
        title={displayName || shortAddress || 'Profile'}
        description={heroDescription}
        background={PUBLIC_HERO_COLOR}
      />

      <div className="pp-sections">
        {/* Interests — mirrors the personal-profile grid. Read-only:
            no add / remove on someone else's profile. */}
        <section className="pp-section">
          <SectionH2>Interests</SectionH2>
          <InterestsGrid
            selectedTopics={selectedTopics}
            topicScores={topicScores}
          />
        </section>

        {/* Profile charts — radar + details + calendar + top platforms
            + top claim. The component already accepts a foreign
            `addresses` array (see prop docs) so no fork needed. */}
        <ProfileCharts
          topClaims={topClaims}
          claimsLoading={claimsLoading}
          walletAddress={walletAddress}
          hideplatformPositions
          selectedTopics={selectedTopics}
          selectedCategories={selectedCategories}
          topicScores={topicScores}
          addresses={addresses}
        />

        {/* Echoes — same bento grid as the personal profile. */}
        <section className="pp-section">
          <div className="pf-echoes-head">
            <SectionH2>Echoes</SectionH2>
            <EchoesSortTabs value={echoesSort} onChange={setEchoesSort} />
          </div>
          <LastActivitySection
            activities={echoesActivities}
            loading={onChainLoading}
            sort={echoesSort}
            linkable={false}
          />
        </section>
      </div>
    </div>
  )
}
