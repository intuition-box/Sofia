import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import chatIcon from '../../components/ui/icons/chatIcon.png'
import LevelProgress from '../ui/LevelProgress'
import PulseAnimation from '../ui/PulseAnimation'
import CircularMenu from '../ui/CircularMenu'
import '../styles/HomeConnectedPage.css'
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const HomeConnectedPage = () => {
  const [chatInput, setChatInput] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const { navigateTo } = useRouter()

  const handleOrbClick = () => {
    setShowMenu(!showMenu)
  }

  const handleBackgroundClick = () => {
    setShowMenu(false)
  }

  return (
    <>
      {showMenu && (
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
            zIndex: 999
          }}
        />
      )}
      <div className="home-connected-page">
        <div className="chat-section">
        <div className="chat-input-container">
          <img
            src={chatIcon}
            alt="Sofia"
            className="chat-logo"
            onClick={async () => {
              if (chatInput.trim()) {
                await storage.set("pendingChatInput", chatInput)
              }
              navigateTo('chat')
            }}

            style={{ cursor: 'pointer' }}
          />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && chatInput.trim()) {
                await storage.set("pendingChatInput", chatInput)
                navigateTo('chat')
              }
            }}
            placeholder="Talk with Sofia..."
            className="chat-input"
          />

        </div>
      </div>

      <div className="level-progress-section">
        <LevelProgress />
      </div>


      <div className="pulse-animation-section">
        <div 
          className="pulse-with-menu"
          style={{
            position: 'relative',
            width: '400px',
            height: '400px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div onClick={handleOrbClick}>
            <PulseAnimation size={120} />
          </div>
          <CircularMenu 
            isVisible={showMenu} 
            onItemClick={(item) => {
              console.log('Menu item clicked:', item)
              setShowMenu(false)
            }}
          />
        </div>
      </div>
      </div>
    </>
  )
}


export default HomeConnectedPage