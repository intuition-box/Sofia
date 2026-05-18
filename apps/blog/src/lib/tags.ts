import yaml from 'js-yaml'
import tagsRaw from '../content/tags.yml?raw'
import type { Tag } from './types'

/**
 * Parse `content/tags.yml` once. Same Docusaurus blog tag schema as
 * before:
 *
 *   <id>:
 *     label: string
 *     permalink: /path
 *     description: string
 */
interface RawTag {
  label: string
  permalink: string
  description?: string
}

const parsed = (yaml.load(tagsRaw) ?? {}) as Record<string, RawTag>

export const TAGS: Record<string, Tag> = Object.fromEntries(
  Object.entries(parsed).map(([id, raw]) => [
    id,
    {
      id,
      label: raw.label,
      permalink: raw.permalink.replace(/^\//, ''),
      description: raw.description,
    },
  ]),
)

export function resolveTags(ids: string[] | undefined): Tag[] {
  if (!ids) return []
  return ids
    .map((id) => {
      const tag = TAGS[id]
      if (!tag) {
        console.warn(`[blog] unknown tag id: "${id}"`)
      }
      return tag
    })
    .filter((t): t is Tag => Boolean(t))
}

export function findTagByRoute(idOrPermalink: string): Tag | undefined {
  return Object.values(TAGS).find(
    (t) => t.id === idOrPermalink || t.permalink === idOrPermalink,
  )
}
