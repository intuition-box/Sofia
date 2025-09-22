import { useState } from 'react'

interface QuickActionButtonProps {
  action: 'add' | 'remove' | 'send' | 'view' | 'vote' | 'scan' | 'amplify' | 'select'
  onClick?: () => void
  className?: string
  disabled?: boolean
  isSelected?: boolean
}

const QuickActionButton = ({ 
  action, 
  onClick, 
  className,
  disabled = false,
  isSelected = false
}: QuickActionButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const getContent = () => {
    const contentMap = {
      add: '➕',
      remove: '❌',
      send: '📤',
      view: '👁️',
      vote: '👍',
      scan: '🔍',
      amplify: '📢',
      select: isSelected ? '✅' : '⭕'
    }

    return contentMap[action]
  }

  return (
    <button
      className={`quick-action-button ${isHovered ? 'hovered' : ''} ${disabled ? 'disabled' : ''} ${className || ''}`}
      data-action={action}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
    >
      <span className="quick-action-icon">
        {getContent()}
      </span>
    </button>
  )
}

export default QuickActionButton