/**
 * Acme teammates — plain enterprise display names (no crypto handles) for the
 * "who on your team already saved this" social proof. Deterministic per URL so
 * the demo is stable. This is the hook of onboarding: the favourites you import
 * are already kept by people on the team you're about to join.
 */
import { proofFor } from '../lib/social'

export interface Teammate {
  name: string
  grad: number
  teamId: string
}

export const TEAMMATES: Teammate[] = [
  { name: 'Ana Costa', grad: 0, teamId: 'eng' },
  { name: 'Liam Walsh', grad: 1, teamId: 'eng' },
  { name: 'Mei Tan', grad: 2, teamId: 'design' },
  { name: 'Sofia Rossi', grad: 3, teamId: 'research' },
  { name: 'Tom Becker', grad: 4, teamId: 'finance' },
  { name: 'Yuki Sato', grad: 5, teamId: 'eng' },
  { name: 'Noah Klein', grad: 6, teamId: 'marketing' },
  { name: 'Priya Nair', grad: 8, teamId: 'research' },
  { name: 'Marco Bianchi', grad: 9, teamId: 'ops' },
  { name: 'Elena Petrov', grad: 10, teamId: 'design' },
  { name: 'Hugo Martin', grad: 12, teamId: 'finance' },
  { name: 'Clara Mendez', grad: 14, teamId: 'eng' },
  { name: 'Maxime Dubois', grad: 7, teamId: 'eng' },
  { name: 'Sara Lindqvist', grad: 13, teamId: 'marketing' },
]

export interface LikedBy {
  /** How many teammates saved this (≥ people.length). */
  total: number
  /** Up to 4 named teammates for the avatar/name cluster. */
  people: Teammate[]
}

/** Which teammates already saved this URL — stable, hash-seeded. */
export function likedBy(url: string): LikedBy {
  const p = proofFor(url)
  if (!p.certified) return { total: 0, people: [] }
  let h = 5381
  for (let i = 0; i < url.length; i++) h = (Math.imul(h, 33) ^ url.charCodeAt(i)) >>> 0
  const people: Teammate[] = []
  let k = h
  for (let i = 0; i < p.curators && people.length < 4; i++) {
    k = (Math.imul(k, 1103515245) + 12345) >>> 0
    const t = TEAMMATES[k % TEAMMATES.length]
    if (!people.some((x) => x.name === t.name)) people.push(t)
  }
  return { total: p.curators, people }
}
