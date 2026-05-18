# Sofia Blog

Static MDX-driven blog app served at **blog.sofia.intuition.box**.

Replaces the old Docusaurus blog section of `apps/doc/`. Same content,
same authors / tags, simpler stack — Vite + React Router + MDX, no
heavy site generator.

## Stack

- **Vite 6** + **React 18** + **TypeScript**
- **react-router-dom v7** for routing
- **@mdx-js/rollup** + `remark-frontmatter` + `remark-mdx-frontmatter` +
  `remark-gfm` + `rehype-slug` + `rehype-autolink-headings` for the
  markdown pipeline
- **js-yaml** for `authors.yml` / `tags.yml`
- **@0xsofia/design-system** (theme tokens shared with the landing)

## Layout

```
apps/blog/
├── src/
│   ├── components/          Navbar, Footer, Layout, PostCard, PostMeta
│   ├── pages/               BlogIndex, BlogPost, AuthorPage, TagPage, NotFound
│   ├── lib/                 posts.ts (loader), authors.ts, tags.ts, types.ts
│   ├── content/
│   │   ├── posts/<YYYY-MM-DD-slug>/index.md{,x}
│   │   ├── authors.yml      same schema as Docusaurus' blog authors plugin
│   │   └── tags.yml         same schema
│   ├── styles/              global.css, variables.css, prose.css
│   └── main.tsx
├── public/img/              Sofia favicon + logo
├── Dockerfile               Coolify build (workspace-aware bun install)
└── nginx.conf               SPA history-fallback + cache headers
```

## Authoring

Drop a folder under `src/content/posts/` with the date-prefixed name:

```
src/content/posts/2026-05-22-my-post/
├── index.md          (or .mdx if you want JSX)
└── hero.png          (optional asset, referenced as ./hero.png)
```

`index.md` frontmatter shape:

```yaml
---
slug: my-post
title: A clear, declarative title
authors: [Maxime]
tags: [docusaurus]   # optional, ids must exist in tags.yml
description: Optional excerpt override
---
```

The loader pulls the date from the folder prefix (`YYYY-MM-DD`),
extracts an excerpt (text before `{/* truncate */}` or the first
paragraph), and joins authors / tags against the YAML config files.

## Scripts

```bash
bun run dev         # vite dev server
bun run build       # tsc + vite build
bun run preview     # local preview of the production build
bun run lint
```

## Deploy

Coolify with the Dockerfile in this folder. No build-time env vars
today — pure static site. Build context is the monorepo root.
