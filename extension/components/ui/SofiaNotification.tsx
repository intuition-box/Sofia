/**
 * SofiaNotification
 *
 * Slide-up notification for browsing nudge.
 * Glassmorphism dark style matching CartDrawer theme.
 */

import { X } from "lucide-react"
import sofiaIcon from "data-base64:~assets/icon-dark-32.png"
import "../styles/SofiaNotification.css"

interface SofiaNotificationProps {
  message: string
  visible: boolean
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
}

export const SofiaNotification = ({
  message,
  visible,
  actionLabel = "Open Cart",
  onAction,
  onDismiss
}: SofiaNotificationProps) => {
  if (!visible) return null

  return (
    <div className="sofia-notification">
      <div className="sofia-notification__header">
        <img
          src={sofiaIcon}
          width={28}
          height={28}
          className="sofia-notification__icon"
          alt="Sofia"
        />
        <span className="sofia-notification__message">{message}</span>
        {onDismiss && (
          <button
            className="sofia-notification__dismiss-btn"
            onClick={onDismiss}>
            <X size={16} />
          </button>
        )}
      </div>
      <div className="sofia-notification__actions">
        {onDismiss && (
          <button
            className="sofia-notification__secondary-btn"
            onClick={onDismiss}>
            Later
          </button>
        )}
        {onAction && (
          <button
            className="sofia-notification__action-btn"
            onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
