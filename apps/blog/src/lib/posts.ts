import type { ComponentType } from 'react'
import { resolveAuthors } from './authors'
import { resolveTags } from './tags'
import type { Post, PostFrontmatter, PostKind } from './types'

/**
 * Posts loader — discovers every `index.md` / `index.mdx` under
 * `content/posts/<YYYY-MM-DD-slug>/` at build time via Vite's
 * `import.meta.glob` and joins them with authors.yml / tags.yml.
 *
 * Two passes, both eager so the index page renders synchronously:
 *
 *   1. Compiled MDX modules → React component + `frontmatter` named
 *      export (set by remark-mdx-frontmatter in vite.config.ts).
 *
 *   2. `?excerpt` modules → plain-text excerpt extracted at build
 *      time by the `sofia-blog:mdx-excerpt` Vite plugin (see
 *      vite.config.ts). The plugin reads the file via fs, strips
 *      the YAML frontmatter, cuts at `{/* truncate *\/}`, and exports
 *      a clean snippet for the index card. Doing the extraction in
 *      the plugin sidesteps the issue of the MDX plugin intercepting
 *      `?raw` queries on `.md` / `.mdx` files (it has enforce: 'pre'
 *      and doesn't bail out for query strings).
 *
 * Build-time discovery means each post is statically imported, so the
 * route gets code-split + the index page iterates synchronously.
 */

interface MdxModule {
  default: ComponentType
  frontmatter?: PostFrontmatter
}

const mdxModules = import.meta.glob<MdxModule>(
  '../content/posts/*/index.{md,mdx}',
  { eager: true },
)

const excerptModules = import.meta.glob<string>(
  '../content/posts/*/index.{md,mdx}',
  { eager: true, query: '?excerpt', import: 'default' },
)

/** Extract the YYYY-MM-DD prefix from a folder name like
 *  `2026-04-17-logbook`. Returns the matched date or the empty string
 *  when the prefix is malformed (we fall back to alphabetical sort in
 *  that case). */
function extractDate(folder: string): string {
  const m = folder.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

/** Pretty-print "2026-04-17" → "Apr 17, 2026". Uses the browser's
 *  Intl so the locale follows the user's preference; falls back to
 *  the raw ISO string when parsing fails. */
function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Pull the post slug from the folder path. Frontmatter `slug:` wins
 *  when set; otherwise the part after the date prefix is used. */
function deriveSlug(folder: string, fmSlug: string | undefined): string {
  if (fmSlug) {
    return fmSlug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }
  return folder.replace(/^\d{4}-\d{2}-\d{2}-?/, '')
}

function folderFromPath(filePath: string): string {
  /* filePath looks like `../content/posts/2026-04-17-logbook/index.mdx` */
  const segments = filePath.split('/')
  return segments[segments.length - 2] ?? ''
}

/** Derive the post archetype. The founding Story is the only post
 *  tagged `vision`; a monthly recap titles itself "… Month in Review". */
function deriveKind(fm: PostFrontmatter, slug: string): PostKind {
  const tags = fm.tags ?? []
  if (tags.includes('vision') || slug === 'from-idea-to-reality') {
    return 'story'
  }
  if (/month in review/i.test(fm.title ?? '')) return 'monthly'
  return 'logbook'
}

/* ── Build the resolved post list at module load. ───────────────── */

function buildPosts(): Post[] {
  const out: Post[] = []
  for (const [filePath, mod] of Object.entries(mdxModules)) {
    const folder = folderFromPath(filePath)
    const fm = mod.frontmatter ?? ({ title: folder } as PostFrontmatter)
    const date = extractDate(folder)
    const slug = deriveSlug(folder, fm.slug)
    /* Prefer an author-written `description:` over the auto-extracted
       excerpt — explicit beats implicit. The excerpt plugin returns
       an empty string when both the truncate marker and the first
       paragraph are missing, so this fallback chain never throws. */
    const excerpt = fm.description ?? excerptModules[filePath] ?? ''
    out.push({
      slug,
      kind: deriveKind(fm, slug),
      title: fm.title,
      date,
      dateLabel: formatDate(date),
      authors: resolveAuthors(fm.authors),
      tags: resolveTags(fm.tags),
      excerpt,
      image: fm.image,
      Content: mod.default,
      frontmatter: fm,
    })
  }
  /* Newest first — sort by date desc, then by slug for stable order. */
  out.sort((a, b) => {
    if (a.date === b.date) return a.slug.localeCompare(b.slug)
    return a.date < b.date ? 1 : -1
  })
  return out
}

export const POSTS: Post[] = buildPosts()

export const POSTS_BY_SLUG: Record<string, Post> = Object.fromEntries(
  POSTS.map((p) => [p.slug, p]),
)

/** Posts authored by a given author id — preserves the newest-first
 *  order from the global list. */
export function postsByAuthor(authorId: string): Post[] {
  return POSTS.filter((p) => p.authors.some((a) => a.id === authorId))
}

/** Posts tagged with a given tag id. */
export function postsByTag(tagId: string): Post[] {
  return POSTS.filter((p) => p.tags.some((t) => t.id === tagId))
}

/* ── Archetype selectors (POSTS is sorted newest-first). ────────── */

/** The founding Story, if present. */
export function getStory(): Post | undefined {
  return POSTS.find((p) => p.kind === 'story')
}

/** The most recent Monthly Review, if present. */
export function getMonthlyReview(): Post | undefined {
  return POSTS.find((p) => p.kind === 'monthly')
}

/** The most recent weekly logbook. */
export function getLatestLogbook(): Post | undefined {
  return POSTS.find((p) => p.kind === 'logbook')
}

/** Every weekly logbook, newest first. */
export function logbooks(): Post[] {
  return POSTS.filter((p) => p.kind === 'logbook')
}
