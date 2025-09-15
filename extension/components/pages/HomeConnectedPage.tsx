import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import chatIcon from '../../components/ui/icons/chatIcon.png'
import LevelProgress from '../ui/LevelProgress'
import PulseAnimation from '../ui/PulseAnimation'
import '../styles/HomeConnectedPage.css'
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const HomeConnectedPage = () => {
  const [chatInput, setChatInput] = useState("")
  const { navigateTo } = useRouter()

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


      <div className="pulse-animation-section">
        <PulseAnimation size={120} />
      </div>
    </div>
  )
}


export default HomeConnectedPage