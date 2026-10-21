/**
 * PageMarketService
 *
 * The page's market for the Page tab (ONE_MARKET_PER_PAGE_SPEC §4.2): one
 * `I | recommends | page` claim — its Support / Oppose stake and holders,
 * the momentum (positions this week), where the viewer would land ("you'd
 * be #N"), the viewer's own position and P&L, the page's tags, and the
 * viewer's positions on legacy claims (intentions, trusts, distrust).
 *
 * Everything returned is plain JSON (bigints as strings): it can live in the
 * persisted React Query cache.
 */

import {
  intentionTagForAtom,
  isLegacyPagePredicate,
  PAGE_CLAIM_PREDICATE_LABELS,
  PAGE_MARKET_PREDICATE_LABEL
} from "@0xsofia/taxonomy"
import { getAddress } from "viem"

import {
  GetPageMarketDocument,
  intuitionGraphqlClient,
  type GetPageMarketQuery
} from "../clients/graphql-client"
import { SUBJECT_IDS } from "../config/chainConfig"

type ClaimRow = GetPageMarketQuery["claims"][number]
type VaultRow = NonNullable<ClaimRow["term"]>["vaults"][number]
type LegRow = ClaimRow["mySupport"][number]

const WAD = 10n ** 18n
const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

export interface MarketSide {
  /** TRUST in the vaults, both curves (wei) */
  staked: string
  /** Distinct wallets in position */
  holders: number
}

export interface MyPosition {
  side: "support" | "oppose"
  /** Current value (wei) */
  value: string
  /** Net put in: deposits − exits (wei) */
  invested: string
  /** value − invested (wei, signed) */
  pnl: string
  /** Vaults to exit this position from (claim or counter vault) */
  termIds: string[]
}

export interface PageTag {
  termId: string
  label: string
  /** Wallets holding this tag on the page's claims */
  count: number
  intention: boolean
}

export interface LegacyPosition {
  claimTermId: string
  predicateLabel: string
  side: "support" | "oppose"
  value: string
}

export interface PageMarket {
  /** The `recommends` claim (busiest one when the page has several atoms) */
  claimTermId: string | null
  support: MarketSide
  oppose: MarketSide
  /** Every page claim (market + legacy), both sides (wei) */
  totalStaked: string
  /** Positions opened in the last 7 days on any of the page's claims */
  positionsThisWeek: number
  /** Distinct wallets backing the page (market + legacy positive claims) */
  pageHolders: number
  /** Viewer's rank among the page's backers (earliest first, legacy claims
   *  included), or the rank they'd take */
  rank: number
  inPosition: boolean
  /** In position only through legacy claims */
  legacyOnly: boolean
  /** Who recommended the page first, and how early */
  discoverer: {
    account: string
    isYou: boolean
    /** Days before the next Recommend, null while nobody followed */
    leadDays: number | null
  } | null
  mine: MyPosition[]
  tags: PageTag[]
  legacy: LegacyPosition[]
}

const sumAssets = (vaults: readonly VaultRow[] | undefined) =>
  (vaults ?? []).reduce((sum, v) => sum + BigInt(v.total_assets ?? "0"), 0n)

/** Value of the viewer's legs at each curve's current share price */
function legsValue(
  legs: readonly LegRow[],
  vaults: readonly VaultRow[] | undefined
) {
  let value = 0n
  let invested = 0n
  for (const leg of legs) {
    const price = BigInt(
      (vaults ?? []).find((v) => String(v.curve_id) === String(leg.curve_id))
        ?.current_share_price ?? "0"
    )
    value += (BigInt(leg.shares) * price) / WAD
    invested +=
      BigInt(leg.total_deposit_assets_after_total_fees ?? "0") -
      BigInt(leg.total_redeem_assets_for_receiver ?? "0")
  }
  return { value, invested }
}

const isMarketClaim = (c: ClaimRow) =>
  c.predicate?.label === PAGE_MARKET_PREDICATE_LABEL &&
  c.subject_id.toLowerCase() === SUBJECT_IDS.I.toLowerCase()

