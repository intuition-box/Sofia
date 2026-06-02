# Sofia Docs

The Sofia documentation site, **off Docusaurus** — Vite + React 18 +
React Router 7 + MDX, on the `@0xsofia/design-system` language. Mirrors
the `apps/blog` stack 1:1 (the established non-Docusaurus reference in
this repo). Replaces `apps/doc` (Docusaurus) once content is fully
migrated.

## Status

Structural pass complete:

- **Stack & scaffold** — Vite/RR7/MDX, tsconfig ×3, eslint, all mirror
  `apps/blog`.
- **Design ported 1:1** from the Claude Design handoff (`Sofia Docs.html`)
  — tokens (light + dark, both intentional), navbar, tree, shell, TOC,
  pager, footer, admonitions, code, doc cards, statbox, hero, predicate
  grid, search palette, drawer.
- **Real content tree** — `src/data/tree.ts` is 1:1 with the old
  Docusaurus `sidebars.ts` (all 41 docs, mapped onto the predicate-color
  motif). NOT the design's fictional mock tree.
- **All 8 page types** — Home (editorial), Reading (tree│content│TOC),
  Manifesto (full-bleed), Litepaper (chapter index), Architecture
  (diagram), 404, ⌘K search overlay, mobile (responsive + drawer).
- **Legacy redirects** — the Docusaurus `plugin-client-redirects` config
  is replayed in `src/main.tsx`.

## Next pass — content migration

Wire the 41 real `.md/.mdx` from `apps/doc/docs/` through the MDX Vite
pipeline. The integration point is `src/pages/ReadingPage.tsx`: swap the
representative sample `<article>` for the compiled MDX component keyed by
the route id (see `apps/blog/src/lib/posts.ts` for the
`import.meta.glob` pattern). Bodies are placeholder until then; **the
design prototype's mock copy is never shipped** — real text comes from
the docs source.

## Commands

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # tsc -b && vite build
bun run typecheck
bun run lint
```
