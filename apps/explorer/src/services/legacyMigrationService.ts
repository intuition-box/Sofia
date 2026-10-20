/**
 * legacyMigrationService — move a wallet's legacy page positions to the page
 * market (ONE_MARKET_PER_PAGE_SPEC §6).
 *
 * Legacy = positions on the old page claims (`visits for X`, `trusts`). They
 * stay valid, they're just not created anymore. Moving a page:
 *   1. exit its legacy legs (both curves) — redeemBatch, chunked;
 *   2. prefill the cart with one Recommend for what was exited (progressive
 *      curve), the old intentions as tags. The user reviews, then confirms.
 * Only pages above a threshold move: every re-deposit pays Sofia's fee and,
 * for a page without a market yet, the claim creation — not worth it on
 * dust. Support side only (no legacy `distrust` claims on mainnet).
 *
 * No RPC read before signing: the public RPC has a per-IP bandwidth quota.
 * Shares per curve come from the indexed positions, claim ids are computed
 * locally (deterministic).
 */
import { CANONICAL_PREDICATE_IDS, SOFIA_I_ATOM_ID } from '@/config/atomIds'
import {
  intentionTagForLegacyPredicate,
  isLegacyPagePredicate,
  LEGACY_PAGE_PREDICATE_LABELS,
  PAGE_MARKET_PREDICATE_LABEL,
} from '@0xsofia/taxonomy'
import type { CartItem } from '@/hooks/useCart'
import { useGetUserRecentPageExitsQuery } from '@0xsofia/graphql'
import { calculateTripleId } from '@/lib/contracts'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import { buildContextCartItem } from './contextCartService'
import { getFeeParams, type WalletDescriptor } from './depositService'
import {
  redeemLegs,
  REDEEM_BATCH_SIZE,
  type RedeemLeg,
  type RedeemResult,
} from './redeemService'
import { MIN_SIGNAL_TRUST } from './tripleCreationService'
import type { MarketPosition } from './userPositionsService'

/** Exit fee kept by the vaults on redeem (0.75%) */
export const EXIT_FEE_BPS = 75n
/** Threshold presets (TRUST per page) — 0 = every page */
export const MIGRATION_THRESHOLDS = [0, 0.5, 1, 5] as const
export const DEFAULT_MIGRATION_THRESHOLD = 1

const RECOMMEND_COLOR = '#22C55E'
const WAD = 10n ** 18n

/** One page's legacy positions, grouped */
export interface LegacyPage {
  objectTermId: string
  title: string
  domain: string
  /** Σ value of its legacy positions (wei) */
  value: bigint
  positions: MarketPosition[]
  /** `intent:work`… from the legacy predicates */
  tagSlugs: string[]
  /** Already exited (resume): `value` is what came back, fees already out */
  exited?: boolean
}

/** The wallet's legacy page positions, grouped by page, biggest first */
export function legacyPages(
  positions: readonly MarketPosition[],
): LegacyPage[] {
  const pages = new Map<string, LegacyPage>()
  for (const p of positions) {
    if (
      p.kind !== 'claim' ||
      p.side !== 'support' ||
      !p.legs?.length ||
      !p.objectTermId ||
      (p.predicateLabel ?? '').trim() === 'distrust' ||
      !isLegacyPagePredicate(p.predicateLabel ?? '')
    ) {
      continue
    }
    const page = pages.get(p.objectTermId) ?? {
      objectTermId: p.objectTermId,
      title: p.title,
      domain: p.domain,
      value: 0n,
      positions: [],
      tagSlugs: [],
    }
    page.value += BigInt(p.value)
    page.positions.push(p)
    const tag = intentionTagForLegacyPredicate(p.predicateLabel ?? '')
    if (tag && !page.tagSlugs.includes(tag.slug)) page.tagSlugs.push(tag.slug)
    pages.set(p.objectTermId, page)
  }
  return [...pages.values()].sort((a, b) =>
    b.value > a.value ? 1 : b.value < a.value ? -1 : 0,
  )
}

/** Pages worth moving at this threshold (TRUST) */
export const pagesAbove = (pages: readonly LegacyPage[], threshold: number) =>
  pages.filter((p) => Number(p.value) / 1e18 >= threshold)

const afterExitFee = (value: bigint) =>
  (value * (10_000n - EXIT_FEE_BPS)) / 10_000n

/** Every funded leg (vault × curve) of these pages, from the indexed data */
function pageLegs(pages: readonly LegacyPage[]): RedeemLeg[] {
  return pages.flatMap((p) =>
    p.positions.flatMap((pos) =>
      (pos.legs ?? [])
        .filter((l) => BigInt(l.shares) > 0n)
        .map((l) => ({
          termId: pos.termId,
          curveId: BigInt(l.curveId),
          shares: BigInt(l.shares),
        })),
    ),
  )
}

export interface MigrationEstimate {
  pages: number
  /** What comes back after the exit fee (wei) */
  moved: bigint
  /** Exit fee + Sofia fixed/percent fees + claim creations, worst case (wei) */
  fees: bigint
  /** Exit transactions to sign */
  signatures: number
}

