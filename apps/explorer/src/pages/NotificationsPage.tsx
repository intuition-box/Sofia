/**
 * NotificationsPage — the connected user's notification feed (group-join
 * requests, approvals, role changes), X-style: a sticky column header + a list
 * of rows. Each row carries a type icon, links to the relevant circle when it
 * has a groupTermId, and shows an unread dot until clicked.
 */
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNotifications } from '@/hooks/useGroupNotifications'
import '@/components/styles/notifications-page.css'

type Tone = 'info' | 'positive' | 'negative'

/** Per-type icon + colour intent. Falls back to a neutral bell. */
const TYPE_META: Record<string, { icon: LucideIcon; tone: Tone }> = {
  JOIN_REQUESTED: { icon: UserPlus, tone: 'info' },
  JOIN_APPROVED: { icon: CheckCircle2, tone: 'positive' },
  JOIN_REJECTED: { icon: XCircle, tone: 'negative' },
  ROLE_UPDATED: { icon: ShieldCheck, tone: 'info' },
}

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
        <div className="np-head-l">
          <h1 className="np-title">Notifications</h1>
          {unread > 0 && <span className="np-count">{unread}</span>}
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="np-readall"
            onClick={() => markAllRead()}>
            Mark all read
          </button>
        )}
      </header>

      {loading ? (
        <ul className="np-list" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="np-row">
              <div className="np-row-link">
                <span className="np-ico np-sk" />
                <div className="np-row-main">
                  <span className="np-sk np-sk-line np-sk-line--title" />
                  <span className="np-sk np-sk-line" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : notifications.length === 0 ? (
        <div className="np-state">
          <span className="np-empty-ico">
            <Bell size={22} strokeWidth={2} />
          </span>
          <p className="np-empty-title">You're all caught up</p>
          <p className="np-empty-sub">
            Join requests and role changes will show up here.
          </p>
        </div>
      ) : (
        <ul className="np-list">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, tone: 'info' as Tone }
            const Icon = meta.icon
            const groupTermId =
              typeof n.metadata?.groupTermId === 'string'
                ? n.metadata.groupTermId
                : null
            const body = (
              <>
                <span className={`np-ico np-ico--${meta.tone}`}>
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="np-row-main">
                  <span className="np-row-title">{n.title}</span>
                  <span className="np-row-msg">{n.message}</span>
                </div>
                <div className="np-row-meta">
                  <span className="np-row-when">{timeAgo(n.createdAt)}</span>
                  {!n.readAt && <span className="np-dot" aria-label="unread" />}
                </div>
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
