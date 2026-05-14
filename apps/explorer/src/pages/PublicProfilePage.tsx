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
  SectionH2,
  EchoesSortTabs,
  type EchoesSortKey,
} from '@0xsofia/design-system'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { userCertsToActivityInputs } from '@/hooks/useIntentionGroups'
import { useTopClaims } from '@/hooks/useTopClaims'
import { useEnsNames } from '@/hooks/useEnsNames'
import ProfileTrustButton from '@/components/profile/ProfileTrustButton'
import { useTrustScore } from '@/hooks/useTrustScore'
import { useUserCertCountsByTopic } from '@/hooks/useUserCertCountsByTopic'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useSignals } from '@/hooks/useSignals'
import { useAddressInterests } from '@/hooks/useAddressInterests'
import { resolveEnsToAddress } from '@/services/ensService'
import type { ConnectionStatus } from '@/types/reputation'
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
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  // ── On-chain data — single round of fetches the rest of the page reads.
  const { profile: onChainProfile, isLoading: onChainLoading } =
    useUserOnChainProfile(addresses.length > 0 ? addresses : undefined)
  const { claims: topClaims, loading: claimsLoading } = useTopClaims(
    addresses.length > 0 ? addresses : undefined,
  )
  const { score: trustScore } = useTrustScore(walletAddress)
  const { signals } = useSignals(walletAddress)

  // Cert counts per topic — same source the personal profile feeds
  // into `useReputationScores`. Drives the radar weight so the charts
  // surface the same numbers the user sees on their own /profile.
  const certCountsByTopic = useUserCertCountsByTopic(
    addresses.length > 0 ? addresses : undefined,
  )

  // Interests — the personal profile's `useInterestsHydration` calls
  // `getSharesBatch(connectedWallet, TOPIC_ATOM_IDS)` against every
  // topic atom and keeps the ones with shares > 0. We do the exact
  // same on-chain read here but for the viewed address, via the
  // pure-read variant `useAddressInterests`. Same source, same set.
  const { topics: ownedTopics, categories: ownedCategories } =
    useAddressInterests(walletAddress)

  const selectedTopics = useMemo<string[]>(() => {
    if (ownedTopics.length > 0) return ownedTopics.slice(0, MAX_INTERESTS)
    // Fallback — for users who only have certifications and never
    // staked on a raw topic atom, surface the top cert contexts so
    // the interests grid isn't empty.
    return [...certCountsByTopic.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_INTERESTS)
      .map(([slug]) => slug)
  }, [ownedTopics, certCountsByTopic])

  const selectedCategories = useMemo<string[]>(
    () => ownedCategories.slice(0, 6),
    [ownedCategories],
  )

  // Platform connections aren't queryable for someone else — stub
  // every lookup as `disconnected` so the score service treats their
  // profile as a pure on-chain footprint. `useReputationScores` then
  // produces the same topic scores the personal profile would
  // synthesize had its platforms been disconnected.
  const getStatus = useMemo(
    () =>
      (_platformId: string): ConnectionStatus =>
        'disconnected',
    [],
  )
  const scores = useReputationScores(
    getStatus,
    selectedTopics,
    selectedCategories,
    trustScore,
    signals,
    certCountsByTopic,
  )
  const topicScores = scores?.topics ?? []

  // Echoes activities feed the bento grid — same source the personal
  // profile uses so the section stays visually identical.
  const echoesActivities = useMemo(
    () => userCertsToActivityInputs(onChainProfile.certs),
    [onChainProfile.certs],
  )

  // ── Hero copy
  const displayName = walletAddress
    ? getDisplay(walletAddress as Address)
    : rawAddress || ''
  const ensAvatar = walletAddress ? getAvatar(walletAddress as Address) : ''
  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
    : ''
  const heroDescription =
    shortAddress && shortAddress !== displayName
      ? shortAddress
      : 'Public profile'
  const initials = (displayName || rawAddress || '?').slice(0, 2).toUpperCase()

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
      {/* Custom hero — same peach-banner silhouette as `<PageHero>` but
          with the viewed user's ENS avatar inlined to the left of the
          title, so visitors immediately see whose profile they're on. */}
      <div
        className="ph-container pp-public-hero"
        style={{ background: PUBLIC_HERO_COLOR }}
      >
        <div className="pp-public-hero-row">
          <span className="pp-public-hero-avatar" aria-hidden="true">
            {ensAvatar ? (
              <img src={ensAvatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="pp-public-hero-initials">{initials}</span>
            )}
          </span>
          <div className="pp-public-hero-text">
            <h1 className="ph-title">
              {displayName || shortAddress || 'Profile'}
            </h1>
            {heroDescription && (
              <p className="ph-description">{heroDescription}</p>
            )}
          </div>
          <ProfileTrustButton
            walletAddress={walletAddress}
            displayName={displayName || shortAddress}
            avatarUrl={ensAvatar}
          />
        </div>
        <div className="ph-deco" aria-hidden="true" />
      </div>

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
            // Echo cards now route to /profile/platform/:domain?address=…
            // so visitors can drill into the viewed user's certs on a
            // given platform, just like the personal profile does for
            // its own wallets.
            viewedAddress={walletAddress}
          />
        </section>
      </div>
    </div>
  )
}
