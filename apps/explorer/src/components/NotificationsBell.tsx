/**
 * NotificationsBell — bell + unread badge + dropdown list, fed by
 * `useGroupNotifications` (REST history + Ably realtime). Mounting it also
 * enables the realtime subscription, so the admin panel + join gate update live.
 */
import { usePrivy } from '@privy-io/react-auth'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useGroupNotifications } from '@/hooks/useGroupNotifications'
import './styles/group-join.css'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function NotificationsBell() {
  const { authenticated } = usePrivy()
  const { notifications, unread, markRead, markAllRead } =
    useGroupNotifications()

  if (!authenticated) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="gj-bell" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="gj-bell-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="gj-notif-menu">
        <div className="gj-notif-head">
          <span className="gj-notif-title">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              className="gj-notif-readall"
              onClick={() => markAllRead()}>
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="gj-notif-empty">You're all caught up.</p>
        ) : (
          <ul className="gj-notif-list">
            {notifications.map((n) => {
              const groupTermId =
                typeof n.metadata?.groupTermId === 'string'
                  ? n.metadata.groupTermId
                  : null
              const body = (
                <>
                  <span className="gj-notif-row-title">{n.title}</span>
                  <span className="gj-notif-row-msg">{n.message}</span>
                  <span className="gj-notif-row-when">{timeAgo(n.createdAt)}</span>
                </>
              )
              return (
                <li
                  key={n.id}
                  className={`gj-notif-row${n.readAt ? '' : ' is-unread'}`}
                  onClick={() => !n.readAt && markRead(n.id)}>
                  {groupTermId ? (
                    <Link to={`/circles/${groupTermId}`} className="gj-notif-link">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                  {!n.readAt && <span className="gj-notif-dot" aria-hidden="true" />}
                </li>
              )
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
