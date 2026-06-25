# Intuition Pro — circle-pro-mvp

> **Status:** wired to a **real backend**. Bookmarks, comments, profiles and the
> group search are live (off-chain) via `services/circle-pro-api`. Auth is real
> (Privy for the web app, ENS-aware). Bound to become the **Pro tab inside
> `apps/explorer`** — built migration-ready on the shared packages.

The hero loop: **import your bookmarks → qualify them with the taxonomy → share
them to your team → search the whole group's knowledge.** A multi-tenant SaaS
where each **circle** is a workspace (one per on-chain group atom).

Runs on **:5174** (the explorer owns :5173).

---

## Architecture (what's real vs mock)

```
apps/circle-pro-mvp (web app, :5174)        services/circle-pro-api (Hono+Bun+Prisma+Postgres, :8789)
  Essential = search landing ───────────────►  GET /search, /search/hints   (real)
  PostDetail comments ──────────────────────►  /bookmarks/:key/comments CRUD (real)
  My bookmarks (IndexedDB private) ─ Share ──►  POST /bookmarks + tags        (real)
  Onboarding (import bookmarks.html) ────────►  (local IndexedDB, then Share)
  Privy login + ENS auto ───────────────────►  Profile (handle/displayName)  (real)
```

| Surface | State |
|---|---|
| **Search** (Essential landing) | **real** — backend over bookmarks/comments/people + mock tools/memory/skills ("soon") |
| **Comments** (PostDetail) | **real** — circle-pro-api, public read / auth+profile write, edit/delete/like |
| **My bookmarks** | **real** — private collection in **IndexedDB**, explicit **Share** → backend; Sync (file import); grid/list |
| **Onboarding** | **real** — upload your exported `bookmarks.html`, sort into topics, lands in My bookmarks |
| **Identity** | **real** — Privy login + ENS auto-adopt → `Profile` (no `0x…` shown) |
| Members / Activity / Memory / Roles / TeamView | **mock** (colleague's UI surfaces, not yet wired) |

The single qualification invariant: the **normalised URL** (`@0xsofia/url-key`,
shared by app + backend + extension) is the bookmark key — it must match what
derives a URL's Intuition atom, so rows are on-chain-reconcilable later.

---

## Run it

```bash
# 1. backend + its Postgres (one terminal)
cd services/circle-pro-api
cp .env.example .env            # set DATABASE_URL, JWT_SECRET; PRIVY_* optional in dev
bun install                     # (or `bun install` at the monorepo root)
bun run db:up                   # local Postgres (docker, :5433)
bun run db:migrate              # tables
bun run dev                     # API on :8789
bun test                        # 22 tests (SIWE auth + endpoints)

# 2. the web app (another terminal)
cd apps/circle-pro-mvp          # set .env: VITE_PRIVY_APP_ID, VITE_CIRCLE_PRO_API_URL=http://localhost:8789
bun run dev                     # :5174  (or `bun run --filter circle-pro-mvp dev` from root)
```

---

## Auth — two paths, one API

`circle-pro-api`'s `authMiddleware` accepts three credentials:

1. **Privy bearer** — the web app (this app, and later the explorer Pro tab).
2. **SIWE → JWT** — wallet-native, for the **extension** (no Privy login): the
   wallet signs a nonce → `/auth/siwe` issues an HS256 JWT (`exp 12h`).
3. **dev backdoor** (`x-dev-token` + `x-dev-wallet`) — local testing only.

This is why both the explorer (Privy) and the extension (SIWE) can write to the
same circle-pro DB.

---

## Multi-tenant model

- A **circle** = an on-chain **group atom** (`term_id`). Created via the
  explorer's create-circle flow; membership = `member_of` triples (mirrored
  off-chain by `group-api`).
- Everything is scoped by `circleId`. **Writes are members-only** (membership gate).
- The extension's Share targets a **selected circle** (picker in the modal).

---

## The extension bridge

`apps/circle-pro-extension` is the **prototype** of the right-click **"Share in
Sofia"** modal (taxonomy tags + context + preview). The plan is to **port it into
the published `apps/extension`** (the browser bridge) and wire its Share to
`POST /bookmarks` using the SIWE→JWT path — so a right-click lands a qualified
bookmark in the circle's DB. The extension stores its JWT in
`chrome.storage.session` (cleared on browser close).

---

## Migration into the explorer (later)

A lift-and-reparent, not a rewrite — by design:
- The **backend doesn't move**; the explorer Pro tab calls the same `circle-pro-api`.
- Components ride on the **shared packages** (`@0xsofia/url-key`, `taxonomy`,
  `design-system`, `graphql`) the explorer already uses.
- Business logic lives in **hooks/services**; auth is behind a thin `useAuth`
  facade → swap to the explorer's Privy session, nothing else changes.
- `circleId` is already dynamic (multi-tenant).
