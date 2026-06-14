/**
 * PublicProfilePage — read-only profile view for any wallet address or
 * ENS name. Accessible via `/profile/:address` (public, no auth gate).
 *
 * Mirrors the personal `ProfilePage` skeleton — same section order:
 * ProfileCharts (radar + details with inline interest rail + calendar)
 * followed by the Echoes section (search + sort tabs + bento grid with
 * filter chips) — so a visitor sees the same layout regardless of whose
 * wallet they're looking at. The structural differences are read-only:
 * no add/remove interest affordances, the topic selection is derived
 * from the user's on-chain positions instead of a local taxonomy
 * preference, and the hero shows the viewed wallet rather than the
 * connected user. The custom hero inlines the viewed user's ENS avatar.
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isAddress } from 'viem'
import type { Address } from 'viem'
import { Search, X } from 'lucide-react'
import { SectionH2 } from '@0xsofia/design-system'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { userCertsToActivityInputs } from '@/hooks/useIntentionGroups'
import { useEnsNames } from '@/hooks/useEnsNames'
import ProfileTrustButton from '@/components/profile/ProfileTrustButton'
import { useTrustScore } from '@/hooks/useTrustScore'
import { useUserCertCountsByTopic } from '@/hooks/useUserCertCountsByTopic'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useDerivedReputation } from '@/hooks/useDerivedReputation'
import { useSignals } from '@/hooks/useSignals'
import { useAddressInterests } from '@/hooks/useAddressInterests'
import { useEndorseAttribute } from '@/hooks/useEndorseAttribute'
import { resolveEnsToAddress } from '@/services/ensService'
import type { ConnectionStatus } from '@/types/reputation'
import { MAX_INTERESTS } from '@/components/profile/InterestsGrid'
import ProfileCharts from '@/components/profile/ProfileCharts'
import ProfileAttributes from '@/components/profile/ProfileAttributes'
import LastActivitySection from '@/components/profile/LastActivitySection'
import PublicProfileAside from '@/components/profile/PublicProfileAside'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/pages.css'
import '@/components/styles/profile-sections.css'

const PUBLIC_HERO_COLOR = '#627EEA'

export default function PublicProfilePage() {
  const { address: rawAddress } = useParams<{ address: string }>()
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [echoesSearch, setEchoesSearch] = useState('')

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
  // Endorse ("vote") a skill/tool of the viewed user — stakes their
  // endorsement triple via the Amplify cart.
  const { endorse } = useEndorseAttribute()

  // ── On-chain data — single round of fetches the rest of the page reads.
  const { profile: onChainProfile, isLoading: onChainLoading } =
    useUserOnChainProfile(addresses.length > 0 ? addresses : undefined)
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
  // Boost = credibility of users who positioned AFTER this wallet on its
  // claims, added on top of the per-cert base. See docs/reputation-curation.md.
  const { scoreByTopic: derivedRep } = useDerivedReputation(addresses)
  const topicScores = useMemo(
    () =>
      (scores?.topics ?? []).map((t) => ({
        ...t,
        score: t.score + (derivedRep.get(t.topicId) ?? 0),
      })),
    [scores?.topics, derivedRep],
  )

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
        {/* Profile charts — radar + details (with inline interest rail)
            + calendar. Mirrors the personal profile: the Overview details
            panel embeds the compact interest rail, so there's no standalone
            Interests section. Read-only here — no add/remove affordances on
            someone else's profile. The component already accepts a foreign
            `addresses` array (see prop docs) so no fork needed. */}
        <ProfileCharts
          selectedTopics={selectedTopics}
          topicScores={topicScores}
          addresses={addresses}
        />

        {/* Skills & Tools — on-chain endorsements. Votable here: a visitor
            can endorse this wallet's skills/tools (stakes the triple). */}
        <ProfileAttributes address={walletAddress} onEndorse={endorse} />

        {/* Echoes — same bento grid + head (search + sort tabs) as the
            personal profile. The filter chips + context/verb chips live
            inside LastActivitySection. */}
        <section className="pp-section">
          <div className="pf-echoes-head">
            <div className="pf-echoes-head-left">
              <SectionH2>Echoes</SectionH2>
              <div className="pf-echoes-search">
                <Search
                  className="pf-echoes-search-icon h-3.5 w-3.5"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  className="pf-echoes-search-input"
                  placeholder="Search echoes…"
                  value={echoesSearch}
                  onChange={(e) => setEchoesSearch(e.target.value)}
                  aria-label="Search echoes"
                />
                {echoesSearch ? (
                  <button
                    type="button"
                    className="pf-echoes-search-clear"
                    onClick={() => setEchoesSearch('')}
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <LastActivitySection
            activities={echoesActivities}
            loading={onChainLoading}
            searchQuery={echoesSearch}
            // Echo cards now route to /profile/platform/:domain?address=…
            // so visitors can drill into the viewed user's certs on a
            // given platform, just like the personal profile does for
            // its own wallets.
            viewedAddress={walletAddress}
          />
        </section>
      </div>

      {/* Right rail — viewed-user info (replaces the connected user's
          ProfileDrawer, which is meaningless on someone else's profile). */}
      <PublicProfileAside
        walletAddress={walletAddress}
        displayName={displayName}
        ensAvatar={ensAvatar}
        shortAddress={shortAddress}
        trustScore={trustScore}
        certs={onChainProfile.certs}
        certCountsByTopic={certCountsByTopic}
      />
    </div>
  )
}
