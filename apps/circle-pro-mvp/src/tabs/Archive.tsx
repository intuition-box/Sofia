/**
 * Archive — a named collection (e.g. "EthCC Cannes 2025") of saved items grouped
 * into categories. A switcher picks the archive; the card below shows it in a
 * read view or an edit view. Anyone can add items, rename categories, or spin up
 * a new category — the "dump fast, sort later" surface.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { BookmarkPicker } from '../components/BookmarkPicker'
import { DomainTagByTopic } from '../components/Tag'
import { avGrad, initials } from '../data/helpers'
import { TOPIC_MAP } from '../data/mock'
import { toast } from '../lib/toast'
import {
  addCategory,
  addItem,
  createArchive,
  removeCategory,
  renameArchive,
  renameCategory,
  setArchiveDesc,
  useArchivesStore,
  voteItem,
  type Archive as ArchiveT,
  type ArchiveCategory,
  type ArchiveItem,
} from '../lib/archives'

/* Small round monogram avatar. */
function Av({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <span
      className="ar-av"
      style={{ width: size, height: size, fontSize: size * 0.5, background: avGrad(name.length % 6) }}
    >
      {initials(name)}
    </span>
  )
}

export function Archive() {
  const archives = useArchivesStore()
  const [selId, setSelId] = useState(archives[0]?.id ?? '')
  const [editing, setEditing] = useState(false)
  const archive = archives.find((a) => a.id === selId) ?? archives[0]

  if (!archive) return null

  const selectArchive = (id: string) => {
    setSelId(id)
    setEditing(false)
  }

  return (
    <section className="module ar">
      <div className="ar-switch">
        {archives.map((a) => (
          <button
            key={a.id}
            className={`ar-tab${a.id === archive.id ? ' on' : ''}`}
            onClick={() => selectArchive(a.id)}
          >
            {a.name}
          </button>
        ))}
        <button
          className="ar-tab ar-tab--new"
          onClick={() => {
            const id = createArchive('New archive')
            setSelId(id)
            setEditing(true)
          }}
        >
          ＋ New archive
        </button>
      </div>

      <div className="ar-card">
        {editing ? (
          <ArchiveEdit archive={archive} onDone={() => setEditing(false)} />
        ) : (
          <ArchiveRead archive={archive} onEdit={() => setEditing(true)} />
        )}
      </div>
    </section>
  )
}

/* ── Read view ──────────────────────────────────────────────────────────── */

function ArchiveRead({ archive, onEdit }: { archive: ArchiveT; onEdit: () => void }) {
  return (
    <>
      <div className="ar-head">
        <div className="ar-headbar">
          <div className="ar-byline">
            <Av name={archive.createdBy} size={24} />
            <span>
              Created by <b>{archive.createdBy}</b>
            </span>
          </div>
          <div className="ar-headbar-actions">
            <button className="ar-add-btn" onClick={onEdit}>
              <Icon name="plus" /> Add item
            </button>
            <button className="ar-edit-btn" onClick={onEdit}>
              <Icon name="edit" /> Edit
            </button>
          </div>
        </div>
        <h1 className="ar-title">{archive.name}</h1>
        {archive.desc ? <p className="ar-desc">{archive.desc}</p> : null}
      </div>

      {archive.categories.map((cat) => (
        <div className="ar-cat" key={cat.id}>
          <div className="ar-cat-head">
            <span className="ar-dot" style={{ background: cat.color }} />
            <span className={`ar-cat-name${cat.unsorted ? ' ar-cat-name--muted' : ''}`}>{cat.name}</span>
          </div>
          {cat.items.map((it) => (
            <ReadItem key={it.id} archiveId={archive.id} catId={cat.id} it={it} />
          ))}
        </div>
      ))}
    </>
  )
}

