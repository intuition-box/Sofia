import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import PulseAnimation from '../ui/orbanimation/PulseAnimation'
import CircularMenu from '../ui/orbanimation/CircularMenu'
import PageBlockchainCard from '../ui/PageBlockchainCard'
import FullScreenLoader from '../ui/FullScreenLoader'
import '../styles/HomeConnectedPage.css'
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const HomeConnectedPage = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { navigateTo } = useRouter()

  const handleOrbClick = () => {
    setShowMenu(!showMenu)
  }

  const handleBackgroundClick = () => {
    setShowMenu(false)
  }

  const handleStartAnalysis = () => {
    setIsAnalyzing(true)
    setShowMenu(false)
  }

  const handleStartImport = () => {
    setIsImporting(true)
    setShowMenu(false)
  }

  const handleChatSubmit = async (message: string) => {
    console.log("🎯 handleChatSubmit called with message:", message)
    if (message.trim()) {
      await storage.set("pendingChatInput", message)
      console.log("💾 Message saved to storage:", message)
      navigateTo('chat')
    }
  }

  // Listen for pulse analysis and theme extraction completion via Chrome runtime messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'PULSE_ANALYSIS_COMPLETE') {
        console.log('🫀 Pulse analysis completed, redirecting...')
        setIsAnalyzing(false)
        localStorage.setItem('targetTab', 'Pulse')
        navigateTo('Sofia')
      }
      if (message.type === 'THEME_EXTRACTION_COMPLETE') {
        console.log('📚 Theme extraction completed, redirecting to Echoes...')
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
        isVisible={isAnalyzing}
        message="Analyzing your browsing session..."
      />
      <FullScreenLoader
        isVisible={isImporting}
        message="Importing and analyzing your bookmarks..."
      />
      {showMenu && !isAnalyzing && !isImporting && (
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
            zIndex: 999,
            cursor: 'pointer'
          }}
        />
      )}
      <div className="home-connected-page">
      <PageBlockchainCard />


      <div className="pulse-animation-section">
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
            size={120}
            onToggleMenu={handleOrbClick}
            showMenu={showMenu}
            onChatSubmit={handleChatSubmit}
          />
          <CircularMenu
            isVisible={showMenu}
            onItemClick={(item) => {
              console.log('Menu item clicked:', item)
              setShowMenu(false)
            }}
            onStartAnalysis={handleStartAnalysis}
            onStartImport={handleStartImport}
          />
        </div>
      </div>
      </div>
    </>
  )
}


export default HomeConnectedPage