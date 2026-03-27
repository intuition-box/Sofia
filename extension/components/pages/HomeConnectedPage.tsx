import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import PulseAnimation from '../ui/orbanimation/PulseAnimation'
import CircularMenu from '../ui/orbanimation/CircularMenu'
import PageBlockchainCard from '../ui/PageBlockchainCard'
import FullScreenLoader from '../ui/FullScreenLoader'
import '../styles/HomeConnectedPage.css'
import { createHookLogger } from '../../lib/utils'

const logger = createHookLogger('HomeConnectedPage')

const HomeConnectedPage = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { navigateTo } = useRouter()

  const handleOrbClick = () => {
    setShowMenu(!showMenu)
  }

  const handleBackgroundClick = () => {
    setShowMenu(false)
  }

  const handleStartImport = () => {
    setIsImporting(true)
    setShowMenu(false)
  }

  // Listen for theme extraction completion via Chrome runtime messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'THEME_EXTRACTION_COMPLETE') {
        logger.info('Theme extraction completed, redirecting to Echoes')
        setIsImporting(false)
        localStorage.setItem('targetTab', 'Echoes')
        navigateTo('Sofia')
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  return (
    <>
      <FullScreenLoader
        isVisible={isImporting}
        message="Importing and analyzing your bookmarks..."
      />
      {showMenu && !isImporting && (
        <div
          className="page-blur-overlay"
          onClick={handleBackgroundClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.1) 80%, rgba(0, 0, 0, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 50,
            cursor: 'pointer'
          }}
        />
      )}
      <div className="home-connected-page">
      <PageBlockchainCard />


      <div className={`pulse-animation-section ${showMenu ? "menu-open" : ""}`}>
        <div
          className="pulse-with-menu"
          style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <PulseAnimation
            onToggleMenu={handleOrbClick}
            showMenu={showMenu}
          />
          <CircularMenu
            isVisible={showMenu}
            onItemClick={(item) => {
              logger.debug('Menu item clicked', { item })
              setShowMenu(false)
            }}
            onStartImport={handleStartImport}
          />
        </div>
      </div>
      </div>
    </>
  )
}


export default HomeConnectedPage