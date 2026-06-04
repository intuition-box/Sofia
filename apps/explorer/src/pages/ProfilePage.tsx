import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useLogin, useLinkAccount } from '@privy-io/react-auth'
import { useViewAs } from '@/hooks/useViewAs'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useTopicSync } from '../hooks/useTopicSync'
import { usePlatformConnections } from '../hooks/usePlatformConnections'
import { useReputationScores } from '../hooks/useReputationScores'
import { useDerivedReputation } from '../hooks/useDerivedReputation'
import { useUserCertCountsByTopic } from '../hooks/useUserCertCountsByTopic'
import { useUserOnChainProfile } from '../hooks/useUserOnChainProfile'
import { userCertsToActivityInputs } from '../hooks/useIntentionGroups'
import { useTrustScore } from '../hooks/useTrustScore'
import { useSignals } from '../hooks/useSignals'
import LastActivitySection from '../components/profile/LastActivitySection'
import ProfileCharts from '../components/profile/ProfileCharts'
import { useUntaggedCerts } from '../hooks/useUntaggedCerts'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Wallet, User, Tags, ArrowUpRight, Search, X } from 'lucide-react'
import { PageHero, SectionH2 } from '@0xsofia/design-system'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'
import '@/components/styles/profile-sections.css'

export default function ProfilePage() {
  const { authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { linkWallet } = useLinkAccount({
    onSuccess: () => window.location.reload(),
  })
  const { viewAsAddress, isViewingAs, clearViewAs } = useViewAs()
  const { addresses: myAddresses } = useLinkedWallets()
  const address = viewAsAddress || user?.wallet?.address || ''
  // When viewing yourself, aggregate across all linked wallets. When viewing
  // someone else (isViewingAs), use only their address.
  const activityAddresses = viewAsAddress ? [viewAsAddress] : myAddresses
  const { selectedTopics, selectedCategories } = useTopicSync()
  const navigate = useNavigate()
  const { getStatus } = usePlatformConnections()
  const { score: trustCompositeScore } = useTrustScore(address || undefined)
  const { signals } = useSignals(address || undefined)
  const certCountsByTopic = useUserCertCountsByTopic(activityAddresses)
  // Every topic is scored now (#521); the donut + details panel show the
  // full split, so we hand the chart bundle the complete topic list.
  const scores = useReputationScores(
    getStatus,
    selectedTopics,
    selectedCategories,
    trustCompositeScore,
    signals,
    certCountsByTopic,
  )
  // Base reputation = your own certs per topic (POINTS_PER_CERT). The big
  // driver on top is the support of credible users who positioned AFTER you on
  // your claims (eigentrust-weighted). See docs/reputation-curation.md.
  const { scoreByTopic: derivedRep, loading: boostLoading } =
    useDerivedReputation(activityAddresses)
  const topicScores = useMemo(
    () =>
      (scores?.topics ?? []).map((t) => ({
        ...t,
        score: t.score + (derivedRep.get(t.topicId) ?? 0),
      })),
    [scores?.topics, derivedRep],
  )
  // Echoes derives from the master on-chain profile so the bento groups
  // cover every cert (alltime), staying in sync with calendar/radar/score.
  const { profile, isLoading: profileLoading } = useUserOnChainProfile(
    activityAddresses.length > 0 ? activityAddresses : undefined,
  )
  const echoesActivities = useMemo(
    () => userCertsToActivityInputs(profile.certs),
    [profile.certs],
  )
  // Untagged-cert count feeds the Context Manager banner. Same cache
  // ProfileCharts already reads, so this is a derived value, not a
  // new fetch.
  const { certs: untaggedCerts } = useUntaggedCerts(
    activityAddresses.length > 0 ? activityAddresses : undefined,
  )

  if (!authenticated && !isViewingAs) {
    return (
      <Card className="p-8 text-center">
        <Wallet className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-bold">Connect your wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Connect your wallet to access your profile, select domains, connect
          platforms, and view your reputation scores.
        </p>
        <Button className="mt-4" onClick={() => login()}>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </Card>
    )
  }

  const pc = PAGE_COLORS['/profile']
  const shortAddr = address
    ? address.slice(0, 6) + '...' + address.slice(-4)
    : ''
  const [echoesSearch, setEchoesSearch] = useState('')
  const heroDescription = isViewingAs
    ? 'Exploring this wallet — pick an interest to dive in.'
    : address
      ? `Your reputation across every interest, from ${shortAddr}.`
      : pc.subtitle

  return (
    <div className="pf-view pf-home page-enter">
      <PageHero
        title={isViewingAs ? shortAddr : pc.title}
        description={heroDescription}
        background={pc.color}
      />

      {/* View-as banner */}
      {isViewingAs && (
        <Card
          className="pp-wallet-banner"
          style={{ borderColor: '#627EEA40', background: '#627EEA08' }}
        >
          <User className="h-5 w-5" style={{ color: '#627EEA' }} />
          <div className="pp-wallet-banner-text">
            <p className="text-sm font-semibold">Viewing as {shortAddr}</p>
            <p className="text-xs text-muted-foreground">
              Read-only mode — you are viewing another user's profile.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={clearViewAs}>
            Back to my profile
          </Button>
        </Card>
      )}

      {/* Link wallet banner */}
      {!isViewingAs && !address && (
        <Card className="pp-wallet-banner">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div className="pp-wallet-banner-text">
            <p className="text-sm font-semibold">Read-only mode</p>
            <p className="text-xs text-muted-foreground">
              Link a wallet to interact, support claims, and build your
              reputation.
            </p>
          </div>
          <Button size="sm" onClick={() => linkWallet()}>
            <Wallet className="h-3.5 w-3.5 mr-1" />
            Link Wallet
          </Button>
        </Card>
      )}

      {/* Context Manager CTA — only surfaces when the user has tagable
          certs without an `in context of` link. Hidden on view-as so a
          visitor doesn't see a CTA they can't fulfil. */}
      {!isViewingAs && untaggedCerts.length > 0 && (
        <button
          type="button"
          className="pp-context-banner"
          onClick={() => navigate('/profile/context-manager')}
        >
          <span className="pp-context-banner-icon">
            <Tags className="h-4 w-4" />
          </span>
          <span className="pp-context-banner-text">
            <strong>{untaggedCerts.length}</strong> URL
            {untaggedCerts.length === 1 ? '' : 's'} without context — give them
            topics to grow your reputation
          </span>
          <span className="pp-context-banner-cta">
            Open Context Manager
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </button>
      )}

      <div className="pp-sections">
        {/* Profile charts — radar + details (with inline interest pills)
            + calendar. The Overview details panel now embeds the compact
            interest rail directly, so we no longer render a standalone
            My Interests section. */}
        <ProfileCharts
          selectedTopics={selectedTopics}
          topicScores={topicScores}
          addresses={myAddresses}
          onViewScores={isViewingAs ? undefined : () => navigate('/scores')}
          refining={boostLoading}
          onSelectTopic={
            isViewingAs
              ? undefined
              : (id) => navigate(`/profile/interest/${id}`)
          }
        />

        {/* Echoes */}
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
            loading={profileLoading}
            searchQuery={echoesSearch}
          />
        </section>
      </div>
    </div>
  )
}
