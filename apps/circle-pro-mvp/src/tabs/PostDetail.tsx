/**
 * PostDetail — wireframe view 4. The detail of a shared link: the sharer's
 * context ("why it's useful"), the link preview, and the comment thread.
 *
 * Two comment renderers live here:
 *  - `CommentRow` — the mock visual (Comment from discussion.ts), kept as-is and
 *    reused by Activity.tsx.
 *  - `PostCommentRow` — the REAL thread (PublicComment from circle-pro-api):
 *    public reads, auth+profile-gated writes (add/edit/delete/like).
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { CommentComposer, isMediaUrl } from '../components/CommentComposer'
import { DeptTagByName, DomainTagByTopic } from '../components/Tag'
import { CATEGORY_MAP } from '../data/topics'
import { TEAM_MAP } from '../data/teams'
import { docType, whyFor, type Comment } from '../lib/discussion'
import { likedBy } from '../data/teammates'
import { avGrad, initials } from '../data/helpers'
import { voteSeed } from '../components/VoteButton'
import { bookmarkKey } from '../lib/bookmarkKey'
import { useComments } from '../hooks/useComments'
import { useAuth } from '../hooks/useAuth'
import type { PublicComment } from '../services/circleProApi'

export interface PostItem {
  title: string
  url: string
  host: string
  topicId: string
  teamId: string
}

/* Deterministic "added on" date per link (mock — no real timestamp on bookmarks). */
const WHEN = ['Jan 14', 'Feb 3', 'Feb 27', 'Mar 11', 'Mar 25', 'Apr 8', 'Apr 22', 'May 6']

// Mock comment row — kept for Activity.tsx's "who-knows-what" surface.
export function CommentRow({ c }: { c: Comment }) {
  const grad = c.grad
  return (
    <div className={`pc${c.reply ? ' pc--reply' : ''}`}>
      <span className="pc-av" style={{ background: avGrad(grad) }}>
        {initials(c.who)}
      </span>
      <div className="pc-main">
        <div className="pc-head">
          <span className="pc-who">{c.who}</span>
          <span className="pc-when">{c.when}</span>
        </div>
        {isMediaUrl(c.text) ? (
          <img className="pc-gif" src={c.text} alt="" />
        ) : (
          <p className="pc-text">{c.text}</p>
        )}
        <div className="pc-actions">
          <span className="pc-like">
            <Icon name="thumbup" /> {c.likes}
          </span>
          <button className="pc-reply">Reply</button>
        </div>
      </div>
    </div>
  )
}

/** Compact relative time from an ISO timestamp. */
function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return `${d} d`
}

interface PostCommentRowProps {
  c: PublicComment
  mine: boolean
  onEdit: (id: string, text: string) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  onToggleLike: (c: PublicComment) => Promise<unknown>
}

