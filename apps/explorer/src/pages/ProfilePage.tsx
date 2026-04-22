import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useLogin, useLinkAccount } from '@privy-io/react-auth'
import { useViewAs } from '@/hooks/useViewAs'
import { useTopicSync } from '../hooks/useTopicSync'
import { usePlatformConnections } from '../hooks/usePlatformConnections'
import { useReputationScores } from '../hooks/useReputationScores'
import { useUserActivity } from '../hooks/useUserActivity'
import { useTopClaims } from '../hooks/useTopClaims'
import { useTrustScore } from '../hooks/useTrustScore'
import { useSignals } from '../hooks/useSignals'
import LastActivitySection from '../components/profile/LastActivitySection'
import InterestsGrid from '../components/profile/InterestsGrid'
import ProfileCharts from '../components/profile/ProfileCharts'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Wallet, User } from 'lucide-react'
import { PageHero, SectionTitle, SectionH2, EchoesSortTabs, type EchoesSortKey } from '@0xsofia/design-system'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'
import '@/components/styles/profile-sections.css'

export default function ProfilePage() {
  const { authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { linkWallet } = useLinkAccount({ onSuccess: () => window.location.reload() })
  const { viewAsAddress, isViewingAs, clearViewAs } = useViewAs()
  const address = viewAsAddress || user?.wallet?.address || ''
  const { selectedTopics, selectedCategories, removeTopic } = useTopicSync()
  const navigate = useNavigate()
  const { getStatus } = usePlatformConnections()
  const { score: trustCompositeScore } = useTrustScore(address || undefined)
  const { signals } = useSignals(address || undefined)
  const scores = useReputationScores(getStatus, selectedTopics, selectedCategories, trustCompositeScore, signals)
  const topicScores = scores?.topics ?? []
  const { items: activityItems, loading: activityLoading } = useUserActivity(address || undefined)
  const { claims: topClaims, loading: claimsLoading } = useTopClaims(address || undefined)

  if (!authenticated && !isViewingAs) {
    return (
      <Card className="p-8 text-center">
        <Wallet className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-bold">Connect your wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Connect your wallet to access your profile, select domains, connect platforms, and view your reputation scores.
        </p>
        <Button className="mt-4" onClick={() => login()}>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </Card>
    )
  }

  const pc = PAGE_COLORS['/profile']
  const shortAddr = address ? address.slice(0, 6) + '...' + address.slice(-4) : ''
  const [echoesSort, setEchoesSort] = useState<EchoesSortKey>('platform')
  const heroDescription = isViewingAs
    ? 'Viewing profile'
    : address
      ? `Your on-chain footprint at ${shortAddr}.`
      : pc.subtitle

  return (
    <div className="pf-view page-enter">
      <PageHero
        title={isViewingAs ? shortAddr : pc.title}
        description={heroDescription}
        background={pc.color}
      />

      {/* View-as banner */}
      {isViewingAs && (
        <Card className="pp-wallet-banner" style={{ borderColor: '#627EEA40', background: '#627EEA08' }}>
          <User className="h-5 w-5" style={{ color: '#627EEA' }} />
          <div className="pp-wallet-banner-text">
            <p className="text-sm font-semibold">Viewing as {shortAddr}</p>
            <p className="text-xs text-muted-foreground">Read-only mode — you are viewing another user's profile.</p>
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
            <p className="text-xs text-muted-foreground">Link a wallet to interact, support claims, and build your reputation.</p>
          </div>
          <Button size="sm" onClick={() => linkWallet()}>
            <Wallet className="h-3.5 w-3.5 mr-1" />
            Link Wallet
          </Button>
        </Card>
      )}

      <div className="pp-sections">

        {/* Interests */}
        <section className="pp-section">
          <SectionTitle>{isViewingAs ? 'Interests' : 'My Interests'}</SectionTitle>
          <InterestsGrid
            selectedTopics={selectedTopics}
            selectedCategories={selectedCategories}
            topicScores={topicScores}
            onAddTopic={isViewingAs ? undefined : () => navigate('/profile/topics')}
            onRemoveTopic={isViewingAs ? undefined : removeTopic}
          />
        </section>

        {/* Profile charts — radar + details + calendar + top platforms + top claim */}
        <ProfileCharts
          topClaims={topClaims}
          claimsLoading={claimsLoading}
          walletAddress={address}
          hideplatformPositions={isViewingAs}
          selectedTopics={selectedTopics}
        />

        {/* Echoes */}
        <section className="pp-section">
          <div className="pf-echoes-head">
            <SectionH2>Echoes</SectionH2>
            <EchoesSortTabs value={echoesSort} onChange={setEchoesSort} />
          </div>
          <LastActivitySection
            items={activityItems}
            loading={activityLoading}
            walletAddress={address}
            sort={echoesSort}
          />
        </section>

      </div>
    </div>
  )
}
