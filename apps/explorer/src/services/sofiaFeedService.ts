/**
 * sofiaFeedService — single fetch path behind the unified `useSofiaFeed` hook.
 *
 * Recency model — POSITIONS, not triples.
 * --------------------------------------
 * The feed must reflect the latest *staking action*, but a triple's
 * `created_at` is frozen at first mint, so ordering triples by it buries
 * recent certs on pre-existing URLs and hides topic tags entirely (a tag is
 * a stake on a separate "in context of" triple). The profile calendar reads
 * the `positions` table directly, which is why it shows everything the feed
 * misses.
 *
 * So this service drives the feed from `positions` (indexed on `created_at`):
 *   1. Cert positions (visits-for / trusts) → the base feed cards, newest
 *      staking action first. Global collapses to one card per URL (most
 *      recent endorser); circle keeps one per (member, URL).
 *   2. Topic enrichment — `enrichWithTopicContexts` resolves each cert's
 *      `in context of <topic>` links (authoritative, all users).
 *   3. Context (tag) positions — bump a card's timestamp to the moment it was
 *      last tagged, so tagging an old cert resurfaces it (and feeds the topic
 *      filter). Certs tagged recently but whose own cert-position fell outside
 *      the window are backfilled by term_id.
 *   4. Re-sort by timestamp desc.
 */
import { getAddress } from 'viem'
import {
  useGetSofiaFeedCertPositionsQuery,
  useGetSofiaFeedContextPositionsQuery,
  useGetSofiaFeedTriplesByIdsQuery,
  type Positions_Bool_Exp,
} from '@0xsofia/graphql'
import {
  processEvents,
  enrichWithTopicContexts,
  type FeedEvent,
  type CertifierInfo,
} from './feedProcessing'
import type { CircleItem } from './circleService'

/** Sofia's canonical predicate labels — kept in sync with
 *  `userOnChainProfileService` and `circleService`. */
export const SOFIA_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing-space variant
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
  'trusts',
  'distrust',
] as const

export interface SofiaFeedParams {
  /** When non-empty, scope the feed to positions held by any of these
   *  wallets. When empty/undefined, return the global Sofia feed. */
  accountIds?: readonly string[]
  /** Viewer wallets — drives the per-card `userSupported` / `userOpposed`
   *  flags via the nested vault-position filter. */
  viewerWallets: readonly string[]
  /** Predicate label allow-list. Defaults to the full Sofia set. */
  predicateLabels?: readonly string[]
  limit?: number
  offset?: number
}

/** Both checksum + lowercase casings — the indexer is inconsistent across
 *  deposit emitters, so querying one casing silently drops the other (same
 *  dual-case fix `userOnChainProfileService` uses). */
function bothCasings(addresses: readonly string[]): string[] {
  const checksum = addresses.map((a) => getAddress(a))
  const lower = addresses.map((a) => a.toLowerCase())
  return Array.from(new Set([...checksum, ...lower]))
}

const getCertifier = (evt: FeedEvent): CertifierInfo => ({
  address: evt.deposit?.receiver?.id || '',
  label: evt.deposit?.receiver?.label || evt.deposit?.receiver?.id || '',
})

export async function fetchSofiaFeed({
  accountIds,
  viewerWallets,
  predicateLabels = SOFIA_PREDICATE_LABELS,
  limit = 1000,
  offset = 0,
}: SofiaFeedParams): Promise<CircleItem[]> {
  const viewer = bothCasings(viewerWallets)
  const labels = [...predicateLabels]
  const isScoped = !!accountIds && accountIds.length > 0
  const scoped = isScoped ? bothCasings(accountIds!) : []
  const scopeFilter: Positions_Bool_Exp = isScoped
    ? { account_id: { _in: scoped } }
    : {}

  // ── 1. Cert positions — recency-ordered base cards ──
  const certWhere: Positions_Bool_Exp = {
    shares: { _gt: '0' },
    term: { triple: { predicate: { label: { _in: labels } } } },
    ...scopeFilter,
  }
  const certData = await useGetSofiaFeedCertPositionsQuery.fetcher({
    where: certWhere,
    userAddresses: viewer,
    limit,
    offset,
  })()

  let certRows = certData.positions ?? []
  // Global feed → one card per URL: positions arrive newest-first, so the
  // first row per triple IS the most recent endorser. (Circle keeps every
  // member's position so the card fans out per member, as before.)
  if (!isScoped) {
    const seen = new Set<string>()
    certRows = certRows.filter((p) => {
      const id = p.term?.triple?.term_id
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

  const synthetic: FeedEvent[] = certRows.map((p) => ({
    id: `${p.term?.triple?.term_id ?? ''}-${p.account_id ?? ''}`,
    created_at: p.created_at ?? undefined,
    triple: p.term?.triple,
    deposit: {
      receiver: {
        id: p.account_id ?? '',
        label: p.account?.label ?? p.account_id ?? '',
      },
    },
  }))

  const items = processEvents(synthetic, getCertifier)
  await enrichWithTopicContexts(items, viewer)

  // ── 2. Context (tag) positions — latest tag timestamp per cert term_id ──
  const ctxWhere: Positions_Bool_Exp = {
    shares: { _gt: '0' },
    term: { triple: { predicate: { label: { _eq: 'in context of' } } } },
    ...scopeFilter,
  }
  const ctxData = await useGetSofiaFeedContextPositionsQuery.fetcher({
    where: ctxWhere,
    limit,
    offset,
  })()

  const tagTime = new Map<string, string>()
  for (const p of ctxData.positions ?? []) {
    const certId = p.term?.triple?.subject_id
    const ts = p.created_at
    if (!certId || !ts) continue
    const prev = tagTime.get(certId)
    if (!prev || ts > prev) tagTime.set(certId, ts)
  }

  // cert term_id → the card(s) it backs (a card stacks one vault per intention).
  const termIdToItems = new Map<string, CircleItem[]>()
  for (const item of items) {
    for (const vault of Object.values(item.intentionVaults)) {
      if (!vault.termId) continue
      const arr = termIdToItems.get(vault.termId)
      if (arr) arr.push(item)
      else termIdToItems.set(vault.termId, [item])
    }
  }

  // ── 3. Bump existing cards to their latest tag time ──
  for (const [certId, ts] of tagTime) {
    const linked = termIdToItems.get(certId)
    if (!linked) continue
    for (const item of linked) if (ts > item.timestamp) item.timestamp = ts
  }

  // Backfill: certs tagged recently but whose own cert-position fell outside
  // the window — fetch their metadata by id so the card still surfaces.
  const missing = [...tagTime.keys()].filter((id) => !termIdToItems.has(id))
  if (missing.length > 0) {
    const bf = await useGetSofiaFeedTriplesByIdsQuery.fetcher({
      termIds: missing,
      userAddresses: viewer,
    })()
    const bfSynthetic: FeedEvent[] = (bf.triples ?? []).map((t) => {
      const rp = t.recentPositions?.[0]
      return {
        id: `${t.term_id ?? ''}-${rp?.account_id ?? 'tag'}`,
        created_at: tagTime.get(t.term_id ?? '') ?? rp?.created_at ?? undefined,
        triple: t,
        deposit: {
          receiver: {
            id: rp?.account_id ?? '',
            label: rp?.account?.label ?? rp?.account_id ?? '',
          },
        },
      }
    })
    const bfItems = processEvents(bfSynthetic, getCertifier)
    await enrichWithTopicContexts(bfItems, viewer)
    items.push(...bfItems)
  }

  // ── 4. Recency sort (ISO timestamps compare lexicographically) ──
  items.sort((a, b) =>
    b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0,
  )
  return items
}
