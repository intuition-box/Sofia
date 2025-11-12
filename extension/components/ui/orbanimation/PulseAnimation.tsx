import './PulseAnimation.css'
import { useState } from 'react'

interface PulseAnimationProps {
  size?: number
  isAnalyzing?: boolean
  onToggleMenu?: () => void
  showMenu?: boolean
  onChatSubmit?: (message: string) => void
}

const PulseAnimation = ({
  size = 60,
  isAnalyzing = false,
  onToggleMenu,
  showMenu = false,
  onChatSubmit
}: PulseAnimationProps) => {
  const [chatInput, setChatInput] = useState("")

  const handleClick = () => {
    if (!isAnalyzing && onToggleMenu) {
      onToggleMenu()
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("⌨️ Key pressed in PulseAnimation:", e.key, "chatInput:", chatInput)
    if (e.key === 'Enter' && chatInput.trim() && onChatSubmit) {
      console.log("✅ Enter detected, calling onChatSubmit with:", chatInput.trim())
      onChatSubmit(chatInput.trim())
      setChatInput("")
    }
  }

  return (
    <div className="container-vao">
      <input
        type="checkbox"
        className="input-orb"
        id="v.a.o."
        name="v.a.o."
        checked={showMenu}
        onChange={handleClick}
        style={{ display: 'none' }}
      />

      <div className="container-chat-ia">
        <div className="chat-bubble">
          <p>
            <span style={{'--word': 0} as React.CSSProperties}>Hey</span>{' '}
            <span style={{'--word': 1} as React.CSSProperties}>!</span>{' '}
            <span style={{'--word': 2} as React.CSSProperties}>What</span>{' '}
            <span style={{'--word': 3} as React.CSSProperties}>can</span>{' '}
            <span style={{'--word': 4} as React.CSSProperties}>I</span>{' '}
            <span style={{'--word': 5} as React.CSSProperties}>do</span>{' '}
            <span style={{'--word': 6} as React.CSSProperties}>for</span>{' '}
            <span style={{'--word': 7} as React.CSSProperties}>you</span>{' '}
            <span style={{'--word': 8} as React.CSSProperties}>?</span>
          </p>
        </div>

        <div className="container-input">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask something to Sofia..."
            className="input-chat"
          />
        </div>
      </div>

      <label htmlFor="v.a.o." className="orb">
        <div className="ball">
          <div className="container-lines"></div>
          <div className="container-rings"></div>
        </div>
        <svg style={{ pointerEvents: 'none' }}>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6"></feGaussianBlur>
            <feColorMatrix
              values="1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 20 -10"
            ></feColorMatrix>
          </filter>
        </svg>
      </label>

      {isAnalyzing && (
        <div className="analyzing-text">
          Analyzing...
        </div>
      )}
    </div>
  )
}

export default PulseAnimation
