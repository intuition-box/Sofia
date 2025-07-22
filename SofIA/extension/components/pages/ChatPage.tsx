import { useState } from 'react'
import { CornerRightUp } from 'lucide-react'
import logoIcon from '../../assets/iconcolored.png'
import '../styles/ChatPage.css'

interface Message {
  id: string
  content: string
  role: 'user' | 'sofia'
  created_at: number
}

const SERVER_ID = "00000000-0000-0000-0000-000000000000"
const CHANNEL_ID = "c28a5ffd-32c3-4c6d-882c-b81006ed45ad"
const AUTHOR_ID = "2914780f-8ccc-436a-b857-794d5d1b9aa7"

export default function ChatPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || submitting) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      role: "user",
      created_at: Date.now()
    }

    setMessages((prev) => [...prev, userMessage])
    setSubmitting(true)

    try {
      const res = await fetch("http://localhost:3000/api/messaging/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: CHANNEL_ID,
          server_id: SERVER_ID,
          author_id: AUTHOR_ID,
          content: input,
          source_type: "user_message",
          raw_message: input
        })
      })

      const data = await res.json()

      if (typeof data?.data?.content === "string") {
        const sofiaMessage: Message = {
          id: crypto.randomUUID(),
          content: data.data.content,
          role: "sofia",
          created_at: Date.now()
        }
        setMessages((prev) => [...prev, sofiaMessage])
      }
    } catch (err) {
      console.error("❌ Erreur lors de l’envoi :", err)
    }

    setInput("")
    setSubmitting(false)
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>SofIA</h2>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.role === 'user' ? 'user-message' : 'sofia-message'}`}
          >
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-section">
        <div className="chat-input-container">
          <img src={logoIcon} alt="Sofia" className="chat-logo" />
          <input
            type="text"
            placeholder="Talk with SofIA"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="chat-input"
            disabled={submitting}
          />
          <button
            onClick={handleSend}
            className="send-button"
            disabled={submitting}
          >
            {submitting ? (
              <div className="loader" />
            ) : (
              <CornerRightUp size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
