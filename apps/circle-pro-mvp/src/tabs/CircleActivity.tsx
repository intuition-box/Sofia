/**
 * CircleActivity — the circle's real activity feed: who shared what, who
 * commented where, newest first. Sourced from GET /circles/:id/activity (real
 * bookmarks + comments). Follows the paginated-feed shape with a Load-more pill.
 */
import { avGrad, initials, hostOf } from '../data/helpers'
import { useCircleActivity } from '../hooks/useCircleActivity'
import type { ActivityItem } from '../services/circleProApi'

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString()
}

function Row({ it }: { it: ActivityItem }) {
  const name = it.author.displayName
  const host = hostOf(it.url ?? it.bookmarkKey)
  return (
    <div className="act-row">
      <span className="act-av" style={{ background: avGrad(it.author.avatarSeed) }}>
        {initials(name)}
      </span>
      <div className="act-body">
        <div className="act-line">
          <b>{name}</b>{' '}
          {it.kind === 'share' ? (
            <>
              shared <span className="act-target">{it.title || host}</span>
            </>
          ) : (
            <>
              commented on <span className="act-target">{host}</span>
            </>
          )}
          <span className="act-time mono">· {ago(it.createdAt)}</span>
        </div>
        {it.kind === 'comment' && it.text ? <div className="act-text">{it.text}</div> : null}
        {it.kind === 'share' ? <div className="act-host mono">{host}</div> : null}
      </div>
    </div>
  )
}

export function CircleActivity() {
  const { items, loading, loadingMore, hasMore, loadMore, error } = useCircleActivity()

  if (loading) return <div className="tm-empty">Loading activity…</div>
  if (error) return <div className="tm-empty">{error}</div>
  if (!items.length) {
    return <div className="tm-empty">No activity in this circle yet — share a bookmark to start.</div>
  }

  return (
    <div className="content">
      <div className="act-feed">
        {items.map((it) => (
          <Row key={`${it.kind}:${it.id}`} it={it} />
        ))}
      </div>
      {hasMore ? (
        <div className="act-more">
          <button type="button" className="btn btn-sm" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
