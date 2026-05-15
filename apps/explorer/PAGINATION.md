# Paginated Feed Hooks — Sofia Explorer Convention

When a hook fetches a list that the UI can extend page-by-page, it
**must** expose this shape so consumers can wire pagination uniformly
without hand-rolling state for each one:

```typescript
{
  items: T[]            // accumulated across pages
  loading: boolean      // first page in flight
  loadingMore: boolean  // subsequent page in flight
  hasMore: boolean      // true while the indexer can still return more
  loadMore: () => void  // fetches the next BATCH_SIZE-sized page
  refresh: () => void   // refetches page 0 + drops local extras
  error: string | null
}
```

## Hook-side rules

- Page 0 lives in the **React Query cache** (10 min stale, 24h gc,
  persisted across reloads). It's the stable head of the list.
- Subsequent pages append to a **local `extra` state** — _not_ the
  React Query cache. Avoids stitching mismatched results into a shared
  cache entry when query params change mid-pagination.
- `hasMore` flips false either eagerly (last page came back
  `< BATCH_SIZE`) or on a `loadMore` that returns `[]`.
- **Dedupe by `item.id`** when appending — the indexer can return
  overlapping rows under pagination races.
- **Reset `extra` + offset** whenever the first-page payload changes
  (new address set, refetch).
- Default `BATCH_SIZE = 200`. Don't go below 100 for a feed-like
  surface — the user is going to scroll past the fold immediately.

Reference implementations:
- [`useCircleFeed.ts`](../apps/explorer/src/hooks/useCircleFeed.ts)
- [`useUserActivity.ts`](../apps/explorer/src/hooks/useUserActivity.ts)

## Consumer-side rules

- A feed-like surface that calls a paginated hook **must** wire
  `loadMore` to a user-visible trigger (a "Load more" button, an
  intersection-observer sentinel, etc.) and surface `loadingMore`
  somehow.
- **Never `.slice(0, N)` items silently.** That drops paid-for data on
  the floor and makes the hook's pagination machinery dead code. If
  the design genuinely caps the displayed count, expose a "View all"
  affordance that opens the full list elsewhere.
- `MAX_*` constants are reserved for **preview slots** (avatar stacks,
  top-N rankings, hero cards). Not for feeds. If the user can scroll a
  list to see more, render the list to its full length and let
  pagination handle growth.

Reference consumer: [`CircleFeedSection.tsx`](../apps/explorer/src/components/circles/CircleFeedSection.tsx)
— Load-more pill below the masonry, disabled + label-flipped while
`loadingMore`.

## Anti-pattern catalogue

| Pattern | Why it's a smell |
|---|---|
| `const items = useCircleFeed(...)` then `items.slice(0, 24)` | Drops 88% of paid-for items, never invokes `loadMore`. |
| Hook returns `hasMore` but no `loadMore` | UI consumer destructures `hasMore` thinking it can extend, can't. |
| Local `useState<Item[]>([])` + manual offset in a consumer | Reinvents the hook contract per-card; cache + dedupe are ad hoc. |
| `BATCH_SIZE = 24` on a feed hook | Triggers a Load-more click after every screenful — UX cliff. |
