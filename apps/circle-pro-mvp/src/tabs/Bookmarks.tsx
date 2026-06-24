/**
 * My bookmarks — your real browser folder tree, brought into Sofia and made
 * better. Navigation mirrors Chrome/Brave: a big breadcrumb walks YOUR folders
 * (Sofia › OPERATION › ACCELERATOR …), sub-folders show as chips, and the links
 * at the current level are the rows. The "improved" part rides on top of the
 * familiar structure: who on your team already keeps each link, your own
 * context note, and the discussion. Click a row → its detail + comments.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { TopicIcon } from '../components/TopicIcon'
import { TopicSelect } from '../components/TopicSelect'
import { TEAM_MAP, teamFor } from '../data/teams'
import { likedBy } from '../data/teammates'
import { suggestCategory, CATEGORY_MAP } from '../data/topics'
import { classify } from '../data/taxonomyNav'
import { addBookmark, setContext, setTopic, useMyBookmarks } from '../lib/mybookmarks'
import { MY_BOOKMARKS, type BmNode, type BmFolder } from '../data/myBookmarks'
import { avGrad, hostOf } from '../data/helpers'
import { countLinks, allLinksDeep, sharedPeople } from '../data/folderTree'
import { PostDetail, type PostItem } from './PostDetail'

const SHOWN_CAP = 60

interface FlatLink {
  title: string
  url: string
}

export function Bookmarks() {
  const my = useMyBookmarks()
  const [path, setPath] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<PostItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [openCrumb, setOpenCrumb] = useState<number | null>(null)
  const crumbsRef = useRef<HTMLElement>(null)
  const [likes, setLikes] = useState<Set<string>>(() => new Set())
  const [ctxEdit, setCtxEdit] = useState<string | null>(null)
  const toggleLike = (url: string) =>
    setLikes((s) => {
      const n = new Set(s)
      if (n.has(url)) n.delete(url)
      else n.add(url)
      return n
    })

  // Root = your top folders, preceded by anything you've added by hand (loose).
  const rootChildren = useMemo<BmNode[]>(() => {
    const added: BmNode[] = my.added.map((b) => ({ type: 'link', title: b.title, url: b.url }))
    return [...added, ...(MY_BOOKMARKS as BmNode[])]
  }, [my.added])

  // Walk the folder path to the nodes shown at the current level.
  const currentNodes = useMemo<BmNode[]>(() => {
    let nodes = rootChildren
    for (const seg of path) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes
  }, [rootChildren, path])

  const needle = q.trim().toLowerCase()

  // The feed: every bookmark under the current folder (deep), so you always see
  // information. Folders are navigated from the breadcrumb, not as cards.
  const links = useMemo<FlatLink[]>(() => {
    const base = allLinksDeep(needle ? rootChildren : currentNodes)
    const filtered = needle
      ? base.filter((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))
      : base
    return filtered.slice(0, SHOWN_CAP)
  }, [currentNodes, rootChildren, needle])

  const currentFolderName = path.length ? path[path.length - 1] : ''
  const totalHere = needle ? links.length : countLinks(currentNodes)

  // Child folders selectable from breadcrumb crumb `c` (0 = root "My bookmarks").
  const foldersAt = (c: number): BmFolder[] => {
    let nodes = rootChildren
    for (const seg of path.slice(0, c)) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes.filter((n): n is BmFolder => n.type === 'folder')
  }
  const crumbClick = (c: number) => {
    setPath((p) => p.slice(0, c))
    setOpenCrumb((o) => (o === c ? null : c))
  }
  const navTo = (c: number, name: string) => {
    setPath((p) => p.slice(0, c).concat(name))
    setOpenCrumb(null)
  }

  useEffect(() => {
    if (openCrumb === null) return
    const onDoc = (e: MouseEvent) => {
      if (crumbsRef.current && !crumbsRef.current.contains(e.target as Node)) setOpenCrumb(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openCrumb])

  const openLink = (l: FlatLink) => {
    setSelected({
      title: l.title,
      url: l.url,
      host: hostOf(l.url),
      topicId: suggestCategory(currentFolderName, l.url),
      teamId: teamFor(l.url),
    })
  }

  const submitAdd = (url: string, title: string, why: string) => {
    const u = url.trim()
    if (!u) return
    const host = hostOf(u)
    const topicId = suggestCategory('', u)
    const { categoryId, nicheId } = classify(u, topicId)
    addBookmark({ title: title.trim() || host, url: u, host, topicId, categoryId, nicheId, teamId: teamFor(u) })
    if (why.trim()) setContext(u, why)
    setAdding(false)
    setPath([])
  }

  if (selected) {
    return <PostDetail item={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="content">
      <div className="kb">
        {/* ── Breadcrumb-driven folder navigation (always present) ── */}
        <nav className="fab-crumbs" aria-label="Breadcrumb" ref={crumbsRef}>
          {[{ label: 'My bookmarks', c: 0 }, ...path.map((seg, i) => ({ label: seg, c: i + 1 }))].map(
            ({ label, c }, idx) => {
              const folders = foldersAt(c)
              return (
                <span className="fab-seg" key={`${label}-${c}`}>
                  {idx > 0 ? (
                    <span className="fab-sep" aria-hidden="true">›</span>
                  ) : null}
                  <span className="fab-crumb-wrap">
                    <button
                      className={`fab-crumb fab-crumb--nav${openCrumb === c ? ' open' : ''}`}
                      onClick={() => crumbClick(c)}
                    >
                      {c > 0 ? <Icon name="folder" /> : null}
                      {label}
                      {folders.length ? <Icon name="chevronDown" /> : null}
                    </button>
                    {openCrumb === c && folders.length ? (
                      <div className="fab-dd">
                        {folders.map((f) => {
                          const people = sharedPeople(f.children)
                          return (
                            <button className="fab-dd-item" key={f.name} onClick={() => navTo(c, f.name)}>
                              <Icon name="folder" />
                              <span className="fab-dd-name">{f.name}</span>
                              {people.length ? (
                                <span className="fab-dd-avs">
                                  {people.slice(0, 3).map((p, j) => (
                                    <span
                                      key={p.name}
                                      className="fab-dd-av"
                                      title={p.name}
                                      style={{ background: avGrad(p.grad), zIndex: 9 - j }}
                                    />
                                  ))}
                                </span>
                              ) : (
                                <span className="fab-dd-n tnum">{countLinks(f.children)}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </span>
                </span>
              )
            },
          )}
        </nav>

        {/* ── Toolbar ── */}
        <div className="fab-bar">
          <div className="bk2-search">
            <Icon name="search" />
            <input
              className="bk2-search-input"
              placeholder="Search all my bookmarks…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="kb-add-btn" onClick={() => setAdding((v) => !v)}>
            <Icon name="plus" /> Add bookmark
          </button>
        </div>

        {adding ? <AddForm onSubmit={submitAdd} onCancel={() => setAdding(false)} /> : null}

        {/* ── Feed: resource title → who shares it + context → actions ── */}
        <div className="kb-resources">
          {links.length ? (
            <div className="kb-feed">
              {links.map((l) => {
                const host = hostOf(l.url)
                const liked = likedBy(l.url)
                const services = [...new Set(liked.people.map((p) => p.teamId))]
                  .map((id) => TEAM_MAP[id])
                  .filter(Boolean)
                const ctxId = my.topics[l.url] ?? suggestCategory('', l.url)
                const ctx = CATEGORY_MAP[ctxId]
                const isLiked = likes.has(l.url)
                const likeCount = liked.total + (isLiked ? 1 : 0)
                const picking = ctxEdit === l.url
                return (
                  <div
                    className="bk-card"
                    key={l.url}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLink(l)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openLink(l)
                    }}
                  >
                    <div className="bk-card-top">
                      <span className="bk-fav">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                          }}
                        />
                      </span>
                      <div className="bk-id">
                        <div className="bk-title">{l.title}</div>
                        <div className="bk-meta">
                          {ctx ? (
                            <span className="bk-ctx-chip" style={{ ['--c' as string]: ctx.color }}>
                              <TopicIcon id={ctx.id} size={12} />
                              {ctx.label}
                            </span>
                          ) : null}
                          <span className="bk-domain mono">{host}</span>
                          <button
                            type="button"
                            className="bk-addctx"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCtxEdit(picking ? null : l.url)
                            }}
                          >
                            <Icon name="plus" /> Context
                          </button>
                        </div>
                      </div>
                      <div className="bk-likes">
                        <button
                          type="button"
                          className={`bk-like${isLiked ? ' on' : ''}`}
                          aria-pressed={isLiked}
                          aria-label="Like"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(l.url)
                          }}
                        >
                          <Icon name="thumbup" />
                          <span className="tnum">{likeCount}</span>
                        </button>
                        {services.length ? (
                          <span className="bk-shared-svcs">
                            {services.map((s) => (
                              <span key={s.id} className="team-tag" style={{ ['--c' as string]: s.color }}>
                                {s.label}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {picking ? (
                      <div className="bk-picker" onClick={(e) => e.stopPropagation()}>
                        <span className="bk-picker-lab mono">In context of</span>
                        <TopicSelect
                          value={ctxId}
                          onChange={(id) => {
                            setTopic(l.url, id)
                            setCtxEdit(null)
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="bk2-empty">Nothing here yet. Open a folder above, or add a bookmark.</p>
          )}
        </div>

        {totalHere > links.length ? (
          <p className="bk2-count mono">Showing {links.length} of {totalHere}</p>
        ) : null}
      </div>
    </div>
  )
}

/* ── Add-bookmark inline form ──────────────────────────────────────────── */
function AddForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (url: string, title: string, why: string) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  return (
    <div className="kb-addform">
      <div className="kb-addrow">
        <input className="kb-addinput" placeholder="Paste a URL…" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
        <input className="kb-addinput" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <textarea
        className="kb-addwhy"
        placeholder="Why is this useful? (your context — optional)"
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        rows={2}
      />
      <div className="kb-addactions">
        <button className="ex-back" onClick={onCancel}>Cancel</button>
        <button className="kb-add-btn kb-add-btn--primary" onClick={() => onSubmit(url, title, why)}>
          Add to my bookmarks
        </button>
      </div>
    </div>
  )
}
