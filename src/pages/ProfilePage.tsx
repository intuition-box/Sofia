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
import TopClaimsSection from '../components/profile/TopClaimsSection'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Wallet, User } from 'lucide-react'
import PageHeader from '../components/PageHeader'
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

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={isViewingAs ? shortAddr : pc.title} subtitle={isViewingAs ? 'Viewing profile' : pc.subtitle} />

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

      <div className="pp-sections page-content page-enter">

        {/* Top Claims */}
        {(claimsLoading || topClaims.length > 0) && (
          <section className="pp-section">
            <h3 className="pp-section-title">Top Claims</h3>
            <TopClaimsSection
              claims={topClaims}
              loading={claimsLoading}
              walletAddress={address}
              hideplatformPositions={isViewingAs}
            />
          </section>
        )}

        {/* Interests */}
        <section className="pp-section">
          <h3 className="pp-section-title">{isViewingAs ? 'Interests' : 'My Interests'}</h3>
          <InterestsGrid
            selectedTopics={selectedTopics}
            selectedCategories={selectedCategories}
            topicScores={topicScores}
            onAddTopic={isViewingAs ? undefined : () => navigate('/profile/topics')}
            onRemoveTopic={isViewingAs ? undefined : removeTopic}
          />
        </section>

        {/* Last Activity */}
        <section className="pp-section">
          <h3 className="pp-section-title">Last Activity</h3>
          <LastActivitySection
            items={activityItems}
            loading={activityLoading}
            walletAddress={address}
          />
        </section>

      </div>
    </div>
  )
}
