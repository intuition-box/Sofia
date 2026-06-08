import { Suspense, lazy, useState, useCallback } from 'react'
import { useWalletFromStorage } from '../../hooks'
import Breadcrumb from '../ui/Breadcrumb'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'
import '../styles/CommunityHomeView.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./circles-tabs/CircleFeedTab'))
const CommunityHomeView = lazy(() => import('./circles-tabs/CommunityHomeView'))
const TrustCirclePanel = lazy(() =>
  import('./circles-tabs/follow/TrustCirclePanel').then(m => ({
    default: m.TrustCirclePanel
  }))
)

type CircleLayer = 'home' | 'feed' | 'members'

const CirclesPage = () => {
  const { walletAddress } = useWalletFromStorage()
  const [circleLayer, setCircleLayer] = useState<CircleLayer>('home')

  const goToMembers = useCallback(() => {
    setCircleLayer('members')
  }, [])

  return (
    <div className="page">
      <div className="page-content">
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {circleLayer === 'home' && (
            <CommunityHomeView
              onOpenFeed={() => setCircleLayer('feed')}
              onTrustAdded={goToMembers}
            />
          )}
          {circleLayer === 'feed' && (
            <>
              <Breadcrumb
                crumbs={[
                  { label: 'Circles', onClick: () => setCircleLayer('home') },
                  { label: 'Feed' }
                ]}
              />
              <CircleFeedTab onViewMembers={() => setCircleLayer('members')} />
            </>
          )}
          {circleLayer === 'members' && (
            <>
              <Breadcrumb
                crumbs={[
                  { label: 'Circles', onClick: () => setCircleLayer('home') },
                  { label: 'Trust Circle Members' }
                ]}
              />
              <TrustCirclePanel
                walletAddress={walletAddress}
                onInviteMember={() => setCircleLayer('home')}
              />
            </>
          )}
        </Suspense>
      </div>
    </div>
  )
}

export default CirclesPage
