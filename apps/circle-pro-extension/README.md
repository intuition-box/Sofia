# Sofia Pro — "Share in Sofia" extension (PoC)

A Chrome MV3 extension (Plasmo + TypeScript, same stack as `apps/extension`)
that proves the core gesture: **right-click any page or link → Share in Sofia →
qualify it with the Sofia taxonomy.**

It injects a Dropmark-style modal **into the current page** (shadow-DOM isolated),
so you never have to open the extension:

- **Title** — pre-filled from the page, freely editable.
- **Tags** — typed search over the real `@0xsofia/taxonomy` (topics → categories
  → niches); selected tags show as colored pills.
- **Preview** — a live thumbnail of the page on the right.

No intentions/verbs — taxonomy only, by design.

This is a **proof of concept** — infra-free: the qualified bookmark is saved to
`chrome.storage.local` (viewable in the popup). The payload shape (`SavedBookmark`
in `lib/bookmarks.ts`) is already the real one, so the backend POST + team-sponsored
payment delegation plug in at `saveBookmark()` later.

## Run it

```bash
cd apps/circle-pro-extension
bun install
bun run dev          # builds to build/chrome-mv3-dev with HMR
```

Then in Chrome:

1. `chrome://extensions/` → enable **Developer mode**
2. **Load unpacked** → select `apps/circle-pro-extension/build/chrome-mv3-dev`
3. Reload a normal web page (content scripts only inject on fresh loads)
4. Right-click the page (or a link) → **Share in Sofia** → edit title, add taxonomy
   tags, **Share**
5. Click the extension icon → see saved links with their tags

## Files

| File | Role |
|---|---|
| `background.ts` | Registers the "Share in Sofia" menu, messages the page |
| `contents/share-modal.tsx` | The injected modal (CSUI, shadow DOM) |
| `components/TagInput.tsx` | Taxonomy tag field (search-to-add) |
| `lib/taxonomyIndex.ts` | Flat searchable index of `@0xsofia/taxonomy` |
| `lib/bookmarks.ts` | Typed payload + `chrome.storage.local` helpers |
| `lib/normalizeUrl.ts` | URL normalisation (mirrors circle-pro-mvp's bookmarkKey) |
| `lib/history.ts` | Recent browsing (`chrome.history`) for the popup |
| `components/QualifyFields.tsx` | Shared title + context + tags form (modal & popup) |
| `styles.css` | Shared `.sis-*` styles (modal shadow DOM + popup) |
| `popup.tsx` | Two views: **Recent browsing** (publish inline) + **Shared** |

## Popup — the curation loop

The popup has two tabs:

- **Recent browsing** — your `chrome.history`; click a page to qualify it inline
  (title + context + taxonomy tags) and **Share in Sofia** without leaving the
  popup. Pages already shared are flagged `✓ shared`.
- **Shared** — what you've contributed, with context + tags.

Adds the `history` permission — **reload the extension** in `chrome://extensions/`
after the first build so Chrome grants it.

The `~` alias maps to the extension root (e.g. `import { TagInput } from "~components/TagInput"`).

## Next (when we do infra)

- `saveBookmark()` → POST to the backend (same `normalizeUrl` key as circle-pro-mvp).
- Frictionless payment: the team sponsors the write via a delegation the member
  signed with their wallet after being invited.
- Map taxonomy tags → on-chain "in context of" atoms (`@0xsofia/taxonomy`
  already exposes `contextAtomIdForSlug`).
