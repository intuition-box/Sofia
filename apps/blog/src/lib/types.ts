import type { ComponentType } from 'react'

/** Raw frontmatter shape — what we accept from a post's YAML block. */
export interface PostFrontmatter {
  /** Public URL slug. Defaults to the folder name if omitted. */
  slug?: string
  /** Title shown on the post page + index card. Required. */
  title: string
  /** Author IDs that must exist in `content/authors.yml`. */
  authors?: string[]
  /** Tag IDs that should exist in `content/tags.yml`. Optional. */
  tags?: string[]
  /** Custom hero image for the post (path relative to its folder). */
  image?: string
  /** Manual excerpt override. When absent, the loader uses the content
   *  before the `{/* truncate *\/}` marker, or the first paragraph. */
  description?: string
}

/** Resolved author — frontmatter author IDs are joined against
 *  `content/authors.yml` so the page can render full names + avatars. */
export interface Author {
  /** Author ID — matches the key in authors.yml AND the entry in a
   *  post's frontmatter `authors:` array. */
  id: string
  name: string
  title?: string
  url?: string
  imageUrl?: string
  /** Optional custom permalink for the author page. Defaults to
   *  `/blog/authors/<id>`. */
  permalink?: string
  socials?: {
    x?: string
    linkedin?: string
    github?: string
  }
}

/** Resolved tag — frontmatter tag IDs joined against `content/tags.yml`. */
export interface Tag {
  id: string
  label: string
  permalink: string
  description?: string
}

/** A loaded post ready for rendering. Resolved authors / tags are
 *  attached so the UI doesn't need to look them up itself. */
export interface Post {
  /** Slug used in `/blog/:slug`. Derived from frontmatter or folder. */
  slug: string
  title: string
  /** ISO date extracted from the folder name (YYYY-MM-DD prefix). */
  date: string
  /** Pre-formatted "Apr 17, 2026" for display. */
  dateLabel: string
  authors: Author[]
  tags: Tag[]
  /** Plain-text excerpt — first paragraph or pre-truncate content. */
  excerpt: string
  /** Custom hero image URL when the frontmatter specifies one. */
  image?: string
  /** Compiled MDX component — render with <Content /> inside a
   *  `.prose` wrapper. */
  Content: ComponentType
  /** Raw frontmatter, useful for advanced rendering. */
  frontmatter: PostFrontmatter
}
