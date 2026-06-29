import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Blog app — Vite + React + MDX.
 *
 * Plugin order matters here:
 *
 *   1. `mdxExcerpt` (enforce: 'pre') — handles a custom `?excerpt`
 *      query. It reads the source `.md` / `.mdx` file via fs, strips
 *      the YAML frontmatter, takes everything before
 *      `{/* truncate *\/}` (or the first paragraph), cleans the
 *      remaining markdown markers, and exposes the result as a string
 *      default-export. Lives ahead of MDX in the chain so the MDX
 *      plugin doesn't see (and try to compile) `?excerpt` paths.
 *      `import.meta.glob` is the only consumer (see posts.ts).
 *
 *   2. `@mdx-js/rollup` (enforce: 'pre') — compiles bare `.md` and
 *      `.mdx` content (no query) into React components.
 *        - remark-frontmatter parses the YAML block.
 *        - remark-mdx-frontmatter re-exports it as `frontmatter`.
 *        - remark-gfm adds tables / strikethrough / task lists.
 *        - rehype-slug + rehype-autolink-headings wrap every heading
 *          in an anchor for share-friendly TOC links.
 *
 *   3. `@vitejs/plugin-react-swc` — JSX transform for `.tsx` + the
 *      MDX-compiled JS output from step 2.
 */

/* Strip YAML frontmatter, cut at the {/* truncate *\/} marker, and
   produce a clean plain-text excerpt suitable for index cards. */
function extractExcerptText(raw: string): string {
  const body = raw.replace(/^---[\s\S]*?---\s*/m, '')
  const truncateIdx = body.search(/\{\s*\/[*_]\s*truncate\s*[*_]\/\s*\}/)
  const head = truncateIdx >= 0 ? body.slice(0, truncateIdx) : body
  const firstPara = head
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find(
      (p) =>
        p &&
        !p.startsWith('#') &&
        !p.startsWith('import ') &&
        !p.startsWith('export '),
    )
  if (!firstPara) return ''
  return firstPara
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') /* images */
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') /* links → text */
    .replace(/[*_`]/g, '') /* bold / italic / inline code markers */
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280)
}

interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
}

/* The Docusaurus-style truncate marker line is only used to cut the
   index excerpt — it must never render in the article body. Markdown
   in `md` format keeps it as literal text (and may split the asterisks
   into emphasis), so drop any paragraph whose text, once stripped of
   braces / slashes / asterisks / spaces, is exactly "truncate". */
function remarkStripTruncate() {
  const flatten = (node: MdNode): string =>
    node.type === 'text'
      ? (node.value ?? '')
      : (node.children ?? []).map(flatten).join('')
  const strip = (node: MdNode): void => {
    if (!node.children) return
    node.children = node.children.filter((child) => {
      if (
        child.type === 'paragraph' &&
        flatten(child)
          .replace(/[{}\/*_\s]/g, '')
          .toLowerCase() === 'truncate'
      ) {
        return false
      }
      strip(child)
      return true
    })
  }
  return (tree: MdNode) => strip(tree)
}

function mdxExcerpt(): Plugin {
  const SUFFIX = '?excerpt'
  return {
    name: 'sofia-blog:mdx-excerpt',
    enforce: 'pre',
    resolveId(id) {
      if (id.endsWith(SUFFIX)) return id
      return null
    },
    load(id) {
      if (!id.endsWith(SUFFIX)) return null
      const filePath = id.slice(0, -SUFFIX.length)
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const excerpt = extractExcerptText(raw)
        return `export default ${JSON.stringify(excerpt)};`
      } catch {
        /* File missing or unreadable — fall back to empty string so the
           index page just renders without an excerpt rather than crashing. */
        return `export default "";`
      }
    },
  }
}

export default defineConfig({
  plugins: [
    mdxExcerpt(),
    {
      enforce: 'pre',
      ...mdx({
        format: 'detect',
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
          remarkGfm,
          remarkStripTruncate,
        ],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'wrap',
              properties: { className: 'heading-anchor' },
            },
          ],
        ],
      }),
    } as Plugin,
    react(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      /* `@site/src/*` was the Docusaurus alias for the docs app's src.
         Posts that imported `@site/src/components/ImageCarousel` were
         using it via the Docusaurus convention; we re-map it to the
         blog app's own src so those imports keep working without
         touching the MDX. New posts should prefer the `~` alias. */
      '@site/src': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
})
