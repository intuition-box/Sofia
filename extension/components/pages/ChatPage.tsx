import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import logoIcon from '../../assets/iconcolored.png'
import HomeIcon from '../../assets/Icon=home.svg'
import '../styles/ChatPage.css'
import { sendMessageToChatbotSocket, initializeChatbotSocket } from '../../background/websocket'
import { Storage } from "@plasmohq/storage"

const storage = new Storage()


interface Message {
  id: string
  content: string
  sender: 'user' | 'sofia'
  timestamp: Date
}

const ChatPage = () => {
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const { goBack } = useRouter()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [isSocketReady, setSocketReady] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const container = document.querySelector('.chat-messages')
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  useEffect(() => {
    initializeChatbotSocket(() => setSocketReady(true))
  }, [])

  useEffect(() => {
    const fetch = async () => {
      const saved = await storage.get("pendingChatInput")
      if (saved && typeof saved === "string" && saved.trim() !== "") {
        await storage.remove("pendingChatInput")
        setPendingMessage(saved)
        setChatInput(saved) // si tu veux qu’il s'affiche aussi
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (isSocketReady && pendingMessage) {
      handleSendMessage(pendingMessage)
      setPendingMessage(null)
    }
  }, [isSocketReady, pendingMessage])


  const handleSendMessage = (content?: string) => {
    const message = content ?? chatInput
    if (!message.trim()) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    console.log("✉️ Message utilisateur :", message)
    sendMessageToChatbotSocket(message)

    setChatInput("")
  }

    useEffect(() => {
      const loadMessages = async () => {
        const saved = await storage.get("chatMessages")
        if (Array.isArray(saved)) {
          const restored = saved.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          setMessages(restored)
        }
        setIsLoaded(true)
      }
      loadMessages()
    }, [])

    useEffect(() => {
      if (isLoaded) {
        storage.set("chatMessages", messages)
      }
    }, [messages, isLoaded])


  useEffect(() => {
    const handler = (message: any) => {
      if (message?.type === "CHATBOT_RESPONSE") {
        const response: Message = {
          id: Date.now().toString(),
          content: message.text,
          sender: 'sofia',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, response])
      }
    }

    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button onClick={goBack} className="chat-back-button">
          <img src={HomeIcon} alt="Home" className="home-icon" />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'sofia-message'}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            <small className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
        ))}
      </div>

      <div className="chat-input-section">
        <div className="chat-input-container">
          <img src={logoIcon} alt="Sofia" className="chat-logo" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              console.log("🔑 Touche pressée :", e.key)
              if (e.key === 'Enter') handleSendMessage()
            }}
            placeholder="Talk with SofIA"
            className="chat-input"
          />
        </div>
      </div>
    </div>
  )
}

export default ChatPage
