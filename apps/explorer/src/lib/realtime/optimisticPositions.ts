/**
 * Optimistic overlay for My positions.
 *
 * Once a tx is mined it WILL be indexed, but the indexer lags by seconds to
 * minutes. So the cart records what each mined tx did — positions exited,
 * Recommends opened or topped up — under its own query key (persisted like
 * every query, so it survives a reload), and `useUserPositions` merges it over
 * the indexer's list. An entry is pruned as soon as the indexer reflects it:
 * an exit once the position is gone, a deposit once its shares changed.
 * Entries older than MAX_AGE_MS are dropped (never a stuck ghost).
 *
 * Written by WeightModal on tx success, reconciled by useUserPositions.
 */
import type { QueryClient } from '@tanstack/react-query'

import type {
  MarketPosition,
  UserPositionsResult,
} from '@/services/userPositionsService'

export const MAX_AGE_MS = 30 * 60 * 1000

export interface OptimisticExit {
  termId: string
  at: number
}

export interface OptimisticAdd {
  position: MarketPosition
  /** Indexed shares on this term when the tx was mined ('0' if none) */
  baseShares: string
  at: number
}

export interface OptimisticPositions {
  exited: OptimisticExit[]
  added: OptimisticAdd[]
}

export const EMPTY_OPTIMISTIC: OptimisticPositions = { exited: [], added: [] }

export const optimisticPositionsKey = (wallet: string) => [
  'user-market-positions-optimistic',
  wallet.toLowerCase(),
]

/** The indexed list useUserPositions caches for this wallet */
export const userPositionsKey = (wallet: string | undefined) => [
  'user-market-positions',
  'v3',
  wallet?.toLowerCase(),
]

const byValueDesc = (a: MarketPosition, b: MarketPosition) => {
  const d = BigInt(b.value) - BigInt(a.value)
  return d > 0n ? 1 : d < 0n ? -1 : 0
}

/** Indexed list + what mined txs did that the indexer doesn't show yet */
export function mergeOptimisticPositions(
  real: readonly MarketPosition[],
  overlay: OptimisticPositions,
  now = Date.now(),
): MarketPosition[] {
  const live = (at: number) => now - at < MAX_AGE_MS
  const exited = new Set(
    overlay.exited.filter((e) => live(e.at)).map((e) => e.termId),
  )
  const added = overlay.added.filter((a) => live(a.at))
  if (exited.size === 0 && added.length === 0) return [...real]

  const out = real.filter((p) => !exited.has(p.termId))
  for (const a of added) {
    const i = out.findIndex((p) => p.termId === a.position.termId)
    if (i === -1) {
      out.push(a.position)
      continue
    }
    // Already indexed with the new shares: the indexer has caught up
    if (out[i].shares !== a.baseShares) continue
    const value = BigInt(out[i].value) + BigInt(a.position.value)
    const deposited = BigInt(out[i].deposited) + BigInt(a.position.deposited)
    out[i] = {
      ...out[i],
      value: String(value),
      deposited: String(deposited),
      change: String(value - deposited),
    }
  }
  return out.sort(byValueDesc)
}

/** The overlay without the entries the indexer now reflects (or too old) */
export function pruneOptimisticPositions(
  real: readonly MarketPosition[],
  overlay: OptimisticPositions,
  now = Date.now(),
): OptimisticPositions {
  const shares = new Map(real.map((p) => [p.termId, p.shares]))
  return {
    exited: overlay.exited.filter(
      (e) => now - e.at < MAX_AGE_MS && shares.has(e.termId),
    ),
    added: overlay.added.filter(
      (a) =>
        now - a.at < MAX_AGE_MS &&
        (shares.get(a.position.termId) ?? '0') === a.baseShares,
    ),
  }
}

function read(qc: QueryClient, wallet: string): OptimisticPositions {
  return (
    qc.getQueryData<OptimisticPositions>(optimisticPositionsKey(wallet)) ??
    EMPTY_OPTIMISTIC
  )
}

function realPositions(qc: QueryClient, wallet: string): MarketPosition[] {
  return (
    qc.getQueryData<UserPositionsResult>(userPositionsKey(wallet))?.positions ??
    []
  )
}

/** Positions emptied by a mined exit */
export function markPositionsExited(
  qc: QueryClient,
  wallet: string,
  termIds: readonly string[],
): void {
  if (termIds.length === 0) return
  const current = read(qc, wallet)
  const known = new Set(current.exited.map((e) => e.termId))
  const at = Date.now()
  const fresh = [...new Set(termIds)]
    .filter((id) => !known.has(id))
    .map((termId) => ({ termId, at }))
  qc.setQueryData(optimisticPositionsKey(wallet), {
    exited: [...current.exited, ...fresh],
    // An exit cancels what was just added on the same term
    added: current.added.filter((a) => !termIds.includes(a.position.termId)),
  })
}

/** Positions opened or topped up by a mined deposit / creation */
export function markPositionsAdded(
  qc: QueryClient,
  wallet: string,
  positions: readonly MarketPosition[],
): void {
  if (positions.length === 0) return
  const current = read(qc, wallet)
  const shares = new Map(
    realPositions(qc, wallet).map((p) => [p.termId, p.shares]),
  )
  const at = Date.now()
  qc.setQueryData(optimisticPositionsKey(wallet), {
    exited: current.exited.filter(
      (e) => !positions.some((p) => p.termId === e.termId),
    ),
    added: [
      ...current.added,
      ...positions.map((position) => ({
        position,
        baseShares: shares.get(position.termId) ?? '0',
        at,
      })),
    ],
  })
}

/** A just-mined page-market position, before the indexer has its row */
export function pendingPosition(input: {
  termId: string
  amountWei: bigint
  title: string
  image: string | null
  objectTermId: string | null
  predicateLabel: string | null
  side: 'support' | 'oppose'
}): MarketPosition {
  const amount = String(input.amountWei)
  return {
    termId: input.termId,
    legs: [],
    markValue: amount,
    kind: 'claim',
    side: input.side,
    claimTermId: input.termId,
    objectTermId: input.objectTermId,
    title: input.title,
    predicateLabel: input.predicateLabel,
    subjectLabel: null,
    url: '',
    domain: '',
    image: input.image,
    shares: '0',
    deposited: amount,
    value: amount,
    change: '0',
    changePct: 0,
    totalStaked: amount,
    supporters: 1,
    openedAt: new Date().toISOString(),
  }
}
