/**
 * One bookmark — feed-card layout: curator header → generated cover → title →
 * votes + intent/topic tags. Ported from `SignalCard` in `circle/Expertise.jsx`.
 */
import { useState } from 'react'
import { Icon } from './Icon'
import { INTENT_META, expertsForTheme } from '../data/mock'
import { avGrad, initials } from '../data/helpers'
import { toast } from '../lib/toast'
import type { Bookmark, Topic } from '../data/types'

/** Deterministic abstract cover (data-URI SVG) — no network dependency. */
function coverDataUri(domain: string, color: string): string {
  let h = 0
  for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) % 100000
  const r = (n: number) => {
    h = (h * 9301 + 49297) % 233280
    return (h / 233280) * n
  }
  const W = 520,
    H = 240
  const blobs: string[] = []
  for (let i = 0; i < 5; i++) {
    blobs.push(
      `<circle cx="${Math.round(r(W))}" cy="${Math.round(r(H))}" r="${Math.round(
        40 + r(120),
      )}" fill="${color}" opacity="${(0.08 + r(0.14)).toFixed(2)}"/>`,
    )
  }
  const ang = Math.round(100 + r(120))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.55"/><stop offset="1" stop-color="#0c0b14" stop-opacity="0.92"/></linearGradient></defs><rect width="${W}" height="${H}" fill="#11101a"/><rect width="${W}" height="${H}" fill="url(#g)"/><g>${blobs.join(
    '',
  )}</g><rect width="${W}" height="${H}" fill="url(#g)" opacity="0.25" transform="rotate(${ang} ${W / 2} ${H / 2})"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface BookmarkCardProps {
  b: Bookmark
  topic: Topic
  topicId: string
}

export function BookmarkCard({ b, topic, topicId }: BookmarkCardProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const by = expertsForTheme(topicId, 1)[0]
  const up = b.curators + (vote === 'up' ? 1 : 0)
  const down = Math.max(1, Math.round(b.curators * 0.18)) + (vote === 'down' ? 1 : 0)
  const cast = (dir: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = vote === dir ? null : dir
    setVote(next)
    if (next === 'up') toast(`Voted up · "${b.title}"`)
    else if (next === 'down') toast(`Voted down · "${b.title}"`)
  }
  const intent = INTENT_META[b.intent] || INTENT_META.work
  return (
    <a
      className="sigc"
      href="#"
      onClick={(e) => {
        e.preventDefault()
        toast(`Opening ${b.domain}`)
      }}
      style={{ ['--c' as string]: topic.color }}
    >
      {by ? (
        <div className="sigc-head">
          <span className="sigc-av" style={{ background: avGrad(by.grad) }}>
            {initials(by.handle)}
          </span>
          <div className="sigc-id">
            <div className="sigc-handle">{by.handle}</div>
            <div className="sigc-when">{b.when} ago</div>
          </div>
        </div>
      ) : null}
      <div className="sigc-banner">
        <img className="sigc-banner-img" src={coverDataUri(b.domain, topic.color)} alt="" />
      </div>
      <h3 className="sigc-title">{b.title}</h3>
      <div className="sigc-foot">
        <div className="sigc-vote">
          <button
            className={vote === 'up' ? 'vote up on' : 'vote up'}
            onClick={(e) => cast('up', e)}
            title="Vote up"
          >
            <Icon name="thumbup" /> {up}
          </button>
          <button
            className={vote === 'down' ? 'vote down on' : 'vote down'}
            onClick={(e) => cast('down', e)}
            title="Vote down"
          >
            <Icon name="thumbdown" /> {down}
          </button>
        </div>
        <div className="sigc-verbs">
          <span className="sigc-verb" style={{ ['--vc' as string]: intent.color }}>
            <i />
            {intent.label}
          </span>
          <span className="sigc-tag">
            <i />
            {topic.label}
          </span>
        </div>
      </div>
    </a>
  )
}
