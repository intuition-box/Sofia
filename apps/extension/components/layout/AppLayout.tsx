import { useWalletFromStorage } from '../../hooks'
import Background from './background'
import { useRouter } from './RouterProvider'
import '../styles/Global.css'
import '../styles/AppLayout.css'

interface AppLayoutProps {
  children: any
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { walletAddress, authenticated } = useWalletFromStorage()
  const account = authenticated ? walletAddress : null
  const { currentPage } = useRouter()

  const isOnboarding = currentPage.startsWith('onboarding')
  // The bottom navigation only renders when a wallet is connected
  // (see BottomNavigation). Without it we must not reserve its footprint,
  // otherwise the full-height login page overflows and scrolls.
  const showBottomNav = !!account

  return (
    <div className={`app-container ${isOnboarding ? 'app-container--onboarding' : ''}`}>
      {!isOnboarding && <Background />}
      {!isOnboarding && ((account && currentPage !== 'mark') || (!account && currentPage === 'home')) ? (
        <div className="app-overlay" />
      ) : null}

      <div className={`app-content ${showBottomNav ? '' : 'app-content--no-nav'}`}>
        {children}
      </div>
    </div>
  )
}

export default AppLayout
