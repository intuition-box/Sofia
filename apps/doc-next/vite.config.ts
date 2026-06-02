import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import path from 'node:path'

/**
 * Sofia · Docs — Vite + React + MDX. Mirrors apps/blog's stack and
 * adds the bits the 41 migrated Docusaurus docs need:
 *
 *   - remark-directive + `remarkAdmonitions`: turns Docusaurus
 *     `:::note[Title] … :::` containers into `<Admonition kind…>`
 *     (kind mapped to the predicate-color motif).
 *   - `remarkDocImages`: rewrites the docs' relative
 *     `./img/x.png` references to `/docs-assets/<docDir>/img/x.png`
 *     (assets are copied verbatim into public/, so this is
 *     bullet-proof in dev and build).
 *
 * The maison components the docs `import` (`DocCard`,
 * `DocCardGrid`, `StatBox` from `@site/src/components/docs/*`)
 * resolve via the `@site/src` alias — same convention the old
 * Docusaurus site used, so the MDX is migrated unchanged.
 */

const CONTENT_DIR = path.resolve(__dirname, 'src/content/docs')

const ADMONITION_KIND: Record<string, string> = {
  note: 'note',
  tip: 'tip',
  info: 'info',
  caution: 'warning',
  warning: 'warning',
  danger: 'danger',
}

interface AnyNode {
  type: string
  name?: string
  url?: string
  value?: string
  data?: { directiveLabel?: boolean; [k: string]: unknown }
  attributes?: unknown
  children?: AnyNode[]
  [k: string]: unknown
}

function walk(node: AnyNode, fn: (n: AnyNode) => void): void {
  fn(node)
  if (node.children) for (const c of node.children) walk(c, fn)
}

function textOf(node: AnyNode): string {
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

/* Docusaurus `:::note[Title]` containers → <Admonition kind title>. */
function remarkAdmonitions() {
  return (tree: AnyNode) => {
    walk(tree, (node) => {
      if (node.type !== 'containerDirective') return
      const kind = ADMONITION_KIND[node.name ?? '']
      if (!kind) return

      let title: string | undefined
      const children = (node.children ?? []).filter((child) => {
        if (child.data && child.data.directiveLabel) {
          title = textOf(child).trim() || undefined
          return false
        }
        return true
      })

      node.type = 'mdxJsxFlowElement'
      node.name = 'Admonition'
      node.attributes = [
        { type: 'mdxJsxAttribute', name: 'kind', value: kind },
        ...(title
          ? [{ type: 'mdxJsxAttribute', name: 'title', value: title }]
          : []),
      ]
      node.children = children
      delete node.data
    })
  }
}

/* Rewrite the docs' relative markdown links (`[text](../x/y.md)`)
   to absolute SPA routes (`/docs/x/y`). Otherwise the browser
   tries to fetch the literal `.md` URL and falls through to a
   404. Hash fragments are preserved. External / mailto / already-
   absolute links pass through untouched. */
function remarkDocLinks() {
  return (tree: AnyNode, file: { path?: string }) => {
    const filePath = file.path ?? ''
    const relDir = path
      .relative(CONTENT_DIR, path.dirname(filePath))
      .split(path.sep)
      .filter(Boolean)
      .join('/')
    walk(tree, (node) => {
      if (node.type !== 'link' || !node.url) return
      const url = node.url
      if (
        /^([a-z]+:)?\/\//i.test(url) ||
        url.startsWith('/') ||
        url.startsWith('mailto:') ||
        url.startsWith('#')
      ) {
        return
      }
      const hashIdx = url.indexOf('#')
      const bare = hashIdx >= 0 ? url.slice(0, hashIdx) : url
      const hash = hashIdx >= 0 ? url.slice(hashIdx) : ''
      if (!bare) return
      let resolved = path.posix.normalize(path.posix.join(relDir, bare))
      resolved = resolved.replace(/\.mdx?$/i, '')
      resolved = resolved.replace(/^(\.\.\/)+/, '')
      node.url = `/docs/${resolved}${hash}`
    })
  }
}

/* Rewrite the docs' relative image URLs to the copied public asset
   path. Co-located `./img/x.png` (and nested `./img/intro/x.png`)
   map under the doc's dir; Docusaurus `../../static/img/x.png`
   refs map to the mirrored `_static/` tree. Resolution is done
   with posix path math against the doc's dir so any `../` depth
   works, not just the two shapes that happen to exist today. */
function remarkDocImages() {
  return (tree: AnyNode, file: { path?: string }) => {
    const filePath = file.path ?? ''
    const relDir = path
      .relative(CONTENT_DIR, path.dirname(filePath))
      .split(path.sep)
      .filter(Boolean)
      .join('/')
    walk(tree, (node) => {
      if (node.type !== 'image' || !node.url) return
      const url = node.url
      if (/^([a-z]+:)?\/\//i.test(url) || url.startsWith('/')) return
      let p = path.posix.normalize(path.posix.join(relDir, url))
      const staticIdx = p.indexOf('static/')
      if (staticIdx !== -1) {
        // Docusaurus static/ ref → mirrored _static/ tree.
        p = '_static/' + p.slice(staticIdx + 'static/'.length)
      } else {
        // Drop any leading ../ that escaped the docs root.
        p = p.replace(/^(\.\.\/)+/, '')
      }
      node.url = `/docs-assets/${p}`
    })
  }
}

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        /* Per-extension format: `.md` uses commonmark (the safe
           default for ported docs that may contain markdown the
           strict MDX parser would reject), `.mdx` uses full MDX
           (imports, JSX, expressions). The one doc that needs
           components — intro — is intro.mdx for that reason. */
        format: 'detect',
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
          remarkGfm,
          remarkDirective,
          remarkAdmonitions,
          remarkDocImages,
          remarkDocLinks,
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
      '@site/src': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
})
