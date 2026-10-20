/**
 * legacyMigrationService — move a wallet's legacy page positions to the page
 * market in one go (ONE_MARKET_PER_PAGE_SPEC §6).
 *
 * Legacy = positions on the old page claims (`visits for X`, `trusts`,
 * `distrust`). They stay valid, they're just not created anymore. Moving:
 *   1. exit every legacy leg (both curves, both sides) in ONE redeemBatch;
 *   2. prefill the cart with one Recommend per page (progressive curve) for
 *      what was exited, the old intentions as tags.
 * Support side only: legacy oppose positions (and `distrust` claims — none
 * on mainnet) stay as they are, exitable from My positions.
 * The user reviews the cart before anything is re-deposited.
 */
import { CANONICAL_PREDICATE_IDS, SOFIA_I_ATOM_ID } from '@/config/atomIds'
import {
  intentionTagForLegacyPredicate,
  isLegacyPagePredicate,
} from '@0xsofia/taxonomy'
import type { CartItem } from '@/hooks/useCart'
import { getFaviconUrl } from '@/utils/favicon'
import { buildContextCartItem } from './contextCartService'
import { MIN_SIGNAL_TRUST } from './tripleCreationService'
import { redeemLegs, findFundedLegs, type RedeemResult } from './redeemService'
import type { WalletDescriptor } from './depositService'
import type { MarketPosition } from './userPositionsService'
import { createPublicClient, http } from 'viem'
import {
  INTUITION_RPC_URL,
  PROXY_ADDRESS,
  SofiaFeeProxyAbi,
} from '@/lib/contracts'

const publicClient = createPublicClient({ transport: http(INTUITION_RPC_URL) })

/** Exit fee kept by the vaults on redeem (0.75%) — shown before signing */
export const EXIT_FEE_BPS = 75n

/** The wallet's positions on legacy page claims */
export function legacyPagePositions(
  positions: readonly MarketPosition[],
): MarketPosition[] {
  return positions.filter(
    (p) =>
      p.kind === 'claim' &&
      p.side === 'support' &&
      (p.predicateLabel ?? '').trim() !== 'distrust' &&
      !!p.objectTermId &&
      isLegacyPagePredicate(p.predicateLabel ?? ''),
  )
}

/** Step 1 — exit every legacy position in one transaction */
export async function exitLegacyPositions(
  wallet: WalletDescriptor,
  positions: readonly MarketPosition[],
): Promise<RedeemResult> {
  const legs = await findFundedLegs(
    wallet.address,
    positions.map((p) => p.termId),
  )
  return redeemLegs(wallet, legs)
}

const RECOMMEND_COLOR = '#22C55E'

/** Step 2 — the Recommends (and their tags) that put the TRUST back */
export async function buildRecommendCart(
  positions: readonly MarketPosition[],
): Promise<CartItem[]> {
  interface Page {
    objectTermId: string
    title: string
    domain: string
    value: bigint
    tagSlugs: Set<string>
  }
  const pages = new Map<string, Page>()
  for (const p of positions) {
    const page = pages.get(p.objectTermId!) ?? {
      objectTermId: p.objectTermId!,
      title: p.title,
      domain: p.domain,
      value: 0n,
      tagSlugs: new Set<string>(),
    }
    page.value += BigInt(p.value)
    const tag = intentionTagForLegacyPredicate(p.predicateLabel ?? '')
    if (tag) page.tagSlugs.add(tag.slug)
    pages.set(p.objectTermId!, page)
  }

  const items: CartItem[] = []
  for (const page of pages.values()) {
    // What comes back after the exit fee, in TRUST
    const back = (page.value * (10_000n - EXIT_FEE_BPS)) / 10_000n
    const amount = Math.max(Number(back) / 1e18, MIN_SIGNAL_TRUST)
    const claimId = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'calculateTripleId',
      args: [
        SOFIA_I_ATOM_ID as `0x${string}`,
        CANONICAL_PREDICATE_IDS.recommends as `0x${string}`,
        page.objectTermId as `0x${string}`,
      ],
      authorizationList: undefined,
    })) as string
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
