/**
 * Optimistic overlay for the user's Trust Circle.
 *
 * The trust circle is a GraphQL LIST query (['trustCircle', …]) with no
 * per-slug share map, so the generic `applyOptimisticPosition` (which bumps
 * topic/category/platform maps) can't cover it. Instead we keep a tiny
 * side-list of just-trusted accounts under its own query key; `useTrustCircle`
 * merges it in (deduped by termId) so a freshly-signed trust shows up
 * instantly and survives refetches — until the indexer returns the real
 * triple, at which point `pruneOptimisticTrust` drops the placeholder.
 *
 * Written by WeightModal on tx success (once a trust triple is signed it WILL
 * be indexed), reconciled by useTrustCircle.
 */
import type { QueryClient } from '@tanstack/react-query'

import type { TrustCircleAccount } from '@/services/trustCircleService'

export const OPTIMISTIC_TRUST_KEY: string[] = ['trustCircle-optimistic']

function read(qc: QueryClient): TrustCircleAccount[] {
  return (
    (qc.getQueryData(OPTIMISTIC_TRUST_KEY) as
      | TrustCircleAccount[]
      | undefined) ?? []
  )
}

/** Add a just-trusted account to the overlay (dedupe by termId). */
export function addOptimisticTrust(
  qc: QueryClient,
  account: TrustCircleAccount,
): void {
  const current = read(qc)
  if (current.some((a) => a.termId === account.termId)) return
  qc.setQueryData(OPTIMISTIC_TRUST_KEY, [...current, account])
}

/** Drop overlay entries whose real triple is now indexed (present in the
 *  authoritative list), so no stale placeholder lingers. */
export function pruneOptimisticTrust(
  qc: QueryClient,
  indexedTermIds: Set<string>,
): void {
  const current = read(qc)
  if (!current.length) return
  const next = current.filter((a) => !indexedTermIds.has(a.termId))
  if (next.length !== current.length) {
    qc.setQueryData(OPTIMISTIC_TRUST_KEY, next)
  }
}
