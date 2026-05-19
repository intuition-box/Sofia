import yaml from 'js-yaml'
import authorsRaw from '../content/authors.yml?raw'
import type { Author } from './types'

/**
 * Parse `content/authors.yml` once at module load and expose the
 * resolved author map. The YAML schema mirrors Docusaurus' blog
 * authors plugin (the same file the docs site used to consume) so
 * existing posts referencing `authors: [Samuel, Maxime]` keep working.
 *
 * Schema (per entry, keyed by author id):
 *   name: string                 — display name
 *   title: string                — role / job title
 *   url: string                  — homepage
 *   image_url: string            — avatar URL (snake_case to match Docusaurus)
 *   page: bool | { permalink }   — optional author-page settings
 *   socials: { x, linkedin, github }
 */
interface RawAuthor {
  name: string
  title?: string
  url?: string
  image_url?: string
  bio?: string
  page?: boolean | { permalink?: string }
  socials?: {
    x?: string
    linkedin?: string
    github?: string
  }
}

function normalize(id: string, raw: RawAuthor): Author {
  const permalink =
    typeof raw.page === 'object' && raw.page?.permalink
      ? raw.page.permalink.replace(/^\//, '')
      : undefined
  return {
    id,
    name: raw.name,
    title: raw.title,
    url: raw.url,
    imageUrl: raw.image_url,
    bio: raw.bio,
    permalink,
    socials: raw.socials,
  }
}

const parsed = yaml.load(authorsRaw) as Record<string, RawAuthor>

/** Author lookup by ID (the key used in post frontmatter `authors:`). */
export const AUTHORS: Record<string, Author> = Object.fromEntries(
  Object.entries(parsed).map(([id, raw]) => [id, normalize(id, raw)]),
)

/** Every author, in authors.yml declaration order. */
export const ALL_AUTHORS: Author[] = Object.values(AUTHORS)

/** Resolve a list of author IDs to full Author objects. Unknown IDs
 *  are dropped silently with a console warning — a missing author
 *  shouldn't crash the index. */
export function resolveAuthors(ids: string[] | undefined): Author[] {
  if (!ids) return []
  return ids
    .map((id) => {
      const author = AUTHORS[id]
      if (!author) {
        console.warn(`[blog] unknown author id: "${id}"`)
      }
      return author
    })
    .filter((a): a is Author => Boolean(a))
}

/** All authors that opted into a dedicated page (`page: true` or
 *  `page: { permalink }`). Used by the AuthorPage route. */
export function getPagedAuthors(): Author[] {
  return Object.values(AUTHORS).filter((a) => {
    const raw = parsed[a.id]
    return raw.page === true || typeof raw.page === 'object'
  })
}

/** Find an author by either id or permalink path segment. */
export function findAuthorByRoute(idOrPermalink: string): Author | undefined {
  return Object.values(AUTHORS).find(
    (a) => a.id === idOrPermalink || a.permalink === idOrPermalink,
  )
}
