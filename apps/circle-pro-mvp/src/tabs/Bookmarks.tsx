/**
 * My bookmarks — your real browser folder tree, brought into Sofia and made
 * better. Navigation mirrors Chrome/Brave: a big breadcrumb walks YOUR folders
 * (Sofia › OPERATION › ACCELERATOR …), sub-folders show as chips, and the links
 * at the current level are the rows. The "improved" part rides on top of the
 * familiar structure: who on your team already keeps each link, your own
 * context note, and the discussion. Click a row → its detail + comments.
 */
import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { TEAM_MAP, teamFor } from '../data/teams'
import { likedBy } from '../data/teammates'
import { suggestCategory } from '../data/topics'
import { classify } from '../data/taxonomyNav'
import { addBookmark, setContext, useMyBookmarks } from '../lib/mybookmarks'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { avGrad, hostOf } from '../data/helpers'
import { countLinks, allLinksDeep, sharedPeople } from '../data/folderTree'
import { PostDetail, type PostItem } from './PostDetail'

const SHOWN_CAP = 60

interface FlatLink {
  title: string
  url: string
}

function Favicon({ host }: { host: string }) {
  const [err, setErr] = useState(false)
  if (err || !host) return <span className="kb-res-fav kb-res-fav--fb">{(host[0] || '?').toUpperCase()}</span>
  return (
    <span className="kb-res-fav">
      <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" loading="lazy" onError={() => setErr(true)} />
    </span>
  )
}

export function Bookmarks() {
  const my = useMyBookmarks()
  const [path, setPath] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<PostItem | null>(null)
  const [adding, setAdding] = useState(false)

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

  const subfolders = useMemo(() => {
    if (needle) return []
    return currentNodes
      .filter((n): n is BmFolder => n.type === 'folder')
      .map((f) => ({ name: f.name, people: sharedPeople(f.children) }))
  }, [currentNodes, needle])

  const links = useMemo<FlatLink[]>(() => {
    if (needle) {
      return allLinksDeep(rootChildren)
        .filter((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))
        .slice(0, SHOWN_CAP)
    }
    return currentNodes
      .filter((n): n is BmLink => n.type === 'link')
      .map((l) => ({ title: l.title, url: l.url }))
      .slice(0, SHOWN_CAP)
  }, [currentNodes, rootChildren, needle])

  const currentFolderName = path.length ? path[path.length - 1] : ''
  const totalHere = needle ? links.length : countLinks(currentNodes)

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
        {/* ── Breadcrumb — only your folder path, root reachable via home icon ── */}
        {path.length > 0 ? (
          <nav className="fab-crumbs" aria-label="Breadcrumb">
            <button className="fab-crumb fab-home fab-home--ic" onClick={() => setPath([])} aria-label="Back to all folders">
              <Icon name="home" />
            </button>
            {path.map((seg, i) => (
              <span className="fab-seg" key={`${seg}-${i}`}>
                <span className="fab-sep" aria-hidden="true">›</span>
                <span className="fab-crumb fab-crumb--facet fab-crumb--folder" style={{ ['--c' as string]: 'var(--ds-muted)' }}>
                  <Icon name="folder" />
                  <button className="fab-crumb-label" onClick={() => setPath((p) => p.slice(0, i + 1))}>
                    {seg}
                  </button>
                </span>
              </span>
            ))}
          </nav>
        ) : null}

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

        {/* ── Sub-folders ── */}
        {subfolders.length ? (
          <div className="kb-deeper">
            <span className="kb-section-lab mono">Folders</span>
            <div className="kb-chips">
              {subfolders.map((f) => (
                <button className="kb-chip kb-chip--folder" key={f.name} onClick={() => setPath((p) => [...p, f.name])}>
                  <Icon name="folder" />
                  {f.name}
                  {f.people.length ? (
                    <span className="kb-chip-people">
                      {f.people.slice(0, 3).map((p, j) => (
                        <span key={p.name} className="kb-chip-av" title={p.name} style={{ background: avGrad(p.grad), zIndex: 9 - j }} />
                      ))}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Links at this level ── */}
        <div className="kb-resources">
          {!needle && currentFolderName ? (
            <span className="kb-section-lab mono">In {currentFolderName}</span>
          ) : needle ? (
            <span className="kb-section-lab mono">Results</span>
          ) : (
            <span className="kb-section-lab mono">Bookmarks</span>
          )}
          {links.length ? (
            <div className="kb-list kb-browse">
              {links.map((l) => {
                const host = hostOf(l.url)
                const liked = likedBy(l.url)
                const resTeam = TEAM_MAP[teamFor(l.url)]
                const note = my.context[l.url]
                return (
                  <div
                    className="kb-res"
                    key={l.url}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLink(l)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openLink(l)
                    }}
                  >
                    <Favicon host={host} />
                    <div className="kb-res-main">
                      <div className="kb-res-title">{l.title}</div>
                      {note ? (
                        <div className="kb-res-why is-mine">
                          <span className="kb-res-mine mono">your note</span>“{note}”
                        </div>
                      ) : null}
                      <div className="kb-res-signals">
                        {liked.total ? (
                          <span className="kb-sig kb-likedby">
                            <span className="kb-lb-avs">
                              {liked.people.map((t, j) => (
                                <span
                                  key={t.name}
                                  className="kb-lb-av"
                                  title={t.name}
                                  style={{ background: avGrad(t.grad), zIndex: 9 - j }}
                                />
                              ))}
                            </span>
                            <span className="kb-lb-txt">
                              <b>{liked.total}</b> from{' '}
                              <span className="kb-lb-team-name" style={{ color: resTeam.color }}>{resTeam.label}</span>
                            </span>
                          </span>
                        ) : (
                          <span className="kb-sig kb-sig--new">Only you so far</span>
                        )}
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
