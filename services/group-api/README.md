# group-api

Gated **group-join** backend for the Sofia explorer. A user **requests** to join
an on-chain group (circle); the group's **owner/admins** are notified and
**approve or reject**; on approval the user mints the on-chain `MEMBER_OF`
triple via the explorer cart (this service only gates).

Modelled on [intuition-box/Atlas](https://github.com/intuition-box/Atlas)
(Application / Membership / Notification / Event + OWNER/ADMIN/MODERATOR/MEMBER
roles), adapted to **wallet/Privy** identity + the **on-chain group atom
term_id** instead of NextAuth userId + communityId.

## Stack

- **Bun + Hono** (HTTP), boots via `bun src/index.ts`
- **Prisma + Postgres** (relational store)
- **Privy** server-side JWT verification (`@privy-io/server-auth`)
- **Ably** realtime notifications (`notif:{wallet}` channel)

## Develop

```bash
cp .env.example .env      # fill DATABASE_URL, PRIVY_*, ABLY_API_KEY
bun install
bun run db:migrate        # create tables (prisma migrate dev)
bun run dev               # http://localhost:8788
```

## API (all routes require `Authorization: Bearer <privy token>`, except /health)

| Method | Path                                                 | Role        | Purpose                         |
| ------ | ---------------------------------------------------- | ----------- | ------------------------------- |
| GET    | `/health`                                            | —           | liveness                        |
| POST   | `/groups/:groupTermId/applications`                  | any         | request to join                 |
| GET    | `/groups/:groupTermId/applications?status=pending`   | reviewer    | list requests                   |
| POST   | `/applications/:id/approve` · `/reject`              | reviewer    | decide                          |
| GET    | `/me/membership?groupTermId=`                        | any         | my status (drives the join CTA) |
| GET    | `/groups/:groupTermId/members`                       | any         | roster + roles                  |
| GET    | `/groups/:groupTermId/me/is-admin`                   | any         | can I review?                   |
| POST   | `/groups/:groupTermId/members/:wallet/role`          | owner       | promote/demote                  |
| DELETE | `/groups/:groupTermId/members/:wallet`               | owner/admin | ban                             |
| GET    | `/me/notifications` · POST `/notifications/:id/read` | any         | notif history                   |
| GET    | `/ably/token`                                        | any         | scoped realtime token           |

Reviewer = OWNER / ADMIN / MODERATOR. The owner is seeded automatically from the
group atom's on-chain creator on first interaction.

## Deploy (Coolify)

Build context = `services/group-api`, Dockerfile = `Dockerfile`, port `8788`.
Env: `DATABASE_URL`, `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `ABLY_API_KEY`,
`INTUITION_GRAPHQL_URL`, `CORS_ORIGINS`. The container runs
`prisma migrate deploy` on boot.
