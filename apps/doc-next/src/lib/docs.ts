import type { ComponentType } from 'react'
import type { DocFrontmatter } from './types'

/**
 * Docs loader — discovers every migrated `.md` / `.mdx` under
 * `src/content/docs/**` at build time via Vite's `import.meta.glob`
 * (eager, so routes resolve synchronously and code-split per doc).
 *
 * The key is the route id: the path relative to `content/docs`
 * minus the extension — e.g. `core-concepts/atoms`, `intro`,
 * `litepaper/network`. That id is 1:1 with the tree in
 * `~/data/tree`, so navigation, breadcrumbs and pager line up.
 *
 * Mirrors apps/blog/src/lib/posts.ts.
 */
interface MdxModule {
  default: ComponentType
  frontmatter?: DocFrontmatter
}

const modules = import.meta.glob<MdxModule>(
  '../content/docs/**/*.{md,mdx}',
  { eager: true },
)

export interface Doc {
  id: string
  Component: ComponentType
  frontmatter: DocFrontmatter
}

function idFromPath(filePath: string): string {
  return filePath
    .replace(/^.*\/content\/docs\//, '')
    .replace(/\.(md|mdx)$/, '')
}

/* AI Features is hidden (product decision): keep the source files
   but make the routes unreachable so /docs/ai-features/* 404s.
   Reversible — drop this prefix to bring the section back (and
   re-add it to ~/data/tree). */
const HIDDEN_PREFIXES = ['ai-features/']

export const DOCS: Record<string, Doc> = Object.fromEntries(
  Object.entries(modules)
    .map(([filePath, mod]) => {
      const id = idFromPath(filePath)
      return [
        id,
        {
          id,
          Component: mod.default,
          frontmatter: mod.frontmatter ?? {},
        },
      ] as const
    })
    .filter(([id]) => !HIDDEN_PREFIXES.some((p) => id.startsWith(p))),
)

export function getDoc(id: string): Doc | undefined {
  return DOCS[id]
}
