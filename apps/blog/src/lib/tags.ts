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

/**
 * Tag → intent-tint token. The design assigns each tag one of the
 * Sofia "predicate" colors so a tag reads as a consistent visual
 * scent across cards, chips and the tag page. Unknown ids fall back
 * to the peach accent.
 */
const TAG_INTENT: Record<string, string> = {
  'design-ui': 'inspiration',
  blockchain: 'work',
  architecture: 'learning',
  'ai-agents': 'fun',
  'trust-reputation': 'trusted',
  milestones: 'accent',
  infrastructure: 'music',
  community: 'buying',
  security: 'distrusted',
  gamification: 'fun',
  explorer: 'trusted',
  vision: 'inspiration',
}

/** CSS custom-property reference for a tag's color, e.g. `var(--work)`. */
export function tagColorVar(tagId: string): string {
  return `var(--${TAG_INTENT[tagId] ?? 'accent'})`
}
