/**
 * useCircleFeed — the Trust Circle feed data layer, extracted from
 * CircleFeedTab so the component stays presentational.
 *
 * Pipeline (each step feeds the next):
 *   1. Trust circle  — followed accounts (paginated trust-circle positions).
 *   2. Cert triples  — every "visits for …" cert those wallets staked on.
 *   3. Feed items    — one CircleFeedItem per (cert, certifier).
 *   3b. Contexts     — the "in context of" triples nested under each cert,
 *                      mapped cert→contexts so a vote can fan out across them.
 *
 * Returns the feed rows + member identity maps + per-cert contexts plus
 * loading / refreshing flags and a `refresh()` that re-runs steps 1 & 2.
 */
import {
  useGetFeedContextTriplesQuery,
  useGetPerspectiveCertsQuery,
  useGetTrustCirclePositionsQuery,
  type GetFeedContextTriplesQuery,
  type GetPerspectiveCertsQuery,
  type GetTrustCirclePositionsQuery
} from "@0xsofia/graphql"
import { resolveContextAtom } from "@0xsofia/taxonomy"
import { useCallback, useEffect, useState } from "react"
import { getAddress } from "viem"

import { PREDICATE_IDS, SUBJECT_IDS } from "~/lib/config/constants"
import { batchResolveEns, createHookLogger } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"

import type { CircleFeedItem, FeedContext } from "./feedTypes"

const logger = createHookLogger("useCircleFeed")

// Pagination convention shared with the explorer's perspectiveService:
// loop the indexer 1000 rows at a time until a short page comes back,
// hard-capped at 50 pages (50k rows) so a runaway query can't spin.
const PAGE_SIZE = 1000
const MAX_PAGES = 50

// Predicate labels that count as circle activity — kept identical to the
// explorer's circle feed (sofiaFeedService / circleService) so the two show
// the same data. Includes trusts/distrust: in Sofia those are staked on
// pages/URLs too (e.g. "trusts <site>"), so they belong in the feed.
const PERSPECTIVE_PREDICATE_LABELS: string[] = [
  "visits for work",
  "visits for learning",
  "visits for learning ", // legacy trailing-space variant
  "visits for fun",
  "visits for inspiration",
  "visits for buying",
  "visits for music",
  "trusts",
  "distrust"
]

// Extract domain from URL
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

export interface UseCircleFeedResult {
  feedItems: CircleFeedItem[]
  trustedWallets: string[]
  walletToLabel: Map<string, string>
  walletToImage: Map<string, string>
  contextsByCert: Map<string, FeedContext[]>
  loading: boolean
  refreshing: boolean
  refresh: () => void
}

