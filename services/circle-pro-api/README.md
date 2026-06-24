# circle-pro-api

Off-chain backend for **circle-pro-mvp** (the first pro-client MVP). Hono + Bun +
Prisma/Postgres + Privy JWT auth. Same shape as `services/group-api`.

Two concerns:

- **Identity** — a `Profile` maps a wallet (Privy embedded/linked) to a unique
  `@handle` + free `displayName`, so the UI never shows a `0x…` address.
- **Discussion** — `Comment` + `CommentLike` attached to a bookmark.

Bookmarks themselves are **not** stored here. A comment references a
`bookmarkKey` = normalised URL, valid whether bookmarks end up on-chain (atom
`term_id`, mappable from the URL) or off-chain later. Zero migration either way.

## Local dev

```bash
cd services/circle-pro-api
cp .env.example .env            # already provided for local; tweak if needed
bun install
bun run db:up                   # start local Postgres (docker, port 5433)
bun run db:migrate              # create tables (name it e.g. "init")
bun run dev                     # http://localhost:8789
```

Prod swaps `DATABASE_URL` for a Neon connection string — no code change.

## Auth

The front sends `Authorization: Bearer <privy access token>`; the server
verifies it, resolves the wallet (embedded or linked), and lowercases it.

For **curl testing without Privy**, set `DEV_SEED_TOKEN` (already
`dev-local-secret` in the local `.env`) and impersonate a wallet with the
`x-dev-token` + `x-dev-wallet` headers.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness, auth-free |
| GET | `/me/profile` | 404 `PROFILE_REQUIRED` drives the pseudo gate |
| POST | `/me/profile` | `{ handle, displayName?, avatarSeed? }` |
| PATCH | `/me/profile` | Update handle/displayName/avatar |
| GET | `/profiles/check?handle=` | Live availability check |
| GET | `/profiles?wallets=a,b` | Batch resolve authors |
| GET | `/bookmarks/:key/comments` | Thread (oldest-first), `?offset=&limit=&circleId=` |
| POST | `/bookmarks/:key/comments` | `{ text, circleId? }` — needs a profile |
| PATCH | `/comments/:id` | Edit (author only) → sets `edited` |
| DELETE | `/comments/:id` | Soft-delete (author only) |
| POST/DELETE | `/comments/:id/like` | Toggle like |

`:key` is the URL-encoded `bookmarkKey` (normalised URL).

## Smoke test (no Privy)

```bash
T=dev-local-secret
W=0xaaa0000000000000000000000000000000000001
BK=$(python3 -c "import urllib.parse;print(urllib.parse.quote('https://example.com/post',safe=''))")

# 1. seed a profile (dev backdoor)
curl -s -XPOST localhost:8789/dev/seed-profile -H "x-dev-token: $T" \
  -H 'content-type: application/json' \
  -d "{\"wallet\":\"$W\",\"handle\":\"alice\",\"displayName\":\"Alice\"}"

# 2. post a comment as that wallet
curl -s -XPOST "localhost:8789/bookmarks/$BK/comments" \
  -H "x-dev-token: $T" -H "x-dev-wallet: $W" \
  -H 'content-type: application/json' -d '{"text":"first!"}'

# 3. read the thread
curl -s "localhost:8789/bookmarks/$BK/comments" \
  -H "x-dev-token: $T" -H "x-dev-wallet: $W"
```
