/**
 * BookmarkPicker — pick a URL straight from My bookmarks: search across all, or
 * browse folders. The label is taken from the bookmark's title automatically.
 * Shared by SkillView (add a resource) and MemoryView (add a source).
 */
import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { hostOf } from '../data/helpers'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { allLinksDeep } from '../data/folderTree'

export function BookmarkPicker({ onPick, onClose }: { onPick: (url: string, title: string) => void; onClose: () => void }) {
  const [path, setPath] = useState<string[]>([])
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()

  const currentNodes = useMemo<BmNode[]>(() => {
    let nodes = MY_BOOKMARKS as BmNode[]
    for (const seg of path) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes
  }, [path])

  const folders = needle ? [] : currentNodes.filter((n): n is BmFolder => n.type === 'folder')
  const links = needle
    ? allLinksDeep(MY_BOOKMARKS as BmNode[])
        .filter((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))
        .slice(0, 40)
    : currentNodes.filter((n): n is BmLink => n.type === 'link').map((l) => ({ title: l.title, url: l.url }))

  return (
    <div className="bkpick">
      <div className="bkpick-bar">
        <Icon name="search" />
        <input
          className="bkpick-search"
          placeholder="Search your bookmarks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <button className="btn btn--quiet btn--sm" onClick={onClose}>
          Close
        </button>
      </div>

      {!needle ? (
        <nav className="bkpick-crumbs">
          <button className="bkpick-crumb" onClick={() => setPath([])}>
            My bookmarks
          </button>
          {path.map((seg, i) => (
            <span className="bkpick-seg" key={`${seg}-${i}`}>
              <span className="bkpick-sep" aria-hidden="true">›</span>
              <button className="bkpick-crumb" onClick={() => setPath((p) => p.slice(0, i + 1))}>
                {seg}
              </button>
            </span>
          ))}
        </nav>
      ) : null}

      {folders.length ? (
        <div className="bkpick-folders">
          {folders.map((f) => (
            <button className="bkpick-folder" key={f.name} onClick={() => setPath((p) => [...p, f.name])}>
              <Icon name="folder" />
              {f.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="bkpick-list">
        {links.length ? (
          links.map((l) => (
            <button className="bkpick-item" key={l.url} onClick={() => onPick(l.url, l.title)}>
              <img
                className="bkpick-fav"
                src={`https://www.google.com/s2/favicons?domain=${hostOf(l.url)}&sz=64`}
                alt=""
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                }}
              />
              <span className="bkpick-item-id">
                <span className="bkpick-item-t">{l.title}</span>
                <span className="bkpick-item-h mono">{hostOf(l.url)}</span>
              </span>
              <Icon name="plus" />
            </button>
          ))
        ) : (
          <p className="bkpick-empty">{needle ? 'No bookmark matches.' : 'Open a folder to see its links.'}</p>
        )}
      </div>
    </div>
  )
}
