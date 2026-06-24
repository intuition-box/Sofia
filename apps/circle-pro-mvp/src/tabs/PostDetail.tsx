/**
 * PostDetail — wireframe view 4. The detail of a shared link: the sharer's
 * context ("why it's useful"), the link preview, and the comment thread that
 * makes the "who-knows-what" graph. Opens when a feed card is clicked.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { TopicIcon } from '../components/TopicIcon'
import { CATEGORY_MAP } from '../data/topics'
import { TEAM_MAP } from '../data/teams'
import { commentsFor, docType, whyFor, type Comment } from '../lib/discussion'
import { setContext, useMyBookmarks } from '../lib/mybookmarks'
import { avGrad, initials } from '../data/helpers'

export interface PostItem {
  title: string
  url: string
  host: string
  topicId: string
  teamId: string
}

export function CommentRow({ c }: { c: Comment }) {
  const team = TEAM_MAP[c.teamId]
  const grad = c.grad
  return (
    <div className={`pc${c.reply ? ' pc--reply' : ''}`}>
      <span className="pc-av" style={{ background: avGrad(grad) }}>
        {initials(c.who)}
      </span>
      <div className="pc-main">
        <div className="pc-head">
          <span className="pc-who">{c.who}</span>
          {team ? (
            <span className="team-tag" style={{ ['--c' as string]: team.color }}>
              {team.label}
            </span>
          ) : null}
          <span className="pc-when">{c.when}</span>
        </div>
        <p className="pc-text">{c.text}</p>
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

export function PostDetail({ item, onBack }: { item: PostItem; onBack: () => void }) {
  const cat = CATEGORY_MAP[item.topicId]
  const team = TEAM_MAP[item.teamId]
  const type = docType(item.host)
  const abs = item.url.startsWith('http') ? item.url : `https://${item.url}`

  const [comments, setComments] = useState<Comment[]>(() => commentsFor(item.url))
  const [draft, setDraft] = useState('')
  const my = useMyBookmarks()
  const mine = my.context[item.url]
  const [editWhy, setEditWhy] = useState(false)
  const [whyDraft, setWhyDraft] = useState('')
  const [shotOk, setShotOk] = useState(true)
  const send = () => {
    const t = draft.trim()
    if (!t) return
    setComments((cs) => [
      ...cs,
      { id: `${item.url}#you-${cs.length}`, who: 'You', teamId: 'eng', grad: 0, when: 'now', text: t, likes: 0, reply: false },
    ])
    setDraft('')
  }

  return (
    <div className="content">
      <article className="post">
        <button className="post-back" onClick={onBack}>
          <Icon name="chevronLeft" /> Back to feed
        </button>

        <div className="post-tags">
          {team ? (
            <span className="team-tag" style={{ ['--c' as string]: team.color }}>
              {team.label}
            </span>
          ) : null}
          {cat ? (
            <span className="post-tag post-tag--topic" style={{ ['--c' as string]: cat.color }}>
              <TopicIcon id={cat.id} size={13} />
              {cat.label}
            </span>
          ) : null}
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
          <div className="post-why-head">
            <span className="post-why-lab mono">{mine ? 'Your context' : "Why it's useful"}</span>
            {!editWhy ? (
              <button
                className="post-why-edit"
                onClick={() => {
                  setWhyDraft(mine ?? '')
                  setEditWhy(true)
                }}
              >
                <Icon name="edit" /> {mine ? 'Edit' : 'Add your context'}
              </button>
            ) : null}
          </div>
          {editWhy ? (
            <>
              <textarea
                className="post-why-input"
                value={whyDraft}
                onChange={(e) => setWhyDraft(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Why is this useful? Add the context only you have…"
              />
              <div className="post-why-actions">
                <button className="ex-back" onClick={() => setEditWhy(false)}>
                  Cancel
                </button>
                <button
                  className="post-composer-send"
                  onClick={() => {
                    setContext(item.url, whyDraft)
                    setEditWhy(false)
                  }}
                >
                  Save context
                </button>
              </div>
            </>
          ) : (
            <p className="post-why-text">{mine ?? whyFor(item.url)}</p>
          )}
        </div>

        <div className="post-actions">
          <button className="post-action">
            <Icon name="bookmark" /> Save
          </button>
          <button className="post-action">
            <Icon name="send" /> Share
          </button>
        </div>

        <div className="post-comments">
          <h3 className="post-comments-h">{comments.length} comments</h3>
          {comments.map((c) => (
            <CommentRow key={c.id} c={c} />
          ))}

          <div className="post-composer">
            <span className="pc-av" style={{ background: avGrad(0) }}>
              YO
            </span>
            <input
              className="post-composer-input"
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <button className="post-composer-send" onClick={send}>
              Send
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
