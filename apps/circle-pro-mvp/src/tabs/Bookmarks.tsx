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
import { DeptTagByName } from '../components/Tag'
import { TEAM_MAP, teamFor } from '../data/teams'
import { likedBy } from '../data/teammates'
import { suggestCategory, CATEGORY_MAP, CATEGORIES } from '../data/topics'
import { classify } from '../data/taxonomyNav'
import { addBookmark, setContext, setTopic, useMyBookmarks } from '../lib/mybookmarks'
import { MY_BOOKMARKS, type BmNode, type BmFolder } from '../data/myBookmarks'
import { hostOf } from '../data/helpers'
import { countLinks, allLinksDeep } from '../data/folderTree'
import { PostDetail, type PostItem } from './PostDetail'

const SHOWN_CAP = 60

interface FlatLink {
  title: string
  url: string
}

/* Big OG preview for a card — thum.io screenshot, favicon fallback. */
function BkShot({ url, host }: { url: string; host: string }) {
  const [ok, setOk] = useState(true)
  return (
    <div className="bk-shot">
      {ok ? (
        <img
          className="bk-shot-img"
          src={`https://image.thum.io/get/width/600/crop/360/noanimate/${url}`}
          alt=""
          loading="lazy"
          onError={() => setOk(false)}
        />
      ) : (
        <img className="bk-shot-fav" src={`https://www.google.com/s2/favicons?domain=${host}&sz=128`} alt="" />
      )}
    </div>
  )
}

export function Bookmarks() {
  const my = useMyBookmarks()
  const [path, setPath] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [selected, setSelected] = useState<PostItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [openCrumb, setOpenCrumb] = useState<number | null>(null)
  const crumbsRef = useRef<HTMLElement>(null)
  const [likes, setLikes] = useState<Set<string>>(() => new Set())
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
    const byText = needle
      ? base.filter((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))
      : base
    const byTopic =
      topicFilter === 'all'
        ? byText
        : byText.filter((l) => (my.topics[l.url] ?? suggestCategory('', l.url)) === topicFilter)
    return byTopic.slice(0, SHOWN_CAP)
  }, [currentNodes, rootChildren, needle, topicFilter, my.topics])

  const currentFolderName = path.length ? path[path.length - 1] : ''
  const totalHere = needle || topicFilter !== 'all' ? links.length : countLinks(currentNodes)

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
                        {folders.map((f) => (
                          <button className="fab-dd-item" key={f.name} onClick={() => navTo(c, f.name)}>
                            <Icon name="folder" />
                            <span className="fab-dd-name">{f.name}</span>
                            <span className="fab-dd-n tnum">{countLinks(f.children)}</span>
                          </button>
                        ))}
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
          <TopicFilter value={topicFilter} options={CATEGORIES} onChange={setTopicFilter} />
          <button className="kb-add-btn" onClick={() => setAdding((v) => !v)}>
            <Icon name="plus" /> Add bookmark
          </button>
        </div>

        {adding ? <AddForm onSubmit={submitAdd} onCancel={() => setAdding(false)} /> : null}

        {/* ── Feed: resource title → who shares it + context → actions ── */}
        <div className="kb-resources">
          {links.length ? (
            <div className="kb-feed kb-grid4">
              {links.map((l) => {
                const host = hostOf(l.url)
                const liked = likedBy(l.url)
                const services = [...new Set(liked.people.map((p) => p.teamId))]
                  .map((id) => TEAM_MAP[id])
                  .filter(Boolean)
                const ctxId = my.topics[l.url] ?? suggestCategory('', l.url)
                const isLiked = likes.has(l.url)
                const likeCount = liked.total + (isLiked ? 1 : 0)
                const abs = l.url.startsWith('http') ? l.url : `https://${l.url}`
                return (
                  <div
                    className="bk-card bk-card--xl"
                    key={l.url}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLink(l)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openLink(l)
                    }}
                  >
                    <BkShot url={abs} host={host} />
                    <div className="bk-body">
                      <div className="bk-title">{l.title}</div>
                      <div className="bk-meta" onClick={(e) => e.stopPropagation()}>
                        <TopicSelect value={ctxId} onChange={(id) => setTopic(l.url, id)} />
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
                              <DeptTagByName key={s.id} name={s.label} />
                            ))}
                          </span>
                        ) : null}
                      </div>
                    </div>
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

/* ── Topic filter — single dropdown over the feed (mirrors the Explorer
   circle feed filters, scoped to topic/context). ──────────────────────── */
function TopicFilter({
  value,
  options,
  onChange,
}: {
  value: string
  options: { id: string; label: string; color: string }[]
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const active = value !== 'all' ? CATEGORY_MAP[value] : null
  return (
    <div className="bk-filter" ref={ref}>
      <button
        type="button"
        className="bk-filter-trigger"
        style={active ? { ['--c' as string]: active.color } : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="bk-filter-lab mono">Topic</span>
        <span className="bk-filter-val">
          {active ? (
            <>
              <TopicIcon id={active.id} size={15} />
              {active.label}
            </>
          ) : (
            'All'
          )}
        </span>
        <Icon name="chevronDown" />
      </button>
      {open ? (
        <div className="bk-filter-pop">
          <button
            type="button"
            className={`bk-filter-opt${value === 'all' ? ' on' : ''}`}
            onClick={() => {
              onChange('all')
              setOpen(false)
            }}
          >
            All topics
          </button>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`bk-filter-opt${value === o.id ? ' on' : ''}`}
              style={{ ['--c' as string]: o.color }}
              onClick={() => {
                onChange(o.id)
                setOpen(false)
              }}
            >
              <TopicIcon id={o.id} size={16} />
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
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
