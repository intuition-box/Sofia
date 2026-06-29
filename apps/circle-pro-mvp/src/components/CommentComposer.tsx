/**
 * CommentComposer — Discord-style comment box: type text, drop an emoji, or
 * pick a GIF. Emojis insert into the field; picking a GIF sends it right away
 * as its own message (the URL — comment rows render media URLs as images).
 * Reused by PostDetail, the skill modal and the tool modal.
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { avGrad } from '../data/helpers'

const EMOJIS = [
  '😀', '😂', '😍', '🥳', '😅', '😉', '🙌', '👍', '🔥', '💯',
  '🎉', '🚀', '✨', '👀', '🤝', '💡', '❤️', '😎', '🤔', '🙏',
  '👏', '😢', '😮', '🥲', '😴', '🤯', '💪', '🫶', '✅', '⭐',
]

// giphy public beta key — a documented demo key, not a secret.
const GIPHY_KEY = 'dc6zaTOxFJmzC'

interface GiphyImage {
  url: string
}
interface GiphyItem {
  id: string
  images: {
    downsized_medium?: GiphyImage
    original?: GiphyImage
    fixed_width_small?: GiphyImage
    preview_gif?: GiphyImage
  }
}

interface Gif {
  id: string
  url: string
  preview: string
}

function GifPanel({ onPick }: { onPick: (url: string) => void }) {
  const [q, setQ] = useState('')
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    const ctrl = new AbortController()
    setLoading(true)
    const base = 'https://api.giphy.com/v1/gifs'
    const url = q.trim()
      ? `${base}/search?api_key=${GIPHY_KEY}&rating=pg&limit=18&q=${encodeURIComponent(q.trim())}`
      : `${base}/trending?api_key=${GIPHY_KEY}&rating=pg&limit=18`
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ data?: GiphyItem[] }>)
      .then((d) => {
        if (!live) return
        const list = (d.data ?? []).map((g) => ({
          id: g.id,
          url: g.images.downsized_medium?.url ?? g.images.original?.url ?? '',
          preview: g.images.fixed_width_small?.url ?? g.images.preview_gif?.url ?? '',
        }))
        setGifs(list.filter((g) => g.url && g.preview))
      })
      .catch(() => {})
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
      ctrl.abort()
    }
  }, [q])

  return (
    <div className="cc-pop cc-pop--gif">
      <input
        className="cc-gif-search"
        placeholder="Search GIFs…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="cc-gif-grid">
        {loading ? (
          <span className="cc-gif-msg mono">Loading…</span>
        ) : gifs.length ? (
          gifs.map((g) => (
            <button type="button" key={g.id} className="cc-gif-item" onClick={() => onPick(g.url)}>
              <img src={g.preview} alt="" loading="lazy" />
            </button>
          ))
        ) : (
          <span className="cc-gif-msg mono">No GIFs.</span>
        )}
      </div>
    </div>
  )
}

interface CommentComposerProps {
  onSend: (content: string) => void
  avatarSeed?: number
  you?: string
}

export function CommentComposer({ onSend, avatarSeed = 0, you = 'YO' }: CommentComposerProps) {
  const [text, setText] = useState('')
  const [panel, setPanel] = useState<'emoji' | 'gif' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panel) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanel(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [panel])

  const submitText = () => {
    const t = text.trim()
    if (!t) return
    onSend(t)
    setText('')
    setPanel(null)
  }
  const pickGif = (url: string) => {
    onSend(url)
    setPanel(null)
  }

  return (
    <div className="cc" ref={ref}>
      {panel === 'emoji' ? (
        <div className="cc-pop cc-pop--emoji">
          {EMOJIS.map((e) => (
            <button type="button" key={e} className="cc-emoji" onClick={() => setText((t) => t + e)}>
              {e}
            </button>
          ))}
        </div>
      ) : null}
      {panel === 'gif' ? <GifPanel onPick={pickGif} /> : null}

      <div className="cc-bar">
        <span className="pc-av cc-av" style={{ background: avGrad(avatarSeed) }}>
          {you}
        </span>
        <input
          className="cc-input"
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitText()
          }}
        />
        <button
          type="button"
          className={`cc-ic${panel === 'emoji' ? ' on' : ''}`}
          aria-label="Add emoji"
          onClick={() => setPanel((p) => (p === 'emoji' ? null : 'emoji'))}
        >
          <Icon name="smile" />
        </button>
        <button
          type="button"
          className={`cc-gif-btn${panel === 'gif' ? ' on' : ''}`}
          aria-label="Add a GIF"
          onClick={() => setPanel((p) => (p === 'gif' ? null : 'gif'))}
        >
          GIF
        </button>
        <button type="button" className="btn btn--accent btn--sm cc-send" onClick={submitText}>
          Send
        </button>
      </div>
    </div>
  )
}

/** True when a comment body is just a media URL we should render as an image. */
export function isMediaUrl(s: string): boolean {
  return /^https?:\/\/\S+\.(gif|png|jpe?g|webp)(\?|$)/i.test(s) || /(giphy|tenor)\.com\/(media|.*\.gif)/i.test(s)
}
