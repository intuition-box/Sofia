/**
 * NotificationsPage — the connected user's notification feed (group-join
 * requests, approvals, role changes), X-style: a sticky column header + a list
 * of rows. Each row links to the relevant circle when it carries a groupTermId.
 */
import { Link } from 'react-router-dom'
import { useNotifications } from '@/hooks/useGroupNotifications'
import '@/components/styles/notifications-page.css'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function NotificationsPage() {
  const { notifications, unread, loading, markRead, markAllRead } =
    useNotifications()

  return (
    <div className="pf-view np-page">
      <header className="np-head">
        <h1 className="np-title">Notifications</h1>
        {unread > 0 && (
          <button type="button" className="np-readall" onClick={() => markAllRead()}>
            Mark all read
          </button>
        )}
      </header>

      {loading ? (
        <p className="np-empty">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="np-empty">You're all caught up.</p>
      ) : (
        <ul className="np-list">
          {notifications.map((n) => {
            const groupTermId =
              typeof n.metadata?.groupTermId === 'string'
                ? n.metadata.groupTermId
                : null
            const body = (
              <>
                <div className="np-row-main">
                  <span className="np-row-title">{n.title}</span>
                  <span className="np-row-msg">{n.message}</span>
                </div>
                <span className="np-row-when">{timeAgo(n.createdAt)}</span>
              </>
            )
            return (
              <li
                key={n.id}
                className={`np-row${n.readAt ? '' : ' is-unread'}`}
                onClick={() => !n.readAt && markRead(n.id)}>
                {groupTermId ? (
                  <Link to={`/circles/${groupTermId}`} className="np-row-link">
                    {body}
                  </Link>
                ) : (
                  <div className="np-row-link">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
