/**
 * Discussion layer for a shared link — the sharer's "why it's useful" note and
 * the comment thread. All deterministic per URL (mocked), so a card and its
 * detail view always agree. Mirrors wireframe view 4 (post + comments).
 */
import { TEAMMATES } from '../data/teammates'

/** Docs vs links — drives the Type filter + the card/detail glyph. */
const DOC_HOSTS = /notion\.so|figma\.com|docs\.google|drive\.google|linear\.app|coda\.io|miro\.com|excalidraw|are\.na|airtable|slides/i
export function docType(host: string): 'doc' | 'link' {
  return DOC_HOSTS.test(host) ? 'doc' : 'link'
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}
const step = (h: number) => (Math.imul(h, 1103515245) + 12345) >>> 0

/** The sharer's note — the context that's missing everywhere else. */
const WHY = [
  'We lose hours to sync meetings. Section 3 has a doc format that replaces most of our calls — testing it on the rebrand this week.',
  'Cleanest take on this I have found. Saved me a day of digging.',
  'Keep this as the reference whenever we onboard someone new.',
  'Backs up the approach we pitched last quarter — worth a read before the next planning round.',
  'The framework here maps almost 1:1 to our stack. Skip to the examples.',
  'Came up at the offsite. Good shared baseline before we decide.',
]
export function whyFor(url: string): string {
  return WHY[hash(url) % WHY.length]
}

const COMMENT_TEXTS = [
  'Adopted on the Sales side two weeks ago — works great for client recaps.',
  'Nice! Can you share your template?',
  'Adding a related link on team rituals →',
  'We tried this last year and hit some edge cases — happy to compare notes.',
  'Bookmarking. This is exactly what the new hires keep asking for.',
  'Section 4 is the gold here.',
  'Pinged the design team, they will want this.',
  'Lines up with what Research found last sprint.',
]
const WHENS = ['1 h', '48 min', '20 min', '3 h', 'yesterday', '2 d']

export interface Comment {
  id: string
  who: string
  teamId: string
  grad: number
  when: string
  text: string
  likes: number
  /** Rendered indented as a reply to the comment above. */
  reply: boolean
}

export function commentsFor(url: string): Comment[] {
  let h = hash(url)
  const n = 2 + (h % 3) // 2–4
  const out: Comment[] = []
  for (let i = 0; i < n; i++) {
    h = step(h)
    const tm = TEAMMATES[h % TEAMMATES.length]
    h = step(h)
    out.push({
      id: `${url}#${i}`,
      who: tm.name,
      teamId: tm.teamId,
      grad: tm.grad,
      when: WHENS[i % WHENS.length],
      text: COMMENT_TEXTS[h % COMMENT_TEXTS.length],
      likes: h % 4,
      reply: i === 1 && n > 2,
    })
  }
  return out
}

export function countComments(url: string): number {
  return commentsFor(url).length
}
