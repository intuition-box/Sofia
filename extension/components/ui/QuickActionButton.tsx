import { useState } from 'react'
import AddIcon from './icons/quick_action/Selected=add.svg'
import AddHoverIcon from './icons/quick_action/Selected=add hover.svg'
import RemoveIcon from './icons/quick_action/Selected=Remove.svg'
import RemoveHoverIcon from './icons/quick_action/Selected=RemoveHover.svg'
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
import SelectIcon from './icons/quick_action/Selected=Select.svg'
import SelectHoverIcon from './icons/quick_action/Selected=Select hover.svg'
import SelectedIcon from './icons/quick_action/Selected=Selected.svg'
import SelectedHoverIcon from './icons/quick_action/Selected=SelectedHover.svg'
import RemoveIcon2 from './icons/quick_action/Selected=Remove.svg'
import RemoveHoverIcon2 from './icons/quick_action/Selected=RemoveHover.svg'
import BookmarkPlusIcon from './icons/bookmark-plus.svg'

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

  const getIcon = () => {
    const iconMap = {
      add: { normal: AddIcon, hover: AddHoverIcon },
      remove: { normal: RemoveIcon, hover: RemoveHoverIcon },
      send: { normal: SendIcon, hover: SendHoverIcon },
      view: { normal: ViewIcon, hover: ViewHoverIcon },
      vote: { normal: VoteIcon, hover: VoteHoverIcon },
      scan: { normal: ScanIcon, hover: ScanHoverIcon },
      amplify: { normal: AmplifyIcon, hover: AmplifyHoverIcon },
      select: {
        normal: isSelected ? SelectedIcon : SelectIcon,
        hover: isSelected ? RemoveIcon2 : SelectHoverIcon
      }
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
      {className === 'portal-button' && action === 'add' ? (
        <>
          <img src={BookmarkPlusIcon} alt="bookmark" className="portal-button-icon" />
          Bookmark
        </>
      ) : (
        <img
          src={getIcon()}
          alt={`${action === 'scan' ? 'scan' : action === 'amplify' ? 'amplify' : action} action`}
          className="quick-action-icon"
        />
      )}
    </button>
  )
}

export default QuickActionButton