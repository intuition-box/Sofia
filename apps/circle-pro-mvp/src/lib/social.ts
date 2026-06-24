/**
 * Deterministic "social proof" for a bookmark URL — so the demo shows, per
 * link, whether the team has already certified it and how many curators /
 * likes back it. Stable per URL (hash-seeded), no randomness.
 */
import { MEMBERS } from '../data/mock'

export interface Proof {
  /** Already marked by at least one team member. */
  certified: boolean
  likes: number
  curators: number
  /** Avatar-gradient indices for the curator stack (≤4). */
  gradIdxs: number[]
}

export function proofFor(url: string): Proof {
  let h = 2166136261
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  const next = (n: number) => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    return h % n
  }
  const certified = next(100) < 52
  const curators = certified ? 1 + next(8) : 0
  const likes = certified ? 3 + next(58) : 0
  const gradIdxs = Array.from({ length: Math.min(curators, 4) }, () => next(17))
  return { certified, likes, curators, gradIdxs }
}

/** Short team notes ("what's said") — terse, plausible, picked deterministically. */
const NOTES = [
  'Used this for the deck.',
  'Best explainer I have found.',
  'Reference for the audit.',
  'On the team reading list.',
  'Superseded — ping me for the newer link.',
  'We cited this in the proposal.',
  'Solid primer for newcomers.',
  'Came up in the last call.',
  'Still the cleanest writeup on this.',
  'Saved this twice — it is that good.',
]

export interface BookmarkSocial {
  certified: boolean
  likes: number
  /** How many members saved it. */
  curators: number
  /** Across how many teams it's been validated. */
  teams: number
  /** Up to 4 curator handles for the avatar stack. */
  curatorHandles: string[]
  curatorGrads: number[]
  /** The top note about this URL, if any. */
  note?: { who: string; text: string }
}

/** Full social context for a bookmark URL — who saved it, likes, top note. */
export function socialFor(url: string): BookmarkSocial {
  const p = proofFor(url)
  let h = 5381
  for (let i = 0; i < url.length; i++) h = ((Math.imul(h, 33) ^ url.charCodeAt(i)) >>> 0)
  const handles: string[] = []
  const grads: number[] = []
  let k = h
  for (let i = 0; i < p.curators && handles.length < 4; i++) {
    k = (Math.imul(k, 1103515245) + 12345) >>> 0
    const m = MEMBERS[k % MEMBERS.length]
    if (!handles.includes(m.handle)) {
      handles.push(m.handle)
      grads.push(m.grad)
    }
  }
  const note =
    p.certified && handles.length
      ? { who: handles[0], text: NOTES[h % NOTES.length] }
      : undefined
  const teams = p.certified ? Math.max(1, Math.min(p.curators, 1 + (h % 4))) : 0
  return {
    certified: p.certified,
    likes: p.likes,
    curators: p.curators,
    teams,
    curatorHandles: handles,
    curatorGrads: grads,
    note,
  }
}