export function computePageMarket(
  data: GetPageMarketQuery,
  wallet: string | null,
  now = Date.now()
): PageMarket {
  const me = wallet?.toLowerCase() ?? null
  const claims = data.claims ?? []
  const market = claims.filter(isMarketClaim)
  const main = [...market].sort((a, b) =>
    sumAssets(b.term?.vaults) > sumAssets(a.term?.vaults) ? 1 : -1
  )[0]

  // Support / Oppose of the market (all its claims, in case of several atoms)
  const supporters: { account: string; ts: number }[] = []
  const opposers = new Set<string>()
  let supportStaked = 0n
  let opposeStaked = 0n
  for (const c of market) {
    supportStaked += sumAssets(c.term?.vaults)
    opposeStaked += sumAssets(c.counter_term?.vaults)
    for (const s of c.supporters) {
      supporters.push({
        account: s.account_id.toLowerCase(),
        ts: Date.parse(s.created_at)
      })
    }
    for (const o of c.opposers) opposers.add(o.account_id.toLowerCase())
  }
  supporters.sort((a, b) => a.ts - b.ts)
  const order = [...new Set(supporters.map((s) => s.account))]
  const firstTs = (account: string) =>
    supporters.find((s) => s.account === account)!.ts
  const discoverer = order[0]
    ? {
        account: order[0],
        isYou: order[0] === me,
        leadDays:
          order.length > 1
            ? Math.floor((firstTs(order[1]) - firstTs(order[0])) / DAY_MS)
            : null
      }
    : null

  // Rank on the whole page: whoever backed it first, whatever the claim
  // (a legacy `visits for work` / `trusts` position counts — `distrust`
  // claims are against the page, so they don't)
  const backers = claims
    .filter((c) => c.predicate?.label !== "distrust")
    .flatMap((c) =>
      c.supporters.map((s) => ({
        account: s.account_id.toLowerCase(),
        ts: Date.parse(s.created_at)
      }))
    )
    .sort((a, b) => a.ts - b.ts)
  const pageOrder = [...new Set(backers.map((b) => b.account))]
  const myIndex = me ? pageOrder.indexOf(me) : -1

  // Momentum + total over every page claim (legacy included)
  const since = now - WEEK_MS
  let positionsThisWeek = 0
  let totalStaked = 0n
  for (const c of claims) {
    totalStaked += sumAssets(c.term?.vaults) + sumAssets(c.counter_term?.vaults)
    for (const p of [...c.supporters, ...c.opposers]) {
      if (Date.parse(p.created_at) >= since) positionsThisWeek++
    }
  }

  // Viewer's positions
  const mine: MyPosition[] = []
  const legacy: LegacyPosition[] = []
  for (const c of claims) {
    const sides = [
      {
        side: "support" as const,
        legs: c.mySupport,
        vaults: c.term?.vaults,
        termId: c.term_id
      },
      {
        side: "oppose" as const,
        legs: c.myOppose,
        vaults: c.counter_term?.vaults,
        termId: c.counter_term_id
      }
    ]
    for (const { side, legs, vaults, termId } of sides) {
      if (legs.length === 0) continue
      const { value, invested } = legsValue(legs, vaults)
      if (isMarketClaim(c)) {
        const existing = mine.find((m) => m.side === side)
        if (existing) {
          const v = BigInt(existing.value) + value
          const inv = BigInt(existing.invested) + invested
          existing.value = v.toString()
          existing.invested = inv.toString()
          existing.pnl = (v - inv).toString()
          existing.termIds.push(termId)
        } else {
          mine.push({
            side,
            value: value.toString(),
            invested: invested.toString(),
            pnl: (value - invested).toString(),
            termIds: [termId]
          })
        }
      } else if (isLegacyPagePredicate(c.predicate?.label ?? "")) {
        legacy.push({
          claimTermId: c.term_id,
          predicateLabel: (c.predicate?.label ?? "").trim(),
          side,
          value: value.toString()
        })
      }
    }
  }

  // Tags on the page's claims, most held first
  const tagMap = new Map<string, PageTag>()
  for (const t of data.tags ?? []) {
    if (!t.object) continue
    const count = t.positions_aggregate?.aggregate?.count ?? 0
    const prev = tagMap.get(t.object.term_id)
    if (prev) {
      prev.count += count
    } else {
      tagMap.set(t.object.term_id, {
        termId: t.object.term_id,
        label: t.object.label ?? "",
        count,
        intention: !!intentionTagForAtom(t.object)
      })
    }
  }

  return {
    claimTermId: main?.term_id ?? null,
    support: { staked: supportStaked.toString(), holders: order.length },
    oppose: { staked: opposeStaked.toString(), holders: opposers.size },
    totalStaked: totalStaked.toString(),
    positionsThisWeek,
    pageHolders: pageOrder.length,
    rank: myIndex >= 0 ? myIndex + 1 : pageOrder.length + 1,
    inPosition: myIndex >= 0,
    legacyOnly: myIndex >= 0 && !(me && order.includes(me)),
    discoverer,
    mine,
    tags: [...tagMap.values()].sort((a, b) => b.count - a.count),
    legacy
  }
}

class PageMarketServiceClass {
  async fetch(pageAtomIds: string[], wallet: string | null): Promise<PageMarket> {
    const accounts = wallet
      ? [...new Set([wallet.toLowerCase(), getAddress(wallet)])]
      : []
    const data = await intuitionGraphqlClient.request(GetPageMarketDocument, {
      objectIds: pageAtomIds,
      predicateLabels: [...PAGE_CLAIM_PREDICATE_LABELS],
      accounts
    })
    return computePageMarket(data, wallet)
  }
}

export const pageMarketService = new PageMarketServiceClass()
