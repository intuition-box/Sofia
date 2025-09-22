import { useStorage } from "@plasmohq/storage/hook"
import { useRouter } from './RouterProvider'
import '../styles/Global.css'
import '../styles/AppLayout.css'

interface AppLayoutProps {
  children: any
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage } = useRouter()

  return (
    <div className="app-container">
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