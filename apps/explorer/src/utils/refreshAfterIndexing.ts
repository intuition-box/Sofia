import type { QueryClient, QueryKey } from '@tanstack/react-query'

/** The indexer takes a few seconds to show a new position */
const DELAYS_MS = [3_000, 10_000, 25_000]

/** Refetches `keys` while the indexer catches up with a write just sent */
export function refreshAfterIndexing(qc: QueryClient, keys: QueryKey[]) {
  for (const ms of DELAYS_MS) {
    setTimeout(() => {
      for (const queryKey of keys) void qc.invalidateQueries({ queryKey })
    }, ms)
  }
}
