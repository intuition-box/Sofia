/**
 * Helpers over the bookmark folder tree — shared by My bookmarks and the
 * onboarding sort step so both navigate the SAME architecture. `sharedPeople`
 * answers "who do I share this folder with": the teammates who keep any link
 * inside it, regardless of how THEY filed it (membership is per-URL).
 */
import type { BmNode } from './myBookmarks'
import { likedBy, type Teammate } from './teammates'

export interface FlatBkLink {
  title: string
  url: string
}

export function countLinks(nodes: BmNode[]): number {
  let n = 0
  for (const x of nodes) n += x.type === 'link' ? 1 : countLinks(x.children)
  return n
}

export function allLinksDeep(nodes: BmNode[], out: FlatBkLink[] = []): FlatBkLink[] {
  for (const x of nodes) {
    if (x.type === 'link') out.push({ title: x.title, url: x.url })
    else allLinksDeep(x.children, out)
  }
  return out
}

/** Distinct team ids that keep at least one link inside these nodes. */
export function sharedTeamIds(nodes: BmNode[]): string[] {
  const seen = new Set<string>()
  for (const l of allLinksDeep(nodes)) {
    for (const p of likedBy(l.url).people) seen.add(p.teamId)
  }
  return [...seen]
}

/** Teammates who keep at least one link inside these nodes (deduped, capped). */
export function sharedPeople(nodes: BmNode[], cap = 4): Teammate[] {
  const seen = new Set<string>()
  const out: Teammate[] = []
  for (const l of allLinksDeep(nodes)) {
    for (const p of likedBy(l.url).people) {
      if (!seen.has(p.name)) {
        seen.add(p.name)
        out.push(p)
        if (out.length >= cap) return out
      }
    }
  }
  return out
}
