import { useState } from 'react'
import AddIcon from './icons/quick_action/Selected=add.svg'
import AddHoverIcon from './icons/quick_action/Selected=add hover.svg'
import RemoveIcon from './icons/quick_action/Selected=remove.svg'
import RemoveHoverIcon from './icons/quick_action/Selected=remove hover.svg'
import SendIcon from './icons/quick_action/Selected=send.svg'
import SendHoverIcon from './icons/quick_action/Selected=send hover.svg'
import ViewIcon from './icons/quick_action/Selected=view.svg'
import ViewHoverIcon from './icons/quick_action/Selected=view hover.svg'
import VoteIcon from './icons/quick_action/Selected=vote.svg'
import VoteHoverIcon from './icons/quick_action/Selected=vote hover.svg'
import AmplifyIcon from './icons/quick_action/Selected=amplify.svg'
import AmplifyHoverIcon from './icons/quick_action/Selected=amplify hover.svg'
import ScanIcon from './icons/quick_action/Selected= scan.svg'
import ScanHoverIcon from './icons/quick_action/Selected=scan hover.svg'

interface QuickActionButtonProps {
  action: 'add' | 'remove' | 'send' | 'view' | 'vote' | 'scan' | 'amplify'
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
      scan: { normal: ScanIcon, hover: ScanHoverIcon }, // Utilise les nouveaux SVG Scan avec hover
      amplify: { normal: AmplifyIcon, hover: AmplifyHoverIcon } // Utilise les nouveaux SVG Amplify avec hover
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
        alt={`${action === 'scan' ? 'scan' : action === 'amplify' ? 'amplify' : action} action`}
        className="quick-action-icon"
      />
    </button>
  )
}

export default QuickActionButton