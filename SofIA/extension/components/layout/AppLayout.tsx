import { useStorage } from "@plasmohq/storage/hook"
import SplineBackground from '../Splinebackground'
import { useRouter } from './RouterProvider'
import { MigrationIndicator } from '../ui/MigrationStatus'
import { useAutoMigration } from '../../hooks/useMigration'
import '../styles/Global.css'
import '../styles/AppLayout.css'

interface AppLayoutProps {
  children: any
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage } = useRouter()
  
  // Auto-run migration if needed
  const { isMigrationCompleted, isMigrationRunning, migrationError } = useAutoMigration({
    autoRun: true,
    showLogs: false
  })

  return (
    <div className="app-container">
      <SplineBackground />
      {(account && currentPage !== 'home-connected') || (!account && currentPage === 'home') ? (
        <div className="app-overlay" />
      ) : null}
      
      {/* Migration indicator */}
      <MigrationIndicator className="app-migration-indicator" />
      
      <div className="app-content">
        {children}
      </div>
    </div>
  )
}


export default AppLayout