export function useCircleFeed(checksumAddress: string): UseCircleFeedResult {
  const [feedItems, setFeedItems] = useState<CircleFeedItem[]>([])
  const [trustedWallets, setTrustedWallets] = useState<string[]>([])
  const [walletToLabel, setWalletToLabel] = useState(
    () => new Map<string, string>()
  )
  const [walletToImage, setWalletToImage] = useState(
    () => new Map<string, string>()
  )

  // Step 1: Get followed accounts.
  //
  // `GetTrustCirclePositions` has `$offset` but no `$limit` — the
  // indexer's default page cap silently truncated big trust circles to
  // the first page, so members past it never produced feed rows. We now
  // page by offset (same PAGE_SIZE / MAX_PAGES convention as Step 2)
  // until a short page comes back, accumulating every member triple.
  const [trustCircleLoading, setTrustCircleLoading] = useState(false)
  const [trustCircleFetching, setTrustCircleFetching] = useState(false)

  const refetchTrustCircle = useCallback(async () => {
    if (!checksumAddress) {
      setTrustedWallets([])
      setTrustCircleLoading(false)
      setTrustCircleFetching(false)
      return
    }
    setTrustCircleFetching(true)
    setTrustCircleLoading((prev) => prev || trustedWallets.length === 0)

    const rawTriples: NonNullable<GetTrustCirclePositionsQuery["triples"]> = []
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await useGetTrustCirclePositionsQuery.fetcher({
          subjectId: SUBJECT_IDS.I,
          predicateId: PREDICATE_IDS.TRUSTS,
          addresses: checksumAddress,
          offset: page * PAGE_SIZE,
          positionsOrderBy: [{ shares: "desc" }]
        })()
        const rows = data?.triples ?? []
        rawTriples.push(...rows)
        if (rows.length < PAGE_SIZE) break
      }
    } catch (err) {
      // Keep whatever member pages already loaded — partial circle is
      // far better than blanking the feed entirely.
      logger.error("Trust circle pagination failed", err)
    }

    const wallets: string[] = []
    const labelMap = new Map<string, string>()
    const imageMap = new Map<string, string>()

    for (const triple of rawTriples) {
      // Only include if user has positive shares (not untrusted)
      const hasPositiveShares = triple.term?.vaults?.some((v) =>
        v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
      )
      if (!hasPositiveShares) continue

      const accounts = triple.object?.accounts || []
      const label = triple.object?.label || ""

      for (const account of accounts) {
        if (account?.id) {
          try {
            // Indexer matches account ids in EIP-55 checksum case;
            // keep a lowercase mirror for the client-side filter.
            const checksumWallet = getAddress(account.id)
            wallets.push(checksumWallet)
            wallets.push(checksumWallet.toLowerCase())
            labelMap.set(
              checksumWallet.toLowerCase(),
              account.label || label || checksumWallet
            )
            if (account.image) {
              imageMap.set(checksumWallet.toLowerCase(), account.image)
            }
          } catch {
            continue
          }
        }
      }
    }

    setTrustedWallets([...new Set(wallets)])
    setWalletToLabel(labelMap)
    setWalletToImage(imageMap)
    setTrustCircleLoading(false)
    setTrustCircleFetching(false)

    // Batch-resolve ENS names + avatars for wallets with raw address labels
    const addressesToResolve = [...labelMap.entries()]
      .filter(
        ([, label]) => !label || label.startsWith("0x") || label.includes("...")
      )
      .map(([wallet]) => wallet)

    if (addressesToResolve.length > 0) {
      batchResolveEns(addressesToResolve).then((ensResults) => {
        for (const [addr, ens] of ensResults) {
          if (ens.name) labelMap.set(addr, ens.name)
          if (ens.avatar) imageMap.set(addr, ens.avatar)
        }
        setWalletToLabel(new Map(labelMap))
        setWalletToImage(new Map(imageMap))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checksumAddress])

  useEffect(() => {
    refetchTrustCircle()
  }, [refetchTrustCircle])

  // Step 2: Get ALL certifications from trusted wallets — triples, not
  // events.
  //
  // This is the same data path the explorer uses
  // (`perspectiveService.fetchPerspectiveCertifications` →
  // `GetPerspectiveCerts`): query the `visits_for_*` cert triples
  // directly, filtered to triples where one of our trusted wallets holds
  // shares > 0. The old `GetSofiaTrustedActivity` events query routed
  // through the Sofia proxy and structurally missed every non-proxy /
  // out-of-filter certification — that whole code path is gone.
  //
  // Paginated 1000 rows at a time (PAGE_SIZE / MAX_PAGES) with
  // incremental display: each page is mapped and pushed into feedItems
  // immediately so the feed paints progressively and is never blank
  // while later pages stream in. A failed page keeps everything already
  // loaded.
  const [rawCertTriples, setRawCertTriples] = useState<
    NonNullable<GetPerspectiveCertsQuery["triples"]>
  >([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsFetching, setEventsFetching] = useState(false)

  const refetchEvents = useCallback(async () => {
    if (trustedWallets.length === 0) {
      setRawCertTriples([])
      setEventsLoading(false)
      setEventsFetching(false)
      return
    }

    // Indexer stores account ids in EIP-55 checksum case; a lowercase
    // `_in` filter silently matches nothing. Checksum the list before
    // the network call (the trustedWallets state already carries a
    // lowercase mirror used by the client-side certifier filter below).
    const checksumWallets: string[] = []
    for (const w of trustedWallets) {
      try {
        checksumWallets.push(getAddress(w))
      } catch {
        // Skip the lowercase mirror entries / bad ids — getAddress
        // throws on a non-checksum string. Deduped right after.
      }
    }
    const uniqueChecksum = [...new Set(checksumWallets)]
    if (uniqueChecksum.length === 0) {
      setRawCertTriples([])
      setEventsLoading(false)
      setEventsFetching(false)
      return
    }

    setEventsFetching(true)
    setEventsLoading((prev) => prev || rawCertTriples.length === 0)

    const acc: NonNullable<GetPerspectiveCertsQuery["triples"]> = []
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await useGetPerspectiveCertsQuery.fetcher({
          wallets: uniqueChecksum,
          predicateLabels: PERSPECTIVE_PREDICATE_LABELS,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE
        })()
        const rows = data?.triples ?? []
        acc.push(...rows)
        // Incremental display: paint each page as it lands so the feed
        // grows in front of the user and is never blank. A heavy later
        // page must never wipe what's already shown.
        setRawCertTriples([...acc])
        setEventsLoading(false)
        if (rows.length < PAGE_SIZE) break
      }
    } catch (err) {
      // Keep whatever pages already loaded instead of wiping the feed.
      logger.error("Perspective certs pagination failed", err)
      if (acc.length > 0) setRawCertTriples([...acc])
    } finally {
      setEventsLoading(false)
      setEventsFetching(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trustedWallets])

  useEffect(() => {
    refetchEvents()
  }, [refetchEvents])

  // Step 3: Map cert triples → feed items.
  //
  // A triple can carry several certifiers (one position row per trusted
  // wallet that staked on it) — emit one CircleFeedItem per (triple,
  // certifier) so the existing `pageUrl::memberAddress` grouping keeps
  // working and every member's mark is attributed. Kept separate from
  // the fetch so ENS label/avatar resolution re-maps the labels without
  // re-hitting the network.
  useEffect(() => {
    if (rawCertTriples.length === 0) {
      setFeedItems([])
      return
    }

    const lowerWalletSet = new Set(trustedWallets.map((w) => w.toLowerCase()))
    const items: CircleFeedItem[] = []

    for (const triple of rawCertTriples) {
      const predicateLabel = triple.predicate?.label
      if (!predicateLabel) continue

      const intentionType = predicateLabelToIntentionType(predicateLabel)
      if (!intentionType) continue

      const obj = triple.object
      const pageLabel = obj?.label || ""
      const pageUrl =
        obj?.value?.thing?.url ||
        (pageLabel.startsWith("http") ? pageLabel : `https://${pageLabel}`)
      const domain = getDomain(pageUrl)
      const tripleTermId = triple.term_id || ""
      const counterTermId = triple.counter_term_id || ""
      const createdAt = triple.created_at ? String(triple.created_at) : ""

      // positions are already server-filtered to "shares > 0" for our
      // wallet set; every account_id here is a relevant certifier.
      for (const position of triple.positions ?? []) {
        const memberAddress = position.account_id
        if (!memberAddress) continue
        const addrKey = memberAddress.toLowerCase()
        if (!lowerWalletSet.has(addrKey)) continue

        items.push({
          id: `${tripleTermId}::${addrKey}`,
          tripleTermId,
          counterTermId,
          intentionType,
          tripleSubject: "I",
          triplePredicate: predicateLabel,
          tripleObject: pageLabel,
          pageLabel: pageLabel || domain,
          pageUrl,
          domain,
          memberAddress,
          memberLabel: walletToLabel.get(addrKey) || memberAddress,
          memberImage: walletToImage.get(addrKey) || "",
          createdAt
        })
      }
    }

    setFeedItems(items)
  }, [rawCertTriples, trustedWallets, walletToLabel, walletToImage])

  // Step 3b: Fetch the "in context of" triples nested under each cert.
  //
  // The explorer's circle feed votes on these context triples (one stakeable
  // triple per topic/category the cert was tagged with), not on the cert
  // triple itself. We query every cert term_id at once, then map each
  // context triple back to its cert so a card can fan a vote out across all
  // its contexts. Same paginated convention as the cert fetch.
  const [contextsByCert, setContextsByCert] = useState(
    () => new Map<string, FeedContext[]>()
  )

  useEffect(() => {
    if (rawCertTriples.length === 0) {
      setContextsByCert(new Map())
      return
    }

    // certTermId → its predicate/purpose, so a context vote can carry a
    // known predicate for the cart while depositing on the context vault.
    const certMeta = new Map<
      string,
      { predicate: string; purpose: IntentionPurpose | null }
    >()
    for (const triple of rawCertTriples) {
      const termId = triple.term_id
      const predicate = triple.predicate?.label
      if (!termId || !predicate) continue
      const intentionType = predicateLabelToIntentionType(predicate)
      certMeta.set(termId, {
        predicate,
        purpose: intentionType
          ? INTENTION_CONFIG[intentionType].intentionPurpose
          : null
      })
    }

    const certTermIds = [...certMeta.keys()]
    if (certTermIds.length === 0) {
      setContextsByCert(new Map())
      return
    }

    let cancelled = false

    const run = async () => {
      const rows: NonNullable<GetFeedContextTriplesQuery["triples"]> = []
      try {
        for (let page = 0; page < MAX_PAGES; page++) {
          const data = await useGetFeedContextTriplesQuery.fetcher({
            subjectTermIds: certTermIds,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE
          })()
          const pageRows = data?.triples ?? []
          rows.push(...pageRows)
          if (pageRows.length < PAGE_SIZE) break
        }
      } catch (err) {
        logger.error("Feed context triples fetch failed", err)
      }
      if (cancelled) return

      const map = new Map<string, FeedContext[]>()
      for (const row of rows) {
        const certTermId = row.subject_id
        const supportTermId = row.term_id
        const objectTermId = row.object?.term_id
        if (!certTermId || !supportTermId || !objectTermId) continue

        const node = resolveContextAtom(objectTermId)
        if (!node?.slug) continue

        const meta = certMeta.get(certTermId)
        if (!meta) continue

        const ctx: FeedContext = {
          slug: node.slug,
          supportTermId,
          opposeTermId: row.counter_term_id ?? "",
          predicate: meta.predicate,
          purpose: meta.purpose
        }
        const list = map.get(certTermId)
        if (list) list.push(ctx)
        else map.set(certTermId, [ctx])
      }
      setContextsByCert(map)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [rawCertTriples])

  const refresh = useCallback(() => {
    refetchTrustCircle()
    refetchEvents()
  }, [refetchTrustCircle, refetchEvents])

  return {
    feedItems,
    trustedWallets,
    walletToLabel,
    walletToImage,
    contextsByCert,
    loading: trustCircleLoading || eventsLoading,
    refreshing: trustCircleFetching || eventsFetching,
    refresh
  }
}
