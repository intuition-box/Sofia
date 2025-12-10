import { usePrivy } from '@privy-io/react-auth'
import Background from './background'
import { useRouter } from './RouterProvider'
import '../styles/Global.css'
import '../styles/AppLayout.css'

interface AppLayoutProps {
  children: any
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, authenticated } = usePrivy()
  const account = authenticated ? user?.wallet?.address : null
  const { currentPage } = useRouter()

  return (
    <div className="app-container">
      <Background />
      {(account && currentPage !== 'home-connected') || (!account && currentPage === 'home') ? (
        <div className="app-overlay" />
      ) : null}

      <div className="app-content">
        {children}
      </div>
    </div>
  )
}

export default AppLayout