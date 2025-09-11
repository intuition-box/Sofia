import { useState } from 'react'
import { useTracking } from '../../hooks/useTracking'
import { useRouter } from '../layout/RouterProvider'
import chatIcon from '../../components/ui/icons/chatIcon.png'
import toggleTrue from '../ui/icons/button=True.png'
import toggleFalse from '../ui/icons/button=False.png'
import LevelProgress from '../ui/LevelProgress'
import '../styles/HomeConnectedPage.css'
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const HomeConnectedPage = () => {
  const [chatInput, setChatInput] = useState("")
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()

  return (
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

      <div className="floating-buttons">
        <button
          onClick={toggleTracking}
          className="floating-button-check"
          title={isTrackingEnabled ? "Tracking enabled" : "Tracking disabled"}
        >
          <img
            src={isTrackingEnabled ? toggleTrue : toggleFalse}
            alt={isTrackingEnabled ? "Enabled" : "Disabled"}
            className="toggle-icon"
          />
        </button>
      </div>
    </div>
  )
}


export default HomeConnectedPage