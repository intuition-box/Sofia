import { useState } from 'react'
import AddIcon from './quick_action/Selected=add.svg'
import AddHoverIcon from './quick_action/Selected=add hover.svg'
import RemoveIcon from './quick_action/Selected=remove.svg'
import RemoveHoverIcon from './quick_action/Selected=remove hover.svg'
import SendIcon from './quick_action/Selected=send.svg'
import SendHoverIcon from './quick_action/Selected=send hover.svg'
import ViewIcon from './quick_action/Selected=view.svg'
import ViewHoverIcon from './quick_action/Selected=view hover.svg'
import VoteIcon from './quick_action/Selected=vote.svg'
import VoteHoverIcon from './quick_action/Selected=vote hover.svg'

interface QuickActionButtonProps {
  action: 'add' | 'remove' | 'send' | 'view' | 'vote' | 'scan'
  onClick?: () => void
  className?: string
  disabled?: boolean
}

const QuickActionButton = ({ 
  action, 
  onClick, 
  className,
  disabled = false
}: QuickActionButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const getIcon = () => {
    const iconMap = {
      add: { normal: AddIcon, hover: AddHoverIcon },
      remove: { normal: RemoveIcon, hover: RemoveHoverIcon },
      send: { normal: SendIcon, hover: SendHoverIcon },
      view: { normal: ViewIcon, hover: ViewHoverIcon },
      vote: { normal: VoteIcon, hover: VoteHoverIcon },
      scan: { normal: ViewIcon, hover: ViewHoverIcon } // Utilise les mêmes icônes que view
    }

    return isHovered && !disabled ? iconMap[action].hover : iconMap[action].normal
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
      <img 
        src={getIcon()}
        alt={`${action === 'scan' ? 'scan' : action} action`}
        className="quick-action-icon"
      />
    </button>
  )
}

export default QuickActionButton