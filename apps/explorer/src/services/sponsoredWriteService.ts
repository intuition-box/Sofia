/**
 * sponsoredWriteService — free Recommends for every signed-in account.
 *
 * The write-relayer (services/write-relayer) publishes a page's Recommend and
 * its tags from Sofia's treasury, with `receiver` = the user's own wallet: the
 * position is theirs and withdrawable. A cart is sponsored only when every
 * row is a Recommend or a tag on one of the cart's Recommends — anything else
 * goes through the wallet as before. Pure builders + the two HTTP calls;
 * useSponsoredWrite wires them to React.
 */
import {
  CANONICAL_PREDICATE_IDS,
  IN_CONTEXT_OF_PREDICATE_ID,
  SOFIA_I_ATOM_ID,
} from '@/config/atomIds'
import { WRITE_RELAYER_URL } from '@/config'
import type { CartItem } from '@/hooks/useCart'
import { contextSlugFromCartId } from './contextCartService'
import { recommendClaimId } from './pageMarketCartService'

/** Mirrors the relayer's MAX_PAGES_PER_REQUEST / MAX_TAGS_PER_PAGE */
export const MAX_SPONSORED_PAGES = 5
export const MAX_SPONSORED_TAGS = 2

export interface SponsoredPage {
  objectId: string
  tags: string[]
}

export interface SponsoredRequest {
  pages: SponsoredPage[]
  /** The Recommend rows, in `pages` order */
  recommendRows: CartItem[]
}

/** The page a cart row recommends, or null when the row is anything else */
export function recommendedPage(item: CartItem): string | null {
  if (item.side !== 'support' || item.curveId !== 2 || !item.objectId)
    return null
  if (item.kind === 'create-triple')
    return item.subjectId === SOFIA_I_ATOM_ID &&
      item.predicateId === CANONICAL_PREDICATE_IDS.recommends
      ? item.objectId
      : null
  // A deposit on the existing claim
  if ((item.kind ?? 'deposit') === 'deposit')
    return item.termId.toLowerCase() === recommendClaimId(item.objectId)
      ? item.objectId
      : null
  return null
}

/** The relayer request for this cart, or null when it can't be sponsored */
export function buildSponsoredRequest(
  items: readonly CartItem[],
): SponsoredRequest | null {
  const byClaim = new Map<string, SponsoredPage>()
  const recommendRows: CartItem[] = []
  for (const item of items) {
    const objectId = recommendedPage(item)
    if (!objectId) continue
    const claimId = recommendClaimId(objectId)
    if (byClaim.has(claimId)) continue
    byClaim.set(claimId, { objectId: objectId.toLowerCase(), tags: [] })
    recommendRows.push(item)
  }
  if (byClaim.size === 0 || byClaim.size > MAX_SPONSORED_PAGES) return null

  for (const item of items) {
    if (recommendedPage(item)) continue
    // Tags on an existing context atom only — minting one isn't sponsored
    const subject = item.subjectId?.toLowerCase() ?? ''
    const page = byClaim.get(subject)
    const slug =
      item.kind === 'create-triple' &&
      item.predicateId === IN_CONTEXT_OF_PREDICATE_ID &&
      page
        ? contextSlugFromCartId(item.id, item.subjectId!)
        : null
    if (!page || !slug) return null
    if (!page.tags.includes(slug)) page.tags.push(slug)
    if (page.tags.length > MAX_SPONSORED_TAGS) return null
  }
  return { pages: [...byClaim.values()], recommendRows }
}

export interface SponsorQuota {
  eligible: boolean
  /** Why not, when not eligible */
  reason?: string
  /** Free Recommends left (min of today's and this month's) */
  left?: number
  /** Relayer-wide monthly budget reached */
  paused?: boolean
}

export interface SponsorResult {
  txHashes: string[]
  recommended: number
  tagged: number
  left: number
  /** A tx failed after others went through */
  partial: boolean
  dryRun: boolean
  /** TRUST deposited per claim */
  deposit: number
}

export class RelayerError extends Error {
  constructor(
    message: string,
    /** The wallet must approve SofiaFeeProxy once before anything lands */
    readonly needsApproval = false,
  ) {
    super(message)
  }
}

async function call<T>(path: string, token: string, body?: unknown) {
  const res = await fetch(`${WRITE_RELAYER_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json().catch(() => ({}))) as T & {
    error?: string
    needsApproval?: boolean
  }
  if (!res.ok)
    throw new RelayerError(
      json.error ?? `Relayer error ${res.status}`,
      !!json.needsApproval,
    )
  return json
}

export const fetchSponsorQuota = (token: string) =>
  call<SponsorQuota>('/sponsor/quota', token)

/** Gas for the wallet's one-time proxy approval (it may hold no TRUST) */
export const requestApprovalGas = (token: string, wallet: string) =>
  call<{ funded: boolean }>('/sponsor/gas', token, { wallet })

/** `wallet`: the account's wallet that receives the positions */
export const requestSponsoredRecommends = (
  token: string,
  wallet: string,
  pages: readonly SponsoredPage[],
) => call<SponsorResult>('/sponsor/recommend', token, { wallet, pages })