// Real comment row — backed by circle-pro-api. Same visual language as the mock
// CommentRow, plus @handle, an "edited" badge, and author-only edit/delete.
function PostCommentRow({ c, mine, onEdit, onDelete, onToggleLike }: PostCommentRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(c.text ?? '')
  const [busy, setBusy] = useState(false)

  if (c.deleted) {
    return (
      <div className="pc pc--deleted">
        <span className="pc-av pc-av--ghost" />
        <div className="pc-main">
          <p className="pc-text pc-text--muted">comment deleted</p>
        </div>
      </div>
    )
  }

  const saveEdit = async () => {
    const t = draft.trim()
    if (!t || t === c.text) return setEditing(false)
    setBusy(true)
    try {
      await onEdit(c.id, t)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pc">
      <span className="pc-av" style={{ background: avGrad(c.author.avatarSeed) }}>
        {initials(c.author.displayName)}
      </span>
      <div className="pc-main">
        <div className="pc-head">
          <span className="pc-who">{c.author.displayName}</span>
          <span className="pc-handle mono">@{c.author.handle}</span>
          <span className="pc-when">{timeAgo(c.createdAt)}</span>
          {c.edited ? <span className="pc-edited mono">edited</span> : null}
        </div>

        {editing ? (
          <>
            <textarea
              className="post-why-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="post-why-actions">
              <button className="ex-back" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="post-composer-send" disabled={busy} onClick={saveEdit}>
                Save
              </button>
            </div>
          </>
        ) : isMediaUrl(c.text ?? '') ? (
          <img className="pc-gif" src={c.text ?? ''} alt="" />
        ) : (
          <p className="pc-text">{c.text}</p>
        )}

        <div className="pc-actions">
          <button
            className={`pc-like${c.likedByMe ? ' is-on' : ''}`}
            onClick={() => onToggleLike(c)}
          >
            <Icon name="thumbup" /> {c.likeCount}
          </button>
          {mine && !editing ? (
            <>
              <button className="pc-reply" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="pc-reply" onClick={() => onDelete(c.id)}>
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function PostDetail({ item, onBack }: { item: PostItem; onBack: () => void }) {
  const cat = CATEGORY_MAP[item.topicId]
  const team = TEAM_MAP[item.teamId]
  const type = docType(item.host)
  const abs = item.url.startsWith('http') ? item.url : `https://${item.url}`

  const key = bookmarkKey(item.url)
  const { wallet, authenticated, login } = useAuth()
  const {
    items: comments,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    canWrite,
    add,
    edit,
    remove,
    toggleLike,
  } = useComments(key)

  const sharer = likedBy(item.url).people[0]
  const [shotOk, setShotOk] = useState(true)

  return (
    <div className="content">
      <article className="post post--split">
        <button className="post-back" onClick={onBack}>
          <Icon name="chevronLeft" /> Back to feed
        </button>

        <div className="post-split">
          <div className="post-col-main">
        <div className="post-tags">
          {team ? <DeptTagByName name={team.label} /> : null}
          {cat ? <DomainTagByTopic id={cat.id} label={cat.label} /> : null}
          <span className="post-tag post-tag--type">{type === 'doc' ? 'Doc' : 'Link'}</span>
        </div>

        <h1 className="post-title">{item.title}</h1>

        <a className="post-preview" href={abs} target="_blank" rel="noopener noreferrer">
          <div className={`post-shot${shotOk ? '' : ' is-fallback'}`}>
            {shotOk ? (
              <img
                className="post-shot-img"
                src={`https://image.thum.io/get/width/1200/crop/720/noanimate/${abs}`}
                alt={`Preview of ${item.host}`}
                loading="lazy"
                onError={() => setShotOk(false)}
              />
            ) : (
              <img
                className="post-shot-fav"
                src={`https://www.google.com/s2/favicons?domain=${item.host}&sz=128`}
                alt=""
              />
            )}
          </div>
          <div className="post-preview-foot">
            <span className="post-preview-fav">
              <img
                src={`https://www.google.com/s2/favicons?domain=${item.host}&sz=64`}
                alt=""
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </span>
            <div className="post-preview-id">
              <div className="post-preview-title">{item.title}</div>
              <div className="post-preview-host mono">
                {item.host} <Icon name="ext" />
              </div>
            </div>
          </div>
        </a>

        <div className="post-why">
          {sharer ? (
            <div className="post-why-by">
              <span className="post-why-av" style={{ background: avGrad(sharer.grad) }}>
                {initials(sharer.name)}
              </span>
              <div className="post-why-by-meta">
                <div className="post-why-by-name">{sharer.name}</div>
                <div className="post-why-by-sub mono">Shared · {WHEN[voteSeed(item.url) % WHEN.length]}</div>
              </div>
            </div>
          ) : null}
          <div className="post-why-note">
            <div className="post-why-lab mono">Why it's useful</div>
            <p className="post-why-text">{whyFor(item.url)}</p>
          </div>
        </div>

        <div className="post-actions">
          <button className="post-action">
            <Icon name="bookmark" /> Save
          </button>
          <button className="post-action">
            <Icon name="send" /> Share
          </button>
        </div>
          </div>

          <div className="post-col-side">
        <div className="post-comments">
          <h3 className="post-comments-h">
            {loading
              ? 'Comments'
              : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}
          </h3>

          {loading ? (
            <p className="pc-empty mono">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="pc-empty mono">No comments yet — start the thread.</p>
          ) : (
            comments.map((c) => (
              <PostCommentRow
                key={c.id}
                c={c}
                mine={!!wallet && c.author.wallet === wallet}
                onEdit={edit}
                onDelete={remove}
                onToggleLike={toggleLike}
              />
            ))
          )}

          {hasMore ? (
            <button className="pc-more" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? 'Loading…' : 'Load more comments'}
            </button>
          ) : null}

          {canWrite ? (
            <CommentComposer onSend={(content) => void add(content)} />
          ) : (
            <button className="post-composer-signin" onClick={() => login()}>
              <Icon name="send" />
              {authenticated ? 'Set your handle to comment' : 'Sign in to comment'}
            </button>
          )}
        </div>
          </div>
        </div>
      </article>
    </div>
  )
}
