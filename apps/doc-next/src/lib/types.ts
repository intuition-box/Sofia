/**
 * Shared types for the Sofia docs app.
 *
 * `DocFrontmatter` is the YAML block remark-mdx-frontmatter re-exports
 * from each ported `.md` / `.mdx` page (next pass wires the 41 docs).
 * The tree / predicate types model the real Sofia content tree —
 * ported 1:1 from the Docusaurus `sidebars.ts`, not the design mock.
 */

export interface DocFrontmatter {
  title?: string
  description?: string
  sidebar_label?: string
  sidebar_position?: number
  slug?: string
  tags?: string[]
}

/** A predicate / intention color key — the structural motif. */
export type PredicateKey =
  | 'trusted'
  | 'distrusted'
  | 'work'
  | 'learning'
  | 'fun'
  | 'inspiration'
  | 'buying'
  | 'music'

/** Token color key usable for section accents (predicates + accent). */
export type ColorKey = PredicateKey | 'accent'

export type TreeBadge = 'new' | 'beta' | 'draft' | 'editorial'

export interface TreeItem {
  /** Route id — maps to a docs path, e.g. `core-concepts/atoms`. */
  id: string
  label: string
  /** Per-item predicate dot (used by the intentions section). */
  tag?: PredicateKey
  badge?: TreeBadge
  /** Nested children render as an indented sub-tree. */
  items?: TreeItem[]
}

export interface TreeSection {
  id: string
  title: string
  color: ColorKey
  items: TreeItem[]
}

export interface Predicate {
  name: PredicateKey
  hex: string
  desc: string
}

export interface TocEntry {
  label: string
  href?: string
  indent?: boolean
}

export interface Theme {
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
}
