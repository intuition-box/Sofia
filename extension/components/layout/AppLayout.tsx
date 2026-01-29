import { useWalletFromStorage } from '../../hooks/useWalletFromStorage'
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

  return (
    <div className={`app-container ${isOnboarding ? 'app-container--onboarding' : ''}`}>
      {!isOnboarding && <Background />}
      {!isOnboarding && ((account && currentPage !== 'home-connected') || (!account && currentPage === 'home')) ? (
        <div className="app-overlay" />
      ) : null}

      <div className="app-content">
        {children}
      </div>
    </div>
  )
}

export default AppLayout