/** Cost of moving these pages — worst case: every page needs its claim */
export async function estimateMigration(
  pages: readonly LegacyPage[],
): Promise<MigrationEstimate> {
  const total = pages.reduce((sum, p) => sum + p.value, 0n)
  const moved = afterExitFee(total)
  const fp = await getFeeParams()
  const perPage = fp.depositFixed + fp.creationFixed + fp.tripleCost
  const percent = fp.feeDenom > 0n ? (moved * fp.depositPct) / fp.feeDenom : 0n
  return {
    pages: pages.length,
    moved,
    fees: total - moved + perPage * BigInt(pages.length) + percent,
    signatures: Math.max(
      1,
      Math.ceil(pageLegs(pages).length / REDEEM_BATCH_SIZE),
    ),
  }
}

/** Step 1 — exit the pages' legacy legs, one redeemBatch per chunk of
 *  about 100 legs. A page is never split across two transactions, and the
 *  pages fully exited are reported even when a later chunk fails — so the
 *  caller can still queue their Recommends. */
export async function exitLegacyPages(
  wallet: WalletDescriptor,
  pages: readonly LegacyPage[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ exited: LegacyPage[]; result: RedeemResult }> {
  const chunks: LegacyPage[][] = []
  let current: LegacyPage[] = []
  let legCount = 0
  for (const page of pages) {
    const n = pageLegs([page]).length
    if (current.length > 0 && legCount + n > REDEEM_BATCH_SIZE) {
      chunks.push(current)
      current = []
      legCount = 0
    }
    current.push(page)
    legCount += n
  }
  if (current.length > 0) chunks.push(current)

  const exited: LegacyPage[] = []
  let result: RedeemResult = { success: true, noop: true }
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i, chunks.length)
    result = await redeemLegs(wallet, pageLegs(chunks[i]))
    if (!result.success) return { exited, result }
    exited.push(...chunks[i])
  }
  onProgress?.(chunks.length, chunks.length)
  return { exited, result }
}

/**
 * Pages exited recently from legacy claims that aren't back on the market
 * yet (a migration that stopped half-way, or the cart never confirmed).
 * From the indexer only. Pages that still hold a legacy position (they'll
 * move with the banner) or already a Recommend are left out.
 */
export async function fetchExitedPages(
  addresses: string[],
  positions: readonly MarketPosition[],
  sinceDays = 14,
): Promise<LegacyPage[]> {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString()
  const data = await useGetUserRecentPageExitsQuery.fetcher({
    addresses,
    since,
    predicateLabels: LEGACY_PAGE_PREDICATE_LABELS.filter(
      (l) => l !== 'distrust',
    ),
  })()
  const settled = new Set(
    positions
      .filter(
        (p) =>
          p.kind === 'claim' &&
          !!p.objectTermId &&
          (p.predicateLabel === PAGE_MARKET_PREDICATE_LABEL ||
            isLegacyPagePredicate(p.predicateLabel ?? '')),
      )
      .map((p) => p.objectTermId!),
  )
  const pages = new Map<string, LegacyPage>()
  for (const r of data.redemptions ?? []) {
    const triple = r.term?.triple
    // Support side only: the redeemed term is the claim itself
    if (!triple?.object || r.term_id !== triple.term_id) continue
    const objectId = triple.object.term_id
    if (settled.has(objectId)) continue
    const url = triple.object.value?.thing?.url ?? ''
    const page = pages.get(objectId) ?? {
      objectTermId: objectId,
      title: triple.object.value?.thing?.name || triple.object.label || 'Page',
      domain: url ? extractDomain(url) : '',
      value: 0n,
      positions: [],
      tagSlugs: [],
      exited: true,
    }
    page.value += BigInt(r.assets ?? '0')
    const tag = intentionTagForLegacyPredicate(triple.predicate?.label ?? '')
    if (tag && !page.tagSlugs.includes(tag.slug)) page.tagSlugs.push(tag.slug)
    pages.set(objectId, page)
  }
  return [...pages.values()].sort((a, b) =>
    b.value > a.value ? 1 : b.value < a.value ? -1 : 0,
  )
}

/** Step 2 — the Recommends (and their tags) that put the TRUST back */
export function buildRecommendCart(pages: readonly LegacyPage[]): CartItem[] {
  const items: CartItem[] = []
  for (const page of pages) {
    const claimId = calculateTripleId(
      SOFIA_I_ATOM_ID,
      CANONICAL_PREDICATE_IDS.recommends,
      page.objectTermId,
    )
    const back = page.exited ? page.value : afterExitFee(page.value)
    const amount = Math.max(
      Number((back * 10_000n) / WAD) / 10_000,
      MIN_SIGNAL_TRUST,
    )
    const favicon = page.domain ? getFaviconUrl(page.domain) : ''
    // create-triple deposits when the claim exists, creates it otherwise
    items.push({
      id: `recommend:${page.objectTermId}`,
      side: 'support',
      kind: 'create-triple',
      termId: claimId,
      subjectId: SOFIA_I_ATOM_ID,
      predicateId: CANONICAL_PREDICATE_IDS.recommends,
      objectId: page.objectTermId,
      intention: 'Recommend',
      title: page.title,
      favicon,
      intentionColor: RECOMMEND_COLOR,
      curveId: 2,
      presetAmount: amount,
    })
    for (const slug of page.tagSlugs) {
      const label = slug.replace(/^intent:/, '')
      const tag = buildContextCartItem({
        certTermId: claimId,
        topicSlug: slug,
        topicLabel: label.charAt(0).toUpperCase() + label.slice(1),
        topicColor: RECOMMEND_COLOR,
        certTitle: page.title,
        certFavicon: favicon,
      })
      // A tag only needs the minimum stake
      if (tag) items.push({ ...tag, presetAmount: MIN_SIGNAL_TRUST })
    }
  }
  return items
}