function ReadItem({ archiveId, catId, it }: { archiveId: string; catId: string; it: ArchiveItem }) {
  return (
    <a className="ar-item" href={it.url} target="_blank" rel="noopener noreferrer">
      <span className="ar-item-fav">
        <img src={`https://www.google.com/s2/favicons?domain=${it.host}&sz=64`} alt="" loading="lazy" />
      </span>
      <span className="ar-item-body">
        <span className="ar-item-title">{it.title}</span>
        <span className="ar-item-tags">
          <DomainTagByTopic id={it.topic} label={TOPIC_MAP[it.topic]?.label ?? it.topic} />
          {it.meta ? <span className="ar-item-meta mono">{it.meta}</span> : null}
        </span>
        <span className="ar-item-host mono">{it.host}</span>
        {it.note ? <span className="ar-item-note">{it.note}</span> : null}
      </span>
      <button
        className={`ar-vote${it.voted ? ' on' : ''}`}
        aria-pressed={it.voted}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          voteItem(archiveId, catId, it.id)
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 15 6-6 6 6" />
        </svg>
        <span className="tnum">{it.votes}</span>
      </button>
    </a>
  )
}

/* ── Edit view ──────────────────────────────────────────────────────────── */

function ArchiveEdit({ archive, onDone }: { archive: ArchiveT; onDone: () => void }) {
  const [newCat, setNewCat] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)

  const submitCat = () => {
    if (!newCat.trim()) return
    addCategory(archive.id, newCat)
    setNewCat('')
  }

  return (
    <>
      <div className="ar-head">
        <div className="ar-edit-bar">
          <button className="ar-done" onClick={onDone}>
            Done
          </button>
        </div>

        <label className="ar-lab mono">Name</label>
        <input
          className="ar-name-in"
          value={archive.name}
          onChange={(e) => renameArchive(archive.id, e.target.value)}
        />

        <label className="ar-lab mono">Description</label>
        <textarea
          className="ar-desc-in"
          rows={2}
          value={archive.desc}
          onChange={(e) => setArchiveDesc(archive.id, e.target.value)}
        />
      </div>

      {archive.categories.map((cat) => (
        <div className="ar-cat" key={cat.id}>
          <div className="ar-cat-head ar-cat-head--edit">
            <span className="ar-dot" style={{ background: cat.color }} />
            {cat.unsorted ? (
              <span className="ar-cat-name ar-cat-name--muted ar-cat-name--static">{cat.name}</span>
            ) : (
              <>
                <input
                  className="ar-cat-in"
                  value={cat.name}
                  onChange={(e) => renameCategory(archive.id, cat.id, e.target.value)}
                />
                <button
                  className="ar-cat-x"
                  aria-label="Remove category"
                  onClick={() => removeCategory(archive.id, cat.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {cat.items.map((it) => (
            <EditItem key={it.id} cat={cat} it={it} />
          ))}

          {!cat.unsorted ? (
            addingTo === cat.id ? (
              <div className="ar-pick">
                <BookmarkPicker
                  onPick={(u, t) => {
                    addItem(archive.id, cat.id, u, t)
                    setAddingTo(null)
                  }}
                  onClose={() => setAddingTo(null)}
                />
              </div>
            ) : (
              <div className="ar-additem-row">
                <button className="ar-additem" onClick={() => setAddingTo(cat.id)}>
                  ＋ Add item to {cat.name}
                </button>
              </div>
            )
          ) : null}
        </div>
      ))}

      <div className="ar-newcat">
        <div className="ar-newcat-box">
          <span className="ar-newcat-ic">
            <Icon name="plus" />
          </span>
          <input
            className="ar-newcat-in"
            placeholder="Create a category"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCat()
            }}
          />
          <button className="ar-newcat-btn" onClick={submitCat}>
            Create
          </button>
        </div>
      </div>
    </>
  )
}

function EditItem({ cat, it }: { cat: ArchiveCategory; it: ArchiveItem }) {
  return (
    <div className="ar-item ar-item--edit">
      <span className="ar-item-fav">
        <img src={`https://www.google.com/s2/favicons?domain=${it.host}&sz=64`} alt="" loading="lazy" />
      </span>
      <span className="ar-item-body">
        <span className="ar-item-title">{it.title}</span>
        <span className="ar-item-tags">
          <DomainTagByTopic id={it.topic} label={TOPIC_MAP[it.topic]?.label ?? it.topic} />
          {it.meta ? <span className="ar-item-meta mono">{it.meta}</span> : null}
        </span>
        <span className="ar-item-host mono">{it.host}</span>
      </span>
      {cat.unsorted ? (
        <button className="ar-file" onClick={() => toast('File into a category')}>
          File →
        </button>
      ) : null}
    </div>
  )
}
