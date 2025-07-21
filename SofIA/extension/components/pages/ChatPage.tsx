import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import logoIcon from '../../assets/iconcolored.png'
import '../styles/ChatPage.css'

interface Message {
  id: string
  content: string
  sender: 'user' | 'sofia'
  timestamp: Date
}

const ChatPage = () => {
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit',
      sender: 'sofia',
      timestamp: new Date()
    },
    {
      id: '2',
      content: 'Sed ut perspiciatis unde omnis iste natus error sit.',
      sender: 'user',
      timestamp: new Date()
    },
    {
      id: '3',
      content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit',
      sender: 'sofia',
      timestamp: new Date()
    },
    {
      id: '4',
      content: 'Sed ut perspiciatis unde omnis iste natus error sit.',
      sender: 'user',
      timestamp: new Date()
    },
    {
      id: '5',
      content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit',
      sender: 'sofia',
      timestamp: new Date()
    }
  ])
  const { goBack } = useRouter()

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: chatInput,
        sender: 'user',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newMessage])
      setChatInput("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button onClick={goBack} className="back-button">
          ←
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
          </div>
        ))}
      </div>
      
      <div className="chat-input-section">
        <div className="chat-input-container">
          <img 
            src={logoIcon} 
            alt="Sofia" 
            className="chat-logo" 
          />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Talk with SofIA"
            className="chat-input"
          />
        </div>
      </div>
    </div>
  )
}

export default ChatPage