# Sofia Pro — "Add to team" extension (PoC)

A Chrome MV3 extension (Plasmo + TypeScript, same stack as `apps/extension`)
that proves the core gesture: **right-click any page or link → Add to team → it's
bookmarked.** Same intent as Sofia, driven from the browser context menu.

This is a **proof of concept** — intentionally infra-free:

- Teams are a hardcoded list (`lib/teams.ts`).
- Saved links live in `chrome.storage.local` (viewable in the popup).
- **No backend, no wallet, no payment delegation yet.** Those plug in where
  `saveBookmark()` is (`lib/bookmarks.ts`).

## Run it

```bash
cd apps/circle-pro-extension
bun install
bun run dev          # builds to build/chrome-mv3-dev with HMR
```

Then load it in Chrome:

1. `chrome://extensions/` → enable **Developer mode**
2. **Load unpacked** → select `apps/circle-pro-extension/build/chrome-mv3-dev`
3. Right-click any page (or a link) → **Add to team** → pick a team
4. Click the extension icon → see saved links (a `✓` badge flashes on save)

Production build: `bun run build` → `build/chrome-mv3-prod`.

## Files

| File | Role |
|---|---|
| `package.json` | Plasmo config + `manifest` key (permissions) |
| `background.ts` | Builds the menu, captures the URL, saves it |
| `popup.tsx` | React popup — list of saved links |
| `lib/teams.ts` | Mocked team roster |
| `lib/bookmarks.ts` | Typed `chrome.storage.local` helpers |

The `~` alias maps to the extension root (e.g. `import { TEAMS } from "~lib/teams"`).

## Next (when we do infra)

- Replace the mocked `TEAMS` with the teams the signed-in user belongs to.
- `saveBookmark()` → POST to the backend (same `bookmarkKey` normalisation +
  off-chain/on-chain decision as circle-pro-mvp).
- Frictionless payment: the team pays via a delegation the member signed with
  their wallet after being invited — the bookmark write is sponsored.
- Context capture (selection, notes, toolbox) on save.
