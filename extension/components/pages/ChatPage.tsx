import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import logoIcon from '../ui/icons/chatIcon.png'
import '../styles/ChatPage.css'
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
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const container = document.querySelector('.chat-messages')
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  // Define handleSendMessage BEFORE useEffect that uses it
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

    // ✅ Send message to service worker to handle Socket.IO
    // ChatPage runs in sidepanel context, socket runs in service worker context
    chrome.runtime.sendMessage({
      type: "SEND_CHATBOT_MESSAGE",
      text: message
    }).catch(err => console.error("Failed to send message to background:", err))

    setChatInput("")
  }

  // Load pending message from storage (sent from other pages)
  useEffect(() => {
    const fetch = async () => {
      const saved = await storage.get("pendingChatInput")
      if (saved && typeof saved === "string" && saved.trim() !== "") {
        await storage.remove("pendingChatInput")
        setPendingMessage(saved)
        setChatInput(saved)
      }
    }
    fetch()
  }, [])

  // Send pending message immediately (socket is already initialized by background/index.ts)
  useEffect(() => {
    if (pendingMessage) {
      handleSendMessage(pendingMessage)
      setPendingMessage(null)
    }
  }, [pendingMessage])

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
      console.log("🔔 [ChatPage] Received message:", message)

      if (message?.type === "CHATBOT_RESPONSE") {
        console.log("✅ [ChatPage] Processing CHATBOT_RESPONSE:", message.text)

        const response: Message = {
          id: Date.now().toString(),
          content: message.text,
          sender: 'sofia',
          timestamp: new Date()
        }

        setMessages(prev => {
          console.log("📝 [ChatPage] Adding message to state, current count:", prev.length)
          return [...prev, response]
        })
      }
    }

    console.log("🎧 [ChatPage] Message listener registered")
    chrome.runtime.onMessage.addListener(handler)
    return () => {
      console.log("🔌 [ChatPage] Message listener removed")
      chrome.runtime.onMessage.removeListener(handler)
    }
  }, [])

  return (
    <div className="chat-page">

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
          <img
            src={logoIcon}
            alt="Sofia"
            className="chat-logo"
            onClick={goBack}
            style={{ cursor: 'pointer' }}
          />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              console.log("🔑 Key pressed:", e.key)
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
