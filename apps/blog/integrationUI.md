# Blog content audit — integration notes for the new front

> Audit of the 28 articles under `src/content/`, oriented toward the upcoming
> frontend rebuild. Method: full sweep of frontmatter / images / external links /
> syntax across all 28 posts; full read of a sample (the founding Story, the
> monthly review, early/mid/late logbooks, the only `.mdx`) for editorial
> quality.
>
> Paths in this doc are relative to `apps/blog/`.
> Last updated: 2026-05-19.

---

## 1. Inventory

- **28 articles**: 1 founding narrative (`src/content/posts/2025-09-12-Story/index.md` — "The Story of Sofia"), 1 monthly review (`src/content/posts/2026-05-16-logbook/index.md` — "A Month in Review"), 26 weekly logbooks (Sept 2025 → May 2026).
- **All co-authored `[Samuel, Maxime]`** — both IDs exist in `src/content/authors.yml`. Author referential integrity: **100% OK**.
- **Format**: 27 `.md` + **a single `.mdx`** (`src/content/posts/2026-01-30-logbook/index.mdx`).
- **All 28** carry a `{/* truncate */}` marker → excerpt extraction is consistent everywhere.
- Markdown is clean: **no** Docusaurus admonitions (`:::`), no tables, no `<br>`, no `&nbsp;`. The migration off Docusaurus was done properly.

---

## 2. The frontmatter contract (what the new front must parse)

Schema actually used across all posts: **`slug`, `title`, `authors` — nothing else.**

`PostFrontmatter` (`src/lib/types.ts`) also declares `tags`, `description`, `image`, but:

| Field         | Used by    | Consequence for the new front                                                      |
| ------------- | ---------- | ---------------------------------------------------------------------------------- |
| `tags`        | **0 / 28** | The whole tag system + `/tag/*` routes are dead                                    |
| `description` | **0 / 28** | No manual SEO/OG summary → everything relies on the auto-excerpt (first paragraph) |
| `image`       | **0 / 28** | No cover image → no usable thumbnail/hero for the index or OG cards                |

→ A card-with-visual / per-article SEO / OG-image design requires **enriching the
frontmatter first**. That is content work, not code.

YAML cosmetic note: older posts have blank lines between frontmatter keys (keys on
lines 2/4/6), newer ones don't (lines 2/3/4). Parses fine either way — no action needed.

---

## 3. Data-integrity issues (by severity)

### 🔴 HIGH — `src/content/tags.yml` is Docusaurus migration junk

4 placeholder tags: `facebook`→"Gaia", `hello`→"Intuition", `docusaurus`→"Sofia",
`hola`→"Hola", with descriptions like "gaia tag description". **No article
references any tag.** Decision required before relaunch: either a real taxonomy +
re-tagging all 28 articles, or delete the tag system entirely (yml + routes).

### 🟠 HIGH — Slug collision risk

Slugs are `logbook-DD-MM` with **no year** (`deriveSlug` in `src/lib/posts.ts`).
`POSTS_BY_SLUG` silently overwrites duplicates → two logbooks on the same day/month
across different years (this is an ongoing weekly blog) would make one article
**unreachable** at `/blog/:slug`. The 28 current posts are unique, but the
convention is fragile. Fix in the new front: slug with year, or full date.

### ✅ RESOLVED — 5 orphaned image assets

Fixed on `blog/newUI` (2026-05-19). Each was reviewed visually:

- `2025-10-24/4.png` (Follow → Trust Circle UI) → **inserted** in the
  "UI / UX Enhancements" section.
- `2026-01-30/multiwallet.png` (was `mutliwallet.png`, typo renamed; Privy
  wallet picker) → **inserted** in the "Multi-Wallet Support" section.
- `2026-01-30/bookmark-collection.png` → **added as the 8th slide** of the
  existing onboarding `<ImageCarousel>`.
- `2026-01-30/design-home-card.png` (claim card w/ pills) → **inserted** in
  the "Onboarding Flow" section next to the pills bullets.
- `2025-12-19/mastra.svg` (Mastra wordmark, decorative; `currentColor` would
  render invisible on the dark theme) → **deleted**.

Result: 0 orphans on these folders; only genuine dead weight removed.

### ✅ RESOLVED — `src/content/authors.yml` hygiene

Fixed on `blog/newUI` (2026-05-19):

- `url:` is now absolute (`https://sofia.intuition.box`) for both authors.
- Author-page config unified to `page: true` for both → consistent
  `/authors/<id>` URLs. Samuel's legacy `/all-Samuel-Chauche-articles`
  permalink was dropped (Docusaurus relic, off the `/authors/:id` scheme).
- Avatars: kept on GitHub by explicit decision (third-party load accepted;
  not self-hosted).

### 🟡 MEDIUM — Perishable external links (inherited by the new front)

- Expired X broadcast: `src/content/posts/2025-10-17-logbook/index.md:30` (`x.com/i/broadcasts/...`)
- Fragile Pinata gateway: `src/content/posts/2025-12-05-logbook/index.md:103`
- "Early Access" Tally form (2025-10-24 & 2025-10-31) — likely closed
- Phala deep-links (2025-10-31, 2025-11-14) — rot-prone

---

## 4. What the new front MUST support technically

The contract is small and clean:

1. **YAML frontmatter** + **GFM** + the **`{/* truncate */}`** convention
   (excerpt = content before the marker).
2. **MDX** for one article only, which uses a **custom `<ImageCarousel>`
   component** and the **legacy `@site/src` alias**
   (`src/content/posts/2026-01-30-logbook/index.mdx:9`). → keep the alias OR
   migrate that single import.
3. **Relative images** `![](./x.png)` resolved from the article's own folder
   (8 articles concerned).

The only real code watch-point: **`ImageCarousel` + the `@site/src` alias** must
not be broken by the new front.

---

## 5. Editorial quality (read sample)

- **Strong heterogeneity**: early logbooks are terse bullet changelogs; recent
  ones (`2026-05-16`) are polished long-form editorial. A "magazine" design will
  make the early posts look thin — plan a layout that absorbs both, or re-edit
  the early ones.
- **The founding narrative has errors** (`src/content/posts/2025-09-12-Story/index.md`):
  "recommandation", "share.and spread" (missing space), "trough MCP" → through,
  "Synthetize" → Synthesize, and notably **"ElisaOS" → ElizaOS** (wrong framework
  name — a factual error on the most-read page).
- Occasional typos elsewhere: "explorer,the landing … documentation ."
  (`2026-05-16-logbook/index.md:17`).
- Title inconsistency: "Logbook DD/MM" everywhere except "Logbook 02-12"
  (`2025-12-02-logbook`), plus "Logbook 16/05 — A Month in Review" and
  "The Story of Sofia".

---

## 6. Pre-relaunch checklist (prioritized)

1. ~~**Decide on tags**: real taxonomy + re-tag the 28 articles.~~
   ✅ Done on `blog/newUI`: 12-tag taxonomy, all 28 posts tagged.
2. **Year-qualified slugs** to prevent future collisions.
3. **Add `description` + `image`** to articles if the new design wants
   SEO / OG / thumbnails.
4. ~~Remove the 5 orphaned images (or insert them if it was an oversight).~~
   ✅ Done on `blog/newUI`: 4 inserted, 1 (mastra.svg) deleted.
5. Fix "ElisaOS→ElizaOS" + the founding-story typos. _(Author `url:` +
   page-config ✅ done on `blog/newUI`.)_
6. Audit external links (X broadcast, Tally, Pinata, Phala).
7. Guarantee `ImageCarousel` + `@site/src` alias support in the new front.
